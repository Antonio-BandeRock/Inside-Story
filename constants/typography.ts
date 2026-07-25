// A single type scale, reused everywhere instead of each screen picking its
// own fontSize/fontWeight ad hoc. The previous approach had ~15 slightly
// different (size, weight) pairs scattered across screens with no
// consistent logic tying size to importance -- which is the opposite of
// what a type scale is for: training the eye to read "big bold = section,
// small gray = supporting detail" the same way on every screen, without
// having to re-learn it per page.
export const typography = {
  // The page title in ScreenHeader -- the single biggest, boldest text on
  // any screen, so the eye always finds "what page am I on" first.
  screenTitle: { fontSize: 20, fontWeight: '700' as const },

  // A card or major section's own heading (a form card's title, a domain
  // name, "Favorites"/"Templates").
  sectionTitle: { fontSize: 17, fontWeight: '700' as const },

  // A smaller heading nested inside a section, or a list row's primary
  // text (a meal name, a favorite's name, a field label).
  label: { fontSize: 14, fontWeight: '600' as const },

  // Regular readable paragraph/description text.
  body: { fontSize: 14, fontWeight: '400' as const },
  bodyEmphasis: { fontSize: 14, fontWeight: '600' as const },

  // Secondary/supporting text -- meta lines, table cell values, helper
  // text. True content, but not the primary thing being scanned.
  caption: { fontSize: 12, fontWeight: '400' as const },
  captionEmphasis: { fontSize: 12, fontWeight: '600' as const },

  // The smallest tier -- table column headers, eyebrow labels above a
  // section, footer notes. Uppercase + letter-spacing so it reads as a
  // structural label rather than actual content even at a glance.
  eyebrow: { fontSize: 10, fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: 0.4 },
} as const;
