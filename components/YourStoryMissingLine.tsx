// An empty state that names what it is waiting for, 2026-09-24. Pattern
// Finder, Trends and Reports each have a moment where there is nothing to
// draw yet; this line, placed inside that empty box, says which Your Story
// item fills it, how far along it is, and links to the full page, so an
// empty screen points somewhere instead of just being empty.
//
// It reads the same view the Home card and the Your Story page read, so the
// count here can never disagree with the count there. Once the item is done
// it renders nothing, since the box it sits in has something to show by then.
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { ITEM_BY_KEY, type ItemView, type YourStoryItemKey } from '../lib/yourStory';
import { loadYourStory } from '../lib/yourStoryDb';
import { HOME_BAND_CONTENT_PADDING, homeBandStyle } from './HomeSectionBand';

type Props = {
  itemKey: YourStoryItemKey;
  // Placed inside an existing muted empty box, the line paints that same
  // muted colour. A screen with no empty box of its own (Reports) passes
  // its tab colour instead, and the line becomes a muted band of its own,
  // appearing only when there is something to say.
  standaloneColor?: string;
};

export function YourStoryMissingLine({ itemKey, standaloneColor }: Props) {
  const router = useRouter();
  // undefined while loading; null when the item is not part of this
  // person's story (a part of life they did not choose).
  const [item, setItem] = useState<ItemView | null | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      loadYourStory()
        .then((view) => {
          if (!live) return;
          const found = view.sections.flatMap((section) => section.items).find((entry) => entry.def.key === itemKey);
          setItem(found ?? null);
        })
        .catch((error) => console.warn('loadYourStory failed', error));
      return () => {
        live = false;
      };
    }, [itemKey]),
  );

  if (item === undefined) return null;
  if (item && item.state === 'done') return null;

  // Not in this person's story: still say what the screen needs, without
  // a count, since nothing is counting toward it.
  const sentence = item ? item.sentence : ITEM_BY_KEY[itemKey].todo;
  const note = item ? item.note : null;

  return (
    <View style={standaloneColor ? [styles.standalone, { borderColor: standaloneColor }] : styles.wrap}>
      <Text style={styles.sentence}>{sentence}</Text>
      {note ? <Text style={styles.note}>{note}</Text> : null}
      <TouchableOpacity style={styles.link} onPress={() => router.push('/your-story' as Href)} accessibilityRole="button">
        <Text style={styles.linkText}>Where this fits in Your Story</Text>
        <Ionicons name="arrow-forward" size={13} color={colors.primary} style={textShadow} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4, marginTop: 8, backgroundColor: colors.surfaceMuted },
  standalone: {
    ...homeBandStyle,
    backgroundColor: colors.surfaceMuted,
    paddingVertical: 12,
    paddingHorizontal: HOME_BAND_CONTENT_PADDING,
    gap: 4,
  },
  sentence: { ...typography.body, color: colors.textPrimary, ...textShadow },
  note: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, alignSelf: 'flex-start' },
  linkText: { ...typography.caption, color: colors.primary, ...textShadow },
});
