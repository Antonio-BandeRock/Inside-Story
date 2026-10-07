// Recording the Ghostead trailer's voices, in Profile > Developer Tools
// (2026-10-06). One row per line, with the words and how to say them; each
// take is kept on this phone as <id>.m4a under the document folder, and Send
// to OneDrive copies every take into Backups/Voiceover, which is where the
// trailer page's voice/ folder is filled from. A take recorded again replaces
// the last one, here and in OneDrive.
//
// Developer Tools only. Recording needs a phone: the desktop build has no
// microphone path, so it says so rather than offering buttons that cannot work.
import { Directory, File, Paths } from 'expo-file-system';
import {
  createAudioPlayer,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
  type AudioPlayer,
} from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { isDesktopApp } from '../lib/desktop/bridge';
import { announcePhoneOnly } from '../lib/desktop/phoneOnly';
import { explainNotYet } from '../lib/notYet';
import { ensureChildFolder, uploadFile } from '../lib/oneDriveGraph';
import { getBackupsFolder } from '../lib/oneDriveFolders';
import { SPEAKER_LABEL, VOICEOVER_LINES } from '../lib/voiceoverScript';
import { useInfoAlert } from './InfoAlert';

const FOLDER_NAME = 'voiceover';
const ONEDRIVE_FOLDER_NAME = 'Voiceover';

function takesFolder(): Directory {
  return new Directory(Paths.document, FOLDER_NAME);
}

function takeFile(id: string): File {
  return new File(takesFolder(), id + '.m4a');
}

function readTakes(): Set<string> {
  const found = new Set<string>();
  try {
    for (const line of VOICEOVER_LINES) if (takeFile(line.id).exists) found.add(line.id);
  } catch {
    // No folder yet means no takes yet.
  }
  return found;
}

function clock(millis: number): string {
  const seconds = Math.floor(millis / 1000);
  return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
}

