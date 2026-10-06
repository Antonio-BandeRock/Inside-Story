// The first-launch agreement (X2, 2026-09-29): drawn over the whole app
// until the person has agreed to the wording shown now, and again when
// that wording changes (AGREEMENT_VERSION in lib/agreement.ts). Mounted in
// app/_layout.tsx once the local database is ready, beneath the database
// setup screen, so on a first install it is waiting when that screen
// finishes. It covers the app with a solid background while it reads the
// record, so nothing behind it can be tapped before the answer is known.
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import {
  AGREEMENT_BUTTON,
  AGREEMENT_CHANGED_LINE,
  AGREEMENT_FOOTNOTE,
  AGREEMENT_TITLE,
  agreementReason,
  type AgreementRecord,
} from '../lib/agreement';
import { getAgreement, recordAgreement } from '../lib/agreementDb';
import { AgreementPoints } from './AgreementPoints';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, homeBandStyle } from './HomeSectionBand';

type State = { status: 'reading' } | { status: 'ask'; record: AgreementRecord | null } | { status: 'agreed' };

export function FirstLaunchAgreement() {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<State>({ status: 'reading' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAgreement()
      .then((record) => {
        if (cancelled) return;
        setState(agreementReason(record) ? { status: 'ask', record } : { status: 'agreed' });
      })
      .catch((error: unknown) => {
        // A record that cannot be read is asked for again rather than assumed.
        console.warn('[agreement] could not read the agreement record', error);
        if (!cancelled) setState({ status: 'ask', record: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === 'agreed') return null;
  if (state.status === 'reading') return <View style={styles.cover} />;

  const changed = agreementReason(state.record) === 'changed';

  async function agree() {
    if (saving) return;
    setSaving(true);
    try {
      await recordAgreement();
    } catch (error) {
      // Let the person in; the next launch asks again, since nothing was kept.
      console.warn('[agreement] could not keep the agreement', error);
    }
    setState({ status: 'agreed' });
  }

  return (
    <View style={styles.cover}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + HOME_BAND_GAP, paddingBottom: insets.bottom + HOME_BAND_GAP * 2 }]}
      >
        <View style={styles.titleBand}>
          <Text style={styles.title} accessibilityRole="header">
            {AGREEMENT_TITLE}
          </Text>
          {changed ? <Text style={styles.caption}>{AGREEMENT_CHANGED_LINE}</Text> : null}
        </View>
        <AgreementPoints />
        <View style={styles.titleBand}>
          <TouchableOpacity style={[styles.button, saving && styles.buttonBusy]} onPress={agree} disabled={saving} accessibilityRole="button">
            <Text style={styles.buttonText}>{AGREEMENT_BUTTON}</Text>
          </TouchableOpacity>
          <Text style={styles.caption}>{AGREEMENT_FOOTNOTE}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.background, zIndex: 1000, elevation: 1000 },
  content: { gap: HOME_BAND_GAP },
  titleBand: {
    ...homeBandStyle,
    borderColor: colors.tabProfile,
    padding: HOME_BAND_CONTENT_PADDING,
    gap: 10,
  },
  title: { ...typography.sectionTitle, fontSize: 22, color: colors.tabProfileText, ...textShadow },
  caption: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  button: {
    backgroundColor: colors.tabProfileText,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonBusy: { opacity: 0.6 },
  // Dark text on the filled button: no shadow.
  buttonText: { ...typography.body, color: colors.textOnPrimary, textShadowColor: 'transparent', textShadowRadius: 0 },
});
