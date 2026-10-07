// One check-in, one step at a time (D8, 2026-09-30). The Morning Check-In,
// Today's Check-In and a flare, asked in that order on one screen and ending
// on a summary of what was entered. The rules it follows are in
// lib/checkinFlow.ts: every step can be skipped, each saves into the record
// its own form writes as the person moves past it, and the summary says what
// was entered and where it went, nothing more.
//
// Reached from Home's Today's Check-In band. The three forms stay where they
// were, so somebody who answers one question at a time still can.
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BodyMap } from '../components/BodyMap';
import { DailyList } from '../components/DailyList';
import { DailyScalesPicker } from '../components/DailyScalesPicker';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, homeBandStyle } from '../components/HomeSectionBand';
import { NotesInput } from '../components/NotesInput';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import {
  carriedEnergy,
  FLOW_STEPS,
  flareLine,
  nextStep,
  previousStep,
  stepCaption,
  stepIndex,
  summaryRows,
  valenceOfTags,
  type FlowOutcome,
  type FlowStepKey,
} from '../lib/checkinFlow';
import { regionsSentence } from '../lib/bodyMap';
import { getCheckinTagDefinition, getCheckinTagsByCategory } from '../lib/checkinTags';
import { dailyRatingLabel, mergeDailyRatings, noneTodaySentence, ratingsFromSaved } from '../lib/dailyList';
import { getDailyList, saveDailyList } from '../lib/dailyListDb';
import { describeScales, EMPTY_DAILY_SCALES, hasAnyScale, localStamp, scaleOf, type DailyScaleValues } from '../lib/dailyScales';
import { deleteCheckin, getCheckinForDate, recordCheckin } from '../lib/db';
import { morningSummary, SLEEP_QUALITY_WORDS } from '../lib/morningCheckin';
import { getMorningCheckin, saveMorningCheckin } from '../lib/morningCheckinDb';
import { syncReminderNotifications } from '../lib/reminderNotifications';
import { SEVERITY_STEPS, severityStepLabel, stepFromTen } from '../lib/severityScale';
import { VaultClosedBand } from '../components/VaultClosedBand';
import { useOnVaultChange } from '../lib/vaultReads';

const TAB_COLOR = colors.tabBioCompass;
const ENERGY = scaleOf('energy');
const TEN_SCALE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function todayDate(): string {
  return localStamp(new Date()).slice(0, 10);
}

function tagLabel(code: string): string {
  return getCheckinTagDefinition(code)?.label ?? code;
}

// A flare is a something's-wrong report, so only the tags that lean that way.
function negativeTagGroups() {
  return getCheckinTagsByCategory()
    .map((group) => ({ ...group, tags: group.tags.filter((tag) => tag.usualValence === 'negative') }))
    .filter((group) => group.tags.length > 0);
}

