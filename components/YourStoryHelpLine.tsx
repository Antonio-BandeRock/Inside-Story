// "Where this fits in Your Story", 2026-09-24: the last section of every
// tab's help sheet. One sentence from lib/yourStory.ts saying which section
// of the person's paper this tab holds, plus the next thing to set up here
// when there is one, and a way to the full page.
//
// Reading text, rendered inside HelpSheet's scroll, so it scales with the
// phone's font size like the rest of the sheet.
import { useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { tabStoryLine, type YourStoryView } from '../lib/yourStory';
import { loadYourStory } from '../lib/yourStoryDb';

export const YOUR_STORY_HELP_HEADING = 'Where this fits in Your Story';

type Props = {
  tabPath: string | null | undefined;
  // Called before leaving for the full page, so the sheet closes behind it.
  onOpenYourStory?: () => void;
};

export function YourStoryHelpLine({ tabPath, onOpenYourStory }: Props) {
  const router = useRouter();
  const [view, setView] = useState<YourStoryView | null>(null);

  useEffect(() => {
    let live = true;
    loadYourStory()
      .then((next) => {
        if (live) setView(next);
      })
      .catch((error) => console.warn('loadYourStory failed', error));
    return () => {
      live = false;
    };
  }, [tabPath]);

  const line = tabStoryLine(tabPath, view);
  if (!line) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{YOUR_STORY_HELP_HEADING}</Text>
      <Text style={styles.body}>{line}</Text>
      <TouchableOpacity
        onPress={() => {
          onOpenYourStory?.();
          router.push('/your-story' as Href);
        }}
        accessibilityRole="button"
        style={styles.link}
      >
        <Text style={styles.linkText}>Open Your Story</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 16, gap: 4 },
  heading: { ...typography.label, color: colors.primary, ...textShadow },
  body: { ...typography.body, color: colors.textPrimary, lineHeight: 20, ...textShadow },
  link: { paddingVertical: 4, alignSelf: 'flex-start' },
  linkText: { ...typography.body, color: colors.primary, ...textShadow },
});
