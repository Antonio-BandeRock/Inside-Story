import { Ionicons } from '@expo/vector-icons';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DigestEntryRow, makeDigestRowStyles } from './DigestEntryRow';
import { EntryScrollAnchor, type EntryScrollTarget } from './EntryScrollAnchor';
import { HOME_BAND_ACCENT_WIDTH, HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, HomeSectionBand } from './HomeSectionBand';
import { colors } from '../constants/colors';
import { menuLabelShadow, textShadow, typography } from '../constants/typography';
import {
  DIGEST_CATEGORY_META,
  searchEntriesScored,
  type AnyDigestEntry,
  type DigestCategoryKey,
  type SearchMatchInfo,
} from '../lib/digest';
import {
  BASIC_HEALTH_CONDITION_SPECIFIC_HEADING,
  BASIC_HEALTH_MORE_TOPIC_DESCRIPTION,
  BASIC_HEALTH_MORE_TOPIC_LABEL,
  BASIC_HEALTH_TOPICS,
  basicHealthAllGroups,
  basicHealthTopicPathForEntryId,
  groupEntriesForLens,
  TYING_TOGETHER_GROUP_KEY,
} from '../lib/digest/categoryGrouping';

// One reading category (Health Literacy, Earth Matters or Horticulture)
// on fold bands, 2026-09-19, the shape Conditions took on the Life tab
// the same day and the one asked for here by name: one band per topic,
// its subgroups as inset folds inside, each entry a row that opens in
// place, and the search box over the page replacing the bands with one
// ranked list. The horizontal shelves, the topic menu and the drill-down
// breadcrumbs this replaced are gone; a topic's description, which used
// to head a drilled-in page, is the first thing inside its band. Later
// the same day the Digest tab itself went, and this renders inside
// DigestCategoryLens on whichever tab the category moved to.
//
// Grouping is unchanged and lives in lib/digest/categoryGrouping.ts:
// Health Literacy's prefix tree gives the band order and the subtopic
// folds, and Earth Matters and Horticulture come through
// groupEntriesForLens, whose '::'-joined labels fold up into topic, then
// subgroup. Their "Putting It Together" synthesis entry is the last band.

const SEARCH_RESULT_LIMIT = 200;

type Subgroup = { label: string | null; entries: AnyDigestEntry[] };
type Topic = {
  label: string;
  description?: string;
  subgroups: Subgroup[];
  count: number;
  // Health Literacy only: the band is one of the two about a condition,
  // which sit last under a heading of their own.
  conditionSpecific?: boolean;
};

// Every band on the page, in order, with its rows already sorted.
function topicsForCategory(categoryKey: DigestCategoryKey, entries: AnyDigestEntry[]): Topic[] {
  if (categoryKey === 'basicHealth') {
    // basicHealthAllGroups gives every leaf group at once; fold them back
    // up under their topic so each topic is one band. The Glossary is one
    // of them, an alphabetical run of definitions in a band of its own,
    // since the Digest header's Glossary button that used to open it as a
    // separate flat list went with the Digest tab.
    const leaves = basicHealthAllGroups(entries);
    const byTopic = new Map<string, Subgroup[]>();
    const order: string[] = [];
    for (const leaf of leaves) {
      const [topic, ...rest] = leaf.label.split('::');
      if (!byTopic.has(topic)) {
        byTopic.set(topic, []);
        order.push(topic);
      }
      byTopic.get(topic)!.push({ label: rest.length ? rest.join(' › ') : null, entries: leaf.entries });
    }
    return order
      .map((label) => {
        const subgroups = byTopic.get(label)!.filter((subgroup) => subgroup.entries.length > 0);
        const defined = BASIC_HEALTH_TOPICS.find((topic) => topic.label === label);
        const description = label === BASIC_HEALTH_MORE_TOPIC_LABEL ? BASIC_HEALTH_MORE_TOPIC_DESCRIPTION : defined?.description;
        return {
          label,
          description,
          subgroups,
          count: subgroups.reduce((total, subgroup) => total + subgroup.entries.length, 0),
          conditionSpecific: defined?.conditionSpecific === true,
        };
      })
      .filter((topic) => topic.count > 0);
  }
  const grouped = groupEntriesForLens(categoryKey, entries);
  const byTopic = new Map<string, Subgroup[]>();
  const order: string[] = [];
  for (const group of grouped.topics) {
    const [topic, ...rest] = group.label.split('::');
    if (!byTopic.has(topic)) {
      byTopic.set(topic, []);
      order.push(topic);
    }
    byTopic.get(topic)!.push({ label: rest.length ? rest.join(' › ') : null, entries: group.entries });
  }
  const topics: Topic[] = order.map((label) => {
    const subgroups = byTopic.get(label)!;
    return { label, subgroups, count: subgroups.reduce((total, subgroup) => total + subgroup.entries.length, 0) };
  });
  if (grouped.tyingTogether) {
    topics.push({
      label: TYING_TOGETHER_GROUP_KEY,
      subgroups: [{ label: null, entries: [grouped.tyingTogether] }],
      count: 1,
    });
  }
  return topics;
}

