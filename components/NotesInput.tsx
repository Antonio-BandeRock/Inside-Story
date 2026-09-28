import { forwardRef } from 'react';
import type { TextInput as TextInputType } from 'react-native';
import { AppTextInput, type AppTextInputProps } from './AppTextInput';

// A notes field (2026-09-28). Since the same day every text field carries
// the mic inside its box on the hand side (AppTextInput's voice prop), so
// this is only the notes shape of it: a dictation always adds to what is
// written, and `join="line"` puts each one on a line of its own, for a
// field read one item a line (a workout's steps).
export type NotesInputProps = AppTextInputProps & {
  value: string;
  onChangeText: (text: string) => void;
  join?: 'space' | 'line';
};

export const NotesInput = forwardRef<TextInputType, NotesInputProps>(function NotesInput(
  { join = 'space', ...rest },
  ref,
) {
  return <AppTextInput ref={ref} voiceJoin={join} {...rest} />;
});
