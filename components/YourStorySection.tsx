// Your Story, 2026-09-24. The guided way through the app, told as the
// sections of the person's paper: a Front Page saying what matters to them,
// The Archive keeping it safe, then the sections their chosen parts of life
// switch on. Everything it knows comes from lib/yourStory.ts (what each item
// is, when it counts as done, every sentence) and lib/yourStoryDb.ts (the
// records it reads); this file only lays that out.
//
// Since 1.0.51.7 the page also carries a guide for each part of life
// (components/YourStoryGuides.tsx), and the card says which guide the next
// thing belongs to and opens it.
//
// One component in three shapes, so the Home card and the full page can never
// disagree about what an item says or where it goes:
//   card  every tab, what it gives back and what it needs first
//         (lib/yourStoryTabs.ts, 1.0.52.3), plus a way to the full page.
//         It showed only the current section until then, which left
//         somebody who had chosen every part of life looking at two lines.
//   tabs  the same list on its own, first on the full page.
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
import { StyleSheet, Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import {
  BRING_BACK_LABEL,
  OPTIONAL_LABEL,
  WAITING_LABEL,
  WHY_LABEL,
  followingLine,
  sectionSummary,
  type ItemView,
  type SectionKey,
  type SectionView,
  type StoryDestination,
  type YourStoryView,
} from '../lib/yourStory';
import { bringYourStoryItemBack, setYourStoryItemAside } from '../lib/yourStoryDb';
import { loadYourStoryEverything } from '../lib/yourStoryInterviewDb';
import type { InterviewView } from '../lib/yourStoryInterview';
import { currentGuideKey, guideCardLine, openGuideLabel, type GuideView } from '../lib/yourStoryGuides';
import {
  BEFORE_ANYTHING_CAPTION,
  BEFORE_ANYTHING_HEADING,
  FILLING_LABEL,
  FIRST_LABEL,
  READY_LABEL,
  START_HERE_LABEL,
  TAB_GROUP_CAPTIONS,
  TAB_GROUP_HEADINGS,
  buildTabGuide,
  type TabGroup,
  type TabGuideView,
} from '../lib/yourStoryTabs';
import { TAB_ROUTES } from '../constants/tabs';
import { markStoryReturn } from '../lib/storyReturn';
import { BeatPicker } from './BeatPicker';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, homeBandStyle } from './HomeSectionBand';
import { useInfoAlert } from './InfoAlert';
import { YourStoryInterview } from './YourStoryInterview';

