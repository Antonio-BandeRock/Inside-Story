// A single type scale, reused everywhere instead of each screen picking its
// own fontSize/fontWeight ad hoc. The previous approach had ~15 slightly
// different (size, weight) pairs scattered across screens with no
// consistent logic tying size to importance -- which is the opposite of
// what a type scale is for: training the eye to read "big bold = section,
// small gray = supporting detail" the same way on every screen, without
// having to re-learn it per page.
// 2026-08-29, standing rule, direct instruction after a morning lost to
// fixing bold one style at a time: "I don't want bold font anywhere in the
// app, I don't care where it is located... all text, no matter where it is
// located in the app, is to have drop shadows." Every tier below is
// therefore fontWeight '400'. The tiers still differ by SIZE (and the
// eyebrow tier by letter-spacing), which is what establishes hierarchy now
// -- weight no longer does, anywhere. Do not reintroduce a bold weight
// here or override one in a screen's own StyleSheet.
export const typography = {
  // The page title in ScreenHeader -- the single biggest, boldest text on
  // any screen, so the eye always finds "what page am I on" first.
  screenTitle: { fontSize: 20, fontWeight: '400' as const },

  // A card or major section's own heading (a form card's title, a domain
  // name, "Favorites"/"Templates").
  sectionTitle: { fontSize: 17, fontWeight: '400' as const },

  // A smaller heading nested inside a section, or a list row's primary
  // text (a meal name, a favorite's name, a field label).
  label: { fontSize: 14, fontWeight: '400' as const },

  // Regular readable paragraph/description text.
  body: { fontSize: 14, fontWeight: '400' as const },
  bodyEmphasis: { fontSize: 14, fontWeight: '400' as const },

  // Secondary/supporting text -- meta lines, table cell values, helper
  // text. True content, but not the primary thing being scanned.
  caption: { fontSize: 12, fontWeight: '400' as const },
  captionEmphasis: { fontSize: 12, fontWeight: '400' as const },

  // The smallest tier -- table column headers, eyebrow labels above a
  // section, footer notes. Small + bold + letter-spacing so it still reads
  // as a structural label rather than actual content even at a glance.
  //
  // 2026-07-28: textTransform: 'uppercase' removed -- explicitly asked not
  // to use all-caps for headers anywhere in the app. This is the one
  // shared style nearly every header/label in the app builds on, so
  // fixing it here covers all of them at once rather than hunting down
  // each individual usage.
  eyebrow: { fontSize: 10, fontWeight: '400' as const, letterSpacing: 0.4 },
} as const;

// A subtle drop shadow, spread into a text style with `...textShadow` --
// readability insurance for text sitting directly over a photographic
// background (Home's animated sky/wildflower image) rather than a flat
// colors.surface card. Not folded into typography's own tiers above and
// not applied everywhere by default: most text in the app already sits on
// an opaque card and doesn't need it, so this stays opt-in per screen.
// NEVER on near-black text. 2026-08-29, direct report: "I am seeing other
// black font with drop shadows in the Profile. I think black font should
// not have drop shadowing applied anywhere in the app." Correct, and it is
// a real refinement of the app-wide "drop shadow on all text" rule rather
// than an exception to it: a dark shadow behind dark text has nothing to
// separate it from, so it only thickens and smudges the glyphs. Anything
// coloured colors.textOnPrimary, colors.textOnButton, or colors.background
// (all near-black, the last being every ground theme's own dark base, used
// as TEXT colour on filled pills and buttons) carries no shadow at all.
export const textShadow = {
  textShadowColor: 'rgba(0, 0, 0, 0.7)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 2.5,
} as const;

// A stronger version of textShadow above, 2026-08-21 -- direct follow-up
// on TabHub/LensHub's own grid labels ("I think they need a little more
// shadow, and still a lighter color of font"), after the first pass
// (plain textShadow) read as still not enough against colors.menuSurface.
// Deliberately its own constant rather than just turning up textShadow
// itself, which several other, already-tuned call sites (icons sitting on
// photographic backgrounds) share -- strengthening it in place would have
// changed those too, unasked. Darker color, taller offset, wider radius
// than textShadow, short of CORNER_ICON_SHADOW's own even-heavier
// treatment (tuned for TabHub/LensHub's large 32px corner-button icon,
// not small caption text).
//
// NOT for small text. 2026-08-29, direct report on Digest's own search
// pills: "the little pills for the search word are both bold text and
// drop shadowed. This makes them look blurred." Those pills were never
// bold in code (caption tier, fontWeight 400) -- a 4px blur radius with a
// 1.5px offset on 11px text simply smears the glyphs enough to read as
// thick and blurry, which is why several passes hunting for a fontWeight
// found nothing. Anything at the caption (12) or eyebrow (10) tier, or an
// explicit fontSize of 12 or less, should use plain textShadow above
// instead; this stronger one is for the larger labels it was tuned
// against (TabHub/LensHub grid labels, category headers, card titles).
export const menuLabelShadow = {
  textShadowColor: 'rgba(0, 0, 0, 0.85)',
  textShadowOffset: { width: 0, height: 1.5 },
  textShadowRadius: 4,
} as const;
