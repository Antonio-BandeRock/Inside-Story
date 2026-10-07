// Your Story's interview, 1.0.52.5 (lib/yourStoryInterview.ts holds every
// question and sentence). The app asks what it needs, one question at a
// time, and each answer goes straight into the same record Profile or Life
// keeps, so nothing asked here is kept twice.
//
//   page  what has been answered, one line each with Change, then the
//         question being asked, open.
//   card  the question being asked, open, for the Home card. Nothing once
//         every question has an answer.
//
// A question where several things can be chosen (conditions, parts of life,
// eating styles, allergies) stays open while choices are made, until Done,
// since the first tap would otherwise answer it and move on.
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from 'react-native';
import { AppTextInput } from './AppTextInput';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { getConditionStagingModel } from '../lib/conditionStages';
import {
  addFoodAllergy,
  addNeuroProfile,
  getUserProfile,
  removeFoodAllergy,
  removeNeuroProfile,
  setConditionStage,
  setDietPreferenceSelected,
  setUserConditionSelected,
  setUserProfile,
} from '../lib/db';
import { routeForDigestEntry } from '../lib/digestNavigation';
import { ALL_NEURO_PROFILE_KEYS, NEURO_PROFILE_CAPTIONS, NEURO_PROFILE_LABELS, type NeuroProfileKey } from '../lib/neuroProfile';
import type { StoryDestination } from '../lib/yourStory';
import { bringYourStoryItemBack, setYourStoryItemAside } from '../lib/yourStoryDb';
import {
  ADD_MEDS_LABEL,
  ALL_TABS_LABEL,
  CHANGE_LABEL,
  COMMON_ALLERGENS,
  DONE_LABEL,
  EATING_STYLES,
  INTERVIEW_ANSWERED_HEADING,
  INTERVIEW_FINISHED_LINE,
  INTERVIEW_HEADING,
  INTERVIEW_LEAD,
  LEAVE_OUT_LABEL,
  NEURO_PROFILE_NOTE,
  NONE_OF_THESE_LABEL,
  NOT_NOW_LABEL,
  NOT_SURE_LABEL,
  NO_ALLERGIES_LABEL,
  NO_STYLE_LABEL,
  OPEN_PROFILE_LABEL,
  PLAN_THIS_WAY_LABEL,
  READ_MORE_LABEL,
  SET_UP_BACKUP_LABEL,
  SECURITY_APP_LOCK_LABEL,
  SECURITY_BOTH_LABEL,
  SECURITY_VAULT_LABEL,
  START_ALL,
  TAKE_NOTHING_LABEL,
  TOUR_TABS,
  type InterviewQuestionView,
  type InterviewView,
} from '../lib/yourStoryInterview';
import { clearYourStoryAnswer, setYourStoryAnswer } from '../lib/yourStoryInterviewDb';
import { BeatPicker } from './BeatPicker';
import { usePlayfulWording } from '../hooks/usePlayfulWording';
import { wording } from '../lib/playfulCopy';
import { setVisualPreferences } from '../lib/visualPreferences';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_DIVIDER_COLOR, homeBandStyle } from './HomeSectionBand';
import { PopoverSelect } from './PopoverSelect';
import { VAULT_DEFAULT_CATEGORIES } from '../lib/vault';
import { answerVaultSetupNotNow, setVaultCategories } from '../lib/vaultSession';

type Props = {
  mode: 'card' | 'page';
  interview: InterviewView | null;
  onChanged: () => void;
  go: (destination: Exclude<StoryDestination, { kind: 'beats' }>) => void;
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const YEARS = (() => {
  const now = new Date().getFullYear();
  const years: string[] = [];
  for (let year = now; year >= 1900; year -= 1) years.push(String(year));
  return years;
})();
const DAYS = Array.from({ length: 31 }, (_, index) => String(index + 1));

function validBirthDate(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day);
  const same = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return same && date.getTime() <= Date.now();
}

const profileRoute: Exclude<StoryDestination, { kind: 'beats' }> = { kind: 'route', pathname: '/profile' };
// Profile opened at App Lock, where the vault's choices and code are.
const appLockProfileRoute: Exclude<StoryDestination, { kind: 'beats' }> = {
  kind: 'route',
  pathname: '/profile',
  params: { section: 'applock' },
};
const appLockSetupRoute: Exclude<StoryDestination, { kind: 'beats' }> = { kind: 'route', pathname: '/app-lock-setup' };
const myMedsRoute: Exclude<StoryDestination, { kind: 'beats' }> = {
  kind: 'route',
  pathname: '/life',
  params: { openLifeLens: 'myMeds' },
};

