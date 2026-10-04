import { useVisualPreferences } from './useVisualPreferences';

// Whether Playful wording is on (Profile > Playful Wording, on by default).
// A screen passes this to wording() in lib/playfulCopy.ts so a change in
// Profile redraws it straight away.
export function usePlayfulWording(): boolean {
  return useVisualPreferences().playfulWording;
}
