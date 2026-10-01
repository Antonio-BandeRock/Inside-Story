// Photos Over Time (D12, 2026-09-30): every photo taken with a flare, a food
// reaction or a food trial day, lined up oldest first by the day it was
// taken, with the entry each came from under it. Every rule and sentence is
// in lib/symptomPhotos.ts; this reads the rows and draws them.
//
// One photo is open large at the top, with Earlier and Later to step through
// the list in order, which is how a person looks at the same rash across
// weeks. Below it each day with a photo is a row of thumbnails. Nothing is
// compared or judged; the words under a photo are the entry as logged.
//
// Folded by default like every band. On the desktop the photos show once
// sync has brought their files over, the same as anywhere else a photo is.
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { useBandFolds } from '../hooks/useBandFolds';
import { regionLabel } from '../lib/bodyMap';
import { getCheckinTagDefinition } from '../lib/checkinTags';
import { listCheckinsByIds } from '../lib/db';
import { PHOTO_ON_THE_WAY, type MediaItem } from '../lib/media';
import { listMediaOfKind, mediaDisplayUri, mediaThumbUri } from '../lib/mediaDb';
import { describeSeverity } from '../lib/severityScale';
import {
  ALL_PHOTOS,
  entryCaption,
  filterChoices,
  filterValue,
  photoSequence,
  photoTimeline,
  positionLine,
  SYMPTOM_PHOTOS_EMPTY,
  SYMPTOM_PHOTOS_PRIVATE,
  timelineSentence,
  type PhotoEntry,
  type PhotoFilter,
  type Words,
} from '../lib/symptomPhotos';
import { PopoverSelect } from './PopoverSelect';
import { TabBand } from './TabBand';

const WORDS: Words = {
  tag: (code) => getCheckinTagDefinition(code)?.label ?? code,
  region: regionLabel,
  severity: (step, ten) => describeSeverity(step, ten),
};

/** SQLite takes a limited number of values in one IN list. */
const ID_CHUNK = 400;

async function entriesFor(ids: string[]): Promise<PhotoEntry[]> {
  const out: PhotoEntry[] = [];
  for (let i = 0; i < ids.length; i += ID_CHUNK) {
    const rows = await listCheckinsByIds(ids.slice(i, i + ID_CHUNK));
    for (const row of rows) {
      out.push({
        id: row.id,
        loggedAt: row.loggedAt,
        checkinType: row.checkinType,
        severity: row.severity ?? null,
        severityTen: row.severityTen ?? null,
        foodName: row.foodName ?? null,
        tags: row.tags,
        bodyRegions: row.bodyRegions,
      });
    }
  }
  return out;
}

function Thumb({ item, size, onPress, active, color }: { item: MediaItem; size: number; onPress: () => void; active: boolean; color: string }) {
  const [uri, setUri] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    void mediaThumbUri(item).then((value) => {
      if (!cancelled) setUri(value);
    });
    return () => {
      cancelled = true;
    };
  }, [item]);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.thumbWrap, { width: size, height: size }, active && { borderColor: color, borderWidth: 2 }]}
      accessibilityRole="button"
      accessibilityLabel="Open this photo"
    >
      {uri ? <Image source={{ uri }} style={styles.thumb} contentFit="cover" transition={0} /> : <View style={[styles.thumb, styles.thumbEmpty]} />}
    </TouchableOpacity>
  );
}

