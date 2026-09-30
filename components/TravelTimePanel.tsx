// A med's reminders while travelling, inside its Details on Life > My Meds
// (A7): move to local time, or keep home time. The home zone can be set to
// wherever the phone is now. The sentences and the zone arithmetic are in
// lib/travelTime.ts.
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { TRAVEL_LEAD, TRAVEL_MODES, currentZone, isAway, modeLine, zoneName, type TravelMode } from '../lib/travelTime';
import { saveTravelMode, setHomeZoneToHere } from '../lib/travelTimeDb';
import { syncReminderNotifications } from '../lib/reminderNotifications';

type Props = {
  treatmentId: string;
  mode: TravelMode;
  homeZone: string | null;
  tabColor: string;
  onSaved: () => void;
  onProblem: (title: string, message: string) => void;
};

export function TravelTimePanel({ treatmentId, mode, homeZone, tabColor, onSaved, onProblem }: Props) {
  const styles = makeStyles(tabColor);
  const here = currentZone();
  const away = isAway(homeZone, here, Date.now());

  async function choose(next: TravelMode) {
    if (next === mode) return;
    try {
      await saveTravelMode(treatmentId, next);
      void syncReminderNotifications();
      onSaved();
    } catch (error) {
      onProblem('Could not save', error instanceof Error ? error.message : String(error));
    }
  }

  async function makeHome() {
    try {
      await setHomeZoneToHere();
      void syncReminderNotifications();
      onSaved();
    } catch (error) {
      onProblem('Could not save', error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>When you travel</Text>
      <Text style={styles.bodyText}>{modeLine(mode, homeZone)}</Text>
      <View style={styles.chipRow}>
        {TRAVEL_MODES.map((option) => {
          const on = option.mode === mode;
          return (
            <TouchableOpacity
              key={option.mode}
              style={[styles.chip, on && styles.chipOn]}
              onPress={() => void choose(option.mode)}
              accessibilityState={{ selected: on }}
              accessibilityHint={option.detail}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.stepText}>{TRAVEL_LEAD}</Text>
      {homeZone ? (
        <Text style={styles.stepText}>
          {away && here ? `Home time zone: ${zoneName(homeZone)}. This phone is on ${zoneName(here)} time now.` : `Home time zone: ${zoneName(homeZone)}.`}
        </Text>
      ) : null}
      {away && here ? (
        <TouchableOpacity onPress={() => void makeHome()}>
          <Text style={styles.actionText}>{`Make ${zoneName(here)} my home time zone`}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function makeStyles(tabColor: string) {
  return StyleSheet.create({
    actionText: { ...typography.captionEmphasis, color: tabColor, marginTop: 6, ...textShadow },
    bodyText: { ...typography.body, color: tabColor, ...textShadow },
    chip: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: tabColor,
      backgroundColor: colors.surface,
    },
    chipOn: { backgroundColor: tabColor },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6, marginBottom: 4 },
    chipText: { ...typography.caption, color: tabColor, ...textShadow },
    chipTextOn: { color: colors.textOnButton, textShadowColor: 'transparent', textShadowRadius: 0 },
    heading: { ...typography.captionEmphasis, color: tabColor, marginBottom: 4, ...textShadow },
    section: { gap: 2, marginTop: 12 },
    stepText: { ...typography.caption, color: tabColor, ...textShadow },
  });
}
