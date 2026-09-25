// Back to Your Story (1.0.51.9): the one button that takes somebody back to
// where a guide step or the Home card sent them from. Mounted once at the
// app root (app/_layout.tsx) and rendering nothing unless lib/storyReturn.ts
// holds a way back and the person is somewhere else, so every tab and screen
// at rest looks exactly as it did.
//
// Top right, under the status bar, because the bottom of every screen
// already belongs to TabHub, the lens corner and the corner box that says
// where you are. On a screen with a header it sits in the header's right
// slot, which none of the screens a guide opens uses.
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import {
  STORY_RETURN_CLOSE_LABEL,
  STORY_RETURN_LABEL,
  getStoryReturn,
  setStoryReturn,
  storyReturnOnPath,
  storyReturnTarget,
  subscribeStoryReturn,
  type StoryReturn,
} from '../lib/storyReturn';
import { useStoryWalk } from './StoryWalkHost';

function useStoryReturn(): [StoryReturn | null, (next: StoryReturn | null) => void] {
  const [value, setValue] = useState<StoryReturn | null>(getStoryReturn);
  useEffect(() => {
    setValue(getStoryReturn());
    return subscribeStoryReturn(setValue);
  }, []);
  return [value, setStoryReturn];
}

export function StoryReturnHost() {
  const [value, setValue] = useStoryReturn();
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // A walk under way carries its own way back on its strip.
  const walking = useStoryWalk() !== null;
  const { show, next } = storyReturnOnPath(value, pathname);

  useEffect(() => {
    if (next !== value) setValue(next);
  }, [next, value, setValue]);

  if (!show || !value || walking) return null;

  const goBack = () => {
    const target = storyReturnTarget(value.origin);
    router.navigate({ pathname: target.pathname, params: target.params } as Href);
  };

  return (
    <View pointerEvents="box-none" style={[styles.anchor, { top: insets.top + 8 }]}>
      <View style={styles.pill}>
        <TouchableOpacity
          style={styles.back}
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel={STORY_RETURN_LABEL}
        >
          <Ionicons name="arrow-back" size={16} color={colors.textOnButton} />
          <Text style={styles.label}>{STORY_RETURN_LABEL}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.close}
          onPress={() => setValue(null)}
          accessibilityRole="button"
          accessibilityLabel={STORY_RETURN_CLOSE_LABEL}
          hitSlop={8}
        >
          <Ionicons name="close" size={16} color={colors.textOnButton} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: { position: 'absolute', right: 12 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: colors.buttonColor,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingLeft: 14, paddingRight: 8 },
  label: { ...typography.body, color: colors.textOnButton, textShadowColor: 'transparent', textShadowRadius: 0 },
  close: { paddingVertical: 8, paddingLeft: 4, paddingRight: 12 },
});
