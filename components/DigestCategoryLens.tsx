import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { DigestCategorySection } from './DigestCategorySection';
import { categoryLabelForEntry } from './DigestEntryDetail';
import { DigestEntryRow, makeDigestRowStyles } from './DigestEntryRow';
import { EntrySearchInput, searchFieldStyle } from './EntrySearchInput';
import { HelpSheet, type HelpSection } from './HelpButton';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP } from './HomeSectionBand';
import { colors } from '../constants/colors';
import { menuLabelShadow, textShadow, typography } from '../constants/typography';
import { getVisibleFoodBaseNames } from '../lib/db';
import {
  ALL_DIGEST_ENTRIES,
  DIGEST_CATEGORY_META,
  findDigestEntryById,
  getEntriesForCategory,
  isProblemFoodEntry,
  searchDigestEntriesScored,
  type AnyDigestEntry,
  type DigestCategoryKey,
  type SearchMatchInfo,
} from '../lib/digest';
import { routeForDigestEntry } from '../lib/digestNavigation';

// One reading category as a lens on whichever tab it lives on, 2026-09-19.
//
// Direct instruction: "Gardening needs to be moved from Digest to Garden
// ... renamed to something else that relates to learning about
// gardening, like Horticulture. I think that Earth Matters and Basic
// Health both should become a lens each in the Life tab, but rename Basic
// Health to Health Literacy. This will in essence remove the need for the
// Digest completely. Let's remove Digest as a tab after everything is
// moved." So the Digest tab is gone, and what it used to wrap around a
// category (the search box over the page, the food-visibility filter,
// the jump a Related chip makes, the entry a link in asks to open) is
// here, in the host tab's colour, for Life's Health Literacy and Earth
// Matters lenses and Garden's Horticulture lens to share. The bands
// themselves are still DigestCategorySection's.
//
// DigestSearchLens, further down, is the whole-corpus search that used to
// be the Digest's Search All tile: every entry in the app at once, the
// conditions included, with the matched-term pills under each hit.

// The paragraph every reading lens's help ends with. The category's own
// paragraph comes first, from the host tab's LENSES.
export const DIGEST_READING_HELP: HelpSection = {
  heading: 'Reading an entry',
  body: 'Each topic in this lens is a band that folds open to its entries, with the larger topics grouped inside. Tap an entry to open its full write-up and citations in place, and tap it again to close it. The colored dot beside each title is its evidence tier, same discipline as the rest of this app. Where a finding connects to another entry, a Related chip jumps straight there, even when it lives on another tab.',
};

export const DIGEST_SEARCH_HELP: HelpSection[] = [
  {
    heading: 'Search Reading',
    body: 'Type a word or phrase to search every entry at once: every condition, Health Literacy, Earth Matters, Horticulture and the recipes, regardless of which one you were reading last. Tap a result to open it in place.',
  },
  {
    heading: 'Searching one lens at a time',
    body: "Each reading lens also has a search box of its own, scoped to just that lens's entries, useful when you already know roughly where something lives and just want to narrow it down.",
  },
  {
    heading: "Reading a result's match info",
    body: 'Typing more than one word searches for each of them independently, not the exact phrase, so a result can match one, some, or all of them. The "X of Y search terms matched" line and the small pills below it show exactly which ones did: a filled pill means that word appeared in the entry\'s title (the strongest kind of match), an outlined pill means it only showed up in the body or a citation, and a dim pill means that particular word never appeared in this entry at all.',
  },
];