// Loads Your Story whenever the screen holding it comes into focus, which is
// how an item done on another tab is already ticked on the way back.
export function useYourStory(): [YourStoryView | null, () => Promise<void>, GuideView[], InterviewView | null] {
  const [view, setView] = useState<YourStoryView | null>(null);
  const [guides, setGuides] = useState<GuideView[]>([]);
  const [interview, setInterview] = useState<InterviewView | null>(null);
  const live = useRef(true);
  const reload = useCallback(async () => {
    try {
      const next = await loadYourStoryEverything();
      if (live.current) {
        setView(next.view);
        setGuides(next.guides);
        setInterview(next.interview);
      }
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
  return [view, reload, guides, interview];
}

// Where a Your Story destination leads, shared by the paper and the guides.
// `from` is where the person is leaving from: before anything opens it is
// remembered (lib/storyReturn.ts), so the screen they land on carries a
// Back to Your Story button. A Home destination opened in place on Home
// leaves nothing to come back from, so it marks nothing.
export function useStoryGo(
  from: 'home' | 'page',
  onHomeDestination?: (destination: Extract<StoryDestination, { kind: 'home' | 'quickLog' }>) => void,
): (destination: Exclude<StoryDestination, { kind: 'beats' }>, guide?: string) => void {
  const router = useRouter();
  return useCallback(
    (destination, guide) => {
      const inPlace = destination.kind !== 'route' && !!onHomeDestination;
      if (!inPlace) markStoryReturn(from === 'home' ? { kind: 'home' } : { kind: 'page', guide: guide ?? null });
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
    [router, from, onHomeDestination],
  );
}

type Props = {
  // tabs is the by-tab guide on its own (lib/yourStoryTabs.ts), which the
  // full page puts first; the card carries the same list.
  mode: 'card' | 'page' | 'tabs';
  view: YourStoryView | null;
  // The guides for the parts of life chosen; the card uses them to say
  // which guide the next thing belongs to.
  guides?: GuideView[];
  // The interview (lib/yourStoryInterview.ts). While a question is open the
  // card asks it; once none is, the card lists the tabs, the one chosen to
  // start from marked Start here.
  interview?: InterviewView | null;
  onChanged: () => void;
  // Home passes this, since a card on Home and Home's quick-log form open in
  // place there. Anywhere else those go back to Home, which opens them.
  onHomeDestination?: (destination: Extract<StoryDestination, { kind: 'home' | 'quickLog' }>) => void;
};

export function YourStorySection({ mode, view, guides, interview, onChanged, onHomeDestination }: Props) {
  const router = useRouter();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  // Which item has its part-of-life chooser open in place.
  const [beatsOpen, setBeatsOpen] = useState(false);
  // On the full page, sections opened by hand beyond the current one.
  const [openSections, setOpenSections] = useState<SectionKey[]>([]);

  const goElsewhere = useStoryGo(mode === 'card' ? 'home' : 'page', onHomeDestination);
  const go = useCallback(
    (destination: StoryDestination) => {
      if (destination.kind === 'beats') {
        setBeatsOpen((open) => !open);
        return;
      }
      goElsewhere(destination);
    },
    [goElsewhere],
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
            <BeatPicker onChanged={onChanged} onDone={() => setBeatsOpen(false)} />
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

  const guideKey = guides && guides.length > 0 ? currentGuideKey(view, guides) : null;

  // Once the Front Page is behind the card, this is the way back to it.
  function renderFollowing(style: StyleProp<ViewStyle>) {
    if (!view || beatsOpen || view.beats.length === 0) return null;
    return (
      <View style={style}>
        <Text style={styles.followingText}>{followingLine(view.beats)}</Text>
        <TouchableOpacity style={styles.action} onPress={() => setBeatsOpen(true)} accessibilityRole="button">
          <Text style={styles.actionText}>Change</Text>
          <Ionicons name="arrow-forward" size={13} color={colors.primary} style={textShadow} />
        </TouchableOpacity>
      </View>
    );
  }

  // BY TAB (1.0.52.3). Every tab, in the order worth taking them, each
  // saying what it gives back and the one thing it needs first.
  const tabGuide = buildTabGuide(view, interview?.startPath ?? null);

  function renderTab(tab: TabGuideView) {
    const route = TAB_ROUTES.find((entry) => entry.path === tab.def.path);
    const label =
      tab.status === 'first' ? FIRST_LABEL : tab.status === 'filling' ? FILLING_LABEL : tab.status === 'ready' ? READY_LABEL : null;
    const quiet = tab.status === 'notChosen' || tab.status === 'waitingOnChoice';
    return (
      <View key={tab.def.path} style={styles.tabRow}>
        <View style={styles.tabHead}>
          <Ionicons name={route?.icon ?? 'ellipse-outline'} size={18} color={route?.color ?? colors.primary} style={textShadow} />
          <Text style={styles.tabTitle}>{tab.def.title}</Text>
          {tab.startHere ? <Text style={styles.startHere}>{START_HERE_LABEL}</Text> : null}
        </View>
        <View style={styles.tabBody}>
          <Text style={styles.tabGives}>{tab.def.gives}</Text>
          <Text style={quiet ? styles.muted : styles.tabStatus}>
            {label ? <Text style={tab.status === 'ready' ? styles.readyLabel : styles.firstLabel}>{`${label} `}</Text> : null}
            {tab.line}
          </Text>
          {tab.note ? <Text style={styles.note}>{tab.note}</Text> : null}
          <View style={styles.tabActions}>
            <TouchableOpacity style={styles.action} onPress={() => go(tab.go)} accessibilityRole="button">
              <Text style={styles.actionText}>{tab.goLabel}</Text>
              <Ionicons name="arrow-forward" size={13} color={colors.primary} style={textShadow} />
            </TouchableOpacity>
            {tab.status === 'first' && tab.item ? (
              <TouchableOpacity
                style={styles.action}
                onPress={() => tab.item && showInfoAlert(WHY_LABEL, tab.item.def.why)}
                accessibilityRole="button"
              >
                <Text style={styles.actionText}>{WHY_LABEL}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    );
  }

  function renderTabGroup(group: TabGroup) {
    const rows = tabGuide.tabs.filter((tab) => tab.def.group === group);
    return (
      <View key={group} style={styles.tabGroup}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionName}>{TAB_GROUP_HEADINGS[group]}</Text>
          <Text style={styles.sectionCaption}>{TAB_GROUP_CAPTIONS[group]}</Text>
        </View>
        <View style={styles.items}>{rows.map(renderTab)}</View>
      </View>
    );
  }

  const beatsItem = view.allItems.beats;
  function renderBefore() {
    // While the chooser is open, the question stays on screen even once it
    // has an answer, so a second part of life can be picked.
    const before =
      beatsOpen && !tabGuide.before.some((item) => item.def.key === 'beats') ? [beatsItem, ...tabGuide.before] : tabGuide.before;
    if (before.length === 0) return null;
    return (
      <View style={styles.tabGroup}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionName}>{BEFORE_ANYTHING_HEADING}</Text>
          <Text style={styles.sectionCaption}>{BEFORE_ANYTHING_CAPTION}</Text>
        </View>
        <View style={styles.items}>{before.map(renderItem)}</View>
      </View>
    );
  }

  function renderTabGuide() {
    return (
      <>
        {renderBefore()}
        {renderTabGroup('goesIn')}
        {renderTabGroup('givesBack')}
      </>
    );
  }

  if (mode === 'tabs') {
    return (
      <View style={styles.page}>
        <View style={[styles.sectionCard, styles.sectionCardCurrent]}>
          {renderTabGuide()}
          {view.beats.length > 0 && !tabGuide.before.some((item) => item.def.key === 'beats')
            ? renderFollowing(styles.followingRow)
            : null}
        </View>
        {infoAlertElement}
      </View>
    );
  }

  if (mode === 'card') {
    return (
      <View style={styles.cardBody}>
        {interview && !interview.finished ? (
          <YourStoryInterview mode="card" interview={interview} onChanged={onChanged} go={goElsewhere} />
        ) : (
          renderTabGuide()
        )}
        {!tabGuide.before.some((item) => item.def.key === 'beats') ? renderFollowing(styles.followingRow) : null}
        {guideKey ? (
          <View style={styles.guideRow}>
            <Text style={styles.followingText}>{guideCardLine(guideKey)}</Text>
            <TouchableOpacity
              style={styles.action}
              onPress={() => router.push({ pathname: '/your-story', params: { guide: guideKey } } as Href)}
              accessibilityRole="button"
            >
              <Text style={styles.actionText}>{openGuideLabel(guideKey)}</Text>
              <Ionicons name="arrow-forward" size={13} color={colors.primary} style={textShadow} />
            </TouchableOpacity>
          </View>
        ) : null}
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
      {view.current !== 'frontPage' ? renderFollowing([styles.sectionCard, styles.followingRow]) : null}
      {view.sections.map((section) => {
        const isCurrent = section.def.key === view.current;
        const open =
          isCurrent || openSections.includes(section.def.key) || (beatsOpen && section.def.key === 'frontPage');
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
  followingRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, backgroundColor: colors.surface },
  guideRow: { gap: 4, backgroundColor: colors.surface },
  followingText: { ...typography.caption, color: colors.textSecondary, ...textShadow, flexShrink: 1 },
  // By tab. Each row is the tab's name, one line of what it gives back, and
  // one line of what it needs first or that it is ready.
  tabGroup: { gap: 10, backgroundColor: colors.surface },
  tabRow: { gap: 4, backgroundColor: colors.surface },
  tabHead: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  tabTitle: { ...typography.label, color: colors.textPrimary, ...textShadow },
  startHere: { ...typography.caption, color: colors.accent, ...textShadow },
  tabBody: { gap: 3, paddingLeft: 26 },
  tabGives: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  tabStatus: { ...typography.body, color: colors.textPrimary, ...textShadow },
  firstLabel: { color: colors.accent },
  readyLabel: { color: colors.primary },
  tabActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16 },
});
