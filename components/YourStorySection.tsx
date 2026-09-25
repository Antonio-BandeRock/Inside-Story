// Your Story, 2026-09-24. The guided way through the app, told as the
// sections of the person's paper: a Front Page saying what matters to them,
// The Archive keeping it safe, then the sections their chosen parts of life
// switch on. Everything it knows comes from lib/yourStory.ts (what each item
// is, when it counts as done, every sentence) and lib/yourStoryDb.ts (the
// records it reads); this file only lays that out.
//
// One component in two shapes, so the Home card and the full page can never
// disagree about what an item says or where it goes:
//   card  the current section and its items, plus a way to the full page.
//   page  every section: the current one open, the others as one line each,
//         any of them opened with a tap.
//
// What it will not do, each of them a decision rather than an omission:
// no "step N of M", no percentage, no praise when something is done and no
// blame when it is not. A done item says what is on record and when; an
// item whose record has gone reopens and says that, plainly.
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useRef, useState, type ComponentProps } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import {
  BRING_BACK_LABEL,
  OPTIONAL_LABEL,
  WAITING_LABEL,
  WHY_LABEL,
  sectionSummary,
  type ItemView,
  type SectionKey,
  type SectionView,
  type StoryDestination,
  type YourStoryView,
} from '../lib/yourStory';
import { bringYourStoryItemBack, loadYourStory, setYourStoryItemAside } from '../lib/yourStoryDb';
import { BeatPicker } from './BeatPicker';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, homeBandStyle } from './HomeSectionBand';
import { useInfoAlert } from './InfoAlert';

// Loads Your Story whenever the screen holding it comes into focus, which is
// how an item done on another tab is already ticked on the way back.
export function useYourStory(): [YourStoryView | null, () => Promise<void>] {
  const [view, setView] = useState<YourStoryView | null>(null);
  const live = useRef(true);
  const reload = useCallback(async () => {
    try {
      const next = await loadYourStory();
      if (live.current) setView(next);
    } catch (error) {
      console.warn('loadYourStory failed', error);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      live.current = true;
      void reload();
      return () => {
        live.current = false;
      };
    }, [reload]),
  );
  return [view, reload];
}

type Props = {
  mode: 'card' | 'page';
  view: YourStoryView | null;
  onChanged: () => void;
  // Home passes this, since a card on Home and Home's quick-log form open in
  // place there. Anywhere else those go back to Home, which opens them.
  onHomeDestination?: (destination: Extract<StoryDestination, { kind: 'home' | 'quickLog' }>) => void;
};

