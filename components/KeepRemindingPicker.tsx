// "Keep reminding me until I mark it" (C2, 2026-09-26), one picker for every
// form that gives something a time: a routine's nudge, a Did I Do It check,
// and a reminder somebody sets. The choices and the sentence under them live
// in lib/keepReminding.ts; this only draws them in the form's own styles.

import { Text, type StyleProp, type TextStyle } from 'react-native';
import { PopoverSelect } from './PopoverSelect';
import {
  describeKeepReminding,
  KEEP_REMINDING_OPTIONS,
  keepRemindingValue,
  readKeepReminding,
  type KeepReminding,
} from '../lib/keepReminding';
import { getCachedReminderPreferences, isNudgeUntilDoneEnabled } from '../lib/reminderPreferences';

export function KeepRemindingPicker({
  value,
  onChange,
  tabColor,
  labelStyle,
  helperStyle,
}: {
  value: KeepReminding;
  onChange: (value: KeepReminding) => void;
  tabColor: string;
  labelStyle: StyleProp<TextStyle>;
  helperStyle: StyleProp<TextStyle>;
}) {
  const switchOn = isNudgeUntilDoneEnabled(getCachedReminderPreferences());
  return (
    <>
      <Text style={labelStyle}>Keep reminding me until I mark it</Text>
      <PopoverSelect
        options={KEEP_REMINDING_OPTIONS}
        selected={keepRemindingValue(value)}
        onSelect={(choice) => onChange(readKeepReminding(choice))}
        tabColor={tabColor}
      />
      <Text style={helperStyle}>{describeKeepReminding(value, switchOn)}</Text>
    </>
  );
}
