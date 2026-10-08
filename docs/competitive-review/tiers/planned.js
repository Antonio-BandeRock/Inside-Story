// Functions Inside Story is meant to have once it is complete, placed on the Free or
// Paid board beside what is built. st: planned (decided, not built), asked (waiting on
// the owner's decision), companion (a tier for other people). plan: the build plan id
// or the CLAUDE.md open step it comes from. u, p, f: the same draft scales as the board.
const P = (t, id, n, fam, u, p, f, st, plan, r) => ({ t, id, n, fam, u, p, f, st, plan, r, s: false });

module.exports = [
  // Home and daily living
  P('home', 'p-simple', 'Simple View with one clear next thing', 'daily', 3, 3, 3, 'planned', 'Step 28', 'For the second audience the first screen is the product. Tiimo charges $79.99 a year for this kind of help holding the day.'),
  P('home', 'p-wayin', 'A way in that needs no condition', 'daily', 4, 2, 1, 'planned', 'Step 28', 'Not a feature anyone pays for alone, but it decides whether the second audience recognises the app as theirs.'),
  P('home', 'p-tomorrow', 'Ready for tomorrow (evening view, prep lead time)', 'daily', 4, 3, 3, 'planned', 'Step 35', 'Nothing reviewed looks at tomorrow’s records the evening before.'),
  P('home', 'p-widgets', 'Home screen widgets', 'utility', 2, 1, 3, 'planned', 'L2, L3', 'Expected of any app.'),
  P('home', 'p-month', 'What your records showed this month', 'story', 5, 3, 1, 'planned', 'Phase plan', 'Nobody tells a person their month from their records.'),
  P('home', 'p-diary', 'The Diary', 'diary', 3, 3, 3, 'planned', 'Step 32', 'Day One charges $49.99 to $74.99 a year for a journal; this one sits beside the rest of life.'),
  P('home', 'p-share-in', 'Share to Inside Story from any app', 'interests', 3, 2, 2, 'planned', 'C11', 'Needs a rebuild. Plumbing more than a product.'),
  P('home', 'p-steps', 'Break a task into small steps', 'daily', 2, 2, 2, 'planned', 'C14', 'Goblin.tools does this free; here it would sit on the person’s tasks.'),
  // Food
  P('food', 'p-rotation', 'Ingredient rotation for smoothies and salads', 'meal-plan', 5, 3, 2, 'planned', 'Step 3', 'No app reviewed rotates ingredients on a schedule.'),
  P('food', 'p-brew', 'Home brew from whole foods (beer, wine, spirits)', 'prep', 5, 2, 1, 'planned', 'Step 9', 'Hobby brewing apps exist, none tied to nutrition.'),
  P('food', 'p-batch', 'When to start the next batch (yogurt, ferments)', 'prep', 5, 2, 1, 'planned', 'Step 18', 'Unique, small.'),
  P('food', 'p-cook', 'Learning to cook', 'recipes', 3, 3, 2, 'planned', 'Step 32', 'Cooking courses are paid elsewhere; here tied to what suits the person’s conditions.'),
  P('food', 'p-guests', 'Cooking for guests', 'recipes', 4, 2, 1, 'planned', 'Step 35', 'Reading guests’ needs beside the person’s.'),
  P('food', 'p-waste', 'Food thrown out and the loop to compost', 'grocery', 4, 2, 2, 'planned', 'Step 35', 'Waste trackers are free and rare; the compost loop is unique.'),
  P('food', 'p-seasonal', 'Seasonal and local food', 'grocery', 3, 2, 2, 'planned', 'Step 32', 'Seasonal charts are free online; tied to the person’s region and garden here.'),
  P('food', 'p-convert', 'Conversions in kitchen terms', 'utility', 1, 1, 2, 'planned', 'P14 to P21', 'Free everywhere.'),
  // Signals and health records
  P('signals', 'p-illness', 'Short illnesses and antibiotic courses as context', 'records', 5, 2, 1, 'planned', 'Step 35', 'Feeds Pattern Finder; nobody else keeps it for that.'),
  P('signals', 'p-pregnancy', 'Pregnancy and postpartum with a condition in view', 'womens', 5, 4, 2, 'planned', 'Step 32', 'Pregnancy apps ignore thyroid, celiac and the rest.'),
  P('signals', 'p-history', 'Full medical history', 'records', 2, 2, 1, 'planned', 'Step 32', 'Apple Health Records holds portal data free; a whole history is the person’s record.'),
  P('signals', 'p-screenings', 'Preventive screenings due', 'records', 3, 2, 1, 'planned', 'Step 32', 'Some insurers and portals remind for free.'),
  P('signals', 'p-blooddraw', 'Blood-draw prep and the recheck after a dose change', 'labs', 5, 3, 1, 'planned', 'Step 35', 'Nobody reminds you to stop biotin before a thyroid test.'),
  P('signals', 'p-portal', 'Records from a patient portal (FHIR)', 'records', 2, 3, 1, 'planned', 'G29', 'Apple gives this away in the US.'),
  P('signals', 'p-safetyplan', 'A mental health safety plan', 'mental', 2, 1, 1, 'planned', 'Step 32', 'Treat as safety: always Free.'),
  // Insights and garden
  P('insights', 'p-sun', 'Sunlight as a vitamin D source', 'nutrients', 5, 3, 2, 'planned', 'Step 35', 'Completes food, supplement and sun in one reading.'),
  P('insights', 'p-pill', 'Pill identifier', 'med-safety', 1, 1, 1, 'planned', 'A15', 'Drugs.com gives it away with ads.'),
  P('garden', 'p-grow4me', 'What to grow for my conditions', 'garden', 5, 4, 1, 'planned', 'I16', 'Unique, and the clearest link between garden and body.'),
  P('garden', 'p-preserve', 'Preserving the harvest', 'garden', 3, 2, 1, 'planned', 'Step 35', 'Canning guides are free; tying them to a harvest log is not offered.'),
  P('garden', 'p-seedsave', 'Saving seed from your plants', 'garden', 3, 2, 1, 'planned', 'Step 35', 'Seed libraries are free and local.'),
  P('garden', 'p-forage', 'Foraging', 'nature', 3, 2, 1, 'planned', 'Step 32', 'Field guides and iNaturalist are free.'),
  P('garden', 'p-nature', 'A nature journal', 'nature', 2, 1, 1, 'planned', 'Step 32', 'iNaturalist is free.'),
  P('garden', 'p-animals', 'Animals (pets and livestock)', 'nature', 2, 2, 2, 'planned', 'Step 32', '11pets is free with small purchases.'),
  P('garden', 'p-bees-read', 'Reading on every kind of bee and every part of keeping them', 'bees', 3, 2, 1, 'planned', 'Living with nature', 'Reading is free from beekeeping associations; set beside the hive log here.'),
  // Life
  P('life', 'p-bank', 'Import a bank export', 'money', 2, 3, 1, 'planned', 'J1', 'Every budgeting app does it with a bank link; here from a file, no link.'),
  P('life', 'p-dollar', 'Give every dollar a job', 'money', 2, 3, 2, 'planned', 'J5', 'YNAB charges $109 a year for this method.'),
  P('life', 'p-claims', 'Insurance claims and appeal deadlines', 'money', 5, 4, 1, 'planned', 'Step 35', 'No app reviewed tracks appeals for someone with a chronic condition.'),
  P('life', 'p-waiting', 'Things I’m waiting on', 'daily', 4, 2, 2, 'planned', 'Step 35', 'To-do apps have no idea of waiting on someone else.'),
  P('life', 'p-accommodations', 'Accommodations at work and school', 'care', 5, 3, 1, 'planned', 'Step 32', 'Nothing reviewed holds these.'),
  P('life', 'p-travel', 'Travelling with a condition', 'care', 4, 3, 1, 'planned', 'Step 32', 'Med time zones exist; whole-trip readiness does not.'),
  P('life', 'p-prepared', 'Disaster and power-cut preparedness', 'home-env', 3, 2, 1, 'planned', 'Step 35', 'FEMA’s app is free; medicines and fridge items here.'),
  P('life', 'p-water', 'Water quality at home', 'home-env', 3, 2, 1, 'planned', 'Step 35', 'EWG’s database is free.'),
  P('life', 'p-homehealth', 'Home and health (mold, air, energy)', 'home-env', 3, 2, 1, 'planned', 'Step 32', 'Sensor apps come with the sensor.'),
  P('life', 'p-contacts', 'Contacts, one record of a person', 'contacts', 1, 1, 2, 'planned', 'O1, Step 34', 'Comes with the phone.'),
  P('life', 'p-touch', 'Keeping in touch, text or call from a contact', 'contacts', 1, 1, 2, 'planned', 'O2, Step 32', 'Comes with the phone.'),
  P('life', 'p-messages', 'Messages between Inside Story users', 'sharing', 2, 2, 2, 'planned', 'O3', 'Every phone has messaging; here encrypted between paired people.'),
  P('life', 'p-familytree', 'Family health history and the family tree', 'family-tree', 4, 4, 1, 'planned', 'Step 34', 'FamilySearch free, Ancestry $39.99 a month; none hold health history for a doctor.'),
  P('life', 'p-children', 'Children’s records', 'companions', 4, 3, 1, 'planned', 'Step 32', 'Part of the Guardian tier.'),
  P('life', 'p-ifsomething', 'If something happens to me', 'legacy', 4, 4, 1, 'planned', 'Step 32', 'Everplans charges $99.99 a year.'),
  P('life', 'p-legacy', 'A life’s Inside Story', 'legacy', 5, 4, 1, 'planned', 'A life’s Inside Story', 'Nothing else makes years of records into a book in the person’s words.'),
  P('life', 'p-resume', 'Working life and a resume', 'resume', 4, 3, 1, 'planned', 'Step 33', 'Resume builders charge about $311 a year to download.'),
  P('life', 'p-a11y', 'Accessibility past text size', 'looks', 3, 1, 3, 'planned', 'Step 32, P9', 'Always Free.'),
  // Interests
  P('interests', 'p-interests', 'Interests: follow, practise, share', 'interests', 4, 2, 2, 'planned', 'Step 31', 'Note and bookmark apps are free.'),
  P('interests', 'p-projects', 'Projects across the app', 'interests', 3, 3, 2, 'planned', 'Step 31', 'Project apps charge; here a project spans garden, kitchen and money.'),
  P('interests', 'p-makeitpay', 'Making It Pay', 'interests', 5, 3, 1, 'planned', 'Step 31', 'Nothing reviewed connects an interest to earning without pushing it.'),
  P('interests', 'p-learn-ready', 'Learn: ready-made decks', 'learn', 2, 1, 2, 'planned', 'Step 37', 'Decided Free. Anki is free.'),
  P('interests', 'p-learn-own', 'Learn: making your own decks', 'learn', 3, 3, 2, 'planned', 'Step 37', 'Decided paid. Quizlet Plus $35.99 a year.'),
  P('interests', 'p-knowledge', 'Inside Knowledge on Home', 'learn', 4, 2, 3, 'planned', 'Step 37', 'A daily card from the person’s decks.'),
  // Across
  P('across', 'p-external', 'External data lookups (one Worker, three privacy shapes)', 'privacy', 3, 2, 1, 'planned', 'Step 27', 'Plumbing that keeps lookups private.'),
  P('across', 'p-folder', 'Reports saved to a folder in open formats', 'reports', 3, 2, 1, 'planned', 'Step 33, P6', 'Getting records out stays Free.'),
  P('across', 'p-adhd', 'ADHD and autism as profiles', 'daily', 4, 2, 1, 'planned', 'Step 28', 'Needs care not to imply diet treats them.'),
  P('across', 'p-growth', 'What grows on the tab screens', 'story', 5, 2, 3, 'planned', 'Step 29', 'Made of records, never awarded: no streaks or points.'),
  // Waiting on a decision
  P('across', 'z-ai', 'An assistant that answers questions about your records', 'asked', 2, 3, 2, 'asked', 'Z1', 'Google Health Premium $9.99 a month. Needs a model that costs per use.'),
  P('across', 'z-grocery', 'Send the grocery list to a delivery service', 'asked', 2, 2, 1, 'asked', 'Z3', 'Needs a partner agreement.'),
  P('life', 'z-banklink', 'A live bank link', 'asked', 1, 3, 2, 'asked', 'Z10', 'Monarch and YNAB charge about $100 a year; needs a paid aggregator.'),
  P('across', 'z-lifetime', 'A lifetime price and a hardship price', 'asked', 3, 3, 1, 'asked', 'Z15', 'Structured sells lifetime at $99.99.'),
  // Companions
  P('companions', 'c-viewer', 'Free viewer companion (household seat)', 'companions', 3, 1, 2, 'companion', 'Tiers', 'Reads the meal plan, shopping list and Trends summary, ticks off the list. First 2 to 3 seats free, then $1.99 a month.'),
  P('companions', 'c-household', 'Paid interactive household companion', 'companions', 3, 2, 2, 'companion', 'Tiers', 'Writes to the shared household domain, never the subscriber’s health. AnyList household is $14.99 a year.'),
  P('companions', 'c-partner', 'Partner (two full accounts, chosen visibility)', 'companions', 4, 4, 3, 'companion', 'Tiers', '$14.99 a month for both. Clue Connect shares one thing free; nothing shares a whole health life by category.'),
  P('companions', 'c-guardian', 'Guardian (a parent’s children)', 'companions', 4, 3, 2, 'companion', 'Tiers', 'Free with a paid plan, per child. Tiimo family is $119.99 for five.'),
  P('companions', 'c-caregiver', 'Caregiver (writing on behalf of another adult)', 'companions', 5, 5, 3, 'companion', 'Tiers', '$4.99 a month per person. CaringBridge shares updates free but holds no records; Medfriend only hears about missed doses.'),
];
