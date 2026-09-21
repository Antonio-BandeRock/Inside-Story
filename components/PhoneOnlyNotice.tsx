// The band a phone-only lens or screen shows on the desktop build in place
// of the thing it cannot do, 2026-09-21. Direct instruction: "the Windows
// version needs to let the user know when anything their computer can't do
// is selected." So when one is selected, this says so twice: an info
// alert the moment it opens, which is the telling, and this band, which
// stays behind once the alert is dismissed so the screen never reads as
// empty or broken. The wording is lib/desktop/phoneOnly.ts's, one entry
// per feature; a button whose action is phone-only uses announcePhoneOnly
// from the same file rather than this band.
//
// Renders in the tab's colour through makeTabBandStyles like every other
// band, and takes an `action` (a way back, or the half of the feature that
// does work on a computer) plus `children` for anything else the screen
// still offers here.
import { useEffect, useMemo, type ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { phoneOnlyNotice, type PhoneOnlyFeature } from '../lib/desktop/phoneOnly';
import { useInfoAlert } from './InfoAlert';
import { makeTabBandStyles } from './TabBand';

export function PhoneOnlyNotice({
  feature,
  color,
  action,
  children,
}: {
  feature: PhoneOnlyFeature;
  /** The tab's colour, for the band's accent and edge. */
  color: string;
  action?: { label: string; onPress: () => void };
  children?: ReactNode;
}) {
  const notice = phoneOnlyNotice(feature);
  const band = useMemo(() => makeTabBandStyles(color), [color]);
  const [showInfoAlert, infoAlertElement] = useInfoAlert();

  // Once, when the phone-only thing is selected. A change of feature while
  // mounted (the pairing screen switching modes) announces the new one.
  useEffect(() => {
    showInfoAlert(notice.title, notice.message);
  }, [feature, notice.title, notice.message, showInfoAlert]);

  return (
    <View style={band.box}>
      <Text style={styles.title}>{notice.title}</Text>
      <Text style={styles.message}>{notice.message}</Text>
      {action ? (
        <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={action.onPress}>
          <Text style={[styles.buttonText, { color }]}>{action.label}</Text>
        </TouchableOpacity>
      ) : null}
      {children}
      {infoAlertElement}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.sectionTitle, color: colors.textPrimary, marginBottom: 8, ...textShadow },
  message: { ...typography.body, color: colors.textSecondary, ...textShadow },
  button: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: { ...typography.body, ...textShadow },
});
