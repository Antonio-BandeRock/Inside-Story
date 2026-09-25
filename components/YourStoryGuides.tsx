// Your Story guides, 2026-09-24 (lib/yourStoryGuides.ts holds every guide,
// every sentence and when a step counts as done; this file lays them out).
//
// One fold band per guide on the Your Story page: The Basics first, then
// one for each part of life chosen. A folded guide shows its opening line
// and nothing counted, since "how far along" would be a score. The guide
// the Home card points into opens by itself, as does one asked for by name.
//
// 1.0.51.8: the guides are written two ways, and the page asks which the
// person wants before anything else, keeping the answer (getGuideStyle).
// Short lists each group of steps (Start here, Every day, and so on) with a
// line or two per step, and a step written out in an earlier guide is only
// pointed to. Step by step shows one step at a time with Back and Next,
// each one saying how often and how long, how to get there from anywhere,
// and every tap once there; the whole list is one tap away. Nothing on
// either says which step of how many, since that is a count of progress.
//
// A step is ticked, with its date, when its record exists; a step that is
// only reading or looking carries a book instead of a circle and is never
// ticked.
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ComponentProps } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type LayoutChangeEvent } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import type { StoryDestination } from '../lib/yourStory';
import { getGuideStyle, setGuideStyle } from '../lib/yourStoryDb';
import {
  GUIDES_HEADING,
  GUIDES_LEAD,
  GUIDE_STYLE_CAPTIONS,
  GUIDE_STYLE_CHANGE_LINE,
  GUIDE_STYLE_LABELS,
  GUIDE_STYLE_QUESTION,
  HOW_TO_GET_THERE,
  ONCE_THERE,
  READ_LABEL,
  SHOW_ALL_LABEL,
  SHOW_ONE_LABEL,
  STEP_BACK_LABEL,
  STEP_NEXT_LABEL,
  alsoInLine,
  cadenceLine,
  firstStepIndex,
  navigationLine,
  sharedLine,
  type GuideEntryView,
  type GuideKey,
  type GuideStyle,
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

const STYLES: GuideStyle[] = ['short', 'steps'];

export function YourStoryGuides({ guides, initiallyOpen, go, onChanged, onGuideLayout }: Props) {
  const [open, setOpen] = useState<GuideKey[]>(initiallyOpen ? [initiallyOpen] : []);
  const [beatsOpen, setBeatsOpen] = useState(false);
  // Null until chosen; the guides read as Short in the meantime.
  const [style, setStyle] = useState<GuideStyle | null>(null);
  const [styleLoaded, setStyleLoaded] = useState(false);
  // Step by step: which step each guide is on, and which show the whole list.
  const [stepAt, setStepAt] = useState<Partial<Record<GuideKey, number>>>({});
  const [showAll, setShowAll] = useState<GuideKey[]>([]);

  useEffect(() => {
    let live = true;
    void getGuideStyle()
      .then((saved) => {
        if (live) setStyle(saved);
      })
      .finally(() => {
        if (live) setStyleLoaded(true);
      });
    return () => {
      live = false;
    };
  }, []);

  function choose(next: GuideStyle) {
    setStyle(next);
    void setGuideStyle(next);
  }

  function toggle(key: GuideKey) {
    setOpen((keys) => (keys.includes(key) ? keys.filter((entry) => entry !== key) : [...keys, key]));
  }

  function toggleShowAll(key: GuideKey) {
    setShowAll((keys) => (keys.includes(key) ? keys.filter((entry) => entry !== key) : [...keys, key]));
  }

  function iconFor(view: GuideEntryView): ComponentProps<typeof Ionicons>['name'] {
    if (view.state === 'reading') return 'book-outline';
    if (view.state === 'done') return 'checkmark-circle';
    if (view.state === 'setAside') return 'remove-circle-outline';
    return 'ellipse-outline';
  }

  function goLabel(view: GuideEntryView): string {
    const done = view.state === 'done';
    if (view.entry.destination.kind === 'beats') return beatsOpen ? 'Close' : done ? 'Change' : 'Choose';
    if (view.state === 'reading') return READ_LABEL;
    return done ? 'Open' : 'Go there';
  }

  function goButton(view: GuideEntryView) {
    const { destination } = view.entry;
    return (
      <TouchableOpacity
        style={styles.action}
        onPress={() => (destination.kind === 'beats' ? setBeatsOpen((value) => !value) : go(destination))}
        accessibilityRole="button"
      >
        <Text style={styles.actionText}>{goLabel(view)}</Text>
        <Ionicons name="arrow-forward" size={13} color={colors.primary} style={textShadow} />
      </TouchableOpacity>
    );
  }

  function beatPicker(view: GuideEntryView) {
    if (view.entry.destination.kind !== 'beats' || !beatsOpen) return null;
    return (
      <View style={styles.beatsBox}>
        <BeatPicker onChanged={onChanged} onDone={() => setBeatsOpen(false)} />
      </View>
    );
  }

  function stateLines(view: GuideEntryView) {
    return (
      <>
        {view.dateline ? <Text style={styles.dateline}>{view.dateline}</Text> : null}
        {view.note ? <Text style={styles.note}>{view.note}</Text> : null}
      </>
    );
  }

  // Short: a line or two, or a pointer to the guide that writes it out.
  function renderShort(guideKey: GuideKey, view: GuideEntryView) {
    const { entry } = view;
    const done = view.state === 'done';
    return (
      <View key={`${guideKey}:${entry.key}`} style={styles.entry}>
        <View style={styles.entryHead}>
          <Ionicons
            name={iconFor(view)}
            size={18}
            color={done ? colors.primary : colors.textMuted}
            style={[textShadow, styles.entryIcon]}
          />
          <View style={styles.entryText}>
            <Text style={styles.doThis}>{entry.doThis}</Text>
            {view.sharedWith ? (
              <Text style={styles.shared}>{sharedLine(view.sharedWith)}</Text>
            ) : (
              <>
                <Text style={styles.forYou}>{entry.forYou}</Text>
                {entry.leadsTo ? <Text style={styles.leadsTo}>{entry.leadsTo}</Text> : null}
              </>
            )}
            {stateLines(view)}
          </View>
        </View>
        <View style={styles.actions}>{goButton(view)}</View>
        {beatPicker(view)}
      </View>
    );
  }

  // Step by step: everything about one step, written out.
  function renderStep(guideKey: GuideKey, view: GuideEntryView, heading: string | null) {
    const { entry } = view;
    const done = view.state === 'done';
    const route = navigationLine(entry.destination);
    return (
      <View key={`${guideKey}:${entry.key}`} style={styles.entry}>
        {heading ? <Text style={styles.groupHeading}>{heading}</Text> : null}
        <View style={styles.entryHead}>
          <Ionicons
            name={iconFor(view)}
            size={18}
            color={done ? colors.primary : colors.textMuted}
            style={[textShadow, styles.entryIcon]}
          />
          <View style={styles.entryText}>
            <Text style={styles.doThis}>{entry.doThis}</Text>
            <Text style={styles.cadence}>{cadenceLine(entry)}</Text>
            <Text style={styles.forYou}>{entry.forYou}</Text>
            {entry.leadsTo ? <Text style={styles.leadsTo}>{entry.leadsTo}</Text> : null}
            {view.sharedWith ? <Text style={styles.shared}>{alsoInLine(view.sharedWith)}</Text> : null}
            {stateLines(view)}
          </View>
        </View>
        {route ? (
          <View style={styles.stepPart}>
            <Text style={styles.partHeading}>{HOW_TO_GET_THERE}</Text>
            <Text style={styles.forYou}>{route}</Text>
          </View>
        ) : null}
        {entry.taps && entry.taps.length > 0 ? (
          <View style={styles.stepPart}>
            <Text style={styles.partHeading}>{ONCE_THERE}</Text>
            {entry.taps.map((tap) => (
              <View key={tap} style={styles.tapRow}>
                <Text style={styles.tapMark}>{'•'}</Text>
                <Text style={[styles.forYou, styles.tapText]}>{tap}</Text>
              </View>
            ))}
          </View>
        ) : null}
        <View style={styles.actions}>{goButton(view)}</View>
        {beatPicker(view)}
      </View>
    );
  }

  function renderShortGuide(guide: GuideView) {
    return guide.groups.map((group) => (
      <View key={group.when} style={styles.group}>
        <Text style={styles.groupHeading}>{group.heading}</Text>
        {group.entries.map((entry) => renderShort(guide.def.key, entry))}
      </View>
    ));
  }

  function renderStepGuide(guide: GuideView) {
    const key = guide.def.key;
    if (showAll.includes(key)) {
      return (
        <>
          {guide.groups.map((group) => (
            <View key={group.when} style={styles.group}>
              <Text style={styles.groupHeading}>{group.heading}</Text>
              {group.entries.map((entry) => renderStep(key, entry, null))}
            </View>
          ))}
          <View style={styles.stepNav}>
            <NavButton label={SHOW_ONE_LABEL} icon="albums-outline" onPress={() => toggleShowAll(key)} />
          </View>
        </>
      );
    }
    const last = guide.entries.length - 1;
    const at = Math.min(Math.max(stepAt[key] ?? firstStepIndex(guide), 0), last);
    const view = guide.entries[at];
    if (!view) return null;
    const heading = guide.groups.find((group) => group.entries.includes(view))?.heading ?? null;
    const move = (by: number) => {
      setBeatsOpen(false);
      setStepAt((current) => ({ ...current, [key]: Math.min(Math.max(at + by, 0), last) }));
    };
    return (
      <>
        {renderStep(key, view, heading)}
        <View style={styles.stepNav}>
          {at > 0 ? <NavButton label={STEP_BACK_LABEL} icon="arrow-back" onPress={() => move(-1)} /> : null}
          {at < last ? <NavButton label={STEP_NEXT_LABEL} icon="arrow-forward" onPress={() => move(1)} /> : null}
          <NavButton label={SHOW_ALL_LABEL} icon="list-outline" onPress={() => toggleShowAll(key)} />
        </View>
      </>
    );
  }

  const reading: GuideStyle = style ?? 'short';

  return (
    <>
      <View style={styles.band}>
        <Text style={styles.heading}>{GUIDES_HEADING}</Text>
        <Text style={styles.lead}>{GUIDES_LEAD}</Text>
      </View>
      {styleLoaded ? (
        <View style={[styles.band, !style && styles.bandOpen]}>
          <Text style={styles.title}>{GUIDE_STYLE_QUESTION}</Text>
          <View style={styles.choiceRow}>
            {STYLES.map((option) => {
              const active = style === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.choice, active && styles.choiceActive]}
                  onPress={() => choose(option)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{GUIDE_STYLE_LABELS[option]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {style ? (
            <Text style={styles.forYou}>{`${GUIDE_STYLE_CAPTIONS[style]} ${GUIDE_STYLE_CHANGE_LINE}`}</Text>
          ) : (
            STYLES.map((option) => (
              <Text key={option} style={styles.forYou}>
                {`${GUIDE_STYLE_LABELS[option]}: ${GUIDE_STYLE_CAPTIONS[option]}`}
              </Text>
            ))
          )}
        </View>
      ) : null}
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
                <Text style={styles.firstResult}>{guide.def.firstResult}</Text>
                <View style={styles.entries}>
                  {reading === 'steps' ? renderStepGuide(guide) : renderShortGuide(guide)}
                </View>
              </>
            ) : null}
          </View>
        );
      })}
    </>
  );
}

function NavButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.navButton} onPress={onPress} accessibilityRole="button">
      <Ionicons name={icon} size={14} color={colors.primary} style={textShadow} />
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
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
  firstResult: { ...typography.body, color: colors.textPrimary, ...textShadow },
  entries: { gap: 18 },
  group: { gap: 14, backgroundColor: colors.surface },
  groupHeading: { ...typography.label, color: colors.accent, ...textShadow },
  // A guide band is colors.surface, painted again here so every line sits
  // on a surface wherever an entry lands.
  entry: { gap: 6, backgroundColor: colors.surface },
  entryHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  entryIcon: { marginTop: 1 },
  entryText: { flex: 1, gap: 3 },
  doThis: { ...typography.body, color: colors.textPrimary, ...textShadow },
  forYou: { ...typography.body, color: colors.textSecondary, ...textShadow },
  cadence: { ...typography.caption, color: colors.textMuted, ...textShadow },
  leadsTo: { ...typography.caption, color: colors.accent, ...textShadow },
  shared: { ...typography.caption, color: colors.textMuted, ...textShadow },
  dateline: { ...typography.caption, color: colors.textMuted, ...textShadow },
  note: { ...typography.caption, color: colors.textMuted, ...textShadow },
  stepPart: { gap: 3, paddingLeft: 26, backgroundColor: colors.surface },
  partHeading: { ...typography.caption, color: colors.textPrimary, ...textShadow },
  tapRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  tapMark: { ...typography.body, color: colors.textMuted, ...textShadow },
  tapText: { flex: 1 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16, paddingLeft: 26 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2 },
  actionText: { ...typography.caption, color: colors.primary, ...textShadow },
  beatsBox: { paddingLeft: 26 },
  stepNav: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 18, backgroundColor: colors.surface },
  navButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  choice: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  choiceActive: { backgroundColor: colors.buttonColor, borderColor: colors.buttonColor },
  choiceText: { ...typography.body, color: colors.primary, ...textShadow },
  choiceTextActive: { color: colors.textOnButton, textShadowColor: 'transparent', textShadowRadius: 0 },
});