// The sheet behind the (i) inside every reading search box. The dots it
// explains show up under every scoped search's results, so it has to be
// reachable from anywhere someone is searching, which is why each lens
// carries its own HelpSheet rather than one per-screen registration.
const SEARCH_MATCH_HELP_SECTIONS: HelpSection[] = [
  {
    heading: 'How the ranking works',
    body: 'When you type more than one word, this search does not look for that exact phrase. It checks each word on its own, one at a time. An entry can show up in your results even if it only matches some of your words, not all of them, and the words do not need to appear in the same order you typed them. Every entry then earns a score: matching a word in the entry\'s title is worth three times as much as matching that same word only in its body text or a citation. Entries with the highest score are always shown first, so something about what you searched for rises above something that only mentions it once in passing.',
  },
  {
    heading: 'What the dots mean',
    body: "Each small dot stands for one of the words you typed, in the order you typed them, showing how that specific word did against that specific entry. A solid dot in this tab's colour means that word matched the entry's title, the strongest kind of match. An outlined dot means it matched somewhere in the entry's body or a citation, but not its title. A solid grey dot means that word did not match this entry at all.",
  },
  {
    heading: 'See it in action',
    body: 'A worked example is below, using the search "sleep anxiety inflammation" against three illustrative entries, both as the compact dots you see here, and as the fuller version Search Reading shows.',
  },
];

// Three illustrative entries, labelled as such on screen, whose only job
// is to show all three dot and pill states (title match, body match, no
// match) across one three-word query.
const DEMO_QUERY_LABEL = '"sleep anxiety inflammation"';
const DEMO_EXAMPLES: { title: string; note: string; match: SearchMatchInfo }[] = [
  {
    title: 'How Sleep Disruption Drives Inflammation',
    note: '"sleep" and "inflammation" both appear in this title, "anxiety" is never mentioned anywhere in it.',
    match: {
      totalTermCount: 3,
      matchedTermCount: 2,
      score: 6,
      terms: [
        { term: 'sleep', matchedInTitle: true, matchedAnywhere: true },
        { term: 'anxiety', matchedInTitle: false, matchedAnywhere: false },
        { term: 'inflammation', matchedInTitle: true, matchedAnywhere: true },
      ],
    },
  },
  {
    title: 'Managing Everyday Stress and Anxiety',
    note: '"anxiety" is right in the title; "sleep" only comes up once in the body text; "inflammation" never appears.',
    match: {
      totalTermCount: 3,
      matchedTermCount: 2,
      score: 4,
      terms: [
        { term: 'sleep', matchedInTitle: false, matchedAnywhere: true },
        { term: 'anxiety', matchedInTitle: true, matchedAnywhere: true },
        { term: 'inflammation', matchedInTitle: false, matchedAnywhere: false },
      ],
    },
  },
  {
    title: 'The Gut-Brain Connection',
    note: 'None of the three words are in this title, only "inflammation" shows up at all, once, in a citation.',
    match: {
      totalTermCount: 3,
      matchedTermCount: 1,
      score: 1,
      terms: [
        { term: 'sleep', matchedInTitle: false, matchedAnywhere: false },
        { term: 'anxiety', matchedInTitle: false, matchedAnywhere: false },
        { term: 'inflammation', matchedInTitle: false, matchedAnywhere: true },
      ],
    },
  },
];

type MatchStyles = ReturnType<typeof makeMatchStyles>;

