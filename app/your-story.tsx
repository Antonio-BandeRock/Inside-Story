// Your Story, the full page, 2026-09-24. A Stack screen beside Capture and
// Where Is It, for the same reason: it belongs to no tab, since the whole
// point of it is to say where each part of the app fits. Reached from its
// Home card, its Home menu entry and Profile.
//
// The Home card shows the section being worked on; this page shows the
// whole paper, so an item that has dropped off the card is never out of
// reach (the worry that started this: "if it disappears from that list...
// it might not be easy to remember how to get back there again").
import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, homeBandStyle } from '../components/HomeSectionBand';
import { YourStorySection, useYourStory } from '../components/YourStorySection';

export default function YourStoryScreen() {
  const scrollPadding = useFloatingButtonScrollPadding();
  const [view, reload] = useYourStory();

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Your Story' }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <View style={styles.leadBox}>
          <Text style={styles.heading}>{view?.heading ?? 'Your Story'}</Text>
          <Text style={styles.lead}>
            Everything you keep in Inside Story makes up your paper, one section for each part of your life. Each line
            below says what goes in it and takes you straight there. Once something is on record it carries the date it
            went in.
          </Text>
        </View>
        <YourStorySection mode="page" view={view} onChanged={() => void reload()} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { gap: HOME_BAND_GAP },
  leadBox: { ...homeBandStyle, borderColor: colors.primary, padding: HOME_BAND_CONTENT_PADDING, gap: 6 },
  heading: { ...typography.sectionTitle, color: colors.textPrimary, ...textShadow },
  lead: { ...typography.body, color: colors.textSecondary, ...textShadow },
});
