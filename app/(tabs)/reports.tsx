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
// once Reports' own views are designed.
type ReportsLens = 'overview';
const REPORTS_LENSES: LensOption<ReportsLens>[] = [{ key: 'overview', label: 'Overview', icon: 'document-text-outline' }];

export default function ReportsScreen() {
  const [lens, setLens] = useState<ReportsLens>('overview');

  return (
    <SwipeableTabScreen>
      <View style={styles.screen}>
        <View style={styles.header}>
          <ScreenHeader
            title="Reports"
            tabPath="/reports"
            helpSections={[
              {
                heading: 'What this page will do',
                body: 'Not built yet. Once it is, this is where you\'ll generate a printable/shareable summary of your logged meals, nutrient trends, and 6 Dimensions history -- built for handing to a doctor, nutritionist, or trainer, or just for yourself.',
              },
              {
                heading: 'Privacy',
                body: 'Reports will generate entirely on your device, the same as the rest of this app -- nothing is sent anywhere unless you explicitly export or share it yourself.',
              },
            ]}
          />
        </View>

        <ScreenBackground />

        <PageIdentityLabel title="Reports" />
        <LensHub pageTitle="Reports" options={REPORTS_LENSES} selected={lens} onSelect={setLens} />
      </View>
    </SwipeableTabScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 12 },
});
