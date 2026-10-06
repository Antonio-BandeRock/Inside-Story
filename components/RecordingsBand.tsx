// Recordings You Have (2026-09-30, 1.0.57.23): the band on Signals > Calm
// for audio somebody brings in. Every rule and sentence is lib/recordings.ts;
// reading, writing and the folder are lib/recordingsDb.ts.
//
// The computer plays a recording here, through the browser's Audio element,
// from the folder on its disk. The phone plays it here too since R1, through
// expo-audio behind the same shape (lib/phoneAudio.ts), from its cache.
// Leaving the lens stops whatever is playing.
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { typography } from '../constants/typography';
import type { useBandFolds } from '../hooks/useBandFolds';
import { isDesktopApp } from '../lib/desktop/bridge';
import { getRecordingsFolder } from '../lib/oneDriveFolders';
import {
  playClock,
  recordingCaption,
  recordingNameProblem,
  recordingsLead,
  RECORDINGS_EMPTY,
  type Recording,
  type RecordingPlace,
} from '../lib/recordings';
import {
  addRecordingFromPicker,
  listRecordings,
  recordingLocalUri,
  recordingPlaces,
  recordingPlayUrl,
  removeRecording,
  renameRecording,
  syncRecordings,
} from '../lib/recordingsDb';
import { phoneAudio } from '../lib/phoneAudio';
import { AppTextInput } from './AppTextInput';
import type { useConfirmSheet } from './ConfirmSheet';
import { TabBand } from './TabBand';
import { ThumbRow } from './ThumbRow';

type Folds = ReturnType<typeof useBandFolds>;
type Confirm = ReturnType<typeof useConfirmSheet>[0];

/** The parts of the browser's Audio element this band uses. */
type WebAudio = {
  play: () => Promise<void>;
  pause: () => void;
  currentTime: number;
  duration: number;
  onended: (() => void) | null;
};

type Playing = { id: string; audio: WebAudio; release: () => void; paused: boolean };