export function SymptomPhotosOverTime({ tabColor }: { tabColor: string }) {
  const folds = useBandFolds();
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [entries, setEntries] = useState<PhotoEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<PhotoFilter>(ALL_PHOTOS);
  const [openId, setOpenId] = useState<string | null>(null);
  const [largeUri, setLargeUri] = useState<string | null | undefined>(undefined);
  const uriCache = useRef(new Map<string, string | null>());

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        const items = await listMediaOfKind('symptom');
        const ids = [...new Set(items.map((item) => item.ownerId))];
        const rows = await entriesFor(ids);
        if (cancelled) return;
        setPhotos(items);
        setEntries(rows);
        setLoaded(true);
      })().catch(() => setLoaded(true));
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const choices = useMemo(() => filterChoices(photos, entries, WORDS), [photos, entries]);
  // A choice that no longer has a photo (its entry was removed) falls back
  // to every photo rather than an empty list.
  const activeFilter = choices.some((choice) => choice.value === filterValue(filter)) ? filter : ALL_PHOTOS;
  const sequence = useMemo(() => photoSequence(photos, entries, activeFilter), [photos, entries, activeFilter]);
  const days = useMemo(() => photoTimeline(photos, entries, activeFilter), [photos, entries, activeFilter]);

  const openIndex = Math.max(
    0,
    sequence.findIndex((item) => item.photo.id === openId),
  );
  const opened = sequence.length > 0 ? sequence[openId ? openIndex : sequence.length - 1] : null;
  const shownIndex = opened ? sequence.indexOf(opened) : -1;

  useEffect(() => {
    if (!opened) {
      setLargeUri(undefined);
      return;
    }
    const cached = uriCache.current.get(opened.photo.id);
    if (cached !== undefined) {
      setLargeUri(cached);
      return;
    }
    let cancelled = false;
    setLargeUri(undefined);
    void mediaDisplayUri(opened.photo).then((uri) => {
      uriCache.current.set(opened.photo.id, uri);
      if (!cancelled) setLargeUri(uri);
    });
    return () => {
      cancelled = true;
    };
  }, [opened]);

  if (!loaded) return null;

  const step = (by: number) => {
    const next = sequence[shownIndex + by];
    if (next) setOpenId(next.photo.id);
  };

  return (
    <TabBand folds={folds} color={tabColor} id="signals:symptom-photos" title="Photos Over Time" icon="images-outline" count={photos.length}>
      <View style={styles.panel}>
        {photos.length === 0 ? (
          <Text style={styles.body}>{SYMPTOM_PHOTOS_EMPTY}</Text>
        ) : (
          <>
            {choices.length > 1 ? (
              <PopoverSelect
                options={choices.map(({ label, value }) => ({ label, value }))}
                selected={filterValue(activeFilter)}
                onSelect={(value) => {
                  const choice = choices.find((each) => each.value === value);
                  if (choice) {
                    setFilter(choice.filter);
                    setOpenId(null);
                  }
                }}
                tabColor={tabColor}
                searchable={choices.length > 12}
              />
            ) : null}
            <Text style={styles.body}>{timelineSentence(days)}</Text>

            {opened ? (
              <View style={styles.viewer}>
                {largeUri ? (
                  <Image source={{ uri: largeUri }} style={styles.large} contentFit="contain" transition={0} />
                ) : (
                  <View style={[styles.large, styles.largeEmpty]}>
                    <Text style={[styles.caption, styles.muted]}>{largeUri === null ? PHOTO_ON_THE_WAY : ''}</Text>
                  </View>
                )}
                <Text style={styles.caption}>{positionLine(shownIndex, sequence.length, opened.photo.takenOn)}</Text>
                <Text style={[styles.caption, styles.muted]}>{entryCaption(opened.entry, WORDS)}</Text>
                {sequence.length > 1 ? (
                  <View style={styles.controls}>
                    <TouchableOpacity
                      onPress={() => step(-1)}
                      disabled={shownIndex <= 0}
                      style={[styles.linkRow, shownIndex <= 0 && styles.disabled]}
                      accessibilityRole="button"
                    >
                      <Ionicons name="chevron-back" size={16} color={tabColor} />
                      <Text style={[styles.link, { color: tabColor }]}>Earlier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => step(1)}
                      disabled={shownIndex >= sequence.length - 1}
                      style={[styles.linkRow, shownIndex >= sequence.length - 1 && styles.disabled]}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.link, { color: tabColor }]}>Later</Text>
                      <Ionicons name="chevron-forward" size={16} color={tabColor} />
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            ) : null}

            {days.map((day) => (
              <View key={day.day} style={styles.day}>
                <Text style={styles.dayLabel}>{day.label}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
                  {day.photos.map(({ photo }) => (
                    <Thumb
                      key={photo.id}
                      item={photo}
                      size={72}
                      color={tabColor}
                      active={opened?.photo.id === photo.id}
                      onPress={() => setOpenId(photo.id)}
                    />
                  ))}
                </ScrollView>
              </View>
            ))}
            <Text style={[styles.caption, styles.muted]}>{SYMPTOM_PHOTOS_PRIVATE}</Text>
          </>
        )}
      </View>
    </TabBand>
  );
}

const noShadow = { textShadowColor: 'transparent', textShadowRadius: 0 } as const;

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.surface, borderRadius: 12, padding: 12, gap: 8 },
  body: { ...typography.body, color: colors.textPrimary, ...noShadow },
  caption: { ...typography.caption, color: colors.textPrimary, ...noShadow },
  muted: { color: colors.textMuted },
  viewer: { gap: 4 },
  large: { width: '100%', aspectRatio: 3 / 4, maxHeight: 420, borderRadius: 10, backgroundColor: colors.surfaceMuted },
  largeEmpty: { alignItems: 'center', justifyContent: 'center', padding: 12 },
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  link: { ...typography.bodyEmphasis, ...noShadow },
  disabled: { opacity: 0.35 },
  day: { gap: 4 },
  dayLabel: { ...typography.bodyEmphasis, color: colors.textPrimary, ...noShadow },
  thumbRow: { gap: 8 },
  thumbWrap: { borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  thumb: { width: '100%', height: '100%' },
  thumbEmpty: { backgroundColor: colors.surfaceMuted },
});
