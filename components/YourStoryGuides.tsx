// Your Story guides, 2026-09-24 (lib/yourStoryGuides.ts holds every guide,
// every sentence and when a step counts as done; this file lays them out).
//
// One fold band per guide on the Your Story page: The Basics first, then
// one for each part of life chosen. A folded guide shows its opening line
// and nothing counted, since "how far along" would be a score. The guide
// the Home card points into opens by itself, as does one asked for by name.
//
// Each step reads as three short lines: what to do and where, what it does
// for you, and what it feeds next when something later draws on it. A step
// is ticked, with its date, when its record exists; a step that is only
// reading or looking carries a book instead of a circle and is never ticked.
import { Ionicons } from '@expo/vector-icons';
import { useState, type ComponentProps } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type LayoutChangeEvent } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import type { StoryDestination } from '../lib/yourStory';
import {
  GUIDES_HEADING,
  GUIDES_LEAD,
  READ_LABEL,
  type GuideEntryView,
  type GuideKey,
  type GuideView,
} from '../lib/yourStoryGuides';
import { BeatPicker } from './BeatPicker';
import { HOME_BAND_CONTENT_PADDING, homeBandStyle } from './HomeSectionBand';

type Props = {
  guides: GuideView[];
  // Opened when the page first shows: the guide asked for, or the one the
  // Home card points into.
  initiallyOpen: GuideKey | null;
  go: (destination: Exclude<StoryDestination, { kind: 'beats' }>) => void;
  onChanged: () => void;
  // Where each guide band sits in the scroll content, so the page can
  // scroll to the one asked for.
  onGuideLayout?: (key: GuideKey, y: number) => void;
};

export function YourStoryGuides({ guides, initiallyOpen, go, onChanged, onGuideLayout }: Props) {
  const [open, setOpen] = useState<GuideKey[]>(initiallyOpen ? [initiallyOpen] : []);
  const [beatsOpen, setBeatsOpen] = useState(false);

  function toggle(key: GuideKey) {
    setOpen((keys) => (keys.includes(key) ? keys.filter((entry) => entry !== key) : [...keys, key]));
  }

  function renderEntry(guideKey: GuideKey, view: GuideEntryView) {
    const { entry, state } = view;
    const done = state === 'done';
    const icon: ComponentProps<typeof Ionicons>['name'] =
      state === 'reading'
        ? 'book-outline'
        : done
          ? 'checkmark-circle'
          : state === 'setAside'
            ? 'remove-circle-outline'
            : 'ellipse-outline';
    const iconColor = done ? colors.primary : colors.textMuted;
    const isBeats = entry.destination.kind === 'beats';
    const goLabel = isBeats
      ? beatsOpen
        ? 'Close'
        : done
          ? 'Change'
          : 'Choose'
      : state === 'reading'
        ? READ_LABEL
        : done
          ? 'Open'
          : 'Go there';
    return (
      <View key={`${guideKey}:${entry.key}`} style={styles.entry}>
        <View style={styles.entryHead}>
          <Ionicons name={icon} size={18} color={iconColor} style={[textShadow, styles.entryIcon]} />
          <View style={styles.entryText}>
            <Text style={styles.doThis}>{entry.doThis}</Text>
            <Text style={styles.forYou}>{entry.forYou}</Text>
            {entry.leadsTo ? <Text style={styles.leadsTo}>{entry.leadsTo}</Text> : null}
            {view.dateline ? <Text style={styles.dateline}>{view.dateline}</Text> : null}
            {view.note ? <Text style={styles.note}>{view.note}</Text> : null}
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.action}
            onPress={() => (entry.destination.kind === 'beats' ? setBeatsOpen((value) => !value) : go(entry.destination))}
            accessibilityRole="button"
          >
            <Text style={styles.actionText}>{goLabel}</Text>
            <Ionicons name="arrow-forward" size={13} color={colors.primary} style={textShadow} />
          </TouchableOpacity>
        </View>
        {isBeats && beatsOpen ? (
          <View style={styles.beatsBox}>
            <BeatPicker onChanged={onChanged} onDone={() => setBeatsOpen(false)} />
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <>
      <View style={styles.band}>
        <Text style={styles.heading}>{GUIDES_HEADING}</Text>
        <Text style={styles.lead}>{GUIDES_LEAD}</Text>
      </View>
      {guides.map((guide) => {
        const key = guide.def.key;
        const isOpen = open.includes(key);
        return (
          <View
            key={key}
            style={[styles.band, isOpen && styles.bandOpen]}
            onLayout={(event: LayoutChangeEvent) => onGuideLayout?.(key, event.nativeEvent.layout.y)}
          >
            <TouchableOpacity
              onPress={() => toggle(key)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              style={styles.headRow}
            >
              <View style={styles.headText}>
                <Text style={styles.title}>{guide.def.title}</Text>
                {isOpen ? null : (
                  <Text style={styles.folded} numberOfLines={2}>
                    {guide.def.opening}
                  </Text>
                )}
              </View>
              <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primary} style={textShadow} />
            </TouchableOpacity>
            {isOpen ? (
              <>
                <Text style={styles.opening}>{guide.def.opening}</Text>
                <View style={styles.entries}>{guide.entries.map((entry) => renderEntry(key, entry))}</View>
              </>
            ) : null}
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  band: {
    ...homeBandStyle,
    borderColor: colors.border,
    padding: HOME_BAND_CONTENT_PADDING,
    gap: 10,
  },
  bandOpen: { borderColor: colors.primary },
  heading: { ...typography.sectionTitle, color: colors.textPrimary, ...textShadow },
  lead: { ...typography.body, color: colors.textSecondary, ...textShadow },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headText: { flex: 1, gap: 2 },
  title: { ...typography.sectionTitle, color: colors.textPrimary, ...textShadow },
  folded: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  opening: { ...typography.body, color: colors.textSecondary, ...textShadow },
  entries: { gap: 16 },
  // A guide band is colors.surface, painted again here so every line sits
  // on a surface wherever an entry lands.
  entry: { gap: 6, backgroundColor: colors.surface },
  entryHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  entryIcon: { marginTop: 1 },
  entryText: { flex: 1, gap: 3 },
  doThis: { ...typography.body, color: colors.textPrimary, ...textShadow },
  forYou: { ...typography.body, color: colors.textSecondary, ...textShadow },
  leadsTo: { ...typography.caption, color: colors.accent, ...textShadow },
  dateline: { ...typography.caption, color: colors.textMuted, ...textShadow },
  note: { ...typography.caption, color: colors.textMuted, ...textShadow },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16, paddingLeft: 26 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2 },
  actionText: { ...typography.caption, color: colors.primary, ...textShadow },
  beatsBox: { paddingLeft: 26 },
});
