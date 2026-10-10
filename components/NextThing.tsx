// One next thing, C16 and C18 of the competitive build plan (Phase 2,
// 2026-09-26), and the start of Simple View. One sentence and one button,
// never a list. After a gap of a few days with nothing recorded it is the
// welcome-back line (lib/welcomeBack.ts), which asks for nothing about the
// days in between; otherwise it is the first Your Story item not done yet,
// with the button going straight to where it is done. With neither, the
// card says Your Story is up to date and offers Capture.
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { welcomeBackFor, type WelcomeBack } from '../lib/welcomeBack';
import { latestRecordMs } from '../lib/welcomeBackDb';
import type { StoryDestination, YourStoryView } from '../lib/yourStory';

type Props = {
  view: YourStoryView | null;
  tabColor: string;
  /** Opens a Your Story destination the way the Your Story card does. */
  onGo: (destination: StoryDestination) => void;
};

export function NextThing({ view, tabColor, onGo }: Props) {
  const router = useRouter();
  const [welcome, setWelcome] = useState<WelcomeBack | null>(null);
  const [notNow, setNotNow] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      void latestRecordMs().then((latest) => {
        if (live) setWelcome(welcomeBackFor(latest, Date.now()));
      });
      return () => {
        live = false;
      };
    }, []),
  );

  let sentence: string;
  let action: string;
  let go: () => void;
  if (welcome && !notNow) {
    sentence = welcome.sentence;
    action = welcome.action;
    go = () => router.push('/capture' as Href);
  } else if (view?.nextItem && view.nextItem.def.kind !== 'waiting') {
    const item = view.nextItem;
    sentence = item.sentence;
    action = 'Take me there';
    go = () => onGo(item.def.destination);
  } else {
    sentence = 'Your Guide has nothing waiting to be set up. Anything on your mind can go in Capture.';
    action = 'Open Capture';
    go = () => router.push('/capture' as Href);
  }

  return (
    <View style={styles.body}>
      <Text style={styles.sentence}>{sentence}</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.button, { borderColor: tabColor }]} activeOpacity={0.8} onPress={go}>
          <Ionicons name="arrow-forward-circle-outline" size={18} color={tabColor} />
          <Text style={[styles.buttonText, { color: tabColor }]}>{action}</Text>
        </TouchableOpacity>
        {welcome && !notNow ? (
          <TouchableOpacity onPress={() => setNotNow(true)} hitSlop={8}>
            <Text style={styles.quiet}>Not now</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: 10 },
  sentence: { ...typography.body, ...textShadow, color: colors.textPrimary },
  buttonRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 14 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  buttonText: { ...typography.bodyEmphasis, textShadowColor: 'transparent', textShadowRadius: 0 },
  quiet: { ...typography.caption, ...textShadow, color: colors.textSecondary },
});
