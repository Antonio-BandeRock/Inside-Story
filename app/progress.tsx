// Your Progress (C17 of the competitive build plan, 2026-09-27): what a
// person's use of the app has built, told tab by tab, made entirely of
// their records. The design, and the four decisions the owner approved
// before it was built, are in docs/progress-design.md; every sentence on
// this page comes from lib/progress.ts and every picture from
// lib/progressScene.ts.
//
// Five kinds of progress, each in every band where it applies: the firsts
// (with the day each happened), variety (each different thing once),
// weeks kept (a week counts once, never "in a row"), kept alive (what is
// still growing or fermenting, and for how long), and ready to answer
// (what each analysis needs, from the same constant the analysis reads).
// Nothing is scored, nothing is praised, and nothing counts down.
//
// "Since you last looked" compares against keys this device stored the
// last time the page was open (device-local, lib/progressDb.ts). The first
// visit lists nothing and says why, rather than calling everything new.
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router, Stack } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, homeBandStyle } from '../components/HomeSectionBand';
import { ProgressSceneSvg } from '../components/ProgressPicture';
import { TabBand } from '../components/TabBand';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { TAB_ROUTES } from '../constants/tabs';
import { textShadow, typography } from '../constants/typography';
import { useBandFolds } from '../hooks/useBandFolds';
import {
  progressPieces,
  type ProgressBand,
  type ProgressInputs,
  sinceLastLooked,
  sinceLastLookedSentence,
  spokenDay,
} from '../lib/progress';
import { loadProgress, readLastSeenPieces, saveLastSeenPieces } from '../lib/progressDb';
import { buildProgressScene } from '../lib/progressScene';

type Since = ReturnType<typeof sinceLastLooked>;

function bandHasAnything(band: ProgressBand): boolean {
  return (
    band.firsts.length > 0 ||
    band.varieties.some((item) => item.count > 0) ||
    band.weeks.some((item) => item.weeks > 0) ||
    band.keptAlive.length > 0
  );
}

export default function ProgressScreen() {
  const scrollPadding = useFloatingButtonScrollPadding();
  const folds = useBandFolds();
  const [inputs, setInputs] = useState<ProgressInputs | null>(null);
  const [bands, setBands] = useState<ProgressBand[] | null>(null);
  const [since, setSince] = useState<Since | null>(null);
  const [failed, setFailed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      (async () => {
        try {
          const loaded = await loadProgress();
          const previous = await readLastSeenPieces();
          if (!live) return;
          setInputs(loaded.inputs);
          setBands(loaded.bands);
          setSince(sinceLastLooked(previous, progressPieces(loaded.inputs)));
          setFailed(false);
          await saveLastSeenPieces(loaded.inputs);
        } catch {
          if (live) setFailed(true);
        }
      })();
      return () => {
        live = false;
      };
    }, []),
  );

  const sinceLine = since ? sinceLastLookedSentence(since) : null;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Your Progress' }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <View style={styles.introBox}>
          <Text style={styles.introTitle}>Made of what you have recorded</Text>
          <Text style={styles.caption}>
            Everything here is read from your records as they stand today, so it only ever grows as they do. Each tab below
            says what you have started, how many different things, the weeks you came back to it, what you are keeping
            alive, and what each part of the app needs before it can answer you.
          </Text>
        </View>

        <View style={styles.introBox}>
          <Text style={styles.sectionLabel}>Since you last looked</Text>
          {since == null ? (
            <Text style={styles.caption}>{failed ? 'Your records could not be read just now.' : 'Reading your records.'}</Text>
          ) : (
            <>
              {since.lines.map((line) => (
                <View key={line} style={styles.lineRow}>
                  <Ionicons name="add-circle-outline" size={15} color={colors.tabProfile} style={textShadow} />
                  <Text style={styles.lineText}>{line}</Text>
                </View>
              ))}
              {sinceLine ? <Text style={styles.caption}>{sinceLine}</Text> : null}
            </>
          )}
        </View>

        {inputs && bands
          ? bands.map((band) => <TabProgressBand key={band.tab} band={band} inputs={inputs} bands={bands} folds={folds} />)
          : null}
      </ScrollView>
    </View>
  );
}

