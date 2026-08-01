import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';

type OrbLevel = 'none' | 'calm' | 'mild' | 'moderate' | 'active';

const ORB_STYLES: Record<OrbLevel, { colors: [string, string]; label: string }> = {
  none: { colors: [colors.surfaceMuted, colors.border], label: 'Nothing logged yet' },
  calm: { colors: [colors.primaryTint, colors.primary], label: 'Calm' },
  mild: { colors: [colors.accentTint, colors.accent], label: 'Mild' },
  moderate: { colors: [colors.accent, colors.accentDark], label: 'Moderate' },
  active: { colors: [colors.danger, '#7A2626'], label: 'Active flare' },
};

function resolveOrbLevel(recentMaxSeverity: number | null, hasAnyHistory: boolean): OrbLevel {
  if (recentMaxSeverity != null) {
    if (recentMaxSeverity <= 1) return 'mild';
    if (recentMaxSeverity <= 2) return 'moderate';
    return 'active';
  }
  return hasAnyHistory ? 'calm' : 'none';
}

// A soft gradient "orb" standing in for a symptom list -- color alone
// carries most of the signal (cool/green = quiet, warm/red = an active
// flare), reflecting the most severe Flare/Food Reaction logged in the
// last 2 days. Deliberately distinguishes "nothing logged recently, but
// there IS history" (calm -- a real, earned reading) from "nothing has
// ever been logged" (a flat neutral gray -- there's no data to read yet,
// which is not the same thing as things being fine).
export function EnergyOrb({
  recentMaxSeverity,
  hasAnyHistory,
  onPress,
  // Optional override for the label/caption text color -- 2026-07-27, so
  // Home's own orbCard can tint them to match its border (Signals'
  // identity color) like every other font inside that box. Safe to
  // override: the actual mood/severity signal lives entirely in the orb's
  // own gradient (ORB_STYLES above), never in this text's color, so
  // recoloring it doesn't touch that semantic meaning. Defaults to the
  // plain neutral this always used, for any other caller.
  textColor,
}: {
  recentMaxSeverity: number | null;
  hasAnyHistory: boolean;
  onPress: () => void;
  textColor?: string;
}) {
  const level = resolveOrbLevel(recentMaxSeverity, hasAnyHistory);
  const style = ORB_STYLES[level];

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={style.colors}
        start={{ x: 0.3, y: 0.2 }}
        end={{ x: 1, y: 1 }}
        style={styles.orb}
      />
      <Text style={[styles.label, textColor ? { color: textColor } : null]}>{style.label}</Text>
      <Text style={[styles.caption, textColor ? { color: textColor } : null]}>Based on your last 2 days in Signals</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  orb: {
    width: 108,
    height: 108,
    borderRadius: 54,
  },
  label: { ...typography.sectionTitle, ...textShadow, color: colors.textPrimary, marginTop: 10 },
  caption: { ...typography.caption, ...textShadow, color: colors.textSecondary, marginTop: 2 },
});
