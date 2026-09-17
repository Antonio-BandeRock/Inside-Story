// Walking a routine, one step at a time. 2026-09-17, direct instruction:
// "Build the step-by-step routines and the 'did I already do it' record."
//
// The whole screen is one step. That is the feature. A checklist of nine
// things is a thing to be scanned, re-scanned and lost your place in, and
// keeping your place is the exact difficulty the routine exists to take
// away, so showing all nine would hand the problem straight back. What is on
// screen is the thing to do now, said in the person's own words, at a size
// that can be read from across the room with both hands full.
//
// Three answers, not one. Done moves on. Skip moves on and remembers that it
// was skipped, because a skipped step must not write a "did it" mark later.
// Back exists because people press the wrong thing.
//
// Nothing is saved until the walk ends. Half a routine is not a routine, and
// a record saying somebody did their morning at 7:03 when they got two steps
// in and answered the door would be worse than no record. The one exception
// is leaving early on purpose: Stop here saves nothing and says so.
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import {
  routineOccasionLabel,
  routineProgressLabel,
  type DoneCheck,
  type Routine,
} from '../lib/routines';
import { completeRoutine, getDoneChecks, getRoutine } from '../lib/routinesDb';

export default function RoutineWalkScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const routineId = typeof params.id === 'string' ? params.id : null;
  const router = useRouter();
  const scrollPadding = useFloatingButtonScrollPadding();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [checks, setChecks] = useState<DoneCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);

  const load = useCallback(async () => {
    if (!routineId) {
      setLoading(false);
      return;
    }
    const [found, allChecks] = await Promise.all([getRoutine(routineId), getDoneChecks(true)]);
    setRoutine(found);
    setChecks(allChecks);
    setLoading(false);
  }, [routineId]);

  useEffect(() => {
    load();
  }, [load]);

  // Held in a memo rather than read straight off the routine, so the two
  // lists below do not rebuild on every keystroke of an unrelated render.
  const steps = useMemo(() => routine?.steps ?? [], [routine]);
  const step = steps[index] ?? null;
  const checkName = useMemo(() => {
    if (!step?.checkId) return null;
    return checks.find((entry) => entry.id === step.checkId)?.name ?? null;
  }, [checks, step]);

  // What the finished card lists. Worked out from the steps that were not
  // skipped, so it says exactly what was written and nothing more.
  const recorded = useMemo(() => {
    const names: string[] = [];
    for (const entry of steps) {
      if (!entry.checkId || skipped.includes(entry.id)) continue;
      const name = checks.find((check) => check.id === entry.checkId)?.name;
      if (name && !names.includes(name)) names.push(name);
    }
    return names;
  }, [checks, skipped, steps]);

  async function advance(skipThisOne: boolean) {
    if (!step || !routine) return;
    const nextSkipped = skipThisOne ? [...skipped, step.id] : skipped;
    setSkipped(nextSkipped);
    if (index + 1 < steps.length) {
      setIndex(index + 1);
      return;
    }
    await completeRoutine(routine.id, nextSkipped);
    setFinished(true);
  }

  const title = routine?.name ?? 'Routine';

  return (
    <>
      <Stack.Screen options={{ title }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}
      >
        {loading ? (
          <View style={styles.card}>
            <Text style={styles.bodyText}>Opening the routine.</Text>
          </View>
        ) : null}

        {!loading && !routine ? (
          <View style={styles.card}>
            <Text style={styles.bodyText}>
              That routine is not here any more. It may have been deleted from Life, Routines.
            </Text>
          </View>
        ) : null}

        {!loading && routine && steps.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{routine.name}</Text>
            <Text style={styles.bodyText}>
              This routine has no steps yet. Add them in Life, Routines and it becomes walkable.
            </Text>
          </View>
        ) : null}

        {!loading && routine && steps.length > 0 && !finished && step ? (
          <>
            <View style={styles.progressCard}>
              <Text style={styles.progressText}>{routineProgressLabel(index, steps.length)}</Text>
              <View style={styles.pipRow}>
                {steps.map((entry, position) => (
                  <View
                    key={entry.id}
                    style={[
                      styles.pip,
                      position < index ? styles.pipDone : null,
                      position === index ? styles.pipNow : null,
                      skipped.includes(entry.id) ? styles.pipSkipped : null,
                    ]}
                  />
                ))}
              </View>
            </View>

            <View style={styles.stepCard}>
              <Text style={styles.stepText}>{step.text}</Text>
              {step.detail ? <Text style={styles.stepDetail}>{step.detail}</Text> : null}
              {checkName ? (
                <View style={styles.alsoRow}>
                  <Ionicons name="checkmark-done-outline" size={15} color={colors.accent} />
                  <Text style={styles.alsoText}>Also records: {checkName}</Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={() => advance(false)}>
              <Ionicons
                name={index + 1 < steps.length ? 'arrow-forward' : 'checkmark'}
                size={18}
                color={colors.background}
              />
              <Text style={styles.primaryButtonText}>
                {index + 1 < steps.length ? 'Done, next' : 'Done, finish'}
              </Text>
            </TouchableOpacity>

            <View style={styles.minorRow}>
              <TouchableOpacity
                style={[styles.minorButton, index === 0 ? styles.minorButtonOff : null]}
                disabled={index === 0}
                onPress={() => setIndex(Math.max(0, index - 1))}
              >
                <Ionicons name="arrow-back" size={16} color={colors.textSecondary} />
                <Text style={styles.minorButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.minorButton} onPress={() => advance(true)}>
                <Ionicons name="play-skip-forward-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.minorButtonText}>Skip this one</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.stopButton} onPress={() => router.back()}>
              <Text style={styles.stopButtonText}>Stop here. Nothing gets recorded.</Text>
            </TouchableOpacity>

            <View style={styles.footCard}>
              <Text style={styles.footText}>
                {routineOccasionLabel(routine.occasion)}. Nothing is written down until the last step, so
                stopping part way leaves no record of a half done routine.
              </Text>
            </View>
          </>
        ) : null}

        {finished && routine ? (
          <>
            <View style={styles.doneCard}>
              <Ionicons name="checkmark-circle" size={30} color={colors.accent} />
              <Text style={styles.doneTitle}>{routine.name} finished.</Text>
              {skipped.length > 0 ? (
                <Text style={styles.bodyText}>
                  {skipped.length === 1 ? 'One step was skipped' : `${skipped.length} steps were skipped`}, and
                  nothing was recorded for those.
                </Text>
              ) : null}
            </View>

            {recorded.length > 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Recorded for you</Text>
                {recorded.map((name) => (
                  <View key={name} style={styles.recordedRow}>
                    <Ionicons name="checkmark-done-outline" size={16} color={colors.accent} />
                    <Text style={styles.bodyText}>{name}</Text>
                  </View>
                ))}
                <Text style={styles.footText}>
                  Ask again later in Life, Did I Do It, and the answer will be there.
                </Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
              <Text style={styles.primaryButtonText}>Close</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 12 },
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 8,
  },
  cardTitle: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  bodyText: { ...typography.body, color: colors.textSecondary, ...textShadow },
  progressCard: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 8,
  },
  progressText: { ...typography.caption, color: colors.textMuted, ...textShadow },
  pipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  pip: { height: 6, flexGrow: 1, flexBasis: 12, borderRadius: 3, backgroundColor: colors.border },
  pipDone: { backgroundColor: colors.accent },
  pipNow: { backgroundColor: colors.primary },
  pipSkipped: { backgroundColor: colors.textMuted },
  // The one card the screen exists for. Deliberately taller and quieter than
  // everything around it: nothing else on screen competes for the eye.
  stepCard: {
    padding: 20,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    gap: 10,
    minHeight: 150,
    justifyContent: 'center',
  },
  stepText: { ...typography.screenTitle, color: colors.textPrimary, ...textShadow },
  stepDetail: { ...typography.body, color: colors.textSecondary, ...textShadow },
  alsoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  alsoText: { ...typography.caption, color: colors.accent, ...textShadow },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  primaryButtonText: { ...typography.bodyEmphasis, color: colors.background },
  minorRow: { flexDirection: 'row', gap: 10 },
  minorButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  minorButtonOff: { opacity: 0.4 },
  minorButtonText: { ...typography.body, color: colors.textSecondary },
  stopButton: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  stopButtonText: { ...typography.caption, color: colors.textMuted },
  footCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  footText: { ...typography.caption, color: colors.textMuted, ...textShadow },
  doneCard: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: 10,
  },
  doneTitle: { ...typography.sectionTitle, color: colors.textPrimary, textAlign: 'center', ...textShadow },
  recordedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
