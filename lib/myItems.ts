// What each tab's My menu lists, 2026-10-07. Direct request: "the My Foods,
// My Schedules, My Signals, My Insights, My Trends, My Reports, My Garden,
// and My Life should be removed from their Tab LensHub menus and be only
// available from the icon of the same names for each TabHub. Anything that
// is created about the user from or for any of the tabs shows up in that
// menu, grouped by the names of the things they can create."
//
// Food, Schedules and Garden already built their own lists in their screens.
// This module holds the other five as data: one row per kind of thing a
// person makes, the table it is counted from, and the lens it opens. A row
// pointing at another tab names that tab, since the record lives where it
// was made and the menu only finds it. Kinds with nothing in them are left
// out of the menu, so it lists what exists rather than what could.
//
// No React and no database here, so the list can be read and checked on its
// own; lib/myItemsDb.ts does the counting.

export type MyItemsTab = 'log' | 'insights' | 'trends' | 'life';

export type MyItemKind = {
  id: string;
  label: string;
  table: string;
  where?: string;
  lens: string;
  // Set when the record lives on a different tab from the menu listing it.
  elsewhere?: { pathname: '/insights' | '/log' | '/life'; param: 'openInsightsLens' | 'openSignalsLens' | 'openLifeLens' };
};

export const MY_ITEM_KINDS: Record<MyItemsTab, MyItemKind[]> = {
  log: [
    { id: 'flares', label: 'Flares', table: 'wellbeing_checkins', where: "checkin_type = 'flare'", lens: 'flares' },
    { id: 'reactions', label: 'Food Reactions', table: 'wellbeing_checkins', where: "checkin_type = 'post_meal'", lens: 'foodReactions' },
    { id: 'foodTests', label: 'Food Tests', table: 'food_trials', lens: 'newFoods' },
    { id: 'exercise', label: 'Exercise', table: 'exercise_logs', lens: 'exercise' },
    { id: 'bloodPressure', label: 'Blood Pressure Readings', table: 'body_measurements', where: "measurement_type = 'blood_pressure_systolic'", lens: 'bloodPressure' },
    { id: 'therapies', label: 'Hands-On Therapy Sessions', table: 'therapy_sessions', lens: 'therapies' },
    { id: 'notes', label: 'Notes and Check-ins', table: 'wellbeing_checkins', where: "checkin_type IN ('general', 'stress', 'sleep', 'post_exercise')", lens: 'generalNote' },
    { id: 'nights', label: 'Nights', table: 'nocturia_nights', lens: 'nocturia' },
    { id: 'bowel', label: 'Bowel Movements', table: 'bowel_movements', lens: 'bowel' },
    { id: 'microbiome', label: 'Microbiome Tests', table: 'microbiome_tests', lens: 'microbiome' },
    { id: 'cycle', label: 'Cycle Days', table: 'cycle_days', lens: 'cycle' },
    { id: 'trackers', label: 'My Trackers', table: 'custom_trackers', lens: 'trackers' },
    { id: 'trackerEntries', label: 'Tracker Entries', table: 'custom_tracker_entries', lens: 'trackers' },
  ],
  insights: [
    { id: 'labs', label: 'Lab Results', table: 'lab_results', lens: 'labs' },
    { id: 'ownLabTests', label: 'Lab Tests You Added', table: 'own_lab_tests', lens: 'labs' },
    { id: 'rules', label: 'My Rules', table: 'personal_rules', lens: 'myMeds' },
  ],
  // Trends only reads, so what is made from it is kept elsewhere: a rule from
  // Pattern Finder lives with the other rules on Insights, and a leave-it-out
  // test lives on Signals.
  trends: [
    {
      id: 'rules',
      label: 'My Rules (on Insights)',
      table: 'personal_rules',
      lens: 'myMeds',
      elsewhere: { pathname: '/insights', param: 'openInsightsLens' },
    },
    {
      id: 'foodTests',
      label: 'Food Tests (on Signals)',
      table: 'food_trials',
      lens: 'newFoods',
      elsewhere: { pathname: '/log', param: 'openSignalsLens' },
    },
  ],
  life: [
    { id: 'groceryLists', label: 'Grocery Lists', table: 'grocery_lists', lens: 'groceryList' },
    { id: 'family', label: 'Family Members', table: 'family_members', lens: 'conditions' },
    { id: 'money', label: 'Money In and Out', table: 'finance_entries', lens: 'finances' },
    { id: 'accounts', label: 'Accounts', table: 'finance_accounts', lens: 'finances' },
    { id: 'billsIncome', label: 'Bills and Income', table: 'finance_recurring', lens: 'finances' },
    { id: 'moneyGoals', label: 'Money Goals', table: 'finance_goals', lens: 'finances' },
    { id: 'medicalBills', label: 'Medical Bills', table: 'finance_medical_bills', lens: 'finances' },
    { id: 'work', label: 'Work Check-ins', table: 'work_checkins', lens: 'work' },
    { id: 'upkeep', label: 'Upkeep Items', table: 'upkeep_items', lens: 'upkeep' },
    { id: 'emergencyContacts', label: 'Emergency Contacts', table: 'emergency_contacts', lens: 'emergency' },
    { id: 'meds', label: 'Medications and Supplements', table: 'treatments', lens: 'myMeds' },
    { id: 'kitchen', label: 'Kitchen Items', table: 'kitchen_items', lens: 'kitchen' },
    { id: 'body', label: 'Body Measurements', table: 'body_measurements', where: "measurement_type NOT LIKE 'blood_pressure%'", lens: 'movement' },
    { id: 'workouts', label: 'Workouts', table: 'workouts', lens: 'workouts' },
    { id: 'routines', label: 'Routines', table: 'routines', lens: 'routines' },
    { id: 'didIt', label: 'Did I Do It Checks', table: 'done_checks', lens: 'didIDoIt' },
    { id: 'countdowns', label: 'Days Until Counters', table: 'countdowns', lens: 'daysUntil' },
    { id: 'todos', label: 'To-Dos', table: 'todos', lens: 'todos' },
  ],
};
