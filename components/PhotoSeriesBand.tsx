// Photo Series on a record (1.0.53.7): a photo a day from the same spot,
// played back as a flipbook and made into a GIF. Every rule and sentence is
// in lib/photoSeries.ts; the reading and writing in lib/photoSeriesDb.ts;
// the GIF in lib/photoGif.ts.
//
// Offered on a planting first, which is what the request named ("a daily
// picture of the same plant from the same spot"), and built on an owner kind
// and id like every photo, so any record can carry one.
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { localDay, takenOnLabel, type MediaItem } from '../lib/media';
import { listMediaFor, mediaDisplayUri } from '../lib/mediaDb';
import { openPhotoCamera } from '../lib/photoCamera';
import { makeSeriesGif, shareSeriesGif } from '../lib/photoGif';
import {
  FLIPBOOK_SPEEDS,
  frameDelayMs,
  gifMadeSentence,
  SERIES_START_LINE,
  seriesReminderLine,
  seriesSummary,
  type FlipbookSpeed,
  type PhotoSeries,
} from '../lib/photoSeries';
import {
  endSeries,
  listSeriesFor,
  resumeSeries,
  SERIES_GIF_OWNER_KIND,
  seriesFramesFor,
  setSeriesReminder,
  startSeries,
} from '../lib/photoSeriesDb';
import { syncReminderNotifications } from '../lib/reminderNotifications';
import { formatTime12 } from '../lib/timeOfDay';
import { PopoverSelect } from './PopoverSelect';

/** Every half hour from 5 in the morning to 10 at night. */
const TIME_OPTIONS = (() => {
  const out: { label: string; value: string }[] = [];
  for (let minutes = 5 * 60; minutes <= 22 * 60; minutes += 30) {
    const value = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    out.push({ label: formatTime12(value), value });
  }
  return out;
})();

