import { forwardRef } from 'react';
import { StyleSheet, View, type TextInput as TextInputType, type TextStyle, type ViewStyle } from 'react-native';
import { AppTextInput, type AppTextInputProps } from './AppTextInput';
import { VoiceInputButton } from './VoiceInputButton';
import { NAVIGATION_HAND } from '../constants/floatingButton';
import { appendDictatedText, parseVoiceCommands } from '../lib/voiceCommandParsing';

// Every notes field in the app, with the mic inside it (2026-09-28, direct
// request: "Do all notes fields have a microphone accessible to record to
// text, inside the text field as is the default that changes to the other
// side for left to right hand use?"). Before this the mic sat inside the
// field only on search boxes (EntrySearchInput) and the recipe step editor;
// every other notes field had it beside its label, or had none at all.
//
// The mic sits on the side NAVIGATION_HAND favors, the same flag the
// floating hubs and EntrySearchInput read, so flipping it moves every notes
// mic at once with no change here.
//
// A notes field takes the FINAL transcript only, through the spoken-command
// parser, and adds it after what is already there rather than replacing it,
// the second of the two shapes VoiceInputButton's header describes. Several
// fields used to replace their whole text with each dictation, which lost a
// note somebody had half typed. `join="line"` puts each dictation on a line
// of its own, for a field read one item a line (a workout's steps).
//
// scripts/audit_notes_mic.js is the check that keeps every notes field on
// this component.
export type NotesInputProps = AppTextInputProps & {
  value: string;
  onChangeText: (text: string) => void;
  join?: 'space' | 'line';
  micColor?: string;
};

const MIC_ROOM = 40;

const OUTER_KEYS = [
  'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'alignSelf', 'width', 'minWidth', 'maxWidth',
  'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'marginVertical', 'marginHorizontal', 'marginStart', 'marginEnd',
] as const;

export const NotesInput = forwardRef<TextInputType, NotesInputProps>(function NotesInput(
  { value, onChangeText, join = 'space', micColor, style, multiline, maxLength, ...rest },
  ref,
) {
  const micOnLeft = NAVIGATION_HAND === 'left';
  // How the field sits among its neighbours (flex in a row, a width, its
  // margins) moves to the wrap, so a field in a row still stretches the way
  // it did and the mic is placed against the visible box rather than
  // against the margin below it.
  const field: Record<string, unknown> = { ...(StyleSheet.flatten(style) ?? {}) };
  const outer: Record<string, unknown> = {};
  for (const key of OUTER_KEYS) {
    if (field[key] !== undefined) {
      outer[key] = field[key];
      delete field[key];
    }
  }

  function handleResult(transcript: string, isFinal: boolean) {
    if (!isFinal) return;
    const parsed = parseVoiceCommands(transcript);
    let next: string;
    if (join === 'line') {
      const existing = value.replace(/\s+$/, '');
      next = existing ? `${existing}\n${parsed.text.replace(/^\n+/, '')}` : parsed.text;
    } else {
      next = appendDictatedText(value, parsed);
    }
    onChangeText(maxLength ? next.slice(0, maxLength) : next);
  }

  return (
    <View style={[styles.wrap, outer as ViewStyle]}>
      <AppTextInput
        ref={ref}
        {...rest}
        style={[field as TextStyle, micOnLeft ? styles.padLeft : styles.padRight]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        maxLength={maxLength}
      />
      <VoiceInputButton
        onResult={handleResult}
        size={18}
        color={micColor}
        style={[
          styles.mic,
          multiline ? styles.micTop : styles.micMiddle,
          micOnLeft ? styles.micLeft : styles.micRight,
        ]}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  padLeft: { paddingLeft: MIC_ROOM },
  padRight: { paddingRight: MIC_ROOM },
  mic: { position: 'absolute' },
  micTop: { top: 8 },
  micMiddle: { top: 0, bottom: 0, justifyContent: 'center' },
  micLeft: { left: 6 },
  micRight: { right: 6 },
});