export default function DailyCheckinScreen() {
  const router = useRouter();
  const scrollPadding = useFloatingButtonScrollPadding();
  const [step, setStep] = useState<FlowStepKey>('morning');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Morning.
  const [morningId, setMorningId] = useState<string | null>(null);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [morningEnergy, setMorningEnergy] = useState<number | null>(null);
  const [morningNote, setMorningNote] = useState('');

  // Feeling.
  const [dailyList, setDailyList] = useState<string[]>([]);
  const [dailyRatings, setDailyRatings] = useState<Record<string, number>>({});
  const [feelingTags, setFeelingTags] = useState<string[]>([]);
  const [savedTagSeverity, setSavedTagSeverity] = useState<Record<string, number>>({});
  const [feelingScales, setFeelingScales] = useState<DailyScaleValues>(EMPTY_DAILY_SCALES);
  const [feelingTouched, setFeelingTouched] = useState(false);
  // The check-in this flow wrote, so going back and changing it replaces it
  // rather than leaving two.
  const [feelingWrittenId, setFeelingWrittenId] = useState<string | null>(null);

  // Flare.
  const [hadFlare, setHadFlare] = useState<boolean | null>(null);
  const [flareSeverity, setFlareSeverity] = useState<number | null>(null);
  const [flareTen, setFlareTen] = useState<number | null>(null);
  const [flareTags, setFlareTags] = useState<string[]>([]);
  const [flareNote, setFlareNote] = useState('');
  const [flareRegions, setFlareRegions] = useState<string[]>([]);
  const [flareWrittenId, setFlareWrittenId] = useState<string | null>(null);

  const [outcomes, setOutcomes] = useState<{ morning: FlowOutcome; feeling: FlowOutcome; flare: FlowOutcome }>({
    morning: { saved: false },
    feeling: { saved: false },
    flare: { saved: false },
  });

  // Opening the vault reads this morning's answers back in, so a check-in
  // already made is not answered a second time.
  const [vaultReads, setVaultReads] = useState(0);
  useOnVaultChange(() => setVaultReads((n) => n + 1));

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [morning, feeling, list] = await Promise.all([
        getMorningCheckin(),
        getCheckinForDate(todayDate(), 'general'),
        getDailyList(),
      ]);
      if (cancelled) return;
      setMorningId(morning?.id ?? null);
      setSleepQuality(morning?.sleepQuality ?? null);
      setMorningEnergy(morning?.energy ?? null);
      setMorningNote(morning?.notes ?? '');
      const ratings = ratingsFromSaved(list, feeling ?? null);
      setDailyList(list);
      setDailyRatings(ratings);
      setFeelingTags((feeling?.tags ?? []).filter((code) => ratings[code] === undefined));
      setSavedTagSeverity(feeling?.tagSeverity ?? {});
      setFeelingScales(feeling ? { mood: feeling.mood, energy: feeling.energy, stress: feeling.stress } : EMPTY_DAILY_SCALES);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [vaultReads]);

  const morningAnswered = sleepQuality !== null || morningEnergy !== null || morningNote.trim().length > 0;
  const feelingAnswered =
    feelingTouched && (feelingTags.length > 0 || hasAnyScale(feelingScales) || dailyList.some((code) => dailyRatings[code] !== undefined));
  const flareAnswered = hadFlare === true && flareSeverity !== null;

  async function saveMorning() {
    if (!morningAnswered) return;
    await saveMorningCheckin({ existingId: morningId, sleepQuality, energy: morningEnergy, notes: morningNote });
    const saved = await getMorningCheckin();
    setMorningId(saved?.id ?? morningId);
    void syncReminderNotifications();
    const lines = [
      morningSummary({
        sleepQuality,
        energy: morningEnergy,
        energyWord: morningEnergy !== null ? ENERGY.words[morningEnergy - 1] ?? null : null,
      }),
    ];
    if (morningNote.trim()) lines.push(morningNote.trim());
    setOutcomes((current) => ({ ...current, morning: { saved: true, lines } }));
  }

  async function saveFeeling() {
    if (!feelingAnswered) return;
    const pickedSeverity = Object.fromEntries(
      feelingTags.filter((code) => savedTagSeverity[code] !== undefined).map((code) => [code, savedTagSeverity[code]]),
    );
    const merged = mergeDailyRatings(feelingTags, pickedSeverity, dailyList, dailyRatings);
    if (feelingWrittenId) await deleteCheckin(feelingWrittenId);
    const id = await recordCheckin({
      loggedAt: localStamp(new Date()),
      checkinType: 'general',
      valence: valenceOfTags(
        merged.tags.filter((code) => merged.tagSeverity[code] !== 0),
        (code) => getCheckinTagDefinition(code)?.usualValence,
      ),
      tags: merged.tags,
      tagSeverity: merged.tagSeverity,
      ...feelingScales,
    });
    setFeelingWrittenId(id);
    const present = merged.tags.filter((code) => merged.tagSeverity[code] !== 0);
    const lines: string[] = [];
    if (present.length > 0) {
      lines.push(
        present
          .map((code) => (merged.tagSeverity[code] !== undefined ? `${tagLabel(code)} (${dailyRatingLabel(merged.tagSeverity[code])})` : tagLabel(code)))
          .join(', '),
      );
    }
    const none = noneTodaySentence(merged.tags.filter((code) => merged.tagSeverity[code] === 0).map(tagLabel));
    if (none) lines.push(none);
    const scales = describeScales(feelingScales);
    if (scales) lines.push(scales);
    setOutcomes((current) => ({ ...current, feeling: { saved: true, lines } }));
  }

  async function saveFlare() {
    if (flareWrittenId && !flareAnswered) {
      // Changed back to no flare after saving one in this check-in.
      await deleteCheckin(flareWrittenId);
      setFlareWrittenId(null);
      setOutcomes((current) => ({ ...current, flare: { saved: false } }));
      return;
    }
    if (!flareAnswered || flareSeverity === null) return;
    if (flareWrittenId) await deleteCheckin(flareWrittenId);
    const tagSeverity: Record<string, number> = {};
    const id = await recordCheckin({
      loggedAt: localStamp(new Date()),
      checkinType: 'flare',
      valence: 'negative',
      severity: flareSeverity,
      severityTen: flareTen,
      notes: flareNote,
      tags: flareTags,
      tagSeverity,
      bodyRegions: flareRegions,
    });
    setFlareWrittenId(id);
    const lines = [flareLine(severityStepLabel(flareSeverity) ?? 'Flare', flareTen, flareTags.map(tagLabel))];
    if (flareRegions.length > 0) lines.push(`Where: ${regionsSentence(flareRegions)}`);
    if (flareNote.trim()) lines.push(flareNote.trim());
    setOutcomes((current) => ({ ...current, flare: { saved: true, lines } }));
  }

  async function goNext() {
    setSaving(true);
    try {
      if (step === 'morning') {
        await saveMorning();
        setFeelingScales((current) => ({ ...current, energy: carriedEnergy(current.energy, morningEnergy) }));
      } else if (step === 'feeling') {
        await saveFeeling();
      } else if (step === 'flare') {
        await saveFlare();
      }
      setStep(nextStep(step));
    } finally {
      setSaving(false);
    }
  }

  function toggle(list: string[], code: string): string[] {
    return list.includes(code) ? list.filter((c) => c !== code) : [...list, code];
  }

  function renderPills(words: string[], value: number | null, onPick: (next: number | null) => void, numbered: boolean) {
    return (
      <View style={styles.pillRow}>
        {words.map((word, index) => {
          const n = index + 1;
          const active = value === n;
          return (
            <TouchableOpacity
              key={word}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => onPick(active ? null : n)}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{numbered ? `${n} ${word}` : word}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  function renderMorning() {
    return (
      <>
        <Text style={styles.label}>How did you sleep?</Text>
        {renderPills(SLEEP_QUALITY_WORDS, sleepQuality, setSleepQuality, false)}
        <Text style={styles.label}>{ENERGY.question}</Text>
        {renderPills(ENERGY.words, morningEnergy, setMorningEnergy, true)}
        <NotesInput
          style={styles.input}
          placeholder="Anything about the night (optional)"
          placeholderTextColor={colors.textMuted}
          value={morningNote}
          onChangeText={setMorningNote}
          multiline
        />
      </>
    );
  }

  function renderFeeling() {
    return (
      <>
        <DailyList
          list={dailyList}
          ratings={dailyRatings}
          onRate={(code, value) => {
            setFeelingTouched(true);
            setDailyRatings((current) => {
              const next = { ...current };
              if (value === undefined) delete next[code];
              else next[code] = value;
              return next;
            });
          }}
          onListChange={(list) => {
            setDailyList(list);
            void saveDailyList(list);
          }}
          accent={TAB_COLOR}
        />
        <DailyScalesPicker
          values={feelingScales}
          onChange={(next) => {
            setFeelingTouched(true);
            setFeelingScales(next);
          }}
          accent={TAB_COLOR}
        />
        {getCheckinTagsByCategory().map((group) => (
          <View key={group.category} style={styles.tagGroup}>
            <Text style={styles.groupLabel}>{group.label}</Text>
            <View style={styles.pillRow}>
              {group.tags.map((tag) => {
                const active = feelingTags.includes(tag.code);
                return (
                  <TouchableOpacity
                    key={tag.code}
                    style={[styles.pill, active && styles.pillActive]}
                    onPress={() => {
                      setFeelingTouched(true);
                      setFeelingTags((current) => toggle(current, tag.code));
                    }}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{tag.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
        {!feelingTouched && (feelingTags.length > 0 || hasAnyScale(feelingScales)) ? (
          <Text style={styles.caption}>
            This is what you saved earlier today. Change anything to save it again, or go on to leave it as it is.
          </Text>
        ) : null}
      </>
    );
  }

  function renderFlare() {
    return (
      <>
        <View style={styles.pillRow}>
          {[
            { label: 'No', value: false },
            { label: 'Yes', value: true },
          ].map((choice) => {
            const active = hadFlare === choice.value;
            return (
              <TouchableOpacity
                key={choice.label}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setHadFlare(active ? null : choice.value)}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{choice.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {hadFlare ? (
          <>
            <Text style={styles.label}>How severe?</Text>
            <View style={styles.pillRow}>
              {SEVERITY_STEPS.map((option) => {
                const active = flareSeverity === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.pill, active && styles.pillActive]}
                    onPress={() => {
                      setFlareSeverity(option.value);
                      // A number from another step no longer fits the word picked.
                      if (flareTen !== null && stepFromTen(flareTen) !== option.value) setFlareTen(null);
                    }}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.label}>Or on a scale of 0 to 10 (optional)</Text>
            <View style={styles.pillRow}>
              {TEN_SCALE.map((n) => {
                const active = flareTen === n;
                return (
                  <TouchableOpacity
                    key={n}
                    style={[styles.pillSmall, active && styles.pillActive]}
                    onPress={() => {
                      const next = active ? null : n;
                      setFlareTen(next);
                      if (next !== null) setFlareSeverity(stepFromTen(next));
                    }}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{n}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.label}>What was it like? (optional)</Text>
            {negativeTagGroups().map((group) => (
              <View key={group.category} style={styles.tagGroup}>
                <Text style={styles.groupLabel}>{group.label}</Text>
                <View style={styles.pillRow}>
                  {group.tags.map((tag) => {
                    const active = flareTags.includes(tag.code);
                    return (
                      <TouchableOpacity
                        key={tag.code}
                        style={[styles.pill, active && styles.pillActive]}
                        onPress={() => setFlareTags((current) => toggle(current, tag.code))}
                      >
                        <Text style={[styles.pillText, active && styles.pillTextActive]}>{tag.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
            <Text style={styles.label}>Where on the body? (optional)</Text>
            <BodyMap selected={flareRegions} onChange={setFlareRegions} color={TAB_COLOR} />
            <NotesInput
              style={styles.input}
              placeholder="Anything about the flare (optional)"
              placeholderTextColor={colors.textMuted}
              value={flareNote}
              onChangeText={setFlareNote}
              multiline
            />
            <Text style={styles.caption}>
              This saves the flare at the time you finish. For one that started earlier, with the time it started and how bad each
              symptom was, use Signals &gt; Flares.
            </Text>
          </>
        ) : null}
      </>
    );
  }

  function renderSummary() {
    return (
      <>
        {summaryRows(outcomes).map((row) => (
          <View key={row.title} style={styles.summaryRow}>
            <Text style={styles.label}>{row.title}</Text>
            {row.lines.map((line) => (
              <Text key={line} style={styles.body}>
                {line}
              </Text>
            ))}
            {row.where ? <Text style={styles.caption}>{row.where}</Text> : null}
          </View>
        ))}
      </>
    );
  }

  const current = FLOW_STEPS[stepIndex(step)];
  const caption = stepCaption(step);
  const answered = step === 'morning' ? morningAnswered : step === 'feeling' ? feelingAnswered : step === 'flare' ? hadFlare !== null : true;
  const flareIncomplete = step === 'flare' && hadFlare === true && flareSeverity === null;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Check In' }} />
      <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
        <VaultClosedBand color={TAB_COLOR} categories={['symptoms']} />
        <View style={styles.band}>
          {caption ? <Text style={styles.caption}>{caption}</Text> : null}
          <Text style={[styles.title, { color: TAB_COLOR }]}>{current.title}</Text>
          <Text style={styles.body}>{current.question}</Text>
        </View>
        {loaded ? (
          <View style={[styles.band, styles.form]}>
            {step === 'morning' ? renderMorning() : null}
            {step === 'feeling' ? renderFeeling() : null}
            {step === 'flare' ? renderFlare() : null}
            {step === 'summary' ? renderSummary() : null}
          </View>
        ) : (
          <View style={styles.band}>
            <Text style={styles.caption}>Loading…</Text>
          </View>
        )}
        <View style={styles.actions}>
          {step === 'summary' ? (
            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={() => router.back()}>
              <Text style={styles.primaryButtonText}>Done</Text>
            </TouchableOpacity>
          ) : (
            <>
              {step !== 'morning' ? (
                <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => setStep(previousStep(step))}>
                  <Text style={styles.secondaryButtonText}>Back</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[styles.button, styles.primaryButton, (saving || flareIncomplete || !loaded) && styles.buttonDisabled]}
                onPress={() => void goNext()}
                disabled={saving || flareIncomplete || !loaded}
              >
                <Text style={styles.primaryButtonText}>
                  {saving ? 'Saving…' : answered ? (step === 'flare' ? 'Save and See the Summary' : 'Save and Go On') : 'Skip This Step'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { gap: HOME_BAND_GAP },
  band: { ...homeBandStyle, borderColor: TAB_COLOR, padding: HOME_BAND_CONTENT_PADDING, gap: 4 },
  form: { gap: 10 },
  title: { ...typography.sectionTitle, ...textShadow, fontWeight: '400' },
  body: { ...typography.body, ...textShadow, color: colors.textPrimary },
  caption: { ...typography.caption, ...textShadow, color: colors.textMuted },
  label: { ...typography.label, ...textShadow, color: colors.textPrimary },
  groupLabel: { ...typography.eyebrow, ...textShadow, color: colors.textMuted, fontWeight: '400', marginBottom: 6 },
  tagGroup: { marginTop: 4 },
  summaryRow: { gap: 2, marginBottom: 8 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.surfaceMuted,
  },
  pillSmall: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    minWidth: 34,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: colors.surfaceMuted,
  },
  pillActive: { backgroundColor: TAB_COLOR, borderColor: TAB_COLOR },
  pillText: { ...typography.caption, ...textShadow, color: colors.textPrimary },
  pillTextActive: { color: colors.textOnPrimary, textShadowColor: 'transparent', textShadowRadius: 0 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.textPrimary,
    minHeight: 44,
  },
  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: HOME_BAND_CONTENT_PADDING },
  button: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12 },
  primaryButton: { backgroundColor: colors.buttonColor, ...BUTTON_SHADOW },
  primaryButtonText: { ...typography.bodyEmphasis, color: colors.textOnButton, fontWeight: '400', textShadowColor: 'transparent', textShadowRadius: 0 },
  secondaryButton: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  secondaryButtonText: { ...typography.bodyEmphasis, ...textShadow, color: colors.textSecondary, fontWeight: '400' },
  buttonDisabled: { opacity: 0.5 },
});
