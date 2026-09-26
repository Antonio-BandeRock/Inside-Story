// Your Story, the full page, 2026-09-24. A Stack screen beside Capture and
// Where Is It, for the same reason: it belongs to no tab, since the whole
// point of it is to say where each part of the app fits. Reached from its
// Home card, its Home menu entry and Profile.
//
// The Home card shows the section being worked on; this page shows the
// whole paper, so an item that has dropped off the card is never out of
// reach (the worry that started this: "if it disappears from that list...
// it might not be easy to remember how to get back there again").
//
// Since 1.0.52.5 it opens as an interview (components/YourStoryInterview.tsx):
// the app asks what it needs one question at a time, then says what each tab
// is for as a whole (components/YourStoryTour.tsx), the tab chosen to start
// from first. The guides and the paper follow.
//
// Since 1.0.51.7 the page opens with a guide for each part of life chosen
// (components/YourStoryGuides.tsx), and ?guide=<key> opens that guide and
// scrolls to it, which is how the Home card points into the one you are in.
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, homeBandStyle } from '../components/HomeSectionBand';
import { YourStoryGuides } from '../components/YourStoryGuides';
import { YourStoryInterview } from '../components/YourStoryInterview';
import { YourStorySection, useStoryGo, useYourStory } from '../components/YourStorySection';
import { YourStoryTour } from '../components/YourStoryTour';
import { currentGuideKey, isGuideKey, type GuideKey } from '../lib/yourStoryGuides';

export default function YourStoryScreen() {
  const scrollPadding = useFloatingButtonScrollPadding();
  const [view, reload, guides, interview] = useYourStory();
  const { guide } = useLocalSearchParams<{ guide?: string }>();
  const asked: GuideKey | null = isGuideKey(guide) ? guide : null;
  const scrollRef = useRef<ScrollView>(null);
  const scrolled = useRef(false);
  const go = useStoryGo('page');

  const onGuideLayout = useCallback(
    (key: GuideKey, y: number) => {
      if (key !== asked || scrolled.current) return;
      scrolled.current = true;
      scrollRef.current?.scrollTo({ y: Math.max(0, y - HOME_BAND_GAP), animated: false });
    },
    [asked],
  );

  const ready = view && guides.length > 0;
  const initiallyOpen = ready ? asked ?? currentGuideKey(view, guides) : null;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Your Story' }} />
      <ScrollView ref={scrollRef} contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <View style={styles.leadBox}>
          <Text style={styles.heading}>{view?.heading ?? 'Your Story'}</Text>
          <Text style={styles.lead}>
            The app asks what it needs first, then shows what each tab is for and how to get started with it. Below
            those are the guides, one for each part of your life, and then your paper section by section. Every line
            takes you straight there.
          </Text>
        </View>
        <YourStoryInterview mode="page" interview={interview} onChanged={() => void reload()} go={go} />
        {interview ? <YourStoryTour tour={interview.tour} go={go} /> : null}
        {ready ? (
          <YourStoryGuides
            guides={guides}
            initiallyOpen={initiallyOpen}
            go={go}
            onChanged={() => void reload()}
            onGuideLayout={onGuideLayout}
          />
        ) : null}
        <View style={styles.leadBox}>
          <Text style={styles.heading}>Your paper, section by section</Text>
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
