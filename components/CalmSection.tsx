// Calm (D15, 2026-09-30): the bands on Signals > Calm. A breathing pacer, a
// relaxation script read aloud by the voice already on the device, and the
// recordings the person brings in (components/RecordingsBand.tsx). Every pattern,
// script and sentence is in lib/calm.ts;
// this draws them, keeps the timing, and talks to expo-speech and
// expo-haptics, both already installed.
//
// Nothing here writes a record of a session. The only things kept are the
// person's own patterns and scripts (calm_own, carried between devices) and
// which voice to use (calm_voice, this device only).
//
// Leaving the lens stops the pacer and the voice, through the focus effect,
// so nothing keeps talking from a screen nobody is looking at.
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { useBandFolds } from '../hooks/useBandFolds';
import {
  aboutMinutesLine,
  BUILT_IN_PATTERNS,
  BUILT_IN_SCRIPTS,
  circleTarget,
  CUE_CHOICES,
  DEFAULT_VOICE,
  DIZZY_NOTE,
  fieldsFromPattern,
  NO_VOICE_LINE,
  OWN_SCRIPT_HINT,
  ownPatternProblem,
  ownScriptProblem,
  PACER_NOTE,
  patternFromFields,
  patternSentence,
  PHASE_SPOKEN,
  PHASE_WORDS,
  phaseAt,
  SCREEN_ON_NOTE,
  scriptFromOwn,
  scriptPositionLine,
  SCRIPTS_INTRO,
  SESSION_LENGTHS,
  sessionClock,
  sessionFinished,
  speechRate,
  VOICE_PACES,
  type BreathPattern,
  type CalmOwn,
  type CueChoice,
  type PatternFields,
  type RelaxScript,
  type VoiceChoice,
  type VoicePace,
} from '../lib/calm';
import { getCalmOwn, getVoiceChoice, saveCalmOwn, saveVoiceChoice } from '../lib/calmDb';
import { sortByLabel } from '../lib/choiceOrder';
import { AppTextInput } from './AppTextInput';
import { useConfirmSheet } from './ConfirmSheet';
import { PopoverSelect } from './PopoverSelect';
import { RecordingsBand } from './RecordingsBand';
import { TabBand } from './TabBand';
import { useKeepScreenOn } from '../lib/keepScreenOn';

const EMPTY_PATTERN: PatternFields = { name: '', inSec: '', holdInSec: '', outSec: '', holdOutSec: '' };
const ADD_OWN = '__add_own__';

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function speakOptions(choice: VoiceChoice) {
  return {
    rate: speechRate(choice.pace),
    ...(choice.voice ? { voice: choice.voice } : {}),
  };
}

export function CalmSection({ tabColor }: { tabColor: string }) {
  const folds = useBandFolds();
  const [own, setOwn] = useState<CalmOwn>({ patterns: [], scripts: [] });
  const [voice, setVoice] = useState<VoiceChoice>({ voice: null, pace: 'slower' });
  const [voices, setVoices] = useState<Speech.Voice[] | null>(null);
  const [confirm, confirmElement] = useConfirmSheet();

  useEffect(() => {
    let current = true;
    getCalmOwn().then((value) => current && setOwn(value)).catch(() => undefined);
    getVoiceChoice().then((value) => current && setVoice(value)).catch(() => undefined);
    Speech.getAvailableVoicesAsync()
      .then((list) => current && setVoices(list))
      .catch(() => current && setVoices([]));
    return () => {
      current = false;
    };
  }, []);

  function changeOwn(next: CalmOwn) {
    setOwn(next);
    void saveCalmOwn(next).catch(() => undefined);
  }

  function changeVoice(next: VoiceChoice) {
    setVoice(next);
    void saveVoiceChoice(next).catch(() => undefined);
  }

  return (
    <>
      {confirmElement}
      <BreathingPacer tabColor={tabColor} folds={folds} own={own} onChangeOwn={changeOwn} voice={voice} confirm={confirm} />
      <SpokenRelaxation
        tabColor={tabColor}
        folds={folds}
        own={own}
        onChangeOwn={changeOwn}
        voice={voice}
        voices={voices}
        onChangeVoice={changeVoice}
        confirm={confirm}
      />
      <RecordingsBand tabColor={tabColor} folds={folds} confirm={confirm} />
    </>
  );
}

