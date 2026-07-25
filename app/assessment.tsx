import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import {
  AssessmentDomain,
  AssessmentItem,
  AssessmentResponseType,
  getAssessmentDomains,
  getAssessmentItems,
  getSymptomAssessmentTrend,
  recordSymptomAssessment,
} from '../lib/db';
import {
  AssessmentComparison,
  AssessmentResponseValue,
  AssessmentScores,
  compareAssessmentScores,
  scoreAssessment,
} from '../lib/symptomAssessment';

// Original response-scale labels (not the licensed WHO-5/ThyPRO wording --
// see the reference DB's assessment_domains.citation for what these are
// modeled on).
const SEVERITY_LABELS = ['Not at all', 'Mild', 'Moderate', 'Severe', 'Very severe'];
const WELLBEING_LABELS = ['Never', 'Rarely', 'Sometimes', 'Often', 'Very often', 'Always'];

function optionsForResponseType(type: AssessmentResponseType): { value: number; label: string }[] {
  switch (type) {
    case 'severity_0_4':
      return SEVERITY_LABELS.map((label, i) => ({ value: i, label }));
    case 'wellbeing_0_5':
      return WELLBEING_LABELS.map((label, i) => ({ value: i, label }));
    case 'vas_0_100_10step':
      return Array.from({ length: 11 }, (_, i) => ({ value: i * 10, label: String(i * 10) }));
    case 'frequency_days_0_10':
      return Array.from({ length: 11 }, (_, i) => ({ value: i, label: String(i) }));
    default:
      return [];
  }
}

export default function AssessmentScreen() {
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState<AssessmentDomain[]>([]);
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<{ scores: AssessmentScores; comparison: AssessmentComparison | null } | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    Promise.all([getAssessmentDomains(), getAssessmentItems()]).then(([loadedDomains, loadedItems]) => {
      if (!isMounted) return;
      setDomains(loadedDomains);
      setItems(loadedItems);
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

  const answeredCount = Object.keys(responses).length;

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

      setResults({ scores: currentScores, comparison });
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
    return <AssessmentResults domains={domains} scores={results.scores} comparison={results.comparison} onDone={startOver} />;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.intro}>
        Answer as many as feel relevant -- you don't have to finish every question for this to be useful. Retake
        this any time; that's what turns today's snapshot into a real trend.
      </Text>
      <Text style={styles.progressText}>
        {answeredCount} of {items.length} answered
      </Text>

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

      <TouchableOpacity
        style={[styles.submitButton, answeredCount === 0 && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={answeredCount === 0 || submitting}
      >
        <Text style={styles.submitButtonText}>{submitting ? 'Saving…' : 'Save check-in'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// --- Domain scoring polarity: for hypothyroid symptoms and digestive
// symptoms, a LOWER number is improvement; for wellbeing, a HIGHER number
// is improvement. Getting this backwards would show someone getting
// better as if they were getting worse, so it's kept explicit rather than
// inferred from a sign convention.

function deltaLabel(delta: number, higherIsBetter: boolean, unit: string): { text: string; tone: 'good' | 'neutral' | 'watch' } {
  const rounded = Math.round(Math.abs(delta));
  if (rounded === 0) return { text: 'About the same as last time -- that\'s useful information too.', tone: 'neutral' };

  const improved = higherIsBetter ? delta > 0 : delta < 0;
  if (improved) {
    return { text: `Down ${rounded}${unit} in the right direction since your last check-in -- real progress.`, tone: 'good' };
  }
  return { text: `Up ${rounded}${unit} since your last check-in -- worth noticing, not worth panicking over.`, tone: 'watch' };
}

function AssessmentResults({
  domains,
  scores,
  comparison,
  onDone,
}: {
  domains: AssessmentDomain[];
  scores: AssessmentScores;
  comparison: AssessmentComparison | null;
  onDone: () => void;
}) {
  const hypoDomain = domains.find((d) => d.code === 'hypothyroid_symptoms');
  const ibsDomain = domains.find((d) => d.code === 'digestive_ibs');
  const wellbeingDomain = domains.find((d) => d.code === 'wellbeing');

  const hypoDelta = comparison ? deltaLabel(comparison.hypothyroidSymptomsDeltaPercent, false, '%') : null;
  const ibsDelta = comparison ? deltaLabel(comparison.digestiveSymptomsDeltaRaw, false, ' pts') : null;
  const wellbeingDelta = comparison ? deltaLabel(comparison.wellbeingDeltaPercent, true, '%') : null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.resultsTitle}>Your check-in</Text>
      {!comparison ? (
        <Text style={styles.intro}>
          This is your first check-in, so there's nothing to compare yet -- but now you have a real baseline.
          The value here isn't today's number, it's what today's number looks like next to your next one.
        </Text>
      ) : null}

      <ResultCard
        title={hypoDomain?.displayName ?? 'Hypothyroid Symptoms'}
        primaryText={`${Math.round(scores.hypothyroidSymptoms.percentScore)}% symptom burden`}
        secondaryText={`${scores.hypothyroidSymptoms.itemsAnswered} of 13 items answered`}
        delta={hypoDelta}
        framingNote={hypoDomain?.framingNote}
      />

      <ResultCard
        title={ibsDomain?.displayName ?? 'Digestive / IBS Symptoms'}
        primaryText={`${bandLabel(scores.digestiveSymptoms.band)} (${Math.round(scores.digestiveSymptoms.rawScore)} / 500)`}
        secondaryText={null}
        delta={ibsDelta}
        framingNote={ibsDomain?.framingNote}
      />

      <ResultCard
        title={wellbeingDomain?.displayName ?? 'Overall Wellbeing'}
        primaryText={`${Math.round(scores.wellbeing.percentScore)}% wellbeing`}
        secondaryText={`${scores.wellbeing.itemsAnswered} of 5 items answered`}
        delta={wellbeingDelta}
        framingNote={wellbeingDomain?.framingNote}
      />

      <TouchableOpacity style={styles.submitButton} onPress={onDone}>
        <Text style={styles.submitButtonText}>Done</Text>
      </TouchableOpacity>
    </ScrollView>
  );
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
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  intro: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  progressText: {
    ...typography.captionEmphasis,
    color: colors.primary,
    marginBottom: 16,
  },
  domainCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  domainTitle: {
    ...typography.sectionTitle,
    marginBottom: 4,
  },
  domainDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  itemBlock: {
    marginBottom: 16,
  },
  itemPrompt: {
    ...typography.label,
    marginBottom: 8,
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
  },
  scalePillTextActive: {
    color: colors.textOnPrimary,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: colors.primaryMuted,
  },
  submitButtonText: {
    ...typography.bodyEmphasis,
    color: colors.textOnPrimary,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
  },
  resultPrimary: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  resultSecondary: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  deltaText: {
    ...typography.captionEmphasis,
    color: colors.textPrimary,
    marginTop: 8,
  },
  // An isolated results moment, not a dense table -- a real positive color
  // is appropriate here (see the matching note on profile.tsx's savedFlash).
  deltaGood: {
    color: colors.primary,
  },
  deltaWatch: {
    color: colors.statusFlagged,
  },
  framingNote: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 10,
    lineHeight: 17,
    fontStyle: 'italic',
  },
});
