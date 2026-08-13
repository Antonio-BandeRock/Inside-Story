import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { HelpSection } from '../../components/HelpButton';
import { useRegisterScreenHelp } from '../../components/CurrentPageHelp';
import { GatedTabContent } from '../../components/GatedTabContent';
import { LensHub, type LensOption } from '../../components/LensHub';
import { MyItemsHub } from '../../components/MyItemsHub';
import { PageIdentityLabel } from '../../components/PageIdentityLabel';
import { SwipeableTabScreen } from '../../components/SwipeableTabScreen';
import { colors } from '../../constants/colors';
import { useAutoOpenLensHubSignal } from '../../hooks/useAutoOpenLensHubSignal';

// Placeholder for the LensHub corner button (see components/LensHub.tsx) --
// the page itself isn't built yet, so there's nothing real to switch
// between. Reserves the button/shape now; gets replaced with real options
// once Reports' own views are designed.
type ReportsLens = 'overview';

// Single source of truth for both the page-level ScreenHeader help and the
// LensHub Info tile's per-option help -- same reuse pattern as
// FOOD_LENS_COPY in app/(tabs)/food.tsx.
const REPORTS_HELP_SECTIONS: HelpSection[] = [
  {
    heading: 'What this page will do',
    body: 'Not built yet. Once it is, this is where you\'ll generate a printable/shareable summary of your logged meals, nutrient trends, and 6 Dimensions history: built for handing to a doctor, nutritionist, or trainer, or just for yourself.',
  },
  {
    heading: 'Privacy',
    body: 'Reports will generate entirely on your device, the same as the rest of this app; nothing is sent anywhere unless you explicitly export or share it yourself.',
  },
];

const REPORTS_LENSES: LensOption<ReportsLens>[] = [
  { key: 'overview', label: 'Overview', icon: 'document-text-outline', help: REPORTS_HELP_SECTIONS },
];

export default function ReportsScreen() {
  useRegisterScreenHelp('Reports', REPORTS_HELP_SECTIONS, '/reports');
  const [lens, setLens] = useState<ReportsLens>('overview');
  // Same pattern as app/(tabs)/insights.tsx -- see that file's own comment.
  const [revealed, setRevealed] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setRevealed(false);
      return () => setRevealed(false);
    }, []),
  );
  const autoOpenLensHub = useAutoOpenLensHubSignal();
  // 2026-08-08 -- this page had never actually passed activeLensLabel to
  // PageIdentityLabel below (every sibling tab does), so the "which lens
  // you're in" box never showed here even after picking the one real
  // option this page has. Real, if small, gap -- fixed alongside this same
  // pass since "the boxes that show up to tell which lens they are in
  // should all still appear for each lens for all tabs" was explicit.
  const activeLensLabel = REPORTS_LENSES.find((option) => option.key === lens)?.label;

  return (
    <View style={styles.screen}>
      {/* enabled={!revealed} -- see food.tsx's own comment: swipe-to-
          change-tab only works from a lens's own picker, not once a real
          lens's content (with its own scrollable controls) is showing. */}
      <SwipeableTabScreen enabled={!revealed}>
        <GatedTabContent pageTitle="Reports" variant="reports" revealed={revealed} />
      </SwipeableTabScreen>

      <PageIdentityLabel title="Reports" activeLensLabel={revealed ? activeLensLabel : undefined} />
      <MyItemsHub label="My Reports" tabColor={colors.tabReports} />
      <LensHub
        pageTitle="Reports"
        options={REPORTS_LENSES}
        selected={revealed ? lens : undefined}
        columns={3}
        autoOpenSignal={autoOpenLensHub}
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
});