function TabProgressBand({
  band,
  inputs,
  bands,
  folds,
}: {
  band: ProgressBand;
  inputs: ProgressInputs;
  bands: ProgressBand[];
  folds: ReturnType<typeof useBandFolds>;
}) {
  const route = TAB_ROUTES.find((entry) => entry.path === band.tab);
  const color = route?.color ?? colors.tabHome;
  const scene = useMemo(() => (route ? buildProgressScene(band.tab, inputs, bands, route.color) : null), [band.tab, inputs, bands, route]);
  if (!route) return null;
  const empty = !bandHasAnything(band);

  return (
    <TabBand folds={folds} color={color} id={`progress:${band.tab}`} title={route.title} icon={route.icon}>
      <View style={styles.bandColumn}>
        {scene && scene.shapes.length > 0 ? (
          <View style={styles.pictureBox}>
            <ProgressSceneSvg scene={scene} />
          </View>
        ) : null}

        {empty && band.ready.length === 0 && !band.note ? (
          <View style={styles.row}>
            <Text style={styles.caption}>Nothing recorded here yet. This fills in from the first thing you record on {route.title}.</Text>
          </View>
        ) : null}

        {band.firsts.length > 0 ? (
          <View style={styles.row}>
            <Text style={styles.sectionLabel}>Firsts</Text>
            {band.firsts.map((first) => (
              <View key={first.label} style={styles.pairRow}>
                <Text style={styles.lineText}>{first.label}</Text>
                <Text style={styles.dateText}>{spokenDay(first.day)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {band.varieties.map((item) => (
          <View key={item.title} style={styles.row}>
            <Text style={styles.sectionLabel}>{item.count > 0 ? `${item.title} (${item.count})` : item.title}</Text>
            <Text style={styles.lineText}>{item.sentence}</Text>
          </View>
        ))}

        {band.weeks.length > 0 ? (
          <View style={styles.row}>
            <Text style={styles.sectionLabel}>Weeks you came back to it</Text>
            {band.weeks.map((item) => (
              <Text key={item.sentence} style={styles.lineText}>
                {item.sentence}
              </Text>
            ))}
          </View>
        ) : null}

        {band.keptAlive.length > 0 ? (
          <View style={styles.row}>
            <Text style={styles.sectionLabel}>Kept alive</Text>
            {band.keptAlive.map((line) => (
              <Text key={line} style={styles.lineText}>
                {line}
              </Text>
            ))}
          </View>
        ) : null}

        {band.ready.length > 0 ? (
          <View style={styles.row}>
            <Text style={styles.sectionLabel}>Ready to answer</Text>
            {band.ready.map((line) => (
              <View key={line.text} style={styles.lineRow}>
                <Ionicons
                  name={line.ready === null ? 'information-circle-outline' : line.ready ? 'checkmark-circle-outline' : 'ellipse-outline'}
                  size={15}
                  color={color}
                  style={textShadow}
                />
                <Text style={styles.lineText}>{line.text}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {band.note ? (
          <View style={styles.row}>
            <Text style={styles.caption}>{band.note}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={[styles.goButton, { borderColor: color }]} onPress={() => router.navigate(route.path)} activeOpacity={0.8}>
          <Ionicons name={route.icon} size={16} color={color} style={textShadow} />
          <Text style={styles.goText}>Open {route.title}</Text>
        </TouchableOpacity>
      </View>
    </TabBand>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { gap: HOME_BAND_GAP },
  introBox: {
    ...homeBandStyle,
    borderColor: colors.tabProfile,
    padding: HOME_BAND_CONTENT_PADDING,
    gap: 8,
  },
  introTitle: { ...typography.sectionTitle, color: colors.tabProfile, fontWeight: '400', ...textShadow },
  sectionLabel: { ...typography.bodyEmphasis, color: colors.textPrimary, fontWeight: '400', ...textShadow },
  caption: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  lineText: { ...typography.body, color: colors.textPrimary, flexShrink: 1, ...textShadow },
  dateText: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  lineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  pairRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 },
  bandColumn: { gap: HOME_BAND_GAP },
  row: { backgroundColor: colors.surfaceMuted, borderRadius: 10, padding: 12, gap: 6 },
  pictureBox: { height: 190, backgroundColor: '#1d2a33', borderRadius: 10, overflow: 'hidden', padding: 8 },
  goButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.surfaceMuted,
  },
  goText: { ...typography.body, color: colors.textPrimary, ...textShadow },
});
