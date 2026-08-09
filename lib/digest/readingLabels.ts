import type { DigestEntry } from './types';

// Reading Nutrition Labels & Ingredient Lists -- new 2026-08-09, a direct,
// deliberate companion to Choosing the Real Thing (product quality/
// mislabeling): that topic covers whether a product IS what it claims to
// be; this one covers how to actually read the label once you're holding a
// genuine product, the real regulatory mechanics behind the Nutrition
// Facts panel and ingredient list that most people have never had
// explained. Every claim independently verified via WebSearch before being
// written in, the same discipline as every other category in this Digest.
export const READING_LABELS_ENTRIES: DigestEntry[] = [
  {
    id: 'label-overview',
    category: 'basicHealth',
    title: 'A Nutrition Label Is a Real Legal Document, Not Just a Suggestion',
    teaser: 'Every number and every ingredient on a US food label follows a real, specific federal rule -- knowing the rule is what makes the label actually readable.',
    summary:
      'The Nutrition Facts panel and ingredient list on a packaged food sold in the US are both governed by real, specific FDA regulations, not a manufacturer\'s own free choice of what to show or how to show it. That real structure is exactly what makes a label decodable once the underlying rules are known: the ingredient list always follows one fixed ordering rule, the Daily Value percentages are always calculated the same way regardless of the product, and specific allergens must always be disclosed in one of two specific formats. This topic covers those real mechanics directly, so a label reads as information rather than marketing.',
    citations: [
      {
        source: 'FDA, "How to Understand and Use the Nutrition Facts Label"',
        url: 'https://www.fda.gov/food/nutrition-facts-label/how-understand-and-use-nutrition-facts-label',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['label-tying-together', 'quality-overview'],
  },
  {
    id: 'label-percent-daily-value',
    category: 'basicHealth',
    title: '%DV Is Always Measured Against the Same 2,000-Calorie Reference Diet',
    teaser: 'The percentage next to each nutrient on a label always means the same thing: how much of a fixed daily reference amount one serving supplies -- 5% or less is low, 20% or more is high.',
    summary:
      'The % Daily Value (%DV) shown for each nutrient is calculated the same real way every time: the nutrient amount in one serving divided by the FDA\'s own fixed Daily Value reference amount for that nutrient, times 100. That reference amount is built around a 2,000-calorie-a-day diet, chosen by the FDA as a reasonable approximation of an average adult\'s energy need -- not a personal target, and not adjusted for an individual\'s own real calorie need the way this app\'s own DRI-percentage tracking in Insights is. A simple, real rule of thumb the FDA itself states directly: 5% DV or less is considered low for a nutrient, 20% DV or higher is considered high -- genuinely useful for a fast read of any label, regardless of which specific nutrient it\'s attached to.',
    citations: [
      {
        source: '21 CFR 101.9, FDA nutrition labeling regulation',
        url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-101/subpart-A/section-101.9',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['portion-rda-ai-ul-explained'],
  },
  {
    id: 'label-ingredient-order-by-weight',
    category: 'basicHealth',
    title: 'Ingredients Are Always Listed by Real Weight, Heaviest First -- With One Real Exception',
    teaser: 'The first ingredient on any US food label is always the one that weighs the most in the actual product -- a real, fixed rule worth reading the label by.',
    summary:
      'Federal regulation requires every ingredient on a US food label to be listed by its common name in descending order of predominance by weight -- the heaviest real ingredient in the product always comes first, the lightest always comes last, with no exception for how a manufacturer might prefer the list to read. This is a genuinely useful, fast way to read any product: if sugar (in any of its real names) appears in the first two or three ingredients, sugar makes up a real, meaningful share of that product\'s actual weight. The one real exception: ingredients present at 2% or less of the product\'s total weight can be grouped at the end of the list, following a phrase like "contains 2% or less of," without needing to follow strict descending order among themselves -- a real, legitimate reason a small-quantity spice or preservative might not appear in exact weight order relative to its neighbors.',
    citations: [
      {
        source: '21 CFR 101.4, FDA ingredient designation regulation',
        url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-101/subpart-A/section-101.4',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['label-sugar-aliases'],
  },
  {
    id: 'label-sugar-aliases',
    category: 'basicHealth',
    title: 'Sugar Has Over 56 Real, Different Names on an Ingredient List',
    teaser: 'A manufacturer can add several genuinely different named sugars, each in a small enough amount to avoid the top of the ingredient list, while the total added sugar still adds up to a real, meaningful amount.',
    summary:
      'Real, documented tracking of ingredient labels has found over 56 different names sugar can legally appear under -- dextrose, sucrose, fructose, maltodextrin, cane juice, brown rice syrup, and dozens more, each a real, chemically distinct or differently-sourced sugar, not a synonym invented to deceive on its own. The real, worth-knowing consequence is a documented practice: a manufacturer can add several of these different named sugars to a product, each individually small enough to sit lower on the ingredient list than a single combined "sugar" entry would, while the product\'s real total added sugar content stays the same or higher. The one number that cuts through this reliably is the "Added Sugars" line on the Nutrition Facts panel itself, which reports the real combined total regardless of how many different names appear in the ingredient list above it.',
    citations: [
      {
        source: 'SugarScience, University of California San Francisco',
        url: 'https://sugarscience.ucsf.edu/hidden-in-plain-sight/',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['label-ingredient-order-by-weight', 'additive-hfcs'],
  },
  {
    id: 'label-serving-size-games',
    category: 'basicHealth',
    title: 'A Small Serving Size Makes Every Number on the Label Look Smaller, Without Changing the Product',
    teaser: 'The same real product can display very different-looking numbers depending only on how large a "serving" the manufacturer defines it as.',
    summary:
      'Every number on a Nutrition Facts panel -- calories, sugar, sodium, everything -- is reported per the manufacturer\'s own declared serving size, not per package and not per any fixed real-world amount. A genuinely smaller declared serving size makes every one of those numbers look smaller on the label, without the product itself changing at all -- the same real bag of chips can show a lower sugar or sodium figure simply by declaring a smaller official serving than most people would actually eat in one sitting. This app\'s own Portions & Recommended Amounts research already covers the real, separate finding that larger portions genuinely increase how much people eat -- this is the related, label-reading half of that same problem: the number on the package and the amount a person actually consumes are frequently two different real quantities, and only checking servings-per-container against how much is actually eaten reconciles them.',
    citations: [
      {
        source: 'FDA, "How to Understand and Use the Nutrition Facts Label"',
        url: 'https://www.fda.gov/food/nutrition-facts-label/how-understand-and-use-nutrition-facts-label',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['portion-overview', 'portion-larger-portions-larger-intake'],
  },
  {
    id: 'label-allergen-statements',
    category: 'basicHealth',
    title: 'Federal Law Requires 9 Specific Allergens to Be Named Directly, Not Hidden in a Generic Ingredient Name',
    teaser: 'Milk, eggs, fish, shellfish, tree nuts, peanuts, wheat, soy, and (as of 2023) sesame all have to be named by their real, plain source, even inside an ingredient that sounds unrelated.',
    summary:
      'US federal law requires nine specific major allergens (milk, eggs, fish, shellfish, tree nuts, peanuts, wheat, soybean, and, since January 1, 2023 under the real FASTER Act, sesame) to be disclosed in one of two specific, real formats: named directly in parentheses right after an ingredient that doesn\'t obviously reveal it ("natural flavor (sesame)"), or grouped together in a plain "Contains" statement immediately after the ingredient list. Sesame\'s own 2023 addition is a real, recent example of how this list itself can genuinely change -- it took a real act of Congress (the FASTER Act, signed 2021) specifically because sesame allergy reactions are real and were not being reliably caught under the eight-allergen list that existed before it. This mechanism exists for exactly the situation an unfamiliar-sounding ingredient name creates: a real allergen hiding inside a name that gives no obvious clue on its own.',
    citations: [
      {
        source: 'FDA, "FASTER Act: Sesame as the 9th Major Food Allergen"',
        url: 'https://www.fda.gov/food/food-allergies/faster-act-sesame-ninth-major-food-allergen',
      },
    ],
    overallTier: 'strong',
  },
  {
    id: 'label-tying-together',
    category: 'basicHealth',
    title: 'Three Real Rules Cover Most of What a Label Actually Says',
    teaser: 'Ingredient order reflects real weight, %DV reflects a fixed 2,000-calorie reference, and serving size is the manufacturer\'s own choice -- knowing these three rules makes almost any label readable.',
    summary:
      'Across every entry in this topic, three real, fixed rules do most of the actual work of reading a label correctly: ingredients are always listed by real descending weight (so the first few names matter most), %DV is always calculated against the same fixed 2,000-calorie reference regardless of the product (so 5%/20% is a genuinely portable rule of thumb), and serving size is the one number in this whole system a manufacturer gets to define, which is exactly why it deserves its own separate check against how much a person actually eats. None of this requires special training or a nutrition degree -- it requires knowing these three real, fixed rules exist, and reading the label with them in mind rather than trusting the front-of-package marketing to tell the same story.',
    citations: [
      {
        source: 'FDA, "How to Understand and Use the Nutrition Facts Label"',
        url: 'https://www.fda.gov/food/nutrition-facts-label/how-understand-and-use-nutrition-facts-label',
      },
    ],
    overallTier: 'strong',
    relatedIds: ['label-overview', 'quality-how-to-choose-well'],
  },
];
