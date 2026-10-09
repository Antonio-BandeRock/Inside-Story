// Read a Menu (G27, 2026-10-02): on Food > Log or Schedule, above I ate
// this out. A photo of a menu read on the phone (lib/ocr.ts), or text
// typed or pasted, split into dishes and each checked against what the
// person set in Profile. Splitting, matching and every sentence live in
// lib/menuScan.ts; the settings are labelSettingsFor (lib/householdFit.ts),
// the same ones a scanned label is checked with.
import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppTextInput } from './AppTextInput';
import { HOME_BAND_GAP, HomeSectionBand } from './HomeSectionBand';
import { useHouseholdPeople } from './HouseholdFitBand';
import { useInfoAlert } from './InfoAlert';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { announcePhoneOnly } from '../lib/desktop/phoneOnly';
import { routeForDigestEntry } from '../lib/digestNavigation';
import { labelSettingsFor } from '../lib/householdFit';
import {
  checkMenu,
  describeMenuCheck,
  describeMenuReason,
  MENU_BAND_TITLE,
  MENU_CAPTION,
  MENU_DISH_CLEAR_LINE,
  MENU_INTRO,
  MENU_NOTHING_SET_LINE,
  MENU_TEXT_HINT,
} from '../lib/menuScan';
import { recognizeTextFromImage } from '../lib/ocr';
import { flagConditionConcernsForConditions } from '../lib/scannedProductFlags';

export function MenuScanBand() {
  const router = useRouter();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const people = useHouseholdPeople();
  const you = people.find((person) => person.isYou);
  const [open, setOpen] = useState(false);
  const [menuText, setMenuText] = useState('');
  const [reading, setReading] = useState(false);

  const settings = useMemo(
    () => (you ? labelSettingsFor(you, (codes) => (text) => flagConditionConcernsForConditions(text, codes)) : null),
    [you],
  );
  const holdsAnything =
    settings !== null &&
    (settings.conditions.length > 0 ||
      settings.dietTags.length > 0 ||
      settings.allergies.length > 0 ||
      (settings.restrictions ?? []).length > 0);
  const dishes = useMemo(
    () => (settings && menuText.trim() ? checkMenu(menuText, settings) : []),
    [menuText, settings],
  );

  async function readPhoto(from: 'camera' | 'library') {
    if (announcePhoneOnly(showInfoAlert, 'readMenu')) return;
    setReading(true);
    try {
      if (from === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          showInfoAlert('Camera access needed', 'Lifestead needs your camera to read a menu. You can still type or paste what it says.');
          return;
        }
      }
      const shot =
        from === 'camera'
          ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
          : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (shot.canceled || shot.assets.length === 0) return;
      const text = await recognizeTextFromImage(shot.assets[0].uri);
      if (!text) {
        showInfoAlert('Could not read the menu', 'No words came off that photo. Try again closer and flatter, in good light, or type what it says.');
        return;
      }
      // A menu runs over several pages, so a second photo adds to the first.
      setMenuText((current) => (current.trim() ? `${current.trim()}\n\n${text}` : text));
    } catch (error) {
      console.error('[MenuScanBand] Failed to read the photo', error);
      showInfoAlert('Could not read the menu', 'Something went wrong reading that photo. You can type or paste what it says instead.');
    } finally {
      setReading(false);
    }
  }

  return (
    <HomeSectionBand
      kind="fold"
      title={MENU_BAND_TITLE}
      icon="reader-outline"
      color={colors.tabFood}
      expanded={open}
      onToggle={() => setOpen((current) => !current)}
      contentStyle={styles.body}
    >
      <Text style={styles.line}>{MENU_INTRO}</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, reading ? styles.disabled : null]}
          activeOpacity={0.8}
          disabled={reading}
          onPress={() => void readPhoto('camera')}
        >
          <Ionicons name="camera-outline" size={18} color={colors.textOnButton} />
          <Text style={styles.buttonText}>{menuText.trim() ? 'Another Page' : 'Photograph It'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryButton, reading ? styles.disabled : null]}
          activeOpacity={0.8}
          disabled={reading}
          onPress={() => void readPhoto('library')}
        >
          <Ionicons name="images-outline" size={18} color={colors.textPrimary} />
          <Text style={styles.secondaryButtonText}>From a Picture</Text>
        </TouchableOpacity>
      </View>
      {reading ? <ActivityIndicator color={colors.accent} /> : null}
      <AppTextInput
        value={menuText}
        onChangeText={setMenuText}
        style={styles.input}
        multiline
        placeholder="Or type or paste the menu here"
        placeholderTextColor={colors.textMuted}
      />
      <Text style={styles.caption}>{MENU_TEXT_HINT}</Text>
      {menuText.trim() ? (
        <>
          {holdsAnything ? null : <Text style={styles.line}>{MENU_NOTHING_SET_LINE}</Text>}
          <Text style={styles.lead}>{describeMenuCheck(dishes)}</Text>
          {dishes.map((dish, index) => (
            <View key={`${index}|${dish.title}`} style={styles.dish}>
              <View style={styles.dishHead}>
                <Ionicons
                  name={dish.reasons.length > 0 ? 'alert-circle-outline' : 'ellipse-outline'}
                  size={18}
                  color={dish.reasons.length > 0 ? colors.statusYellowOnSurface : colors.textSecondary}
                />
                <Text style={styles.dishTitle}>{dish.title}</Text>
              </View>
              {dish.description ? <Text style={styles.caption}>{dish.description}</Text> : null}
              {dish.reasons.length === 0 ? (
                <Text style={styles.caption}>{MENU_DISH_CLEAR_LINE}</Text>
              ) : (
                dish.reasons.map((reason) => (
                  <TouchableOpacity
                    key={`${reason.kind}|${reason.label}`}
                    disabled={!reason.readingId}
                    activeOpacity={0.7}
                    onPress={() => reason.readingId && router.push(routeForDigestEntry(reason.readingId))}
                    onLongPress={() => showInfoAlert(reason.label, reason.why)}
                  >
                    <Text style={styles.reason}>
                      {describeMenuReason(reason)}
                      {reason.readingId ? <Text style={styles.link}> · Read more</Text> : null}
                    </Text>
                    <Text style={styles.caption}>{reason.why}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          ))}
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8} onPress={() => setMenuText('')}>
            <Ionicons name="close-circle-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.secondaryButtonText}>Clear the Menu</Text>
          </TouchableOpacity>
        </>
      ) : null}
      <Text style={styles.caption}>{MENU_CAPTION}</Text>
      {infoAlertElement}
    </HomeSectionBand>
  );
}

const styles = StyleSheet.create({
  body: { gap: HOME_BAND_GAP },
  line: { ...typography.body, color: colors.textPrimary, ...textShadow },
  lead: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  caption: { ...typography.caption, color: colors.textSecondary, ...textShadow },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.buttonColor,
    ...BUTTON_SHADOW,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  buttonText: { ...typography.bodyEmphasis, color: colors.textOnButton, textShadowColor: 'transparent', textShadowRadius: 0 },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  secondaryButtonText: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  disabled: { opacity: 0.6 },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    minHeight: 120,
    textAlignVertical: 'top',
    backgroundColor: colors.surface,
  },
  dish: { gap: 4, paddingTop: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  dishHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  dishTitle: { ...typography.bodyEmphasis, color: colors.textPrimary, flex: 1, ...textShadow },
  reason: { ...typography.body, color: colors.textPrimary, ...textShadow },
  link: { color: colors.accent },
});
