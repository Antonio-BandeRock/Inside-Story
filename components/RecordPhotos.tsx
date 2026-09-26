// A photo row for any record (1.0.53.7). Direct request: "Documenting
// something in the app through a picture should be a natural step for
// everything."
//
// One compact line, a camera and the count, so a list of plantings or
// kitchen items does not become a wall of thumbnails; a tap opens the
// PhotoStrip for that record, and `children` goes under it (a planting's
// Photo Series band). The count is read on focus, so a photo taken in the
// app's camera shows in the count on coming back.
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import type { MediaOwnerKind } from '../lib/media';
import { countMediaFor } from '../lib/mediaDb';
import { PhotoStrip } from './PhotoStrip';

export function RecordPhotos({
  ownerKind,
  ownerId,
  tabColor,
  title,
  children,
}: {
  ownerKind: MediaOwnerKind;
  ownerId: string;
  tabColor: string;
  /** What the photos are of, for the camera's heading. */
  title?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      countMediaFor(ownerKind, ownerId)
        .then((n) => {
          if (!cancelled) setCount(n);
        })
        .catch(() => undefined);
      return () => {
        cancelled = true;
      };
    }, [ownerKind, ownerId]),
  );

  const label = count === null || count === 0 ? 'Photos' : `Photos (${count})`;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.row}
        onPress={() => setOpen((value) => !value)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Ionicons name="camera-outline" size={16} color={tabColor} />
        <Text style={[styles.label, { color: tabColor }]}>{label}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={tabColor} />
      </TouchableOpacity>
      {open ? (
        <View style={styles.body}>
          <PhotoStrip ownerKind={ownerKind} ownerId={ownerId} tabColor={tabColor} title={title} />
          {children}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  label: { ...typography.caption, textShadowColor: 'transparent', textShadowRadius: 0 },
  body: { gap: 8 },
});
