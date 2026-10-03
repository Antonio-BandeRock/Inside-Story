// Windows Hello for App Lock on the computer (1.0.60.7).
//
// Windows' published Hello key API (Windows.Security.Credentials.
// KeyCredentialManager) keeps a key pair for this app behind Hello: the
// private half never leaves Windows, and signing with it asks for the face,
// fingerprint or Windows Hello PIN. Hello keys sign with RSA PKCS#1 v1.5,
// which gives the same signature every time for the same challenge, so the
// signature of a fixed random challenge is what opens the data key: the
// key cannot be read without Hello, the way the phone's copy cannot be
// read without the fingerprint.
//
// Electron has no Hello API of its own on Windows, so the calls go through
// Windows PowerShell 5.1, which ships with every Windows 10 and 11 and can
// call WinRT. Nothing is installed. On a Mac, available() is false and the
// passcode is the way in.

const { execFile } = require('node:child_process');
const crypto = require('node:crypto');

const CREDENTIAL_NAME = 'InsideStoryAppLock';

const PRELUDE = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Security.Credentials.KeyCredentialManager,Windows.Security.Credentials,ContentType=WindowsRuntime]
$null = [Windows.Storage.Streams.IBuffer,Windows.Storage.Streams,ContentType=WindowsRuntime]
$asTaskOp = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation\`1' })[0]
$asTaskAction = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncAction' })[0]
function Await($op, $type) { $task = $asTaskOp.MakeGenericMethod($type).Invoke($null, @($op)); $task.Wait(); $task.Result }
function AwaitAction($op) { $task = $asTaskAction.Invoke($null, @($op)); $task.Wait() }
$name = '${CREDENTIAL_NAME}'
`;

function powershell(script) {
  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      // -EncodedCommand rather than a script on stdin: PowerShell reads
      // stdin a line at a time and mishandles a block spread over lines.
      [
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-EncodedCommand',
        Buffer.from(PRELUDE + script, 'utf16le').toString('base64'),
      ],
      { windowsHide: true, timeout: 180000, maxBuffer: 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error((stderr || error.message || '').trim()));
          return;
        }
        resolve(String(stdout).trim());
      },
    );
  });
}

let availability = null;

/** True when this Windows account has Hello set up. */
async function available() {
  if (process.platform !== 'win32') return false;
  if (availability === null) {
    availability = powershell(
      `if (Await ([Windows.Security.Credentials.KeyCredentialManager]::IsSupportedAsync()) ([bool])) { 'yes' } else { 'no' }`,
    )
      .then((out) => out.endsWith('yes'))
      .catch((error) => {
        console.error('[hello] could not ask whether Hello is set up', error);
        return false;
      });
  }
  return availability;
}

/**
 * Signs the challenge with this app's Hello key, making the key first when
 * `create` is set. Windows asks for Hello. Answers the signature, or null
 * when the person cancelled.
 */
async function sign(challenge, create) {
  const out = await powershell(`
$open = Await ([Windows.Security.Credentials.KeyCredentialManager]::OpenAsync($name)) ([Windows.Security.Credentials.KeyCredentialRetrievalResult])
if ($open.Status -ne 'Success') {
  if (-not ${create ? '$true' : '$false'}) { 'MISSING'; exit }
  $open = Await ([Windows.Security.Credentials.KeyCredentialManager]::RequestCreateAsync($name, [Windows.Security.Credentials.KeyCredentialCreationOption]::ReplaceExisting)) ([Windows.Security.Credentials.KeyCredentialRetrievalResult])
  if ($open.Status -eq 'UserCanceled') { 'CANCELLED'; exit }
  if ($open.Status -ne 'Success') { 'FAILED ' + $open.Status; exit }
}
$bytes = [Convert]::FromBase64String('${challenge.toString('base64')}')
$buffer = [System.Runtime.InteropServices.WindowsRuntime.WindowsRuntimeBufferExtensions]::AsBuffer($bytes)
$signed = Await ($open.Credential.RequestSignAsync($buffer)) ([Windows.Security.Credentials.KeyCredentialOperationResult])
if ($signed.Status -eq 'UserCanceled') { 'CANCELLED'; exit }
if ($signed.Status -ne 'Success') { 'FAILED ' + $signed.Status; exit }
'SIGNED ' + [Convert]::ToBase64String([System.Runtime.InteropServices.WindowsRuntime.WindowsRuntimeBufferExtensions]::ToArray($signed.Result))
`);
  const last = out.split(/\r?\n/).pop() || '';
  if (last === 'CANCELLED') return null;
  if (last.startsWith('SIGNED ')) return Buffer.from(last.slice(7), 'base64');
  throw new Error(`Windows Hello did not sign: ${last || 'no answer'}`);
}

function wrappingKey(signature) {
  return crypto.createHash('sha256').update(Buffer.from('inside-story-app-lock-hello-v1')).update(signature).digest();
}

/**
 * Keeps the data key behind Hello. Answers what to store (no secret in it
 * that opens without Hello), or null when the person cancelled.
 */
async function wrapKey(dataKeyBase64) {
  const challenge = crypto.randomBytes(32);
  const signature = await sign(challenge, true);
  if (!signature) return null;
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', wrappingKey(signature), nonce);
  const body = Buffer.concat([cipher.update(Buffer.from(dataKeyBase64, 'base64')), cipher.final()]);
  return JSON.stringify({
    v: 1,
    challenge: challenge.toString('base64'),
    nonce: nonce.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    body: body.toString('base64'),
  });
}

/**
 * Opens the data key with Hello. `{ kind: 'key', key }` (base64),
 * `{ kind: 'cancelled' }`, or `{ kind: 'needs-passcode' }` when the Hello
 * key is gone or no longer opens it.
 */
async function unwrapKey(stored) {
  let parsed;
  try {
    parsed = JSON.parse(stored);
  } catch {
    return { kind: 'needs-passcode' };
  }
  let signature;
  try {
    signature = await sign(Buffer.from(parsed.challenge, 'base64'), false);
  } catch (error) {
    console.error('[hello] Hello did not open the key', error);
    return { kind: 'needs-passcode' };
  }
  if (!signature) return { kind: 'cancelled' };
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', wrappingKey(signature), Buffer.from(parsed.nonce, 'base64'));
    decipher.setAuthTag(Buffer.from(parsed.tag, 'base64'));
    const key = Buffer.concat([decipher.update(Buffer.from(parsed.body, 'base64')), decipher.final()]);
    return { kind: 'key', key: key.toString('base64') };
  } catch {
    return { kind: 'needs-passcode' };
  }
}

/** Removes this app's Hello key, when Hello unlock is turned off or the lock is. */
async function remove() {
  if (process.platform !== 'win32') return;
  try {
    await powershell(`AwaitAction ([Windows.Security.Credentials.KeyCredentialManager]::DeleteAsync($name))`);
  } catch {
    // Already gone, which is the outcome wanted.
  }
}

module.exports = { available, wrapKey, unwrapKey, remove };
