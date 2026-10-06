// What This App Is and Is Not (X2, 2026-09-29): the first-launch
// agreement, readable again from Profile, with the day it was agreed to.
// Nothing here writes; agreeing happens once, on components/FirstLaunchAgreement.tsx.
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AgreementPoints } from '../components/AgreementPoints';
import { CalmBands, HOME_BAND_ACCENT_WIDTH, HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, homeBandNoHairlines, homeBandStyle } from '../components/HomeSectionBand';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { agreedLine, type AgreementRecord } from '../lib/agreement';
import { getAgreement } from '../lib/agreementDb';

export default function AgreementScreen() {
  const scrollPadding = useFloatingButtonScrollPadding();
  const [record, setRecord] = useState<AgreementRecord | null | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getAgreement()
        .catch(() => null)
        .then((found) => {
          if (!cancelled) setRecord(found);
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return (
    <CalmBands>
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
          {record !== undefined ? (
            <View style={styles.card}>
              <Text style={styles.caption}>{agreedLine(record)}</Text>
            </View>
          ) : null}
          <AgreementPoints />
        </ScrollView>
      </View>
    </CalmBands>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { gap: HOME_BAND_ACCENT_WIDTH, paddingTop: HOME_BAND_GAP },
  card: {
    ...homeBandStyle,
    ...homeBandNoHairlines,
    borderColor: colors.tabProfile,
    padding: HOME_BAND_CONTENT_PADDING,
  },
  caption: { ...typography.caption, color: colors.textSecondary, ...textShadow },
});