export function RecordingsBand({ tabColor, folds, confirm }: { tabColor: string; folds: Folds; confirm: Confirm }) {
  const onComputer = isDesktopApp();
  const [items, setItems] = useState<Recording[]>([]);
  const [places, setPlaces] = useState<Map<string, RecordingPlace>>(new Map());
  const [hasFolder, setHasFolder] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [clock, setClock] = useState({ at: 0, of: 0 });
  const playing = useRef<Playing | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);

  const load = useCallback(async () => {
    const list = await listRecordings().catch(() => [] as Recording[]);
    setItems(list);
    setPlaces(await recordingPlaces(list).catch(() => new Map<string, RecordingPlace>()));
    setHasFolder(await getRecordingsFolder().then((r) => r.ok).catch(() => false));
  }, []);

  const stop = useCallback(() => {
    const now = playing.current;
    if (!now) return;
    now.audio.pause();
    now.audio.onended = null;
    now.release();
    playing.current = null;
    setPlayingId(null);
    setPaused(false);
    setClock({ at: 0, of: 0 });
  }, []);

  useEffect(() => {
    void load();
    void syncRecordings({ afterSave: false }).then(load);
  }, [load]);

  useFocusEffect(useCallback(() => () => stop(), [stop]));

  useEffect(() => {
    if (!playingId) return undefined;
    const timer = setInterval(() => {
      const now = playing.current;
      if (!now) return;
      setClock({ at: now.audio.currentTime, of: Number.isFinite(now.audio.duration) ? now.audio.duration : 0 });
    }, 500);
    return () => clearInterval(timer);
  }, [playingId]);

  async function add() {
    setBusy(true);
    setMessage(null);
    const result = await addRecordingFromPicker();
    setBusy(false);
    if (result.status === 'problem') setMessage(result.message);
    if (result.status === 'added') await load();
  }

  async function play(item: Recording) {
    setMessage(null);
    if (playingId === item.id && playing.current) {
      const now = playing.current;
      if (paused) {
        await now.audio.play().catch(() => undefined);
        setPaused(false);
      } else {
        now.audio.pause();
        setPaused(true);
      }
      return;
    }
    stop();
    if (!onComputer) {
      setBusy(true);
      const local = await recordingLocalUri(item);
      setBusy(false);
      if (!local.ok) {
        setMessage(local.reason);
        return;
      }
      const made = phoneAudio(local.uri);
      await begin(item, made.audio, made.release);
      await load();
      return;
    }
    setBusy(true);
    const ready = await recordingPlayUrl(item);
    setBusy(false);
    if (!ready.ok) {
      setMessage(ready.reason);
      return;
    }
    const AudioCtor = (globalThis as unknown as { Audio?: new (url: string) => WebAudio }).Audio;
    if (!AudioCtor) {
      ready.release();
      setMessage('This device has no way to play audio inside the app.');
      return;
    }
    await begin(item, new AudioCtor(ready.url), ready.release);
  }

  async function begin(item: Recording, audio: WebAudio, release: () => void) {
    audio.onended = () => stop();
    playing.current = { id: item.id, audio, release, paused: false };
    setPlayingId(item.id);
    setPaused(false);
    try {
      await audio.play();
    } catch {
      stop();
      setMessage('That recording would not play here. Try opening it from the Recordings folder in another player.');
    }
  }

  function skip(seconds: number) {
    const now = playing.current;
    if (!now) return;
    const end = Number.isFinite(now.audio.duration) ? now.audio.duration : now.audio.currentTime + seconds;
    now.audio.currentTime = Math.max(0, Math.min(end, now.audio.currentTime + seconds));
  }

  async function saveName() {
    if (!renaming) return;
    const others = items.filter((item) => item.id !== renaming.id).map((item) => item.name);
    const wrong = recordingNameProblem(renaming.name, others);
    if (wrong) {
      setProblem(wrong);
      return;
    }
    await renameRecording(renaming.id, renaming.name);
    setRenaming(null);
    setProblem(null);
    await load();
  }

  async function remove(item: Recording) {
    const ok = await confirm({
      title: `Remove ${item.name}?`,
      message: 'It goes from this list, from this device and from the Recordings folder in your shared folder.',
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (!ok) return;
    if (playingId === item.id) stop();
    await removeRecording(item);
    await load();
  }

  return (
    <TabBand folds={folds} color={tabColor} id="signals:calm-recordings" title="Recordings You Have" icon="musical-notes-outline">
      <View style={styles.panel}>
        <Text style={styles.body}>{recordingsLead(onComputer, hasFolder)}</Text>
        {items.length === 0 ? <Text style={[styles.caption, styles.muted]}>{RECORDINGS_EMPTY}</Text> : null}
        {items.map((item) => {
          const isPlaying = playingId === item.id;
          return (
            <View key={item.id} style={styles.row}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={[styles.caption, styles.muted]}>{recordingCaption(item, places.get(item.id) ?? 'nowhere')}</Text>
              {isPlaying ? (
                <Text style={styles.caption}>{`${playClock(clock.at)}${clock.of > 0 ? ` of ${playClock(clock.of)}` : ''}${paused ? ', paused' : ''}`}</Text>
              ) : null}
              <View style={styles.linkRow}>
                <TouchableOpacity onPress={() => void play(item)} disabled={busy && !isPlaying}>
                  <Text style={[styles.link, { color: tabColor }]}>
                    {isPlaying ? (paused ? 'Carry on' : 'Pause') : 'Play'}
                  </Text>
                </TouchableOpacity>
                {isPlaying ? (
                  <>
                    <TouchableOpacity onPress={() => skip(-15)}>
                      <Text style={[styles.link, { color: tabColor }]}>Back 15 s</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={stop}>
                      <Text style={[styles.link, { color: tabColor }]}>Stop</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={() => {
                        setProblem(null);
                        setRenaming({ id: item.id, name: item.name });
                      }}
                    >
                      <Text style={[styles.link, { color: tabColor }]}>Rename</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => void remove(item)}>
                      <Text style={[styles.link, { color: colors.statusRedOnSurface }]}>Remove</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
              {renaming?.id === item.id ? (
                <View style={styles.form}>
                  <AppTextInput style={styles.input} value={renaming.name} onChangeText={(name) => setRenaming({ ...renaming, name })} placeholder="Name" />
                  {problem ? <Text style={[styles.caption, { color: colors.statusRedOnSurface }]}>{problem}</Text> : null}
                  <ThumbRow primary="last" style={styles.actions}>
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() => {
                        setRenaming(null);
                        setProblem(null);
                      }}
                    >
                      <Text style={[styles.buttonText, { color: tabColor }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryButton} onPress={() => void saveName()}>
                      <Text style={styles.primaryButtonText}>Save</Text>
                    </TouchableOpacity>
                  </ThumbRow>
                </View>
              ) : null}
            </View>
          );
        })}
        {message ? <Text style={[styles.caption, { color: colors.statusRedOnSurface }]}>{message}</Text> : null}
        <View style={styles.actionsCenter}>
          <TouchableOpacity style={[styles.primaryButton, busy && styles.disabled]} onPress={() => void add()} disabled={busy}>
            <Text style={styles.primaryButtonText}>{busy ? 'Working…' : 'Bring In a Recording'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TabBand>
  );
}

const noShadow = { textShadowColor: 'transparent', textShadowRadius: 0 } as const;

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.surface, borderRadius: 12, padding: 12, gap: 8 },
  body: { ...typography.body, color: colors.textPrimary, ...noShadow },
  caption: { ...typography.caption, color: colors.textPrimary, ...noShadow },
  name: { ...typography.bodyEmphasis, color: colors.textPrimary, ...noShadow },
  muted: { color: colors.textMuted },
  row: { gap: 2, paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  linkRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, paddingVertical: 2 },
  link: { ...typography.bodyEmphasis, ...noShadow },
  form: { gap: 8, padding: 10, borderRadius: 10, backgroundColor: colors.surfaceMuted, marginTop: 4 },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
  },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  actionsCenter: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
  secondaryButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  buttonText: { ...typography.bodyEmphasis, ...noShadow },
  primaryButton: { paddingVertical: 10, paddingHorizontal: 22, borderRadius: 8, backgroundColor: colors.buttonColor, ...BUTTON_SHADOW },
  primaryButtonText: { ...typography.bodyEmphasis, color: colors.textOnButton, ...noShadow },
  disabled: { opacity: 0.4 },
});
