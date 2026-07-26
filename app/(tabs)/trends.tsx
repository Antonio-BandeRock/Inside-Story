import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LensHub, type LensOption } from '../../components/LensHub';
import { PageIdentityLabel } from '../../components/PageIdentityLabel';
import { ScreenBackground } from '../../components/ScreenBackground';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SwipeableTabScreen } from '../../components/SwipeableTabScreen';
import { colors } from '../../constants/colors';

// Placeholder for the LensHub corner button (see components/LensHub.tsx) --
// the page itself isn't built yet, so there's nothing real to switch
// between. Reserves the button/shape now; gets replaced with real options
// once Trends' own views are designed.
type TrendsLens = 'overview';
const TRENDS_LENSES: LensOption<TrendsLens>[] = [{ key: 'overview', label: 'Overview', icon: 'trending-up-outline' }];

export default function TrendsScreen() {
  const [lens, setLens] = useState<TrendsLens>('overview');

  return (
    <SwipeableTabScreen>
      <View style={styles.screen}>
        <View style={styles.header}>
          <ScreenHeader
            title="Trends"
            tabPath="/trends"
            helpSections={[
              {
                heading: 'What this page will do',
                body: 'Not built yet. Once it is, this is where nutrient intake and symptom check-in results will be charted over weeks and months, so slow changes that are invisible day-to-day become visible trends.',
              },
              {
                heading: 'In the meantime',
                body: "Today's snapshot already exists on the Insights tab (Nutrients, 6 Dimensions, and Cooking & Prep). Trends is the same kind of information, but over time instead of just today.",
              },
            ]}
          />
        </View>

        <ScreenBackground variant="trends" />

        <PageIdentityLabel title="Trends" />
        <LensHub pageTitle="Trends" options={TRENDS_LENSES} selected={lens} onSelect={setLens} />
      </View>
    </SwipeableTabScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 12 },
});
