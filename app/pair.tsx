// Pairing two phones by QR, 2026-09-06.
//
// This replaces two routes that both failed on a real device, for the same
// underlying reason: each depended on something outside this app cooperating.
// A hashimotosapp:// link is not tappable, because messaging apps only
// linkify http and https. A .is file tapped in WhatsApp produced WhatsApp's
// own "Couldn't load object", because Android's pathPattern cannot match a
// content:// URI that carries no filename. Neither is fixable from here, and
// a third guess of the same kind was not worth anyone's time.
//
// A code on one screen and a camera on the other is the one channel this app
// owns end to end. It is also what Signal, WhatsApp and Discord use to link
// devices without a server, for exactly this reason.
//
// The honest cost, stated rather than buried: both people have to be in the
// same room. For a partner you live with, which is the case this was asked
// for, that is the normal state. Pairing with someone far away needs an
// https:// App Link, which needs a domain and one native rebuild.
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { QrCode } from '../components/QrCode';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import {
  buildConnectionInvite,
  buildPartnerInvite,
  encodeInviteCode,
  parseInviteInput,
} from '../lib/connections';
import {
  PARTNER_SHARING_NOT_LIVE,
  SHARE_SCOPES,
  defaultGrantsForRole,
  type ShareGrants,
} from '../lib/partners';
import { getMyKeyFingerprint } from '../lib/deviceIdentity';

// Big enough that each module lands on several physical pixels at any normal
// phone density, which is what actually decides whether a code scans on the
// first try rather than the third.
const QR_SIZE = 300;