export function VoiceoverRecorder() {
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const [takes, setTakes] = useState<Set<string>>(() => (isDesktopApp() ? new Set() : readTakes()));
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const player = useRef<{ player: AudioPlayer; release: () => void } | null>(null);

  const stopPlaying = useCallback(() => {
    player.current?.release();
    player.current = null;
    setPlayingId(null);
  }, []);

  useEffect(() => stopPlaying, [stopPlaying]);

  const record = async (id: string) => {
    if (announcePhoneOnly(showInfoAlert, 'voice')) return;
    if (recordingId) {
      explainNotYet('Stop the line being recorded first, then start this one.');
      return;
    }
    stopPlaying();
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      showInfoAlert(
        'The microphone is off for Inside Story',
        'Recording a line needs the microphone. Turn it on for Inside Story in the phone\'s Settings, under Apps, then come back and press Record again.',
      );
      return;
    }
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecordingId(id);
      setMessage(null);
    } catch (error) {
      showInfoAlert('Recording could not start', error instanceof Error ? error.message : String(error));
    }
  };

  const stop = async () => {
    const id = recordingId;
    if (!id) return;
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error('The phone did not hand back a recording.');
      const folder = takesFolder();
      if (!folder.exists) folder.create({ intermediates: true, idempotent: true });
      const dest = takeFile(id);
      if (dest.exists) dest.delete();
      new File(uri).copy(dest);
      setTakes(readTakes());
    } catch (error) {
      showInfoAlert('The take could not be kept', error instanceof Error ? error.message : String(error));
    } finally {
      setRecordingId(null);
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
    }
  };

  const play = (id: string) => {
    if (recordingId) {
      explainNotYet('Stop recording first, then play a take.');
      return;
    }
    if (playingId === id) {
      stopPlaying();
      return;
    }
    stopPlaying();
    const next = createAudioPlayer(takeFile(id).uri);
    const subscription = next.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) stopPlaying();
    });
    player.current = {
      player: next,
      release: () => {
        subscription.remove();
        next.remove();
      },
    };
    next.play();
    setPlayingId(id);
  };

  const send = async () => {
    if (recordingId) {
      explainNotYet('Stop recording first, then send the takes.');
      return;
    }
    const ids = VOICEOVER_LINES.map((line) => line.id).filter((id) => takes.has(id));
    if (ids.length === 0) {
      explainNotYet('Record at least one line first. There is nothing to send yet.');
      return;
    }
    setSending(true);
    setMessage('Sending ' + ids.length + (ids.length === 1 ? ' take' : ' takes') + ' to OneDrive...');
    try {
      const backups = await getBackupsFolder();
      if (!backups.ok) throw new Error(backups.reason);
      const folder = await ensureChildFolder(backups.value, ONEDRIVE_FOLDER_NAME);
      if (!folder.ok) throw new Error(folder.reason);
      const failed: string[] = [];
      for (const id of ids) {
        const sent = await uploadFile(folder.value, id + '.m4a', takeFile(id).uri, 'audio/mp4');
        if (!sent.ok) failed.push(id + ' (' + sent.reason + ')');
      }
      setMessage(
        failed.length === 0
          ? 'Sent ' + ids.length + (ids.length === 1 ? ' take' : ' takes') + ' to Backups/Voiceover in OneDrive.'
          : 'Sent ' + (ids.length - failed.length) + ' of ' + ids.length + '. Not sent: ' + failed.join(', ') + '.',
      );
    } catch (error) {
      setMessage(null);
      showInfoAlert('The takes could not be sent', error instanceof Error ? error.message : String(error));
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.wrap}>
      {infoAlertElement}
      <Text style={styles.heading}>Ghostead Trailer Voiceover</Text>
      <Text style={styles.help}>
        Record each line of the trailer in your voice. A quiet room helps, with the phone about a hand&apos;s width from
        your mouth. Each take replaces the last one for that line. When you are done, Send to OneDrive puts every take
        in Backups/Voiceover, and the trailer plays your takes in place of the stand-in voices.
      </Text>
      <Text style={styles.help}>
        {takes.size} of {VOICEOVER_LINES.length} lines recorded.
      </Text>
      {VOICEOVER_LINES.map((line) => {
        const isRecording = recordingId === line.id;
        const hasTake = takes.has(line.id);
        return (
          <View key={line.id} style={[styles.row, isRecording && styles.rowRecording]}>
            <Text style={styles.label}>
              {line.id} · {SPEAKER_LABEL[line.speaker]}
              {hasTake ? ' · recorded' : ''}
            </Text>
            <Text style={styles.words}>{line.text}</Text>
            <Text style={styles.direction}>{line.direction}</Text>
            <View style={styles.buttons}>
              {isRecording ? (
                <TouchableOpacity style={[styles.button, styles.stopButton]} onPress={() => void stop()}>
                  <Text style={styles.buttonText}>Stop · {clock(recorderState.durationMillis ?? 0)}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.button} onPress={() => void record(line.id)}>
                  <Text style={styles.buttonText}>{hasTake ? 'Record Again' : 'Record'}</Text>
                </TouchableOpacity>
              )}
              {hasTake ? (
                <TouchableOpacity style={styles.outlineButton} onPress={() => play(line.id)}>
                  <Text style={styles.outlineButtonText}>{playingId === line.id ? 'Stop Playing' : 'Play'}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        );
      })}
      {message ? <Text style={styles.help}>{message}</Text> : null}
      <TouchableOpacity style={styles.button} disabled={sending} onPress={() => void send()}>
        <Text style={styles.buttonText}>{sending ? 'Sending...' : 'Send to OneDrive'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 16,
    gap: 10,
  },
  heading: {
    ...typography.bodyEmphasis,
    color: colors.textPrimary,
    ...textShadow,
  },
  help: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 18,
    ...textShadow,
  },
  row: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  rowRecording: {
    borderColor: colors.primary,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    ...textShadow,
  },
  words: {
    ...typography.body,
    color: colors.textPrimary,
    ...textShadow,
  },
  direction: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    ...textShadow,
  },
  buttons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignSelf: 'flex-start',
  },
  stopButton: {
    backgroundColor: colors.danger,
  },
  buttonText: {
    ...typography.captionEmphasis,
    color: colors.textOnPrimary,
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  outlineButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignSelf: 'flex-start',
  },
  outlineButtonText: {
    ...typography.captionEmphasis,
    color: colors.textPrimary,
    ...textShadow,
  },
});
