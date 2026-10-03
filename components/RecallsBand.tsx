import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import type { useBandFolds } from '../hooks/useBandFolds';
import {
  classSentence,
  FDA_ENFORCEMENT_REPORTS_URL,
  FDA_RECALL_CLASSES_URL,
  howMatchedSentence,
  RECALL_OFF_NOTE,
  RECALL_SCOPE_NOTE,
  recallNumberSentence,
  recallTitle,
  retrievalSentence,
  setAsideSentence,
  statusSentence,
  whatToDoSentence,
  type RecallMatch,
} from '../lib/recalls';
import {
  bringBackSetAside,
  getRecallMatches,
  isRecallCheckOn,
  recallsReadOn,
  refreshRecalls,
  setAsideRecalls,
  setRecallCheckOn,
  type RecallMatches,
} from '../lib/recallsDb';
import { TabBand } from './TabBand';
import { HOME_BAND_GAP } from './HomeSectionBand';

// Recalls (A14): the FDA recalls of the past year that name a medicine being
// tracked or a food that was scanned. One band, on Life > My Meds, holding
// both, since a supplement recall is a food recall to the FDA and a person
// looking for one should not have to know that. A code match (the NDC on a
// kept label, the barcode on a scanned product) is shown in full; a match
// on a name alone is grouped per medicine into one line, since levothyroxine
// by itself turns up about thirty times a year from makers the person may
// never have used. Every match can be set aside as checked.

type Folds = ReturnType<typeof useBandFolds>;