export function PhotoSeriesBand({
  ownerKind,
  ownerId,
  title,
  tabColor,
}: {
  ownerKind: string;
  ownerId: string;
  title: string;
  tabColor: string;
}) {
  const router = useRouter();
  const [series, setSeries] = useState<PhotoSeries | null>(null);
  const [frames, setFrames] = useState<MediaItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<FlipbookSpeed>(FLIPBOOK_SPEEDS[1]);
  const [frameUri, setFrameUri] = useState<string | null>(null);
  const [gif, setGif] = useState<MediaItem | null>(null);
  const [gifUri, setGifUri] = useState<string | null>(null);
  const [gifLine, setGifLine] = useState<string | null>(null);
  const [making, setMaking] = useState<{ done: number; total: number } | null>(null);
  const uriCache = useRef(new Map<string, string | null>());
  const today = localDay(new Date());

  const load = useCallback(async () => {
    const all = await listSeriesFor(ownerKind, ownerId);
    const current = all[0] ?? null;
    setSeries(current);
    if (current) {
      const got = await seriesFramesFor(current);
      setFrames(got);
      setIndex(Math.max(0, got.length - 1));
      const gifs = await listMediaFor(SERIES_GIF_OWNER_KIND, current.id);
      setGif(gifs[0] ?? null);
    } else {
      setFrames([]);
      setGif(null);
    }
    setLoaded(true);
  }, [ownerKind, ownerId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  // The frame on show, read once and kept, so playback does not read the
  // same file again on every pass.
  useEffect(() => {
    const frame = frames[index];
    if (!frame) {
      setFrameUri(null);
      return;
    }
    const cached = uriCache.current.get(frame.id);
    if (cached !== undefined) {
      setFrameUri(cached);
      return;
    }
    let cancelled = false;
    void mediaDisplayUri(frame).then((uri) => {
      uriCache.current.set(frame.id, uri);
      if (!cancelled) setFrameUri(uri);
    });
    return () => {
      cancelled = true;
    };
  }, [frames, index]);

  useEffect(() => {
    if (!playing || frames.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % frames.length), frameDelayMs(speed.fps));
    return () => clearInterval(timer);
  }, [playing, frames.length, speed]);

  useEffect(() => {
    if (!gif) {
      setGifUri(null);
      return;
    }
    let cancelled = false;
    void mediaDisplayUri(gif).then((uri) => {
      if (!cancelled) setGifUri(uri);
    });
    return () => {
      cancelled = true;
    };
  }, [gif]);

  async function handleStart() {
    const started = await startSeries({ kind: ownerKind, id: ownerId }, title);
    setSeries(started);
    await load();
    void syncReminderNotifications();
  }

  async function handleReminder(on: boolean, time?: string) {
    if (!series) return;
    await setSeriesReminder(series.id, on, time);
    await load();
    void syncReminderNotifications();
  }

  async function handleEnd() {
    if (!series) return;
    setPlaying(false);
    if (series.endedOn) await resumeSeries(series.id);
    else await endSeries(series.id);
    await load();
    void syncReminderNotifications();
  }

  async function handleMakeGif() {
    if (!series || making) return;
    setPlaying(false);
    setGifLine(null);
    setMaking({ done: 0, total: frames.length });
    const result = await makeSeriesGif(series.id, frames, speed.fps, (done, total) => setMaking({ done, total }));
    setMaking(null);
    if (result.status === 'made') {
      setGif(result.item);
      setGifLine(gifMadeSentence(result.frameCount, result.totalFrames));
    } else if (result.status === 'too-few') {
      setGifLine('A GIF needs at least two photos that can be read on this device.');
    } else {
      setGifLine(`The GIF was not made. ${result.message}`);
    }
  }

  async function handleShareGif() {
    if (!gif) return;
    const shared = await shareSeriesGif(gif);
    if (!shared) setGifLine('Sharing is not available on this device. The GIF stays kept with this series.');
  }

  if (!loaded) return null;

  const muted = { color: colors.textMuted };

  if (!series) {
    return (
      <View style={styles.panel}>
        <Text style={styles.heading}>Photo Series</Text>
        <Text style={[styles.body, muted]}>{SERIES_START_LINE}</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: tabColor }]} onPress={() => void handleStart()} activeOpacity={0.8}>
          <Ionicons name="images-outline" size={16} color={colors.textOnPrimary} />
          <Text style={styles.buttonText}>Start a Photo Series</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const frameDays = frames.map((frame) => frame.takenOn);
  const running = series.endedOn === null;
  const frame = frames[index];

  return (
    <View style={styles.panel}>
      <Text style={styles.heading}>{running ? 'Photo Series' : 'Photo Series, ended'}</Text>
      <Text style={styles.body}>{seriesSummary(series, frameDays, today)}</Text>

      {frames.length > 0 ? (
        <View style={styles.viewer}>
          {frameUri ? (
            <Image source={{ uri: frameUri }} style={styles.frame} contentFit="cover" transition={0} />
          ) : (
            <View style={[styles.frame, styles.frameEmpty]}>
              <Text style={[styles.caption, muted]}>On the way from your other device</Text>
            </View>
          )}
          <Text style={[styles.caption, muted]}>
            {frame ? `${takenOnLabel(frame.takenOn, today)}, frame ${index + 1} of ${frames.length}` : ''}
          </Text>
          {frames.length > 1 ? (
            <View style={styles.controls}>
              <TouchableOpacity onPress={() => setIndex((i) => (i - 1 + frames.length) % frames.length)} hitSlop={8} accessibilityLabel="Earlier photo">
                <Ionicons name="play-back" size={20} color={tabColor} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPlaying((p) => !p)} hitSlop={8} accessibilityLabel={playing ? 'Pause' : 'Play'}>
                <Ionicons name={playing ? 'pause' : 'play'} size={24} color={tabColor} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIndex((i) => (i + 1) % frames.length)} hitSlop={8} accessibilityLabel="Later photo">
                <Ionicons name="play-forward" size={20} color={tabColor} />
              </TouchableOpacity>
              <View style={styles.speeds}>
                {FLIPBOOK_SPEEDS.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    onPress={() => setSpeed(option)}
                    style={[styles.speed, option.key === speed.key ? { backgroundColor: tabColor } : null]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.speedText, option.key === speed.key ? { color: colors.textOnPrimary } : { color: colors.textPrimary }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      {running ? (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: tabColor }]}
          onPress={() => openPhotoCamera(router, { kind: ownerKind, id: ownerId }, { guide: true, title })}
          activeOpacity={0.8}
        >
          <Ionicons name="camera-outline" size={16} color={colors.textOnPrimary} />
          <Text style={styles.buttonText}>{frameDays.includes(today) ? 'Take Another Photo Today' : "Take Today's Photo"}</Text>
        </TouchableOpacity>
      ) : null}

      {frames.length > 1 ? (
        making ? (
          <View style={styles.makingRow}>
            <ActivityIndicator color={tabColor} />
            <Text style={styles.caption}>{`Making the GIF, frame ${making.done} of ${making.total}`}</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.linkRow} onPress={() => void handleMakeGif()} activeOpacity={0.8}>
            <Ionicons name="film-outline" size={16} color={tabColor} />
            <Text style={[styles.link, { color: tabColor }]}>{gif ? 'Make the GIF Again' : 'Make a GIF'}</Text>
          </TouchableOpacity>
        )
      ) : null}
      {gifLine ? <Text style={[styles.caption, muted]}>{gifLine}</Text> : null}
      {gif && gifUri ? (
        <View style={styles.viewer}>
          <Image source={{ uri: gifUri }} style={styles.frame} contentFit="contain" autoplay />
          <TouchableOpacity style={styles.linkRow} onPress={() => void handleShareGif()} activeOpacity={0.8}>
            <Ionicons name="share-outline" size={16} color={tabColor} />
            <Text style={[styles.link, { color: tabColor }]}>Share the GIF</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Text style={[styles.caption, muted]}>{seriesReminderLine(series, formatTime12(series.reminderTime))}</Text>
      {running ? (
        <View style={styles.reminderRow}>
          <TouchableOpacity onPress={() => void handleReminder(!series.reminderOn)} activeOpacity={0.8} style={styles.linkRow}>
            <Ionicons name={series.reminderOn ? 'notifications-off-outline' : 'notifications-outline'} size={16} color={tabColor} />
            <Text style={[styles.link, { color: tabColor }]}>{series.reminderOn ? 'Turn the Reminder Off' : 'Turn the Reminder On'}</Text>
          </TouchableOpacity>
          {series.reminderOn ? (
            <PopoverSelect
              options={TIME_OPTIONS}
              selected={series.reminderTime}
              onSelect={(value) => void handleReminder(true, value)}
              tabColor={tabColor}
              width={140}
            />
          ) : null}
        </View>
      ) : null}
      <TouchableOpacity onPress={() => void handleEnd()} activeOpacity={0.8} style={styles.linkRow}>
        <Text style={[styles.link, { color: tabColor }]}>{running ? 'End This Series' : 'Carry On With This Series'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const noShadow = { textShadowColor: 'transparent', textShadowRadius: 0 } as const;

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.surface, borderRadius: 12, padding: 12, gap: 8 },
  heading: { ...typography.bodyEmphasis, color: colors.textPrimary, ...noShadow },
  body: { ...typography.body, color: colors.textPrimary, ...noShadow },
  caption: { ...typography.caption, color: colors.textPrimary, ...noShadow },
  viewer: { gap: 6 },
  frame: { width: '100%', aspectRatio: 3 / 4, maxHeight: 420, borderRadius: 10, backgroundColor: colors.surfaceMuted },
  frameEmpty: { alignItems: 'center', justifyContent: 'center', padding: 12 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  speeds: { flexDirection: 'row', gap: 6 },
  speed: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: colors.surfaceMuted },
  speedText: { ...typography.caption, ...noShadow },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonText: { ...typography.bodyEmphasis, color: colors.textOnPrimary, ...noShadow },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  link: { ...typography.bodyEmphasis, ...noShadow },
  makingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
});
