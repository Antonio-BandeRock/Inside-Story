// What plant is this (I24, 2026-09-29), above the food search on Garden's
// Add a Planting screen. Folded to one line until opened; open, it offers
// Pl@ntNet and Google Lens, each opened in its own free app on a phone or
// its own site on a computer, and says every time that an app's name for a
// plant is a likely match rather than a certainty. The app that was opened
// is handed back through onOpened so the planting can record it. Why the
// app names nothing itself, and the wording, are in lib/plantIdentify.ts.

import { useState } from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import {
  IDENTIFY_CAUTION,
  IDENTIFY_COMPUTER_INTRO,
  IDENTIFY_INTRO,
  IDENTIFY_SERVICES,
  identifyLinks,
  type IdentifyPlatform,
  type IdentifyService,
  type IdentifyServiceId,
} from '../lib/plantIdentify';
import { makeTabBandStyles } from './TabBand';

const TAB_COLOR = colors.tabGarden;
// 1.0.61.7, extended to every Garden lens in 1.0.61.8: the calm look
// (CalmBands in components/HomeSectionBand.tsx), bands a left-accent width
// apart with no hairlines.
const band = makeTabBandStyles(TAB_COLOR, { calm: true });

const PLATFORM: IdentifyPlatform = Platform.OS === 'android' ? 'android' : Platform.OS === 'ios' ? 'ios' : 'computer';

type Props = {
  /** The app last opened here, shown as the one the planting will name. */
  openedWith: IdentifyServiceId | null;
  onOpened: (id: IdentifyServiceId) => void;
};

export async function openIdentifyService(service: IdentifyService): Promise<boolean> {
  for (const url of identifyLinks(service, PLATFORM)) {
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      // The store app is missing on this phone; the next link is the page.
    }
  }
  return false;
}

export function WhatPlantIsThis({ openedWith, onOpened }: Props) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  async function handleOpen(service: IdentifyService) {
    setFailed(null);
    const opened = await openIdentifyService(service);
    if (opened) onOpened(service.id);
    else setFailed(`${service.name} could not be opened on this device.`);
  }

  return (
    <View style={[band.box, styles.section]}>
      <TouchableOpacity onPress={() => setOpen(!open)} accessibilityRole="button">
        <Text style={styles.linkText}>{open ? 'Hide What Plant Is This' : 'Don’t know the plant? What Plant Is This'}</Text>
      </TouchableOpacity>
      {open ? (
        <View style={styles.nested}>
          <Text style={styles.bodyText}>{PLATFORM === 'computer' ? IDENTIFY_COMPUTER_INTRO : IDENTIFY_INTRO}</Text>
          {IDENTIFY_SERVICES.map((service) => (
            <View key={service.id} style={styles.serviceRow}>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.buttonColor }]}
                onPress={() => handleOpen(service)}
                accessibilityRole="button"
              >
                <Text style={styles.primaryButtonText}>Open {service.name}</Text>
              </TouchableOpacity>
              <Text style={styles.captionText}>{service.note}</Text>
            </View>
          ))}
          {failed ? <Text style={styles.errorText}>{failed}</Text> : null}
          {openedWith ? (
            <Text style={styles.captionText}>
              {`The planting will say it was named with ${IDENTIFY_SERVICES.find((s) => s.id === openedWith)?.name ?? 'that app'}; you can change that before saving.`}
            </Text>
          ) : null}
          <Text style={styles.captionText}>{IDENTIFY_CAUTION}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 6 },
  nested: { gap: 10 },
  serviceRow: { gap: 4 },
  bodyText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  captionText: { ...typography.caption, color: colors.textMuted, ...textShadow },
  primaryButton: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', alignSelf: 'flex-start', ...BUTTON_SHADOW },
  primaryButtonText: {
    color: colors.textOnButton,
    fontWeight: '400',
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  errorText: { color: colors.danger },
  linkText: { ...typography.body, color: colors.primary, ...textShadow },
});