export function RecallsBand({ folds, tabColor, reloadKey }: { folds: Folds; tabColor: string; reloadKey?: number }) {
  const styles = useMemo(() => makeStyles(tabColor), [tabColor]);
  const [on, setOn] = useState<boolean | null>(null);
  const [matches, setMatches] = useState<RecallMatches | null>(null);
  const [readOn, setReadOn] = useState<string | null>(null);
  const [state, setState] = useState<'idle' | 'reading' | 'error'>('idle');
  const [openNames, setOpenNames] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const checking = await isRecallCheckOn();
    setOn(checking);
    if (!checking) return;
    const [found, when] = await Promise.all([getRecallMatches(), recallsReadOn()]);
    setMatches(found);
    setReadOn(when);
  }, []);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  const read = useCallback(
    async (force: boolean) => {
      setState('reading');
      const result = await refreshRecalls(force);
      setState(result.state === 'error' ? 'error' : 'idle');
      await load();
    },
    [load],
  );

  const toggle = useCallback(
    async (next: boolean) => {
      await setRecallCheckOn(next);
      setOn(next);
      if (next) await read(false);
    },
    [read],
  );

  const setAside = useCallback(
    async (items: RecallMatch[]) => {
      await setAsideRecalls(items);
      await load();
    },
    [load],
  );

  const total = matches ? matches.products.length + matches.medicines.reduce((n, m) => n + m.byCode.length + m.byName.length, 0) : 0;

  const renderMatch = (match: RecallMatch, treatmentType?: string) => (
    <View key={`${match.recall.recallNumber}|${match.ownerId}`} style={styles.card}>
      <Text style={styles.title}>{recallTitle(match)}</Text>
      <Text style={styles.body}>{match.recall.product}</Text>
      {match.recall.reason ? <Text style={styles.body}>Why: {match.recall.reason}</Text> : null}
      {match.recall.codeInfo ? <Text style={styles.caption}>Lots and codes: {match.recall.codeInfo}</Text> : null}
      <Text style={styles.caption}>{howMatchedSentence(match)}</Text>
      <Text style={styles.caption}>{classSentence(match.recall.classification)}</Text>
      <Text style={styles.caption}>{statusSentence(match.recall)}</Text>
      <Text style={styles.body}>{whatToDoSentence(match, treatmentType)}</Text>
      <Text style={styles.caption}>{recallNumberSentence(match.recall)}</Text>
      <TouchableOpacity onPress={() => void setAside([match])} accessibilityRole="button">
        <Text style={styles.action}>Checked, not mine: set it aside</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <TabBand folds={folds} color={tabColor} id="life:myMeds:recalls" title="Recalls" icon="alert-circle-outline" count={on && total > 0 ? total : undefined}>
      <View style={styles.column}>
        <View style={styles.switchRow}>
          <Text style={[styles.body, styles.switchLabel]}>Check for FDA recalls</Text>
          <Switch value={!!on} onValueChange={(next) => void toggle(next)} trackColor={{ true: tabColor, false: colors.border }} />
        </View>
        {!on ? (
          <Text style={styles.caption}>{RECALL_OFF_NOTE}</Text>
        ) : (
          <>
            {state === 'reading' ? <Text style={styles.caption}>Reading the recall list. The first read takes a little while.</Text> : null}
            {state === 'error' ? <Text style={styles.caption}>The recall list could not be read just now. It is tried again later, or tap Read it now.</Text> : null}
            {matches && total === 0 && state !== 'reading' && readOn ? (
              <Text style={styles.body}>No recall reported in the past year names a medicine you are tracking or a food you have scanned.</Text>
            ) : null}

            {matches?.medicines.map((med) => {
              const open = openNames.has(med.treatmentId);
              const firms = [...new Set(med.byName.map((m) => m.recall.firm).filter(Boolean))];
              return (
                <View key={med.treatmentId} style={styles.column}>
                  {med.byCode.map((m) => renderMatch(m, med.treatmentType))}
                  {med.byName.length > 0 ? (
                    <View style={styles.card}>
                      <Text style={styles.title}>
                        {med.byName.length === 1 ? `A recall may be about your ${med.name}` : `${med.byName.length} recalls may be about your ${med.name}`}
                      </Text>
                      <Text style={styles.body}>
                        {med.byName.length === 1 ? 'It names' : 'They name'} {med.byName[0].matchedOn}, from {firms.slice(0, 4).join(', ')}
                        {firms.length > 4 ? ` and ${firms.length - 4} more` : ''}.{' '}
                        {firms.length === 1 ? 'If that firm did not make yours, it is not about yours.' : 'If none of those firms made yours, none of these is about yours.'}
                      </Text>
                      {!med.hasLabel ? (
                        <Text style={styles.caption}>
                          Keeping this medicine’s package label in My Meds lets a recall that lists your exact product code say so here.
                        </Text>
                      ) : null}
                      <View style={styles.actionRow}>
                        <TouchableOpacity
                          accessibilityRole="button"
                          onPress={() =>
                            setOpenNames((prev) => {
                              const next = new Set(prev);
                              if (next.has(med.treatmentId)) next.delete(med.treatmentId);
                              else next.add(med.treatmentId);
                              return next;
                            })
                          }
                        >
                          <Text style={styles.action}>{open ? 'Hide them' : 'Show them'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity accessibilityRole="button" onPress={() => void setAside(med.byName)}>
                          <Text style={styles.action}>Checked, not mine: set {med.byName.length === 1 ? 'it' : 'these'} aside</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null}
                  {open ? med.byName.map((m) => renderMatch(m, med.treatmentType)) : null}
                </View>
              );
            })}

            {matches?.products.map((m) => renderMatch(m))}

            {matches && setAsideSentence(matches.setAside) ? (
              <View style={styles.actionRow}>
                <Text style={[styles.caption, styles.switchLabel]}>{setAsideSentence(matches.setAside)}</Text>
                <TouchableOpacity accessibilityRole="button" onPress={() => void bringBackSetAside().then(load)}>
                  <Text style={styles.action}>Show them again</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <Text style={styles.caption}>{retrievalSentence(readOn)}</Text>
            <Text style={styles.caption}>{RECALL_SCOPE_NOTE}</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity accessibilityRole="button" disabled={state === 'reading'} onPress={() => void read(true)}>
                <Text style={styles.action}>Read it now</Text>
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="link" onPress={() => Linking.openURL(FDA_ENFORCEMENT_REPORTS_URL).catch(() => undefined)}>
                <Text style={styles.action}>FDA Enforcement Reports</Text>
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="link" onPress={() => Linking.openURL(FDA_RECALL_CLASSES_URL).catch(() => undefined)}>
                <Text style={styles.action}>What the classes mean</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </TabBand>
  );
}

function makeStyles(tabColor: string) {
  return StyleSheet.create({
    action: { ...typography.captionEmphasis, color: tabColor, paddingVertical: 4, ...textShadow },
    actionRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 16, rowGap: 4 },
    body: { ...typography.body, color: tabColor, marginTop: 4, ...textShadow },
    caption: { ...typography.caption, color: tabColor, marginTop: 4, ...textShadow },
    card: { backgroundColor: colors.surfaceMuted, borderRadius: 10, padding: 12 },
    column: { gap: HOME_BAND_GAP },
    switchLabel: { flex: 1 },
    switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    title: { ...typography.bodyEmphasis, color: tabColor, ...textShadow },
  });
}