export function YourStorySection({ mode, view, onChanged, onHomeDestination }: Props) {
  const router = useRouter();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  // Which item has its part-of-life chooser open in place.
  const [beatsOpen, setBeatsOpen] = useState(false);
  // On the full page, sections opened by hand beyond the current one.
  const [openSections, setOpenSections] = useState<SectionKey[]>([]);

  const go = useCallback(
    (destination: StoryDestination) => {
      if (destination.kind === 'beats') {
        setBeatsOpen((open) => !open);
        return;
      }
      if (destination.kind === 'route') {
        router.push({ pathname: destination.pathname, params: destination.params } as Href);
        return;
      }
      if (onHomeDestination) {
        onHomeDestination(destination);
        return;
      }
      if (destination.kind === 'home') {
        router.push({ pathname: '/', params: { openHomeSection: destination.section } } as Href);
      } else {
        router.push({ pathname: '/', params: { openHomeQuickLog: destination.form } } as Href);
      }
    },
    [router, onHomeDestination],
  );

  const setAside = useCallback(
    async (item: ItemView) => {
      await setYourStoryItemAside(item.def.key);
      onChanged();
    },
    [onChanged],
  );
  const bringBack = useCallback(
    async (item: ItemView) => {
      await bringYourStoryItemBack(item.def.key);
      onChanged();
    },
    [onChanged],
  );

  if (!view) {
    return (
      <View style={mode === 'card' ? styles.cardBody : styles.sectionCard}>
        <Text style={styles.muted}>Reading your records.</Text>
      </View>
    );
  }

  function renderItem(item: ItemView) {
    const { def, state } = item;
    const done = state === 'done';
    const icon: ComponentProps<typeof Ionicons>['name'] = done
      ? 'checkmark-circle'
      : state === 'setAside'
        ? 'remove-circle-outline'
        : state === 'reopened'
          ? 'alert-circle-outline'
          : def.kind === 'waiting'
            ? 'time-outline'
            : 'ellipse-outline';
    const iconColor = done ? colors.primary : state === 'reopened' ? colors.statusYellowStandalone : colors.textMuted;
    const kindLabel = def.kind === 'optional' ? OPTIONAL_LABEL : def.kind === 'waiting' ? WAITING_LABEL : null;
    const goLabel = def.destination.kind === 'beats' ? (beatsOpen ? 'Close' : done ? 'Change' : 'Choose') : done ? 'Open' : 'Go there';
    return (
      <View key={def.key} style={styles.item}>
        <View style={styles.itemHead}>
          <Ionicons name={icon} size={18} color={iconColor} style={[textShadow, styles.itemIcon]} />
          <View style={styles.itemText}>
            <Text style={[styles.sentence, !done && state !== 'setAside' ? styles.sentenceOpen : null]}>{item.sentence}</Text>
            {kindLabel && !done ? <Text style={styles.kindLabel}>{kindLabel}</Text> : null}
            {item.dateline ? <Text style={styles.dateline}>{item.dateline}</Text> : null}
            {item.note ? (
              <Text style={state === 'reopened' ? styles.reopenedNote : styles.note}>{item.note}</Text>
            ) : null}
          </View>
        </View>
        <View style={styles.actions}>
          {state !== 'setAside' ? (
            <TouchableOpacity style={styles.action} onPress={() => go(def.destination)} accessibilityRole="button">
              <Text style={styles.actionText}>{goLabel}</Text>
              <Ionicons name="arrow-forward" size={13} color={colors.primary} style={textShadow} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.action} onPress={() => showInfoAlert(WHY_LABEL, def.why)} accessibilityRole="button">
            <Text style={styles.actionText}>{WHY_LABEL}</Text>
          </TouchableOpacity>
          {def.setAside && (state === 'open' || state === 'reopened') ? (
            <TouchableOpacity style={styles.action} onPress={() => void setAside(item)} accessibilityRole="button">
              <Text style={styles.actionMuted}>{def.setAside.label}</Text>
            </TouchableOpacity>
          ) : null}
          {state === 'setAside' ? (
            <TouchableOpacity style={styles.action} onPress={() => void bringBack(item)} accessibilityRole="button">
              <Text style={styles.actionText}>{BRING_BACK_LABEL}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {def.destination.kind === 'beats' && beatsOpen ? (
          <View style={styles.beatsBox}>
            <BeatPicker onChanged={onChanged} />
          </View>
        ) : null}
      </View>
    );
  }

  function renderSectionHead(section: SectionView) {
    return (
      <View style={styles.sectionHead}>
        <Text style={styles.sectionName}>{section.def.name}</Text>
        <Text style={styles.sectionCaption}>{section.def.caption}</Text>
      </View>
    );
  }

  const current = view.sections.find((section) => section.def.key === view.current) ?? null;

  if (mode === 'card') {
    return (
      <View style={styles.cardBody}>
        {current ? (
          <>
            {renderSectionHead(current)}
            <View style={styles.items}>{current.items.map(renderItem)}</View>
          </>
        ) : (
          <Text style={styles.body}>
            {"Every section of your paper has what it needs. Your Story keeps each record's date, and anything that goes missing shows here again."}
          </Text>
        )}
        <TouchableOpacity style={styles.action} onPress={() => router.push('/your-story' as Href)} accessibilityRole="button">
          <Text style={styles.actionText}>Open Your Story</Text>
          <Ionicons name="arrow-forward" size={13} color={colors.primary} style={textShadow} />
        </TouchableOpacity>
        {infoAlertElement}
      </View>
    );
  }

  return (
    <View style={styles.page}>
      {view.sections.map((section) => {
        const isCurrent = section.def.key === view.current;
        const open = isCurrent || openSections.includes(section.def.key);
        return (
          <View key={section.def.key} style={[styles.sectionCard, isCurrent && styles.sectionCardCurrent]}>
            <TouchableOpacity
              onPress={() =>
                isCurrent
                  ? undefined
                  : setOpenSections((keys) =>
                      keys.includes(section.def.key) ? keys.filter((key) => key !== section.def.key) : [...keys, section.def.key],
                    )
              }
              disabled={isCurrent}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
              style={styles.sectionHeadRow}
            >
              {renderSectionHead(section)}
              {isCurrent ? null : (
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primary} style={textShadow} />
              )}
            </TouchableOpacity>
            {open ? (
              section.items.length > 0 ? (
                <View style={styles.items}>{section.items.map(renderItem)}</View>
              ) : (
                <Text style={styles.muted}>{sectionSummary(section)}</Text>
              )
            ) : (
              <Text style={styles.summary}>{sectionSummary(section)}</Text>
            )}
          </View>
        );
      })}
      {infoAlertElement}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: HOME_BAND_GAP },
  // The Home band this sits in is colors.surface; painting the same colour
  // here keeps every line on a surface wherever the card body is placed.
  cardBody: { gap: 12, backgroundColor: colors.surface },
  body: { ...typography.body, color: colors.textSecondary, ...textShadow },
  muted: { ...typography.caption, color: colors.textMuted, ...textShadow },
  summary: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  sectionCard: {
    ...homeBandStyle,
    borderColor: colors.border,
    padding: HOME_BAND_CONTENT_PADDING,
    gap: 10,
  },
  sectionCardCurrent: { borderColor: colors.primary },
  sectionHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionHead: { flex: 1, gap: 1 },
  sectionName: { ...typography.sectionTitle, color: colors.textPrimary, ...textShadow },
  sectionCaption: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  items: { gap: 12 },
  // Both the Home card body and a page section card are colors.surface.
  item: { gap: 6, backgroundColor: colors.surface },
  itemHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  itemIcon: { marginTop: 1 },
  itemText: { flex: 1, gap: 2 },
  sentence: { ...typography.body, color: colors.textSecondary, ...textShadow },
  sentenceOpen: { color: colors.textPrimary },
  kindLabel: { ...typography.caption, color: colors.accent, ...textShadow },
  dateline: { ...typography.caption, color: colors.textMuted, ...textShadow },
  note: { ...typography.caption, color: colors.textMuted, ...textShadow },
  reopenedNote: { ...typography.caption, color: colors.statusYellowStandalone, ...textShadow },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16, paddingLeft: 26 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2 },
  actionText: { ...typography.caption, color: colors.primary, ...textShadow },
  actionMuted: { ...typography.caption, color: colors.textMuted, ...textShadow },
  beatsBox: { paddingLeft: 26 },
});
