import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { CalmBands, HOME_BAND_ACCENT_WIDTH, HOME_BAND_CONTENT_PADDING, homeBandNoHairlines, homeBandStyle } from '../components/HomeSectionBand';
import {
  AssessmentDomain,
  AssessmentItem,
  AssessmentResponseType,
  getAssessmentDomains,
  getAssessmentItems,
  getChosenQuestionnaires,
  getUserConditions,
  getSymptomAssessmentTrend,
  recordSymptomAssessment,
  setChosenQuestionnaires,
} from '../lib/db';
import {
  AssessmentComparison,
  AssessmentResponseValue,
  AssessmentScores,
  compareAssessmentScores,
  scoreAssessment,
} from '../lib/symptomAssessment';
import {
  bandNote,
  choicesFor,
  hasAnswers,
  HELPLINE_LABEL,
  HELPLINE_URL,
  lastTimeLine,
  needsSafetyLine,
  parseChosen,
  questionnaire,
  QUESTIONNAIRES,
  QUESTIONNAIRES_INTRO,
  SAFETY_LINE,
  scoreLine,
  scoreQuestionnaire,
  serializeChosen,
  type QuestionnaireCode,
} from '../lib/standardQuestionnaires';

type QuestionnaireResult = {
  code: QuestionnaireCode;
  answers: AssessmentResponseValue[];
  previous: { score: number | null; on: string } | null;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// Original response-scale labels (not the licensed WHO-5/ThyPRO wording --
// see the reference DB's assessment_domains.citation for what these are
// modeled on).
const SEVERITY_LABELS = ['Not at all', 'Mild', 'Moderate', 'Severe', 'Very severe'];
const WELLBEING_LABELS = ['Never', 'Rarely', 'Sometimes', 'Often', 'Very often', 'Always'];
// The IPSS answer scale, wording taken from the validated instrument
// itself rather than paraphrased. The nocturia item reads as a count in
// the original; 'Almost always' still maps to the same 5, and the item's
// own prompt already asks 'how many times', so the scale stays honest.
const IPSS_LABELS = [
  'Not at all',
  'Less than 1 time in 5',
  'Less than half the time',
  'About half the time',
  'More than half the time',
  'Almost always',
];

function optionsForResponseType(type: AssessmentResponseType): { value: number; label: string }[] {
  switch (type) {
    case 'severity_0_4':
      return SEVERITY_LABELS.map((label, i) => ({ value: i, label }));
    case 'wellbeing_0_5':
      return WELLBEING_LABELS.map((label, i) => ({ value: i, label }));
    case 'ipss_0_5':
      return IPSS_LABELS.map((label, i) => ({ value: i, label }));
    case 'vas_0_100_10step':
      return Array.from({ length: 11 }, (_, i) => ({ value: i * 10, label: String(i * 10) }));
    case 'frequency_days_0_10':
      return Array.from({ length: 11 }, (_, i) => ({ value: i, label: String(i) }));
    default:
      return [];
  }
}

export default function AssessmentScreen() {
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState<AssessmentDomain[]>([]);
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [chosen, setChosen] = useState<QuestionnaireCode[]>([]);
  const [results, setResults] = useState<{
    scores: AssessmentScores;
    comparison: AssessmentComparison | null;
    questionnaires: QuestionnaireResult[];
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      getUserConditions().then((codes) => getAssessmentDomains(codes)),
      getAssessmentItems(),
      getChosenQuestionnaires().catch(() => null),
    ]).then(([loadedDomains, loadedItems, storedChoice]) => {
      if (!isMounted) return;
      setDomains(loadedDomains);
      setItems(loadedItems);
      setChosen(parseChosen(storedChoice));
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const itemsByDomain = useMemo(() => {
    const map = new Map<string, AssessmentItem[]>();
    for (const item of items) {
      const list = map.get(item.domainCode) ?? [];
      list.push(item);
      map.set(item.domainCode, list);
    }
    return map;
  }, [items]);

  const chosenItemCount = chosen.reduce((total, code) => total + questionnaire(code).items.length, 0);
  const answeredCount = Object.keys(responses).length;

  function toggleQuestionnaire(code: QuestionnaireCode) {
    const next = chosen.includes(code) ? chosen.filter((each) => each !== code) : [...chosen, code];
    const ordered = QUESTIONNAIRES.filter((q) => next.includes(q.code)).map((q) => q.code);
    setChosen(ordered);
    if (!next.includes(code)) {
      // Answers to a scale taken back out of the check-in are not saved with it.
      const dropped = new Set(questionnaire(code).items.map((item) => item.code));
      setResponses((prev) => Object.fromEntries(Object.entries(prev).filter(([key]) => !dropped.has(key))));
    }
    void setChosenQuestionnaires(serializeChosen(ordered)).catch(() => undefined);
  }

  function selectResponse(itemCode: string, value: number) {
    setResponses((prev) => ({ ...prev, [itemCode]: value }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const responseList: AssessmentResponseValue[] = Object.entries(responses).map(([itemCode, value]) => ({
        itemCode,
        value,
      }));

      const previousAssessments = await getSymptomAssessmentTrend();
      const lastPrevious = previousAssessments[previousAssessments.length - 1];
      const previousScores = lastPrevious
        ? scoreAssessment(lastPrevious.responses.map((r) => ({ itemCode: r.itemCode, value: r.responseValue })))
        : null;

      await recordSymptomAssessment({ completedAt: new Date().toISOString(), responses: responseList });

      const currentScores = scoreAssessment(responseList);
      const comparison = previousScores ? compareAssessmentScores(previousScores, currentScores) : null;

      const questionnaires: QuestionnaireResult[] = chosen
        .map((code) => {
          const q = questionnaire(code);
          let previous: QuestionnaireResult['previous'] = null;
          for (let i = previousAssessments.length - 1; i >= 0; i -= 1) {
            const earlier = previousAssessments[i].responses.map((r) => ({ itemCode: r.itemCode, value: r.responseValue }));
            const earlierScore = scoreQuestionnaire(q, earlier);
            if (earlierScore.score != null) {
              previous = { score: earlierScore.score, on: shortDate(previousAssessments[i].completedAt) };
              break;
            }
          }
          return { code, answers: responseList, previous };
        })
        .filter((result) => hasAnswers(questionnaire(result.code), result.answers));

      setResults({ scores: currentScores, comparison, questionnaires });
    } finally {
      setSubmitting(false);
    }
  }

  function startOver() {
    setResponses({});
    setResults(null);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    );
  }

  if (results) {
    return (
      <AssessmentResults
        domains={domains}
        scores={results.scores}
        comparison={results.comparison}
        questionnaires={results.questionnaires}
        onDone={startOver}
      />
    );
  }

  return (
    <CalmBands>
      <ScrollView style={styles.screen} contentContainerStyle={[styles.container, { paddingBottom: scrollBottomPadding }]}>
        <View style={styles.introBox}>
          <Text style={styles.intro}>
            Answer as many as feel relevant; you don&apos;t have to finish every question for this to be useful. Retake
            this any time; that&apos;s what turns today&apos;s snapshot into a trend.
          </Text>
          <Text style={styles.progressText}>
            {answeredCount} of {items.length + chosenItemCount} answered
          </Text>
        </View>

        <View style={styles.domainCard}>
          <Text style={styles.domainTitle}>Published questionnaires</Text>
          <Text style={styles.domainDescription}>{QUESTIONNAIRES_INTRO}</Text>
          <View style={styles.scaleRow}>
            {QUESTIONNAIRES.map((q) => {
              const active = chosen.includes(q.code);
              return (
                <TouchableOpacity
                  key={q.code}
                  style={[styles.scalePill, active && styles.scalePillActive]}
                  onPress={() => toggleQuestionnaire(q.code)}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: active }}
                >
                  <Text style={[styles.scalePillText, active && styles.scalePillTextActive]}>{q.chip}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {domains.map((domain) => (
          <View key={domain.code} style={styles.domainCard}>
            <Text style={styles.domainTitle}>{domain.displayName}</Text>
            <Text style={styles.domainDescription}>{domain.description}</Text>

            {(itemsByDomain.get(domain.code) ?? []).map((item) => (
              <View key={item.code} style={styles.itemBlock}>
                <Text style={styles.itemPrompt}>{item.prompt}</Text>
                <View style={styles.scaleRow}>
                  {optionsForResponseType(item.responseType).map((option) => {
                    const active = responses[item.code] === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[styles.scalePill, active && styles.scalePillActive]}
                        onPress={() => selectResponse(item.code, option.value)}
                      >
                        <Text style={[styles.scalePillText, active && styles.scalePillTextActive]}>{option.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        ))}

        {chosen.map((code) => {
          const q = questionnaire(code);
          return (
            <View key={q.code} style={styles.domainCard}>
              <Text style={styles.domainTitle}>{q.title}</Text>
              <Text style={styles.domainDescription}>{q.stem}</Text>
              {q.items.map((item) => (
                <View key={item.code} style={styles.itemBlock}>
                  <Text style={styles.itemPrompt}>{item.prompt}</Text>
                  <View style={styles.scaleRow}>
                    {choicesFor(q, item).map((option) => {
                      const active = responses[item.code] === option.value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          style={[styles.scalePill, active && styles.scalePillActive]}
                          onPress={() => selectResponse(item.code, option.value)}
                        >
                          <Text style={[styles.scalePillText, active && styles.scalePillTextActive]}>{option.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
              <Text style={styles.framingNote}>{q.source}</Text>
            </View>
          );
        })}

        <TouchableOpacity
          style={[styles.submitButton, answeredCount === 0 && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={answeredCount === 0 || submitting}
        >
          <Text style={styles.submitButtonText}>{submitting ? 'Saving…' : 'Save check-in'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </CalmBands>
  );
}

// --- Domain scoring polarity: for hypothyroid symptoms and digestive
// symptoms, a LOWER number is improvement; for wellbeing, a HIGHER number
// is improvement. Getting this backwards would show someone getting
// better as if they were getting worse, so it's kept explicit rather than
// inferred from a sign convention.

function deltaLabel(delta: number, higherIsBetter: boolean, unit: string): { text: string; tone: 'good' | 'neutral' | 'watch' } {
  const rounded = Math.round(Math.abs(delta));
  if (rounded === 0) return { text: 'About the same as last time; that\'s useful information too.', tone: 'neutral' };

  const improved = higherIsBetter ? delta > 0 : delta < 0;
  if (improved) {
    return { text: `Down ${rounded}${unit} in the right direction since your last check-in: progress.`, tone: 'good' };
  }
  return { text: `Up ${rounded}${unit} since your last check-in: worth noticing, not worth panicking over.`, tone: 'watch' };
}

function AssessmentResults({
  domains,
  scores,
  comparison,
  questionnaires,
  onDone,
}: {
  domains: AssessmentDomain[];
  scores: AssessmentScores;
  comparison: AssessmentComparison | null;
  questionnaires: QuestionnaireResult[];
  onDone: () => void;
}) {
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const hypoDomain = domains.find((d) => d.code === 'hypothyroid_symptoms');
  const ibsDomain = domains.find((d) => d.code === 'digestive_ibs');
  const wellbeingDomain = domains.find((d) => d.code === 'wellbeing');
  const prostateDomain = domains.find((d) => d.code === 'prostate_urinary');

  const hypoDelta = comparison ? deltaLabel(comparison.hypothyroidSymptomsDeltaPercent, false, '%') : null;
  const ibsDelta = comparison ? deltaLabel(comparison.digestiveSymptomsDeltaRaw, false, ' pts') : null;
  const wellbeingDelta = comparison ? deltaLabel(comparison.wellbeingDeltaPercent, true, '%') : null;
  const prostateDelta = comparison ? deltaLabel(comparison.prostateUrinaryDeltaRaw, false, ' pts') : null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.container, { paddingBottom: scrollBottomPadding }]}>
      <View style={styles.headingBand}>
        <Text style={styles.resultsTitle}>Your check-in</Text>
      </View>
      {!comparison ? (
        <View style={styles.introBox}>
          <Text style={styles.intro}>
            This is your first check-in, so there&apos;s nothing to compare yet. But now you have a baseline.
            The value here isn&apos;t today&apos;s number, it&apos;s what today&apos;s number looks like next to your next one.
          </Text>
        </View>
      ) : null}

      {/* 2026-08-29: only report on the domains this person was actually
          asked about. These cards used to render unconditionally, so
          someone tracking Prostate Health got a hypothyroid burden score
          and an IBS severity band built entirely from questions they were
          never shown. Each card is now gated on its own domain being in
          the scoped set. */}
      {hypoDomain ? (
        <ResultCard
          title={hypoDomain.displayName}
          primaryText={`${Math.round(scores.hypothyroidSymptoms.percentScore)}% symptom burden`}
          secondaryText={`${scores.hypothyroidSymptoms.itemsAnswered} of 13 items answered`}
          delta={hypoDelta}
          framingNote={hypoDomain.framingNote}
        />
      ) : null}

      {ibsDomain ? (
        <ResultCard
          title={ibsDomain.displayName}
          primaryText={`${bandLabel(scores.digestiveSymptoms.band)} (${Math.round(scores.digestiveSymptoms.rawScore)} / 500)`}
          secondaryText={null}
          delta={ibsDelta}
          framingNote={ibsDomain.framingNote}
        />
      ) : null}

      {prostateDomain ? (
        <ResultCard
          title={prostateDomain.displayName}
          primaryText={`${prostateBandLabel(scores.prostateUrinary.band)} (${scores.prostateUrinary.rawScore} / 35)`}
          secondaryText={`${scores.prostateUrinary.itemsAnswered} of 7 items answered`}
          delta={prostateDelta}
          framingNote={prostateDomain.framingNote}
        />
      ) : null}

      {wellbeingDomain ? (
        <ResultCard
          title={wellbeingDomain.displayName}
          primaryText={`${Math.round(scores.wellbeing.percentScore)}% wellbeing`}
          secondaryText={`${scores.wellbeing.itemsAnswered} of 5 items answered`}
          delta={wellbeingDelta}
          framingNote={wellbeingDomain.framingNote}
        />
      ) : null}

      {questionnaires.map((result) => {
        const q = questionnaire(result.code);
        const score = scoreQuestionnaire(q, result.answers);
        const last = lastTimeLine(q, result.previous);
        return (
          <View key={q.code} style={styles.domainCard}>
            <Text style={styles.domainTitle}>{q.title}</Text>
            <Text style={styles.resultSecondary}>{scoreLine(q, score)}</Text>
            {last ? <Text style={styles.resultSecondary}>{last}</Text> : null}
            {score.difficulty ? <Text style={styles.resultSecondary}>{`How difficult these made things: ${score.difficulty}.`}</Text> : null}
            {q.code === 'phq9' && needsSafetyLine(result.answers) ? (
              <View style={styles.safetyBox}>
                <Text style={styles.safetyText}>{SAFETY_LINE}</Text>
                <TouchableOpacity onPress={() => void Linking.openURL(HELPLINE_URL)} accessibilityRole="link">
                  <Text style={styles.safetyLink}>{HELPLINE_LABEL}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <Text style={styles.framingNote}>{bandNote(q)}</Text>
          </View>
        );
      })}

      <TouchableOpacity style={styles.submitButton} onPress={onDone}>
        <Text style={styles.submitButtonText}>Done</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// The IPSS bands use their own three-level vocabulary, deliberately not
// folded into bandLabel below, whose 'remission' level has no IPSS
// equivalent and would read wrong here.
function prostateBandLabel(band: 'mild' | 'moderate' | 'severe'): string {
  switch (band) {
    case 'mild':
      return 'Mild';
    case 'moderate':
      return 'Moderate';
    default:
      return 'Severe';
  }
}

function bandLabel(band: 'remission' | 'mild' | 'moderate' | 'severe'): string {
  switch (band) {
    case 'remission':
      return 'Remission / minimal';
    case 'mild':
      return 'Mild';
    case 'moderate':
      return 'Moderate';
    case 'severe':
      return 'Severe';
  }
}

function ResultCard({
  title,
  primaryText,
  secondaryText,
  delta,
  framingNote,
}: {
  title: string;
  primaryText: string;
  secondaryText: string | null;
  delta: { text: string; tone: 'good' | 'neutral' | 'watch' } | null;
  framingNote: string | undefined;
}) {
  return (
    <View style={styles.domainCard}>
      <Text style={styles.domainTitle}>{title}</Text>
      <Text style={styles.resultPrimary}>{primaryText}</Text>
      {secondaryText ? <Text style={styles.resultSecondary}>{secondaryText}</Text> : null}
      {delta ? (
        <Text style={[styles.deltaText, delta.tone === 'good' && styles.deltaGood, delta.tone === 'watch' && styles.deltaWatch]}>
          {delta.text}
        </Text>
      ) : null}
      {framingNote ? <Text style={styles.framingNote}>{framingNote}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  container: { gap: HOME_BAND_ACCENT_WIDTH },
  // The intro sits on a band of its own, with the answered count under it,
  // since nothing sits on the screen without a surface.
  introBox: {
    ...homeBandStyle,
    ...homeBandNoHairlines,
    borderColor: colors.tabProfile,
    padding: HOME_BAND_CONTENT_PADDING,
    gap: 8,
  },
  intro: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
    ...textShadow,
  },
  progressText: {
    ...typography.captionEmphasis,
    color: colors.primary,
    ...textShadow,
  },
  // A full-width heading band on the muted surface, the same shape
  // makeTabBandStyles gives every tab's lens headings.
  headingBand: {
    ...homeBandStyle,
    ...homeBandNoHairlines,
    borderColor: colors.tabProfile,
    backgroundColor: colors.surfaceMuted,
    paddingVertical: 10,
    paddingHorizontal: HOME_BAND_CONTENT_PADDING,
  },
  domainCard: {
    ...homeBandStyle,
    ...homeBandNoHairlines,
    borderColor: colors.tabProfile,
    padding: HOME_BAND_CONTENT_PADDING,
  },
  domainTitle: {
    ...typography.sectionTitle,
    marginBottom: 4,
    ...textShadow,
  },
  domainDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
    ...textShadow,
  },
  itemBlock: {
    marginBottom: 16,
  },
  itemPrompt: {
    ...typography.label,
    marginBottom: 8,
    ...textShadow,
  },
  scaleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  scalePill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  scalePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  scalePillText: {
    ...typography.caption,
    color: colors.textPrimary,
    ...textShadow,
  },
  scalePillTextActive: {
    color: colors.textOnPrimary,

    // Dark text: cancel any shadow inherited from a base style it is

    // composed with. See constants/typography.ts.

    textShadowColor: 'transparent',

    textShadowRadius: 0,

  },
  submitButton: {
    marginHorizontal: HOME_BAND_CONTENT_PADDING,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.primaryMuted,
  },
  submitButtonText: {
    ...typography.bodyEmphasis,
    color: colors.textOnPrimary,

    // Dark text: cancel any shadow inherited from a base style it is

    // composed with. See constants/typography.ts.

    textShadowColor: 'transparent',

    textShadowRadius: 0,

  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: '400',
    ...textShadow,
  },
  resultPrimary: {
    fontSize: 20,
    fontWeight: '400',
    marginBottom: 2,
    ...textShadow,
  },
  resultSecondary: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 8,
    ...textShadow,
  },
  deltaText: {
    ...typography.captionEmphasis,
    color: colors.textPrimary,
    marginTop: 8,
    ...textShadow,
  },
  // An isolated results moment, not a dense table -- a real positive color
  // is appropriate here (see the matching note on profile.tsx's savedFlash).
  deltaGood: {
    color: colors.primary,
  },
  deltaWatch: {
    color: colors.statusRedOnSurface,
  },
  safetyBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.statusRedOnSurface,
    gap: 6,
  },
  safetyText: {
    ...typography.body,
    color: colors.textPrimary,
    ...textShadow,
  },
  safetyLink: {
    ...typography.bodyEmphasis,
    color: colors.primary,
    textDecorationLine: 'underline',
    ...textShadow,
  },
  framingNote: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 10,
    lineHeight: 17,
    fontStyle: 'italic',
    ...textShadow,
  },
});
