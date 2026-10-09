// App icon shortcuts (C12, rebuild R1, 2026-10-02). A long press on the
// Lifestead icon offers three ways straight in, for the moments when
// opening the app and finding the place is the step that gets skipped:
// Capture, Did I take it (today's doses on Schedules > Meds), and Where is
// it. The quick settings tile (plugins/withCaptureTile.js) is the fourth
// way in and opens Capture the same way.
//
// Pure, with no imports, so the list is checked by
// scripts/test_quick_actions.js; components/QuickActionRouter.tsx sets the
// list and follows a tap.

export type QuickActionItem = {
  id: string;
  title: string;
  params: { href: string };
};

export const QUICK_ACTIONS: readonly QuickActionItem[] = [
  { id: 'capture', title: 'Capture', params: { href: '/capture' } },
  { id: 'did-i-take-it', title: 'Did I take it?', params: { href: '/schedule?openScheduleLens=meds' } },
  { id: 'where-is-it', title: 'Where is it?', params: { href: '/where-is-it' } },
];
