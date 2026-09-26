import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { DayTimeline } from '../components/DayTimeline';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, homeBandStyle } from '../components/HomeSectionBand';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';

// The whole Today timeline (B1 of the competitive build plan, 2026-09-26):
// the same builder and the same strip as the Home card and Schedules >
// Timeline, with nothing held back. This route used to hold a placeholder
// for the 2026-08-21 header growth plan's timeline; that idea is now the
// reward design in CLAUDE.md's open item 29, and this screen is what the
// header's title opens.
export default function TimelineScreen() {
  const scrollPadding = useFloatingButtonScrollPadding();
  return (
    <>
      <Stack.Screen options={{ title: 'Timeline' }} />
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <View style={styles.box}>
          <Text style={styles.lead}>
            Everything on the days around today, on one clock: meals and doses, appointments, routines, check-ins and
            sleep, bills, upkeep and counters. Slide it to go back or ahead. A tap opens the place each one is kept.
          </Text>
        </View>
        <View style={styles.box}>
          <DayTimeline tabColor={colors.tabSchedules} />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { gap: HOME_BAND_GAP },
  box: { ...homeBandStyle, borderColor: colors.tabSchedules, padding: HOME_BAND_CONTENT_PADDING },
  lead: { ...typography.body, color: colors.textSecondary, ...textShadow },
});