// The per-term match display under every Search Reading result row: one
// pill per word typed, filled when it hit the title, outlined when it only
// matched the body or a citation, dim when it missed this entry.
function MatchSummaryRow({ match, styles }: { match: SearchMatchInfo; styles: MatchStyles }) {
  return (
    <View style={styles.matchBlock}>
      <Text style={styles.matchSummaryText}>
        {match.matchedTermCount} of {match.totalTermCount} search term{match.totalTermCount === 1 ? '' : 's'} matched
      </Text>
      <View style={styles.matchTermRow}>
        {match.terms.map((termMatch) => (
          <View
            key={termMatch.term}
            style={[
              styles.matchTermPill,
              termMatch.matchedInTitle
                ? styles.matchTermPillTitle
                : termMatch.matchedAnywhere
                  ? styles.matchTermPillBody
                  : styles.matchTermPillMiss,
            ]}
          >
            <Text
              style={[
                styles.matchTermPillText,
                termMatch.matchedInTitle ? styles.matchTermPillTextTitle : null,
                !termMatch.matchedAnywhere ? styles.matchTermPillTextMiss : null,
              ]}
            >
              {termMatch.term}
              {termMatch.matchedInTitle ? ' · title' : termMatch.matchedAnywhere ? '' : ' · not found'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// The labelled version of the dot row a scoped search shows. On screen the
// dots carry no label, since a person already knows the order they typed
// their words in; a worked example needs one.
function DemoDotRow({ match, styles }: { match: SearchMatchInfo; styles: MatchStyles }) {
  return (
    <View style={styles.demoDotRow}>
      {match.terms.map((termMatch) => (
        <View key={termMatch.term} style={styles.demoDotColumn}>
          <View
            style={[
              styles.matchDot,
              termMatch.matchedInTitle
                ? styles.matchDotTitle
                : termMatch.matchedAnywhere
                  ? styles.matchDotBody
                  : styles.matchDotMiss,
            ]}
          />
          <Text style={styles.demoDotLabel}>{termMatch.term}</Text>
        </View>
      ))}
    </View>
  );
}

function SearchMatchDemo({ styles }: { styles: MatchStyles }) {
  return (
    <View style={styles.demoBlock}>
      <Text style={styles.demoHeading}>Example: searching {DEMO_QUERY_LABEL}</Text>
      <Text style={styles.demoIntro}>
        Three illustrative entries below (not actual entries in this app) show how the same three-word search can
        produce different dot patterns, depending on what each entry actually says.
      </Text>
      {DEMO_EXAMPLES.map((example) => (
        <View key={example.title} style={styles.demoExample}>
          <Text style={styles.demoExampleTitle}>{example.title}</Text>
          <DemoDotRow match={example.match} styles={styles} />
          <Text style={styles.demoExampleNote}>{example.note}</Text>
        </View>
      ))}

      <Text style={styles.demoSubheading}>The same three examples in Search Reading</Text>
      <Text style={styles.demoIntro}>
        Search Reading shows the identical information as labeled pills instead of plain dots, since its result rows
        have more room to spell out the actual word:
      </Text>
      {DEMO_EXAMPLES.map((example) => (
        <View key={`${example.title}-pills`} style={styles.demoExample}>
          <Text style={styles.demoExampleTitle}>{example.title}</Text>
          <MatchSummaryRow match={example.match} styles={styles} />
        </View>
      ))}

      <Text style={styles.demoClosing}>
        Dots and pills always mean the same three things: filled in the tab&apos;s colour is a title match, outlined is a
        body or citation match, and dim grey means that word did not match this entry at all. Dots are the compact
        version, used inside the search on every reading lens. Pills are the fuller version, used only in Search
        Reading, where there is room to write out the actual matched word.
      </Text>
    </View>
  );
}

// The (i) sheet itself, shared by every reading search box.
function SearchMatchHelpSheet({ visible, onClose, styles }: { visible: boolean; onClose: () => void; styles: MatchStyles }) {
  return (
    <HelpSheet
      visible={visible}
      onClose={onClose}
      pageTitle="Search Matching"
      sections={SEARCH_MATCH_HELP_SECTIONS}
      extra={<SearchMatchDemo styles={styles} />}
    />
  );
}

// Entries tagged with foods that have since been hidden go with them. One
// bulk lookup for every related food name in the pool, so opening the lens
// never waits on the database twice.
function useVisibleEntries(pool: AnyDigestEntry[]): AnyDigestEntry[] {
  const [visibleFoodNames, setVisibleFoodNames] = useState<Set<string> | null>(null);
  useEffect(() => {
    let cancelled = false;
    const names = new Set<string>();
    for (const entry of pool) {
      if (!isProblemFoodEntry(entry) && entry.relatedFoodNames) for (const name of entry.relatedFoodNames) names.add(name);
    }
    if (names.size === 0) {
      setVisibleFoodNames(null);
      return;
    }
    getVisibleFoodBaseNames(Array.from(names))
      .then((visible) => {
        if (!cancelled) setVisibleFoodNames(visible);
      })
      .catch(() => {
        if (!cancelled) setVisibleFoodNames(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pool]);
  return useMemo(() => {
    if (!visibleFoodNames) return pool;
    return pool.filter((entry) => {
      if (isProblemFoodEntry(entry) || !entry.relatedFoodNames || entry.relatedFoodNames.length === 0) return true;
      return entry.relatedFoodNames.some((name) => visibleFoodNames.has(name));
    });
  }, [pool, visibleFoodNames]);
}

export function DigestCategoryLens({
  categoryKey,
  tabColor,
  tabTextColor = tabColor,
  openEntryId,
  scrollToY,
  onJumpElsewhere,
}: {
  categoryKey: DigestCategoryKey;
  tabColor: string;
  tabTextColor?: string;
  // An entry to open on arrival, from a link in. Opened once per id; an
  // id from another category is handed to onJumpElsewhere instead.
  openEntryId?: string | null;
  // The host screen's ScrollView, so a jump can bring the opened band into
  // view. Positions are measured from this lens's top.
  scrollToY?: (y: number) => void;
  // Where an entry outside this category opens. The host tab may be able
  // to switch lens in place; the default pushes the route the entry lives
  // at.
  onJumpElsewhere?: (id: string) => void;
}) {
  const router = useRouter();
  const styles = useMemo(() => makeStyles(tabColor, tabTextColor), [tabColor, tabTextColor]);
  const meta = DIGEST_CATEGORY_META.find((candidate) => candidate.key === categoryKey);
  const pool = useMemo(() => getEntriesForCategory(categoryKey), [categoryKey]);
  const entries = useVisibleEntries(pool);

  const [query, setQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [searchResetKey, setSearchResetKey] = useState(0);
  const [helpVisible, setHelpVisible] = useState(false);
  // The entry the section should open, handed down once.
  const [sectionOpenId, setSectionOpenId] = useState<string | null>(null);
  // Where the section starts inside this lens, so a band's own offset can
  // be turned into one the host's ScrollView understands.
  const sectionTop = useRef(0);

  const resetSearch = useCallback(() => {
    setQuery('');
    setSearchActive(false);
    setSearchResetKey((key) => key + 1);
  }, []);

  const jumpToRelated = useCallback(
    (id: string) => {
      const target = findDigestEntryById(id);
      if (!target) return;
      if (target.category === categoryKey) {
        resetSearch();
        setSectionOpenId(id);
        return;
      }
      if (onJumpElsewhere) onJumpElsewhere(id);
      else router.push(routeForDigestEntry(id));
    },
    [categoryKey, onJumpElsewhere, resetSearch, router],
  );

  // A link in is consumed once per id, and a cleared id lets the same
  // entry be asked for again later.
  const consumedOpenId = useRef<string | null>(null);
  useEffect(() => {
    if (!openEntryId) {
      consumedOpenId.current = null;
      return;
    }
    if (consumedOpenId.current === openEntryId) return;
    consumedOpenId.current = openEntryId;
    jumpToRelated(openEntryId);
  }, [openEntryId, jumpToRelated]);

  const sectionScrollTo = useCallback(
    (y: number) => {
      scrollToY?.(sectionTop.current + y);
    },
    [scrollToY],
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.controlsBox}>
        <EntrySearchInput
          key={searchResetKey}
          placeholder={`Search within ${meta?.label ?? 'this lens'}...`}
          style={styles.searchField}
          tabColor={tabColor}
          onDebouncedChange={setQuery}
          onActiveChange={(active) => {
            setSearchActive(active);
            if (active) scrollToY?.(0);
          }}
          onPressInfo={() => setHelpVisible(true)}
        />
      </View>
      <SearchMatchHelpSheet visible={helpVisible} onClose={() => setHelpVisible(false)} styles={styles} />
      <View
        onLayout={(event) => {
          sectionTop.current = event.nativeEvent.layout.y;
        }}
      >
        <DigestCategorySection
          categoryKey={categoryKey}
          entries={entries}
          query={query}
          searchActive={searchActive}
          tabColor={tabColor}
          tabTextColor={tabTextColor}
          openEntryId={sectionOpenId}
          scrollToY={sectionScrollTo}
          onJumpToRelated={jumpToRelated}
        />
      </View>
    </View>
  );
}

// Every entry in the app searched at once, the conditions included. A hit
// opens in place; its Related chips jump wherever the target lives.
export function DigestSearchLens({
  tabColor,
  tabTextColor = tabColor,
  onJumpElsewhere,
}: {
  tabColor: string;
  tabTextColor?: string;
  onJumpElsewhere?: (id: string) => void;
}) {
  const router = useRouter();
  const styles = useMemo(() => makeStyles(tabColor, tabTextColor), [tabColor, tabTextColor]);
  const [query, setQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const results = useMemo(() => searchDigestEntriesScored(query), [query]);
  const trimmed = query.trim();

  const jumpToRelated = useCallback(
    (id: string) => {
      if (onJumpElsewhere) onJumpElsewhere(id);
      else router.push(routeForDigestEntry(id));
    },
    [onJumpElsewhere, router],
  );

  return (
    <View style={styles.wrapper}>
      {searchActive ? null : (
        <View style={styles.headerBox}>
          <View style={styles.headerRow}>
            <Ionicons name="search-outline" size={22} color={tabColor} style={textShadow} />
            <Text style={styles.headerText}>Search Reading</Text>
          </View>
          <Text style={styles.headerDescription}>
            Search across all {ALL_DIGEST_ENTRIES.length} entries at once: every condition, Health Literacy, Earth
            Matters, Horticulture and the recipes. A mechanism, a food, an author&apos;s name, anything an entry
            actually says somewhere.
          </Text>
        </View>
      )}
      <View style={styles.controlsBox}>
        <EntrySearchInput
          placeholder="Search everything..."
          style={styles.searchField}
          tabColor={tabColor}
          onDebouncedChange={(text) => {
            setQuery(text);
            setExpandedId(null);
          }}
          onActiveChange={setSearchActive}
          onPressInfo={() => setHelpVisible(true)}
        />
        {trimmed.length > 0 ? (
          <Text style={styles.resultCount}>
            {results.length === 0
              ? `No matches for “${trimmed}”.`
              : `${results.length} match${results.length === 1 ? '' : 'es'}`}
          </Text>
        ) : null}
      </View>
      <SearchMatchHelpSheet visible={helpVisible} onClose={() => setHelpVisible(false)} styles={styles} />
      {results.length > 0 && trimmed.length > 0 ? (
        <View style={styles.resultList}>
          {results.map((result, index) => (
            <Fragment key={result.entry.id}>
              {index > 0 ? <View style={styles.rowDivider} /> : null}
              <DigestEntryRow
                entry={result.entry}
                groupLabel={categoryLabelForEntry(result.entry)}
                expanded={expandedId === result.entry.id}
                onToggle={() => setExpandedId(expandedId === result.entry.id ? null : result.entry.id)}
                onJumpToRelated={jumpToRelated}
                tabColor={tabColor}
                styles={styles}
                below={<MatchSummaryRow match={result.match} styles={styles} />}
              />
            </Fragment>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function makeMatchStyles(tabColor: string, tabTextColor: string) {
  return StyleSheet.create({
    matchDot: { width: 8, height: 8, borderRadius: 4 },
    matchDotTitle: { backgroundColor: tabColor },
    matchDotBody: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: tabColor },
    matchDotMiss: { backgroundColor: colors.border },
    matchBlock: { marginTop: 8 },
    matchSummaryText: { ...typography.caption, color: colors.textMuted, marginBottom: 6, ...textShadow },
    matchTermRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    matchTermPill: {
      borderWidth: 1,
      borderRadius: 12,
      paddingVertical: 3,
      paddingHorizontal: 9,
    },
    matchTermPillTitle: { backgroundColor: tabColor, borderColor: tabColor },
    matchTermPillBody: { backgroundColor: 'transparent', borderColor: tabColor },
    matchTermPillMiss: { backgroundColor: 'transparent', borderColor: colors.border },
    // No shadow at all, 2026-08-29, direct instruction: "The pills in the
    // search Digest still show up as smudgy looking. Remove drop shadowing
    // from those completely." A named exception to the shadow-on-all-text
    // rule: at 11px, inside a bordered pill, any shadow smears the glyphs.
    matchTermPillText: { ...typography.caption, color: tabTextColor, fontSize: 11 },
    matchTermPillTextTitle: {
      color: colors.background,
      // Dark text: cancel any shadow inherited from a base style it is
      // composed with. See constants/typography.ts.
      textShadowColor: 'transparent',
      textShadowRadius: 0,
    },
    matchTermPillTextMiss: { color: colors.textMuted },
    // The worked example inside the Search Matching sheet.
    demoBlock: { marginTop: 4, backgroundColor: colors.surface, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 12 },
    demoHeading: { ...typography.label, ...menuLabelShadow, fontWeight: '400', color: tabTextColor, marginBottom: 4 },
    demoSubheading: { ...typography.label, ...menuLabelShadow, fontWeight: '400', color: tabTextColor, marginTop: 18, marginBottom: 4 },
    demoIntro: { ...typography.caption, color: colors.textMuted, marginBottom: 10, lineHeight: 17, ...textShadow },
    demoExample: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 10,
      marginBottom: 10,
    },
    demoExampleTitle: { ...typography.bodyEmphasis, color: colors.textPrimary, marginBottom: 6, ...textShadow },
    demoExampleNote: { ...typography.caption, color: colors.textMuted, marginTop: 6, lineHeight: 16, ...textShadow },
    demoDotRow: { flexDirection: 'row', gap: 14 },
    demoDotColumn: { alignItems: 'center', gap: 3 },
    demoDotLabel: { ...typography.caption, color: colors.textMuted, fontSize: 10, ...textShadow },
    demoClosing: { ...typography.body, color: colors.textSecondary, lineHeight: 19, marginTop: 4, ...textShadow },
  });
}

function makeStyles(tabColor: string, tabTextColor: string) {
  return StyleSheet.create({
    ...makeDigestRowStyles(tabColor),
    ...makeMatchStyles(tabColor, tabTextColor),
    wrapper: { gap: HOME_BAND_GAP },
    // The search box on its muted band, the shape Life > Conditions gave
    // its own, edge to edge with the band's content inset.
    controlsBox: {
      backgroundColor: colors.surfaceMuted,
      paddingVertical: 12,
      paddingHorizontal: HOME_BAND_CONTENT_PADDING,
      gap: 8,
    },
    searchField: { ...typography.body, ...searchFieldStyle, borderColor: tabColor, ...textShadow },
    resultCount: { ...typography.caption, color: colors.textSecondary, ...textShadow },
    headerBox: {
      backgroundColor: colors.surface,
      paddingVertical: 14,
      paddingHorizontal: HOME_BAND_CONTENT_PADDING,
      gap: 8,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerText: { ...typography.screenTitle, ...menuLabelShadow, fontWeight: '400', color: tabTextColor, flex: 1 },
    headerDescription: { ...typography.body, color: colors.textSecondary, ...textShadow },
    resultList: { backgroundColor: colors.surface, paddingHorizontal: HOME_BAND_CONTENT_PADDING, paddingVertical: 4 },
  });
}
