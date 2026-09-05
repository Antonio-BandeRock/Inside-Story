import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRegisterScreenHelp } from '../../components/CurrentPageHelp';
import { GatedTabContent } from '../../components/GatedTabContent';
import type { HelpSection } from '../../components/HelpButton';
import { LensHub, type LensOption } from '../../components/LensHub';
import { MyItemsHub } from '../../components/MyItemsHub';
import { PageIdentityLabel } from '../../components/PageIdentityLabel';
import { SwipeableTabScreen } from '../../components/SwipeableTabScreen';
import { colors } from '../../constants/colors';
import { useFloatingButtonScrollPadding } from '../../constants/floatingButton';
import { textShadow, typography } from '../../constants/typography';
import { useAutoOpenLensHubSignal } from '../../hooks/useAutoOpenLensHubSignal';

// The 10th tab, added 2026-09-04. Direct request: "A new tab needs to be
// added and available through TabHub menu. The name of the new tab is
// Life. There will be a ton of things that will be included in Life...
// This will deal with the user's life, all aspects."
//
// What ships here is the shell, deliberately. The tab is real: it is in
// TAB_ROUTES, it is in the TabHub grid, it swipes, it has its own identity
// color and its own help, and it behaves like every other tab. What it
// does NOT have is invented content. "A ton of things" was named without
// naming which things, and guessing at a lens set would mean building
// something to be torn out rather than the thing that was actually wanted.
//
// So the one lens below is an honest account of an empty room, written to
// be read by the person who asked for the room. It states what the tab is
// for, states plainly that nothing is in it yet, and says what deciding
// its first area actually involves. That is the same treatment this app
// already gives every other honest empty state (Pattern Finder with no
// flares logged, Therapy Response below its reporting bar, MyItemsHub
// with nothing saved), rather than a "coming soon" placeholder that tells
// someone nothing.
//
// Reports' own precedent is followed for the single-lens case: keep the
// real LensHub anyway rather than skipping it, so the corner button and
// the Info tile behave the same, consistent way every other tab does.

const TAB_COLOR = colors.tabLife;

type LifeLens = 'overview';

const LIFE_HELP_SECTIONS: HelpSection[] = [
  {
    heading: 'What this tab is for',
    body: 'Everything about your life that is not food, not a symptom, and not a lab result. This app started with what you eat and grew outward from there, and the areas that do not fit under Food, Schedules, or Signals belong here.',
  },
  {
    heading: 'Why it is empty right now',
    body: 'The tab exists before its contents do, on purpose. It is wired into navigation, it has its own color and its own place in the menu, and adding an area to it later is a small change rather than a restructuring. Nothing was invented to fill it in the meantime.',
  },
  {
    heading: 'How the rest of this app is built, for reference',
    body: 'Every other tab is a set of lenses reached from the corner button: Schedules has meals, hydration, supplements, prescriptions, appointments and hands-on therapies; Trends has nutrients, symptoms, weight, labs and pattern finding. Life will work the same way once its first areas are decided.',
  },
];

const LIFE_LENSES: LensOption<LifeLens>[] = [
  { key: 'overview', label: 'Overview', icon: 'infinite-outline', help: LIFE_HELP_SECTIONS },
];

export default function LifeScreen() {
  useRegisterScreenHelp('Life', LIFE_HELP_SECTIONS, '/life');
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const [lens, setLens] = useState<LifeLens>('overview');
  // Same pattern as every other tab -- see app/(tabs)/insights.tsx's own
  // comment: a tab always returns to its lens picker on focus rather than
  // reopening whatever was last looked at.
  const [revealed, setRevealed] = useState(false);
  const [myLifeOpen, setMyLifeOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setRevealed(false);
      return () => setRevealed(false);
    }, []),
  );

  const autoOpenLensHub = useAutoOpenLensHubSignal();
  const activeLensLabel = LIFE_LENSES.find((option) => option.key === lens)?.label;

  return (
    <View style={styles.screen}>
      {/* enabled={!revealed} -- see food.tsx's own comment: swipe-to-
          change-tab only works from a lens's own picker, not once a real
          lens's content is showing. */}
      <SwipeableTabScreen enabled={!revealed}>
        {/* variant="field" -- the shared resting scene, the same choice
            Garden and Digest both make. A tab gets its own background image
            when it has earned one; generating one for a tab with no content
            yet would be decorating an empty room. */}
        <GatedTabContent pageTitle="Life" variant="field" revealed={revealed}>
          <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}>
            <Text style={[styles.sectionHeading, styles.groupHeadingChip]}>{activeLensLabel}</Text>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>This tab is ready and empty</Text>
              <Text style={styles.bodyText}>
                Life is where the parts of your life that are not food, not a symptom, and not a lab result will live.
                The tab itself is finished: it has its own place in the menu, its own color, and it works like every
                other tab. What goes inside it has not been decided yet.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>What happens next</Text>
              <Text style={styles.bodyText}>
                Each area added here becomes its own lens on the corner button, the same way Schedules holds meals,
                hydration, supplements, prescriptions, appointments and hands-on therapies behind one button. Adding the
                first one is a small change now that the tab exists, which is why it was built first and left empty
                rather than held back until everything was planned.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Nothing here is pretending to work</Text>
              <Text style={styles.bodyText}>
                There are no placeholder features on this screen and no buttons that do nothing. When something appears
                here, it will be because it was built, not because a space was reserved for it.
              </Text>
            </View>
          </ScrollView>
        </GatedTabContent>
      </SwipeableTabScreen>

      <PageIdentityLabel title="Life" activeLensLabel={revealed ? activeLensLabel : undefined} />
      <MyItemsHub label="My Life" tabColor={TAB_COLOR} open={myLifeOpen} onOpenChange={setMyLifeOpen} />
      <LensHub
        pageTitle="Life"
        options={LIFE_LENSES}
        selected={revealed ? lens : undefined}
        columns={3}
        autoOpenSignal={autoOpenLensHub}
        extraTile={{ label: 'My Life', icon: 'bookmarks-outline', onPress: () => setMyLifeOpen(true) }}
        onSelect={(key) => {
          setLens(key);
          setRevealed(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 32 },

  // A heading introducing a group of separate cards gets its own surface,
  // per the standing no-text-on-the-tab-background rule.
  groupHeadingChip: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  sectionHeading: { ...typography.sectionTitle, color: colors.textPrimary, marginBottom: 16, ...textShadow },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: TAB_COLOR,
  },
  cardTitle: { ...typography.sectionTitle, color: colors.textPrimary, marginBottom: 8, ...textShadow },
  bodyText: { ...typography.body, color: colors.textSecondary, ...textShadow },
});
