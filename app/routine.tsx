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
// Three answers, not one. Done moves on. Skip moves on and records nothing,
// because a skipped step is the person saying they did not do that one.
// Back exists because people press the wrong thing.
//
// What gets written, and when. 2026-09-17, direct correction: "While they
// are walking through a routine, they are also checking off things that they
// need to do while running the routine. Did I do it is the user selecting to
// check the item off as they are doing it." So a step carrying a check shows
// that check on the card, and ticking it writes the mark then and there.
// Pressing Done writes it too, for anyone who treats Done as the tick.
//
// This screen used to gather the whole walk up and write it at the end,
// reasoning that half a routine is not a routine. That is still true of the
// routine's finished stamp, which is why it is still written last. It was
// never true of the checks: somebody who takes their pill at step two and
// then answers the door has taken their pill, and deserves to be told so at
// eleven o'clock. The one thing that stays unwritten on an abandoned walk is
// the claim that the whole routine was done.
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import {
  formatMarkClock,
  routineOccasionLabel,
  routineProgressLabel,
  type CustomOccasion,
  type DoneCheck,
  type Routine,
} from '../lib/routines';
import {
  completeRoutine,
  getDoneChecks,
  getRoutine,
  getRoutineOccasions,
  markDoneCheck,
  undoLastCheckMark,
} from '../lib/routinesDb';

export default function RoutineWalkScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const routineId = typeof params.id === 'string' ? params.id : null;
  const router = useRouter();
  const scrollPadding = useFloatingButtonScrollPadding();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [checks, setChecks] = useState<DoneCheck[]>([]);
  const [occasions, setOccasions] = useState<CustomOccasion[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [skipped, setSkipped] = useState<string[]>([]);
  // Which steps this walk has already written a mark for, and at what time,
  // keyed by step rather than by check so that two steps pointing at one
  // check stay two separate acts. Also the thing that keeps a second press
  // from writing a second mark for one act.
  const [ticked, setTicked] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);

  const load = useCallback(async () => {
    if (!routineId) {
      setLoading(false);
      return;
    }
    const [found, allChecks, allOccasions] = await Promise.all([
      getRoutine(routineId),
      getDoneChecks(true),
      getRoutineOccasions(),
    ]);
    setRoutine(found);
    setChecks(allChecks);
    setOccasions(allOccasions);
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
  const tickedAt = step ? ticked[step.id] ?? null : null;

  // What the finished card lists: what was actually written during this
  // walk, in the order the steps come, and nothing more.
  const recorded = useMemo(() => {
    const lines: { name: string; at: string }[] = [];
    for (const entry of steps) {
      const at = ticked[entry.id];
      if (!at || !entry.checkId) continue;
      const name = checks.find((check) => check.id === entry.checkId)?.name;
      if (name) lines.push({ name, at });
    }
    return lines;
  }, [checks, steps, ticked]);

  /** The tick itself, which is the person saying they have just done this
   *  one. Tapping again takes it back, since the likeliest mistake on a
   *  screen with one big target is hitting it by accident. */
  async function toggleTick() {
    if (!step?.checkId || !routine) return;
    const stepId = step.id;
    const checkId = step.checkId;
    if (ticked[stepId]) {
      await undoLastCheckMark(checkId);
      setTicked((current) => {
        const next = { ...current };
        delete next[stepId];
        return next;
      });
      return;
    }
    const markedAt = new Date().toISOString();
    await markDoneCheck(checkId, 'routine', routine.id, markedAt);
    setTicked((current) => ({ ...current, [stepId]: markedAt }));
    setSkipped((current) => current.filter((id) => id !== stepId));
  }

  async function advance(skipThisOne: boolean) {
    if (!step || !routine) return;
    const stepId = step.id;
    const checkId = step.checkId;
    if (skipThisOne) {
      // Skipping a step already ticked this walk is two opposite claims
      // about one act, and the later one is what the person means now.
      if (checkId && ticked[stepId]) {
        await undoLastCheckMark(checkId);
        setTicked((current) => {
          const next = { ...current };
          delete next[stepId];
          return next;
        });
      }
      setSkipped((current) => (current.includes(stepId) ? current : [...current, stepId]));
    } else if (checkId && !ticked[stepId]) {
      // Done counts as the tick, for anyone who never taps the row itself.
      const markedAt = new Date().toISOString();
      await markDoneCheck(checkId, 'routine', routine.id, markedAt);
      setTicked((current) => ({ ...current, [stepId]: markedAt }));
    }
    if (index + 1 < steps.length) {
      setIndex(index + 1);
      return;
    }
    await completeRoutine(routine.id);
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
                <TouchableOpacity
                  style={[styles.tickRow, tickedAt ? styles.tickRowOn : null]}
                  onPress={toggleTick}
                >
                  <Ionicons
                    name={tickedAt ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={tickedAt ? colors.accent : colors.textSecondary}
                  />
                  <View style={styles.tickTextColumn}>
                    <Text style={[styles.tickText, tickedAt ? styles.tickTextOn : null]}>
                      {tickedAt ? checkName : `Check off: ${checkName}`}
                    </Text>
                    <Text style={styles.tickHint}>
                      {tickedAt
                        ? `Checked off at ${formatMarkClock(new Date(tickedAt))}. Tap to take that back.`
                        : 'Tap it as you do it, and Did I Do It can answer for you later.'}
                    </Text>
                  </View>
                </TouchableOpacity>
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
              <Text style={styles.stopButtonText}>
                {recorded.length > 0
                  ? 'Stop here. What you checked off stays checked off.'
                  : 'Stop here. Nothing has been checked off yet.'}
              </Text>
            </TouchableOpacity>

            <View style={styles.footCard}>
              <Text style={styles.footText}>
                {routineOccasionLabel(routine.occasion, occasions)}. Anything you check off is written down
                the moment you tap it. The routine itself only counts as done once you reach the last step.
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
                <Text style={styles.cardTitle}>Checked off along the way</Text>
                {recorded.map((line) => (
                  <View key={`${line.name}_${line.at}`} style={styles.recordedRow}>
                    <Ionicons name="checkmark-done-outline" size={16} color={colors.accent} />
                    <Text style={styles.bodyText}>
                      {line.name}, {formatMarkClock(new Date(line.at))}
                    </Text>
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
  // A target, not a label. This used to be a line of text saying what would
  // be recorded for you at the end. It is now the thing you press to record
  // it, which is what the person asked for and what the act actually is.
  tickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  tickRowOn: { borderColor: colors.accent },
  tickTextColumn: { flex: 1, gap: 2 },
  tickText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  tickTextOn: { color: colors.accent },
  tickHint: { ...typography.caption, color: colors.textMuted, ...textShadow },
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