export default function PairScreen() {
  const router = useRouter();
  const scrollPadding = useFloatingButtonScrollPadding();
  const params = useLocalSearchParams<{
    role?: string;
    mode?: string;
    ack?: string;
    theirName?: string;
  }>();

  const isPartner = params.role === 'partner';
  // Set when this is the leg AFTER accepting someone, so the code carries the
  // one flag that tells them the link is now mutual. It stays inside the
  // existing symmetric payload rather than adding a second message type.
  const alreadyHaveYou = params.ack === '1';
  const theirName = typeof params.theirName === 'string' ? params.theirName : null;

  const [mode, setMode] = useState<'show' | 'scan'>(params.mode === 'scan' ? 'scan' : 'show');
  const [grants, setGrants] = useState<ShareGrants>(() => defaultGrantsForRole(isPartner ? 'partner' : 'recipe'));
  const [code, setCode] = useState<string | null>(null);
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [buildError, setBuildError] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const [permission, requestPermission] = useCameraPermissions();
  // A camera fires this many times a second once a code is in frame. Without
  // this the screen would push the accept route dozens of times over.
  const handledScan = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const invite = isPartner
          ? await buildPartnerInvite({ grants, alreadyHaveYou })
          : await buildConnectionInvite();
        const mine = await getMyKeyFingerprint();
        if (cancelled) return;
        setCode(encodeInviteCode(invite));
        setFingerprint(mine);
        setBuildError(false);
      } catch (error) {
        console.error('[PairScreen] Failed to build an invite', error);
        if (!cancelled) setBuildError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isPartner, alreadyHaveYou, grants]);

  useEffect(() => {
    if (mode === 'scan' && permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [mode, permission, requestPermission]);

  const handleScan = useCallback(
    (result: BarcodeScanningResult) => {
      if (handledScan.current) return;
      // parseInviteInput rather than trusting the raw scan: it accepts a bare
      // code or a whole deep link, and it validates by actually DECODING
      // rather than by matching a shape, so a QR from anything else on earth
      // is refused here rather than carried forward as a broken invite.
      const data = parseInviteInput(result.data);
      if (!data) {
        setScanError(
          "That code isn't an Inside Story invite. Ask them to open Connections on their phone and show you their code.",
        );
        return;
      }
      handledScan.current = true;
      setScanError(null);
      // replace, not push: once the code is read this screen has done its job,
      // and going back to a live camera from the accept screen would only
      // re-scan the same code.
      router.replace({ pathname: '/connect', params: { data } });
    },
    [router],
  );

  function startScanning() {
    handledScan.current = false;
    setScanError(null);
    setMode('scan');
  }

  if (mode === 'scan') {
    if (!permission) {
      return (
        <View style={styles.screen}>
          <View style={styles.centerBody}>
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>Getting the camera ready…</Text>
            </View>
          </View>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.screen}>
          <View style={styles.centerBody}>
            <View style={styles.card}>
              <Ionicons name="camera-outline" size={40} color={colors.textMuted} style={styles.centerIcon} />
              <Text style={styles.title}>Camera access needed</Text>
              <Text style={styles.text}>
                Inside Story needs your camera to read the code on the other phone. Nothing is recorded, and nothing
                leaves this device.
              </Text>
              <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={requestPermission}>
                <Text style={styles.primaryButtonText}>Allow Camera Access</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => setMode('show')}>
                <Text style={styles.secondaryButtonText}>Show My Code Instead</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.screen}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleScan}
        />
        <View style={styles.scanOverlay} pointerEvents="none">
          <View style={styles.scanFrame} />
        </View>
        <View style={styles.scanFooter}>
          <Text style={styles.scanHint}>
            Point this at the code on their phone. It reads on its own, with nothing to tap.
          </Text>
          {scanError ? <Text style={styles.scanError}>{scanError}</Text> : null}
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => setMode('show')}>
            <Text style={styles.secondaryButtonText}>Show My Code Instead</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
      <View style={styles.card}>
        <Text style={styles.title}>
          {alreadyHaveYou
            ? theirName
              ? `Show this to ${theirName}`
              : 'Show this back to them'
            : isPartner
              ? 'Show this to your partner'
              : 'Show this to them'}
        </Text>
        <Text style={styles.text}>
          {alreadyHaveYou
            ? 'You have them saved. This code tells their phone the same, which is what finishes the link on both sides.'
            : 'They open Inside Story, go to Profile, then Connections, and tap Scan Their Code. Nothing is sent anywhere: the code goes from this screen to their camera and no further.'}
        </Text>

        {buildError ? (
          <Text style={styles.errorText}>Something went wrong building your code. Go back and try again.</Text>
        ) : code ? (
          <View style={styles.qrWrap}>
            <QrCode value={code} size={QR_SIZE} accessibilityLabel="Your pairing code" />
          </View>
        ) : (
          <Text style={styles.text}>Preparing your code…</Text>
        )}

        {fingerprint ? (
          <View style={styles.fingerprintBox}>
            <Text style={styles.fingerprintLabel}>Your device ID</Text>
            <Text style={styles.fingerprintValue}>{fingerprint}</Text>
            <Text style={styles.fingerprintHint}>
              They will be asked to check this matches what their phone shows. It is the only thing that would catch a
              swapped code.
            </Text>
          </View>
        ) : null}
      </View>

      {/* Only a partner invite carries anything beyond a name and a key, so
          only a partner invite has anything to choose. Conditions default off
          on purpose: what is for dinner is a household fact and a list of
          diagnoses is not. */}
      {isPartner ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>What this code shares with them</Text>
          <Text style={styles.grantHint}>
            Change this before showing the code. You can change it again, or undo it entirely, from Connections at any
            time.
          </Text>
          {SHARE_SCOPES.map((scope) => (
            <TouchableOpacity
              key={scope.code}
              style={styles.grantRow}
              activeOpacity={0.8}
              onPress={() => setGrants({ ...grants, [scope.code]: !grants[scope.code] })}
            >
              <View style={[styles.checkBox, grants[scope.code] ? styles.checkBoxOn : null]}>
                {grants[scope.code] ? <Text style={styles.checkMark}>✓</Text> : null}
              </View>
              <View style={styles.grantTextWrap}>
                <Text style={styles.grantLabel}>{scope.label}</Text>
                <Text style={styles.grantWhat}>{scope.what}</Text>
              </View>
            </TouchableOpacity>
          ))}
          <View style={styles.pendingBox}>
            <Text style={styles.pendingText}>{PARTNER_SHARING_NOT_LIVE}</Text>
          </View>
        </View>
      ) : null}

      <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={startScanning}>
        <Ionicons name="qr-code-outline" size={18} color={colors.textOnButton} />
        <Text style={styles.primaryButtonText}>Scan Their Code</Text>
      </TouchableOpacity>
      <View style={styles.noteBox}>
        <Text style={styles.noteText}>
          Whoever goes second scans first. After that each screen says what to do next, until both phones show you are
          connected.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 14 },
  centerBody: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  centerIcon: { alignSelf: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  title: { ...typography.sectionTitle, color: colors.textPrimary, textAlign: 'center', ...textShadow },
  text: { ...typography.body, color: colors.textSecondary, textAlign: 'center', ...textShadow },
  errorText: { ...typography.body, color: colors.danger, textAlign: 'center', ...textShadow },
  qrWrap: { alignItems: 'center', paddingVertical: 8 },
  sectionLabel: { ...typography.label, color: colors.textPrimary, ...textShadow },
  grantHint: { ...typography.caption, color: colors.textMuted, ...textShadow },
  grantRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 6 },
  grantTextWrap: { flex: 1 },
  grantLabel: { ...typography.body, color: colors.textPrimary, ...textShadow },
  grantWhat: { ...typography.caption, color: colors.textMuted, ...textShadow },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxOn: { backgroundColor: colors.accent },
  checkMark: { ...typography.caption, color: colors.textOnPrimary, ...textShadow },
  fingerprintBox: {
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 4,
  },
  fingerprintLabel: { ...typography.caption, color: colors.textMuted, ...textShadow },
  fingerprintValue: { ...typography.body, color: colors.textPrimary, letterSpacing: 1, ...textShadow },
  fingerprintHint: { ...typography.caption, color: colors.textMuted, ...textShadow },
  pendingBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  pendingText: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  noteBox: { backgroundColor: colors.surface, borderRadius: 12, padding: 14 },
  noteText: { ...typography.caption, color: colors.textMuted, textAlign: 'center', ...textShadow },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.buttonColor,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    ...BUTTON_SHADOW,
  },
  primaryButtonText: { ...typography.body, color: colors.textOnButton, ...textShadow },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  secondaryButtonText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  camera: { flex: 1 },
  scanOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 16,
  },
  scanFooter: { padding: 20, gap: 10, backgroundColor: colors.background },
  scanHint: { ...typography.body, color: colors.textSecondary, textAlign: 'center', ...textShadow },
  scanError: { ...typography.caption, color: colors.danger, textAlign: 'center', ...textShadow },
});