function topicDisplayLabel(label: string): string {
  return label === TYING_TOGETHER_GROUP_KEY ? 'Putting It Together' : label;
}

// Where an entry sits: which band, and which fold inside it.
function locateEntry(topics: Topic[], id: string): { topic: string; subgroup: string | null } | null {
  for (const topic of topics) {
    for (const subgroup of topic.subgroups) {
      if (subgroup.entries.some((entry) => entry.id === id)) return { topic: topic.label, subgroup: subgroup.label };
    }
  }
  return null;
}

// The band a search hit would sit under, since the results list has no
// band saying so.
function groupLabelFor(categoryKey: DigestCategoryKey, id: string, topics: Topic[]): string | undefined {
  if (categoryKey === 'basicHealth') {
    const path = basicHealthTopicPathForEntryId(id);
    return path.length > 0 ? path.join(' › ') : BASIC_HEALTH_MORE_TOPIC_LABEL;
  }
  const where = locateEntry(topics, id);
  if (!where) return undefined;
  const topic = topicDisplayLabel(where.topic);
  return where.subgroup ? `${topic} › ${where.subgroup}` : topic;
}

export function DigestCategorySection({
  categoryKey,
  entries,
  query,
  searchActive,
  tabColor,
  tabTextColor,
  openEntryId,
  scrollToY,
  onJumpToRelated,
}: {
  categoryKey: DigestCategoryKey;
  // The category's entries, already trimmed of anything tagged with a
  // hidden food; the screen owns that filter.
  entries: AnyDigestEntry[];
  // The debounced text in the search box over the page. Non-empty replaces
  // the bands with one ranked list.
  query: string;
  // True while the search box has focus or text, when the header box
  // stands down so the results start at the top.
  searchActive: boolean;
  tabColor: string;
  tabTextColor: string;
  // An entry to open on arrival: a Related chip tapped elsewhere, a Search
  // All hit, a Home flip card's Read More. Opened once per id.
  openEntryId?: string | null;
  // The screen's ScrollView, so a jump can bring the opened entry to the
  // top of the screen. Positions are measured from this section's top.
  scrollToY?: (y: number) => void;
  onJumpToRelated: (id: string) => void;
}) {
  const styles = useMemo(() => makeStyles(tabColor, tabTextColor), [tabColor, tabTextColor]);
  const meta = DIGEST_CATEGORY_META.find((candidate) => candidate.key === categoryKey);
  const topics = useMemo(() => topicsForCategory(categoryKey, entries), [categoryKey, entries]);

  const [openTopic, setOpenTopic] = useState<string | null>(null);
  const [openSubgroup, setOpenSubgroup] = useState<string | null>(null);
  const [openEntry, setOpenEntry] = useState<string | null>(null);

  // Switching category closes everything; the old category's labels mean
  // nothing in the new one.
  useEffect(() => {
    setOpenTopic(null);
    setOpenSubgroup(null);
    setOpenEntry(null);
  }, [categoryKey]);

  // The row an open-in-place is waiting to bring to the top of the
  // screen. It measures itself against this section's root once it has
  // laid out (see EntryScrollAnchor), and the host adds the section's
  // offset through scrollToY.
  const sectionRef = useRef<View>(null);
  const pendingEntry = useRef<string | null>(null);
  const scrollTarget = useMemo<EntryScrollTarget | undefined>(
    () => (scrollToY ? { pending: pendingEntry, relativeTo: sectionRef, onMeasured: scrollToY } : undefined),
    [scrollToY],
  );

  const openInPlace = useCallback(
    (id: string) => {
      const where = locateEntry(topics, id);
      if (!where) return;
      setOpenTopic(where.topic);
      setOpenSubgroup(where.subgroup);
      setOpenEntry(id);
      pendingEntry.current = id;
    },
    [topics],
  );

  const consumedOpenId = useRef<string | null>(null);
  useEffect(() => {
    // A cleared id lets the same entry be asked for again later.
    if (!openEntryId) {
      consumedOpenId.current = null;
      return;
    }
    if (consumedOpenId.current === openEntryId) return;
    if (topics.length === 0) return;
    consumedOpenId.current = openEntryId;
    openInPlace(openEntryId);
  }, [openEntryId, topics, openInPlace]);

  // The scoped search: every entry in this category, ranked, with the
  // matched-term dots under each row. Health Literacy's Glossary is in
  // the pool, since a definition is often what a search is after.
  const searchResults = useMemo(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) return null;
    return searchEntriesScored(entries, trimmed, SEARCH_RESULT_LIMIT);
  }, [query, entries]);

  const label = meta?.label ?? '';

  const toggleSubgroup = (key: string, open: boolean) => {
    setOpenSubgroup(open ? null : key);
    setOpenEntry(null);
  };

  const renderRows = (rows: AnyDigestEntry[]) =>
    rows.map((entry, index) => (
      <Fragment key={entry.id}>
        {index > 0 ? <View style={styles.rowDivider} /> : null}
        <EntryScrollAnchor id={entry.id} target={scrollTarget}>
          <DigestEntryRow
            entry={entry}
            expanded={openEntry === entry.id}
            onToggle={() => setOpenEntry(openEntry === entry.id ? null : entry.id)}
            onJumpToRelated={onJumpToRelated}
            tabColor={tabColor}
            styles={styles}
          />
        </EntryScrollAnchor>
      </Fragment>
    ));

  return (
    <View ref={sectionRef} style={styles.wrapper}>
      {searchActive ? null : (
        <View style={styles.headerBox}>
          <View style={styles.headerRow}>
            <Ionicons name={meta?.icon ?? 'reader-outline'} size={22} color={tabColor} style={textShadow} />
            <Text style={styles.headerText}>{label}</Text>
          </View>
          {meta?.description ? <Text style={styles.headerDescription}>{meta.description}</Text> : null}
        </View>
      )}

      {searchResults ? (
        <>
          <View style={styles.countBox}>
            <Text style={styles.countText}>
              {searchResults.length === 0
                ? `No matches for “${query.trim()}” in ${label}.`
                : `${searchResults.length} match${searchResults.length === 1 ? '' : 'es'} in ${label}`}
            </Text>
          </View>
          {searchResults.length > 0 ? (
            <View style={styles.resultList}>
              {searchResults.map((result, index) => (
                <Fragment key={result.entry.id}>
                  {index > 0 ? <View style={styles.rowDivider} /> : null}
                  <DigestEntryRow
                    entry={result.entry}
                    groupLabel={groupLabelFor(categoryKey, result.entry.id, topics)}
                    expanded={openEntry === result.entry.id}
                    onToggle={() => setOpenEntry(openEntry === result.entry.id ? null : result.entry.id)}
                    onJumpToRelated={onJumpToRelated}
                    tabColor={tabColor}
                    styles={styles}
                    below={<MatchDotRow match={result.match} tabColor={tabColor} />}
                  />
                </Fragment>
              ))}
            </View>
          ) : null}
        </>
      ) : (
        topics.map((topic, index) => {
          const expanded = openTopic === topic.label;
          const single = topic.subgroups.length === 1 && topic.subgroups[0].label === null;
          // The heading over the condition-specific bands, once, before
          // the first of them. They are last in the list, so everything
          // above the heading is the general run.
          const headsConditionSpecific = topic.conditionSpecific === true && !(topics[index - 1]?.conditionSpecific === true);
          return (
            <Fragment key={topic.label}>
              {headsConditionSpecific ? (
                <View style={styles.groupHeadingChip}>
                  <Text style={styles.groupHeadingText}>{BASIC_HEALTH_CONDITION_SPECIFIC_HEADING.title}</Text>
                  <Text style={styles.groupHeadingMeta}>{BASIC_HEALTH_CONDITION_SPECIFIC_HEADING.description}</Text>
                </View>
              ) : null}
              <HomeSectionBand
                kind="fold"
                title={`${topicDisplayLabel(topic.label)} (${topic.count})`}
                icon={meta?.icon ?? 'reader-outline'}
                color={tabColor}
                expanded={expanded}
                onToggle={() => {
                  setOpenTopic(expanded ? null : topic.label);
                  setOpenSubgroup(null);
                  setOpenEntry(null);
                }}
                contentStyle={styles.bandBody}
              >
                {topic.description ? <Text style={styles.topicDescription}>{topic.description}</Text> : null}
                {single
                  ? renderRows(topic.subgroups[0].entries)
                  : topic.subgroups.map((subgroup) => {
                      const key = subgroup.label ?? '';
                      const open = openSubgroup === key;
                      return (
                        <View key={key} style={styles.topicFold}>
                          <TouchableOpacity style={styles.topicTapArea} onPress={() => toggleSubgroup(key, open)} activeOpacity={0.85}>
                            <Text style={styles.topicTitle}>
                              {subgroup.label ?? 'Entries'} ({subgroup.entries.length})
                            </Text>
                            <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
                          </TouchableOpacity>
                          {open ? <View style={styles.topicBody}>{renderRows(subgroup.entries)}</View> : null}
                        </View>
                      );
                    })}
              </HomeSectionBand>
            </Fragment>
          );
        })
      )}
    </View>
  );
}