type Folds = ReturnType<typeof useBandFolds>;
type Confirm = ReturnType<typeof useConfirmSheet>[0];

// ---------------------------------------------------------------------------
// Breathing pacer
// ---------------------------------------------------------------------------

function BreathingPacer({
  tabColor,
  folds,
  own,
  onChangeOwn,
  voice,
  confirm,
}: {
  tabColor: string;
  folds: Folds;
  own: CalmOwn;
  onChangeOwn: (next: CalmOwn) => void;
  voice: VoiceChoice;
  confirm: Confirm;
}) {
  const patterns = useMemo(() => [...BUILT_IN_PATTERNS, ...own.patterns], [own.patterns]);
  const [patternId, setPatternId] = useState(BUILT_IN_PATTERNS[0].id);
  const [lengthIndex, setLengthIndex] = useState(2);
  const [cue, setCue] = useState<CueChoice>('none');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [form, setForm] = useState<{ editing: string | null; fields: PatternFields } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const size = useRef(new Animated.Value(0)).current;
  const lastStep = useRef(-1);

  const pattern = patterns.find((p) => p.id === patternId) ?? BUILT_IN_PATTERNS[0];
  const minutes = SESSION_LENGTHS[lengthIndex].minutes;
  const running = startedAt != null;
  useKeepScreenOn(running, 'calm-pacer');
  const state = phaseAt(pattern, elapsed);

  const stop = useCallback(() => {
    setStartedAt(null);
    setElapsed(0);
    lastStep.current = -1;
    size.stopAnimation();
    Animated.timing(size, { toValue: 0, duration: 400, useNativeDriver: true }).start();
    void Speech.stop();
  }, [size]);

  useFocusEffect(useCallback(() => () => stop(), [stop]));

  useEffect(() => {
    if (startedAt == null) return undefined;
    const timer = setInterval(() => setElapsed(Date.now() - startedAt), 100);
    return () => clearInterval(timer);
  }, [startedAt]);

  useEffect(() => {
    if (!running) return;
    if (sessionFinished(pattern, elapsed, minutes)) {
      stop();
      return;
    }
    if (state.step === lastStep.current) return;
    lastStep.current = state.step;
    const left = Math.max(0, (1 - state.progress) * state.length * 1000);
    Animated.timing(size, {
      toValue: circleTarget(state.phase),
      duration: left,
      easing: Easing.inOut(Easing.sin),
      useNativeDriver: true,
    }).start();
    if (cue === 'vibrate') {
      Haptics.selectionAsync().catch(() => {});
    } else if (cue === 'voice') {
      Speech.speak(PHASE_SPOKEN[state.phase], speakOptions(voice));
    }
  }, [running, elapsed, pattern, minutes, state.step, state.phase, state.progress, state.length, cue, voice, size, stop]);

  function start() {
    lastStep.current = -1;
    size.setValue(0);
    setElapsed(0);
    setStartedAt(Date.now());
  }

  function pickPattern(value: string) {
    if (value === ADD_OWN) {
      setProblem(null);
      setForm({ editing: null, fields: EMPTY_PATTERN });
      return;
    }
    if (running) stop();
    setPatternId(value);
  }

  function savePattern() {
    if (!form) return;
    const taken = patterns.filter((p) => p.id !== form.editing).map((p) => p.name);
    const wrong = ownPatternProblem(form.fields, taken);
    if (wrong) {
      setProblem(wrong);
      return;
    }
    const id = form.editing ?? newId('pattern');
    const made = patternFromFields(id, form.fields);
    const next = form.editing
      ? own.patterns.map((p) => (p.id === id ? made : p))
      : [...own.patterns, made];
    if (running) stop();
    onChangeOwn({ ...own, patterns: next });
    setPatternId(id);
    setForm(null);
    setProblem(null);
  }

  async function removePattern(target: BreathPattern) {
    const ok = await confirm({
      title: `Remove ${target.name}?`,
      message: 'Only this pattern goes. Nothing else is kept with it.',
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (!ok) return;
    if (running) stop();
    onChangeOwn({ ...own, patterns: own.patterns.filter((p) => p.id !== target.id) });
    setPatternId(BUILT_IN_PATTERNS[0].id);
  }

  const patternOptions = [
    ...sortByLabel(patterns.map((p) => ({ label: p.name, value: p.id }))),
    { label: 'Add a pattern of your own', value: ADD_OWN },
  ];
  const scale = size.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });

  return (
    <TabBand folds={folds} color={tabColor} id="signals:calm-pacer" title="Breathing Pacer" icon="ellipse-outline">
      <View style={styles.panel}>
        <Text style={styles.label}>Pattern</Text>
        <PopoverSelect options={patternOptions} selected={pattern.id} onSelect={pickPattern} tabColor={tabColor} />
        <Text style={styles.caption}>{patternSentence(pattern)}</Text>
        {pattern.note ? <Text style={[styles.caption, styles.muted]}>{pattern.note}</Text> : null}
        {pattern.own ? (
          <View style={styles.linkRow}>
            <TouchableOpacity onPress={() => { setProblem(null); setForm({ editing: pattern.id, fields: fieldsFromPattern(pattern) }); }}>
              <Text style={[styles.link, { color: tabColor }]}>Rename or change</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => void removePattern(pattern)}>
              <Text style={[styles.link, { color: colors.statusRedOnSurface }]}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {form ? (
          <View style={styles.form}>
            <Text style={styles.label}>{form.editing ? 'Change this pattern' : 'A pattern of your own'}</Text>
            <AppTextInput
              style={styles.input}
              value={form.fields.name}
              onChangeText={(name) => setForm({ ...form, fields: { ...form.fields, name } })}
              placeholder="Name"
            />
            <View style={styles.secondsRow}>
              {(
                [
                  ['inSec', 'In'],
                  ['holdInSec', 'Hold'],
                  ['outSec', 'Out'],
                  ['holdOutSec', 'Hold'],
                ] as const
              ).map(([key, word]) => (
                <View key={key} style={styles.secondsCell}>
                  <Text style={styles.caption}>{word}</Text>
                  <AppTextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    value={form.fields[key]}
                    onChangeText={(text) => setForm({ ...form, fields: { ...form.fields, [key]: text } })}
                    placeholder={key.startsWith('hold') ? '0' : 's'}
                  />
                </View>
              ))}
            </View>
            <Text style={[styles.caption, styles.muted]}>Seconds for each. Leave a hold empty for none.</Text>
            {problem ? <Text style={[styles.caption, { color: colors.statusRedOnSurface }]}>{problem}</Text> : null}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => { setForm(null); setProblem(null); }}>
                <Text style={[styles.buttonText, { color: tabColor }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={savePattern}>
                <Text style={styles.primaryButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <Text style={styles.label}>How long</Text>
        <PopoverSelect
          options={SESSION_LENGTHS.map((each, index) => ({ label: each.label, value: String(index) }))}
          selected={String(lengthIndex)}
          onSelect={(value) => setLengthIndex(Number(value))}
          tabColor={tabColor}
        />
        <Text style={styles.label}>At each change</Text>
        <PopoverSelect
          options={CUE_CHOICES}
          selected={cue}
          onSelect={(value) => setCue(value as CueChoice)}
          tabColor={tabColor}
        />

        <View style={styles.circleArea}>
          <Animated.View
            style={[styles.circle, { backgroundColor: tabColor, transform: [{ scale }] }]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        </View>
        <Text style={styles.phase} accessibilityLiveRegion="polite">
          {running ? `${PHASE_WORDS[state.phase]}  ${state.secondsLeft}` : 'Ready when you are'}
        </Text>
        <Text style={[styles.caption, styles.center]}>{running ? sessionClock(elapsed, minutes) : SESSION_LENGTHS[lengthIndex].label}</Text>
        <View style={styles.actionsCenter}>
          <TouchableOpacity style={styles.primaryButton} onPress={running ? stop : start}>
            <Text style={styles.primaryButtonText}>{running ? 'Stop' : 'Start'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.caption, styles.muted]}>{SCREEN_ON_NOTE}</Text>
        <Text style={[styles.caption, styles.muted]}>{DIZZY_NOTE}</Text>
        <Text style={[styles.caption, styles.muted]}>{PACER_NOTE}</Text>
      </View>
    </TabBand>
  );
}

// ---------------------------------------------------------------------------
// Relaxation read aloud
// ---------------------------------------------------------------------------

function SpokenRelaxation({
  tabColor,
  folds,
  own,
  onChangeOwn,
  voice,
  voices,
  onChangeVoice,
  confirm,
}: {
  tabColor: string;
  folds: Folds;
  own: CalmOwn;
  onChangeOwn: (next: CalmOwn) => void;
  voice: VoiceChoice;
  voices: Speech.Voice[] | null;
  onChangeVoice: (next: VoiceChoice) => void;
  confirm: Confirm;
}) {
  const scripts = useMemo<RelaxScript[]>(() => [...BUILT_IN_SCRIPTS, ...own.scripts.map(scriptFromOwn)], [own.scripts]);
  const [scriptId, setScriptId] = useState(BUILT_IN_SCRIPTS[0].id);
  const [lineIndex, setLineIndex] = useState<number | null>(null);
  const [form, setForm] = useState<{ editing: string | null; name: string; text: string } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  // Bumped on every Play and Stop, so a line finishing after Stop starts nothing.
  const run = useRef(0);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const script = scripts.find((s) => s.id === scriptId) ?? BUILT_IN_SCRIPTS[0];
  const playing = lineIndex != null;

  const stop = useCallback(() => {
    run.current += 1;
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
    pauseTimer.current = null;
    setLineIndex(null);
    void Speech.stop();
  }, []);

  useFocusEffect(useCallback(() => () => stop(), [stop]));

  function sayLine(target: RelaxScript, index: number, token: number) {
    if (token !== run.current) return;
    const line = target.lines[index];
    if (!line) {
      setLineIndex(null);
      return;
    }
    setLineIndex(index);
    const next = () => {
      if (token !== run.current) return;
      pauseTimer.current = setTimeout(() => sayLine(target, index + 1, token), line.pause * 1000);
    };
    Speech.speak(line.say, { ...speakOptions(voice), onDone: next, onError: next });
  }

  function play() {
    stop();
    const token = run.current;
    sayLine(script, 0, token);
  }

  function pickScript(value: string) {
    if (value === ADD_OWN) {
      setProblem(null);
      setForm({ editing: null, name: '', text: '' });
      return;
    }
    stop();
    setScriptId(value);
  }

  function saveScript() {
    if (!form) return;
    const taken = scripts.filter((s) => s.id !== form.editing).map((s) => s.name);
    const wrong = ownScriptProblem(form.name, form.text, taken);
    if (wrong) {
      setProblem(wrong);
      return;
    }
    const id = form.editing ?? newId('script');
    const made = { id, name: form.name.trim(), text: form.text };
    const next = form.editing ? own.scripts.map((s) => (s.id === id ? made : s)) : [...own.scripts, made];
    stop();
    onChangeOwn({ ...own, scripts: next });
    setScriptId(id);
    setForm(null);
    setProblem(null);
  }

  async function removeScript(target: RelaxScript) {
    const ok = await confirm({
      title: `Remove ${target.name}?`,
      message: 'Only this script goes. Nothing else is kept with it.',
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (!ok) return;
    stop();
    onChangeOwn({ ...own, scripts: own.scripts.filter((s) => s.id !== target.id) });
    setScriptId(BUILT_IN_SCRIPTS[0].id);
  }

  const scriptOptions = [
    ...sortByLabel(scripts.map((s) => ({ label: s.name, value: s.id }))),
    { label: 'Add a script of your own', value: ADD_OWN },
  ];
  const voiceOptions = [
    { label: "The device's usual voice", value: DEFAULT_VOICE },
    ...sortByLabel((voices ?? []).map((v) => ({ label: `${v.name} (${v.language})`, value: v.identifier }))),
  ];
  const noVoice = voices != null && voices.length === 0;

  return (
    <TabBand folds={folds} color={tabColor} id="signals:calm-scripts" title="Relaxation Read Aloud" icon="chatbubble-ellipses-outline">
      <View style={styles.panel}>
        <Text style={styles.body}>{SCRIPTS_INTRO}</Text>
        <Text style={styles.label}>Script</Text>
        <PopoverSelect options={scriptOptions} selected={script.id} onSelect={pickScript} tabColor={tabColor} />
        <Text style={styles.caption}>{`${script.about} ${aboutMinutesLine(script)}.`}</Text>
        {script.note ? <Text style={[styles.caption, styles.muted]}>{script.note}</Text> : null}
        {script.own ? (
          <View style={styles.linkRow}>
            <TouchableOpacity
              onPress={() => {
                const stored = own.scripts.find((s) => s.id === script.id);
                if (!stored) return;
                setProblem(null);
                setForm({ editing: stored.id, name: stored.name, text: stored.text });
              }}
            >
              <Text style={[styles.link, { color: tabColor }]}>Rename or change</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => void removeScript(script)}>
              <Text style={[styles.link, { color: colors.statusRedOnSurface }]}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {form ? (
          <View style={styles.form}>
            <Text style={styles.label}>{form.editing ? 'Change this script' : 'A script of your own'}</Text>
            <AppTextInput style={styles.input} value={form.name} onChangeText={(name) => setForm({ ...form, name })} placeholder="Name" />
            <AppTextInput
              style={[styles.input, styles.multiline]}
              value={form.text}
              onChangeText={(text) => setForm({ ...form, text })}
              placeholder="One thing to say on each line"
              multiline
              voiceJoin="line"
            />
            <Text style={[styles.caption, styles.muted]}>{OWN_SCRIPT_HINT}</Text>
            {problem ? <Text style={[styles.caption, { color: colors.statusRedOnSurface }]}>{problem}</Text> : null}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => { setForm(null); setProblem(null); }}>
                <Text style={[styles.buttonText, { color: tabColor }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={saveScript}>
                <Text style={styles.primaryButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {noVoice ? (
          <Text style={styles.body}>{NO_VOICE_LINE}</Text>
        ) : (
          <>
            <Text style={styles.label}>Voice</Text>
            <PopoverSelect
              options={voiceOptions}
              selected={voice.voice ?? DEFAULT_VOICE}
              onSelect={(value) => onChangeVoice({ ...voice, voice: value === DEFAULT_VOICE ? null : value })}
              tabColor={tabColor}
              searchable={voiceOptions.length > 12}
            />
            <Text style={styles.label}>Pace</Text>
            <PopoverSelect
              options={VOICE_PACES}
              selected={voice.pace}
              onSelect={(value) => onChangeVoice({ ...voice, pace: value as VoicePace })}
              tabColor={tabColor}
            />
          </>
        )}

        {playing ? (
          <View style={styles.nowSaying}>
            <Text style={[styles.caption, styles.muted]}>{scriptPositionLine(lineIndex, script)}</Text>
            <Text style={styles.body}>{script.lines[lineIndex]?.say ?? ''}</Text>
          </View>
        ) : null}
        <View style={styles.actionsCenter}>
          <TouchableOpacity style={[styles.primaryButton, noVoice && styles.disabled]} onPress={playing ? stop : play} disabled={noVoice}>
            <Text style={styles.primaryButtonText}>{playing ? 'Stop' : 'Play'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TabBand>
  );
}

const noShadow = { textShadowColor: 'transparent', textShadowRadius: 0 } as const;

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.surface, borderRadius: 12, padding: 12, gap: 8 },
  body: { ...typography.body, color: colors.textPrimary, ...noShadow },
  caption: { ...typography.caption, color: colors.textPrimary, ...noShadow },
  label: { ...typography.label, color: colors.textPrimary, marginTop: 4, ...noShadow },
  muted: { color: colors.textMuted },
  center: { textAlign: 'center' },
  linkRow: { flexDirection: 'row', gap: 16, paddingVertical: 2 },
  link: { ...typography.bodyEmphasis, ...noShadow },
  form: { gap: 8, padding: 10, borderRadius: 10, backgroundColor: colors.surfaceMuted },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
  },
  multiline: { minHeight: 120, textAlignVertical: 'top' },
  secondsRow: { flexDirection: 'row', gap: 8 },
  secondsCell: { flex: 1, gap: 4 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  actionsCenter: { flexDirection: 'row', justifyContent: 'center' },
  secondaryButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  buttonText: { ...typography.bodyEmphasis, ...noShadow },
  primaryButton: { paddingVertical: 10, paddingHorizontal: 22, borderRadius: 8, backgroundColor: colors.buttonColor, ...BUTTON_SHADOW },
  primaryButtonText: { ...typography.bodyEmphasis, color: colors.textOnButton, ...noShadow },
  disabled: { opacity: 0.4 },
  circleArea: { height: 200, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  circle: { width: 190, height: 190, borderRadius: 95, opacity: 0.55 },
  phase: { ...typography.sectionTitle, color: colors.textPrimary, textAlign: 'center', ...noShadow },
  nowSaying: { gap: 4, padding: 10, borderRadius: 10, backgroundColor: colors.surfaceMuted },
});