export function YourStoryInterview({ mode, interview, onChanged, go }: Props) {
  // The question held open while choices are being made, or reopened with
  // Change. Null means the next unanswered one.
  const [holding, setHolding] = useState<string | null>(null);
  const playful = usePlayfulWording();
  const [allergyText, setAllergyText] = useState('');
  const [sex, setSex] = useState<'male' | 'female' | null>(null);
  const [year, setYear] = useState<string | null>(null);
  const [month, setMonth] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  const openKey = holding ?? interview?.next?.key ?? null;
  const open = interview?.questions.find((question) => question.key === openKey) ?? null;

  useEffect(() => {
    if (open?.def.kind !== 'aboutYou') return;
    let live = true;
    void getUserProfile().then((profile) => {
      if (!live) return;
      setSex(profile.sex);
      if (profile.birthDate) {
        const [y, m, d] = profile.birthDate.split('-');
        setYear(y);
        setMonth(MONTHS[Number(m) - 1] ?? null);
        setDay(String(Number(d)));
      }
    });
    return () => {
      live = false;
    };
  }, [open?.def.kind]);

  const act = useCallback(
    async (work: () => Promise<unknown>, keepOpen: string | null) => {
      try {
        await work();
      } catch (error) {
        console.warn('Your Story interview answer failed', error);
      }
      setHolding(keepOpen);
      onChanged();
    },
    [onChanged],
  );

  if (!interview) return null;
  if (mode === 'card' && !open) return null;
  const facts = interview.facts;

  function pill(label: string, on: boolean, onPress: () => void, key?: string) {
    return (
      <TouchableOpacity
        key={key ?? label}
        style={[styles.pill, on && styles.pillOn]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected: on }}
      >
        {on ? <Ionicons name="checkmark" size={14} color={colors.textOnPrimary} /> : null}
        <Text style={on ? styles.pillTextOn : styles.pillText}>{label}</Text>
      </TouchableOpacity>
    );
  }

  function link(label: string, onPress: () => void, muted = false) {
    return (
      <TouchableOpacity key={label} style={styles.link} onPress={onPress} accessibilityRole="button">
        <Text style={muted ? styles.linkMuted : styles.linkText}>{label}</Text>
        {muted ? null : <Ionicons name="arrow-forward" size={13} color={colors.primary} style={textShadow} />}
      </TouchableOpacity>
    );
  }

  // Done on a question where several things can be chosen: nothing chosen
  // is an answer of its own, anything chosen replaces it.
  function finishMulti(question: InterviewQuestionView, chosen: number) {
    void act(() => (chosen === 0 ? setYourStoryAnswer(question.key, 'none') : clearYourStoryAnswer(question.key)), null);
  }

  function renderChoices(question: InterviewQuestionView) {
    const key = question.key;
    switch (question.def.kind) {
      case 'conditions':
        return (
          <>
            <View style={styles.pills}>
              {facts.conditionChoices.map((code) =>
                pill(
                  facts.conditionNames[code] ?? code,
                  facts.conditions.includes(code),
                  () => void act(() => setUserConditionSelected(code, !facts.conditions.includes(code)), key),
                  code,
                ),
              )}
            </View>
            <View style={styles.links}>
              {facts.conditions.length > 0
                ? link(DONE_LABEL, () => finishMulti(question, facts.conditions.length))
                : link(NONE_OF_THESE_LABEL, () => finishMulti(question, 0))}
            </View>
          </>
        );
      case 'neuro':
        return (
          <>
            <View style={styles.choiceList}>
              {ALL_NEURO_PROFILE_KEYS.map((profileKey: NeuroProfileKey) => {
                const on = facts.neuro.includes(profileKey);
                return (
                  <View key={profileKey} style={styles.choiceRow}>
                    {pill(NEURO_PROFILE_LABELS[profileKey], on, () =>
                      void act(() => (on ? removeNeuroProfile(profileKey) : addNeuroProfile(profileKey)), key),
                    )}
                    <Text style={styles.caption}>{NEURO_PROFILE_CAPTIONS[profileKey]}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={styles.caption}>{NEURO_PROFILE_NOTE}</Text>
            {/* 2026-10-03, direct request: "If the user tells the app from the
                start they have a neurodivergent mind, we can offer to be more
                direct, without the playful stuff." Offered, never switched
                silently; Profile > Playful Wording changes it later. */}
            {facts.neuro.length > 0 ? (
              <>
                <Text style={styles.caption}>{wording('plainWordingOffer', playful)}</Text>
                <View style={styles.pills}>
                  {pill('Plain wording', !playful, () => void setVisualPreferences({ playfulWording: false }), 'plain-wording')}
                  {pill('Keep the jokes', playful, () => void setVisualPreferences({ playfulWording: true }), 'keep-jokes')}
                </View>
              </>
            ) : null}
            <View style={styles.links}>
              {facts.neuro.length > 0
                ? link(DONE_LABEL, () => finishMulti(question, facts.neuro.length))
                : link(NONE_OF_THESE_LABEL, () => finishMulti(question, 0))}
              {facts.neuro.length > 0 ? link(OPEN_PROFILE_LABEL, () => go(profileRoute)) : null}
            </View>
          </>
        );
      case 'beats':
        return <BeatPicker showQuestion={false} onChanged={() => onChanged()} onDone={() => setHolding(null)} />;
      case 'startTab': {
        const chosen = facts.answers.startTab?.answer ?? null;
        return (
          <View style={styles.pills}>
            {TOUR_TABS.map((tab) =>
              pill(tab.title, chosen === tab.path, () => void act(() => setYourStoryAnswer('startTab', tab.path), null), tab.path),
            )}
            {pill(ALL_TABS_LABEL, chosen === START_ALL, () => void act(() => setYourStoryAnswer('startTab', START_ALL), null))}
          </View>
        );
      }
      case 'meds': {
        const setAside = facts.story.allItems.meds?.state === 'setAside';
        return (
          <View style={styles.links}>
            {link(ADD_MEDS_LABEL, () => {
              setHolding(null);
              go(myMedsRoute);
            })}
            {setAside
              ? null
              : link(TAKE_NOTHING_LABEL, () => void act(() => setYourStoryItemAside('meds'), null), true)}
          </View>
        );
      }
      case 'stage': {
        const code = question.condition?.code;
        const model = code ? getConditionStagingModel(code) : null;
        if (!code || !model) return null;
        const current = facts.stages[code];
        return (
          <>
            <Text style={styles.caption}>{`${model.frameworkName}. ${model.frameworkNote}`}</Text>
            <View style={styles.choiceList}>
              {model.stages.map((stage) => (
                <View key={stage.code} style={styles.choiceRow}>
                  {pill(stage.label, current === stage.code, () =>
                    void act(async () => {
                      await setConditionStage(code, stage.code);
                      await clearYourStoryAnswer(key);
                    }, null),
                  )}
                  <Text style={styles.caption}>{stage.shortDescription}</Text>
                </View>
              ))}
            </View>
            <View style={styles.links}>
              {link(
                NOT_SURE_LABEL,
                () =>
                  void act(async () => {
                    await setConditionStage(code, null);
                    await setYourStoryAnswer(key, 'notSure');
                  }, null),
                true,
              )}
            </View>
          </>
        );
      }
      case 'eatingStyle':
        return (
          <>
            <View style={styles.choiceList}>
              {EATING_STYLES.map((style) => {
                const on = facts.diets.includes(style.tag);
                return (
                  <View key={style.tag} style={styles.styleRow}>
                    <Text style={styles.styleName}>{style.tag}</Text>
                    <Text style={styles.caption}>{style.line}</Text>
                    <View style={styles.links}>
                      {pill(on ? 'Chosen' : PLAN_THIS_WAY_LABEL, on, () =>
                        void act(() => setDietPreferenceSelected(style.tag, !on), key),
                      )}
                      {link(READ_MORE_LABEL, () => {
                        const target = routeForDigestEntry(style.readId);
                        go({ kind: 'route', pathname: target.pathname, params: target.params as Record<string, string> });
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
            <View style={styles.links}>
              {facts.diets.length > 0
                ? link(DONE_LABEL, () => finishMulti(question, facts.diets.length))
                : link(NO_STYLE_LABEL, () => finishMulti(question, 0))}
            </View>
          </>
        );
      case 'allergies': {
        const others = facts.allergies.filter((name) => !COMMON_ALLERGENS.includes(name));
        return (
          <>
            <View style={styles.pills}>
              {COMMON_ALLERGENS.map((name) => {
                const on = facts.allergies.includes(name);
                return pill(name, on, () => void act(() => (on ? removeFoodAllergy(name) : addFoodAllergy(name)), key));
              })}
              {others.map((name) => pill(name, true, () => void act(() => removeFoodAllergy(name), key)))}
            </View>
            <View style={styles.addRow}>
              <AppTextInput
                style={styles.input}
                value={allergyText}
                onChangeText={setAllergyText}
                placeholder="Another allergy"
                placeholderTextColor={colors.textMuted}
                onSubmitEditing={() => {
                  const name = allergyText.trim();
                  if (!name) return;
                  setAllergyText('');
                  void act(() => addFoodAllergy(name), key);
                }}
                returnKeyType="done"
              />
            </View>
            <View style={styles.links}>
              {facts.allergies.length > 0
                ? link(DONE_LABEL, () => finishMulti(question, facts.allergies.length))
                : link(NO_ALLERGIES_LABEL, () => finishMulti(question, 0))}
            </View>
          </>
        );
      }
      case 'aboutYou': {
        const save = () => {
          setDateError(null);
          const monthNumber = month ? MONTHS.indexOf(month) + 1 : 0;
          const [y, d] = [Number(year), Number(day)];
          if (!sex || !year || !monthNumber || !day || !validBirthDate(y, monthNumber, d)) {
            setDateError('Choose a sex and a whole birth date, not in the future.');
            return;
          }
          const iso = `${y}-${String(monthNumber).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          void act(async () => {
            await setUserProfile({ sex, birthDate: iso });
            await bringYourStoryItemBack('aboutYou');
          }, null);
        };
        return (
          <>
            <View style={styles.pills}>
              {pill('Female', sex === 'female', () => setSex('female'))}
              {pill('Male', sex === 'male', () => setSex('male'))}
            </View>
            <View style={styles.dateRow}>
              <PopoverSelect options={YEARS} selected={year} onSelect={setYear} tabColor={colors.primary} placeholder="Year" searchable />
              <PopoverSelect options={MONTHS} selected={month} onSelect={setMonth} tabColor={colors.primary} placeholder="Month" />
              <PopoverSelect options={DAYS} selected={day} onSelect={setDay} tabColor={colors.primary} placeholder="Day" />
            </View>
            {dateError ? <Text style={styles.error}>{dateError}</Text> : null}
            <View style={styles.links}>
              {link('Save', save)}
              {link(LEAVE_OUT_LABEL, () => void act(() => setYourStoryItemAside('aboutYou'), null), true)}
            </View>
          </>
        );
      }
      case 'backup':
        return (
          <View style={styles.links}>
            {link(SET_UP_BACKUP_LABEL, () => {
              setHolding(null);
              go(profileRoute);
            })}
            {link(NOT_NOW_LABEL, () => void act(() => setYourStoryAnswer('backup', 'notNow'), null), true)}
          </View>
        );
      case 'security': {
        // Choosing the vault puts the health and money records in it
        // straight away; App Lock is set up on its own screen, and a vault
        // with no App Lock gets its code in Profile.
        const appLockOn = facts.security?.appLockOn ?? false;
        return (
          <View style={styles.links}>
            {link(SECURITY_BOTH_LABEL, () => {
              setVaultCategories(VAULT_DEFAULT_CATEGORIES);
              setHolding(null);
              onChanged();
              go(appLockOn ? appLockProfileRoute : appLockSetupRoute);
            })}
            {appLockOn
              ? null
              : link(SECURITY_APP_LOCK_LABEL, () => {
                  setHolding(null);
                  go(appLockSetupRoute);
                })}
            {link(SECURITY_VAULT_LABEL, () => {
              setVaultCategories(VAULT_DEFAULT_CATEGORIES);
              setHolding(null);
              onChanged();
              go(appLockProfileRoute);
            })}
            {link(
              NOT_NOW_LABEL,
              () =>
                void act(async () => {
                  answerVaultSetupNotNow();
                  await setYourStoryAnswer('security', 'notNow');
                }, null),
              true,
            )}
          </View>
        );
      }
    }
  }

  function renderOpen(question: InterviewQuestionView, bandStyle: ViewStyle = styles.bandOpen) {
    return (
      <View style={[styles.band, bandStyle]}>
        <Text style={styles.question}>{question.question}</Text>
        <Text style={styles.why}>{question.def.why}</Text>
        {renderChoices(question)}
        {holding === question.key && question.answered ? (
          <View style={styles.links}>{link('Close', () => setHolding(null), true)}</View>
        ) : null}
      </View>
    );
  }

  // On Home the question sits inside the Your Story band, which already
  // carries the colour. 1.0.62.12, direct request: the coloured lines above
  // and below the question "shouldn't be there anymore", and any line that
  // separates it uses the same dark line the other areas use. So no accent
  // on the left and the dark divider top and bottom.
  if (mode === 'card') {
    return open ? <View style={styles.cardWrap}>{renderOpen(open, styles.bandInCard)}</View> : null;
  }

  const answered = interview.questions.filter((question) => question.answered && question.key !== openKey);
  return (
    <View style={styles.page}>
      <View style={[styles.band, styles.bandOpen]}>
        <Text style={styles.heading}>{INTERVIEW_HEADING}</Text>
        <Text style={styles.why}>{interview.finished && !holding ? INTERVIEW_FINISHED_LINE : INTERVIEW_LEAD}</Text>
      </View>
      {answered.length > 0 ? (
        <View style={styles.band}>
          <Text style={styles.subheading}>{INTERVIEW_ANSWERED_HEADING}</Text>
          {answered.map((question) => (
            <View key={question.key} style={styles.answeredRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={textShadow} />
              <View style={styles.answeredText}>
                <Text style={styles.answeredQuestion}>{question.question}</Text>
                <Text style={styles.caption}>{question.summary}</Text>
              </View>
              {link(CHANGE_LABEL, () => setHolding(question.key))}
            </View>
          ))}
        </View>
      ) : null}
      {open ? renderOpen(open) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: 10 },
  cardWrap: { backgroundColor: colors.surface },
  band: {
    ...homeBandStyle,
    borderColor: colors.border,
    padding: HOME_BAND_CONTENT_PADDING,
    gap: 10,
    backgroundColor: colors.surface,
  },
  bandOpen: { borderColor: colors.primary },
  bandInCard: {
    borderLeftWidth: 0,
    borderTopColor: HOME_BAND_DIVIDER_COLOR,
    borderBottomColor: HOME_BAND_DIVIDER_COLOR,
  },
  heading: { ...typography.sectionTitle, color: colors.textPrimary, ...textShadow },
  subheading: { ...typography.label, color: colors.textPrimary, ...textShadow },
  question: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  why: { ...typography.body, color: colors.textSecondary, ...textShadow },
  caption: { ...typography.caption, color: colors.textSecondary, ...textShadow, flexShrink: 1 },
  error: { ...typography.caption, color: colors.statusYellowStandalone, ...textShadow },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, backgroundColor: colors.surface },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  pillOn: { backgroundColor: colors.primary },
  pillText: { ...typography.caption, color: colors.textPrimary, ...textShadow },
  pillTextOn: { ...typography.caption, color: colors.textOnPrimary, textShadowColor: 'transparent', textShadowRadius: 0 },
  links: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16, backgroundColor: colors.surface },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2 },
  linkText: { ...typography.caption, color: colors.primary, ...textShadow },
  linkMuted: { ...typography.caption, color: colors.textMuted, ...textShadow },
  choiceList: { gap: 10, backgroundColor: colors.surface },
  choiceRow: { gap: 4, backgroundColor: colors.surface },
  styleRow: { gap: 4, backgroundColor: colors.surface },
  styleName: { ...typography.label, color: colors.textPrimary, ...textShadow },
  addRow: { backgroundColor: colors.surface },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  dateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, backgroundColor: colors.surface },
  answeredRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: colors.surface },
  answeredText: { flex: 1, gap: 1 },
  answeredQuestion: { ...typography.body, color: colors.textPrimary, ...textShadow },
});