// The compact version of the search-term legend: one dot per term, filled
// for a title match, outlined for a body or citation match, grey for a
// miss. The Search Matching help sheet explains the three.
export function MatchDotRow({ match, tabColor }: { match: SearchMatchInfo; tabColor: string }) {
  return (
    <View style={dotStyles.row}>
      {match.terms.map((termMatch) => (
        <View
          key={termMatch.term}
          style={[
            dotStyles.dot,
            termMatch.matchedInTitle
              ? { backgroundColor: tabColor }
              : termMatch.matchedAnywhere
                ? { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: tabColor }
                : dotStyles.miss,
          ]}
        />
      ))}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 5, marginTop: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  miss: { backgroundColor: colors.border },
});

function makeStyles(tabColor: string, tabTextColor: string) {
  return StyleSheet.create({
    ...makeDigestRowStyles(tabColor),
    wrapper: { gap: HOME_BAND_GAP },
    bandBody: { gap: HOME_BAND_GAP },
    // The category's name and description, the box the page starts with.
    // Edge to edge like the bands below it, with the band's content inset
    // so its text lines up with theirs.
    headerBox: {
      backgroundColor: colors.surface,
      paddingVertical: 14,
      paddingHorizontal: HOME_BAND_CONTENT_PADDING,
      gap: 8,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerText: { ...typography.screenTitle, ...menuLabelShadow, fontWeight: '400', color: tabTextColor, flex: 1 },
    headerDescription: { ...typography.body, color: colors.textSecondary, ...textShadow },
    topicDescription: { ...typography.caption, color: colors.textSecondary, ...textShadow },
    countBox: {
      backgroundColor: colors.surfaceMuted,
      paddingVertical: 10,
      paddingHorizontal: HOME_BAND_CONTENT_PADDING,
    },
    countText: { ...typography.caption, color: colors.textSecondary, ...textShadow },
    resultList: {},
    // A heading introducing a group of bands, the same chip Conditions
    // uses for My Conditions, Family and Other Conditions, so it carries
    // a surface of its own rather than sitting on the photograph.
    groupHeadingChip: {
      backgroundColor: colors.surfaceMuted,
      paddingVertical: 10,
      paddingHorizontal: HOME_BAND_CONTENT_PADDING,
      borderLeftWidth: HOME_BAND_ACCENT_WIDTH,
      borderLeftColor: tabColor,
      gap: 6,
    },
    groupHeadingText: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
    groupHeadingMeta: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  });
}
