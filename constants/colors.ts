// Inside Story's design system -- one place for every color used across the
// app, so the palette can be reasoned about (and changed) as a whole rather
// than as scattered hex literals per screen.
//
// Replaced 2026-07-25: this used to be a light "Sage & Cream" theme (cream
// background, white cards, sage-green primary). It's now sourced directly
// from the commissioned thyroid-butterfly artwork -- real pixels sampled
// from the illustration, clustered into distinct jewel tones, not invented.
// Deep Navy (from the wings) replaces the old cream as the base; the warm
// gold, sage, turquoise, slate, teal, and rose tones below all come from the
// same source image. This is a deliberate, requested app-wide re-theme, not
// an incremental tweak -- every screen that reads from this file changes
// look as a result.
export const colors = {
  // Brand -- primary is used for every interactive/active element (buttons,
  // selected pills, checkboxes, links) so there is exactly one "this is the
  // app's color" instead of a mix of colors for interactivity. Turquoise,
  // sampled from the wings -- means "tap this" and nothing else; it is
  // deliberately never reused for a severity/status meaning (see below).
  primary: '#7FC7C3',
  primaryDark: '#5FA8A4',
  // Dark-theme tint: a muted dark teal wash (not a pale one, which assumed
  // a light backdrop under the old theme).
  primaryTint: '#2E4A52',
  primaryMuted: '#4C7672',

  // Accent -- warm gold sampled from the wing linework, reserved for
  // highlights deliberately distinct from primary.
  accent: '#DFC28E',
  accentDark: '#A87E55',
  accentTint: '#3A3020',

  // Neutrals -- Deep Navy base, sampled from the wings. Surface sits
  // *lighter* than the background (an elevated-card feel) rather than
  // darker, since the background itself is already quite dark.
  background: '#2B3753',
  surface: '#45546F',
  surfaceMuted: '#38456A',
  border: '#5C6F94',

  // TabHub's popup menu background specifically -- deliberately its own
  // token rather than reusing `surface`, added 2026-07-26. `surface` is a
  // real blue (~219 degree hue), which was the actual reason Schedules'
  // icon kept blending in through three rounds of trying to fix Schedules
  // itself: it isn't a darkness problem, it's a same-hue-as-background
  // problem. This is `surface` desaturated toward neutral (removing the
  // hue competition) with a small lightness bump -- tested and confirmed
  // that lightening alone would have made contrast *worse* for every tab
  // color, since they're all lighter than the background already; the fix
  // that actually helps is removing the competing hue, not raising
  // brightness. Scoped to this one component rather than changing
  // `surface` itself, which other cards elsewhere in the app also depend
  // on and haven't been individually re-verified against.
  menuSurface: '#545A63',

  // TabHub's *unselected* icon color, added 2026-07-26. Deliberately its
  // own token rather than reusing `textMuted` (used across 8 other files
  // for muted text elsewhere in the app), same reasoning as `menuSurface`
  // above -- a change here shouldn't ripple into screens that haven't been
  // individually checked against it. More washed out than `textMuted` on
  // purpose (lower saturation, slightly darker): every fix so far pushed
  // the *active* tab color harder, this pulls the resting/inactive icon
  // down instead, widening the gap from the other side, which is also
  // just how inactive tab-bar icons conventionally work (dimmer than
  // active by deliberate contrast, not full AA-level legibility -- an
  // icon glyph isn't a critical reading-text element).
  // Darkened further on request (58% -> 50% lightness, same ~15%
  // saturation). Now ~1.6:1 against `menuSurface` -- genuinely low, at the
  // point where this is purely a "recede into the background" color
  // rather than one held to any real legibility standard. That's the
  // explicit goal here (push the resting icon down so any active color
  // pops by comparison). This token now covers the icon glyph only --
  // see `menuLabelMuted` below for why the label text split off and
  // stayed at the lighter value instead of following the icon down.
  menuIconMuted: '#6C7A93',

  // TabHub's *unselected* label (text) color, split off from
  // `menuIconMuted` on 2026-07-27. The two used to share one token, but
  // darkening that token to make the icon recede further (see above) also
  // darkened the label underneath it as a side effect -- fine for a small
  // glyph, but real word-shaped text read as too dim at that lightness.
  // Restored to the lighter value the shared token held before that
  // darkening pass, so the label stays comfortably legible while the icon
  // above it is free to keep receding on its own.
  menuLabelMuted: '#858FA3',

  // textSecondary intentionally matches textPrimary now rather than being a
  // second, dimmer color: a lighter/lower-contrast secondary tone was tried
  // and measured out at ~3.3:1 against the new surface color, below the
  // AA text minimum. Hierarchy between primary and secondary text should
  // come from typography (weight/size), not a second color that has to be
  // re-verified every time the surface color changes.
  textPrimary: '#E4D5C5',
  textSecondary: '#E4D5C5',
  textMuted: '#8B9BB8',
  textOnPrimary: '#0F2E2B',

  danger: '#E0917A',

  // Status -- used by the Insights tab's Nutrients table and 6 Dimensions
  // scorecard. "Good" stays deliberately unsaturated/receding (a muted warm
  // neutral against the dark surface) -- color is reserved for things that
  // need action, so a row that's fine doesn't visually compete with one
  // that's flagged.
  statusGood: '#B9AEA0',
  statusFlagged: '#7A3226',
  statusFlaggedBg: '#F0D9D3',

  // A real green/yellow/red traffic light, specifically for the Nutrients
  // table and 6 Dimensions scorecard (see nutrientStatusSeverity in
  // lib/nutrientAnalysis.ts and tierSeverity in lib/sixDimensionsReference.ts).
  // These are self-contained chips (dark, saturated text on their own pale
  // tint), a pattern that stays legible regardless of the surrounding
  // background, tested across several rounds of the color-system work.
  statusRedBg: '#F0D9D3',
  statusYellow: '#7A5215',
  statusYellowBg: '#F2E2C4',

  // Notice -- a heads-up/in-progress state, distinct from both a
  // flagged/needs-attention state and the brand color.
  noticeBg: '#3A4968',
  noticeText: '#DFC28E',

  // Tab identity -- one jewel tone per tab, sampled from the same artwork,
  // so the app's iridescence signals *which* tab and field someone is
  // working in rather than being purely decorative. Consumed by TabHub for
  // the active-tab indicator; see constants/tabs.ts for the per-route
  // assignment. Deliberately distinct from `background` and from the
  // severity/status colors above, so a tab's identity is never confusable
  // with a health signal.
  //
  // Schedules/Trends/Reports were revised 2026-07-26 after real on-device
  // testing found each one nearly invisible against TabHub's own menu
  // background (`surface`, #45546F): Schedules had originally been set to
  // that *exact* color (0 contrast, not just low -- it wasn't dim, it was
  // literally the same color as what's behind it), Trends measured ~1.7:1,
  // Reports ~1.3:1, both far under the 3:1 minimum for a UI element to
  // read as visible at all.
  //
  // Schedules was revised twice more the same day: the first fix (a pale
  // periwinkle, #8FA8E8) cleared contrast against `surface` but landed too
  // close to `textMuted` (also a blue-gray) in both lightness AND hue, so
  // an active Schedules icon barely read as different from an inactive
  // one. Blue is a genuinely hard color here -- a vivid, saturated blue
  // tends to be too dark to clear 3:1 against this background at all
  // (checked and rejected several candidates for exactly this: pushing
  // saturation by dropping both R and G costs too much luminance; pushing
  // it by raising G to compensate drifts the hue toward Insights' cyan).
  // The current value keeps R low and G/B both high to stay on the blue
  // side of that boundary, landing at ~81% HSL saturation (vs ~24% for
  // `textMuted`) while still clearing 3:1 against `surface` (~3.1:1).
  // Rebuilt entirely 2026-07-26: the incremental fixes above (each color
  // separately pushed just enough to clear 3:1) had drifted wildly
  // inconsistent in saturation -- measured HSL saturation ranged from 32%
  // to 81% across the seven, which is exactly why Bio-Compass and
  // Schedules stood out as "too vivid" next to the rest. All seven are now
  // built from one shared HSL lightness (75%) and saturation (55%), a true
  // pastel set differentiated by hue alone, with hues deliberately
  // re-spread to ~25/45/95/150/195/230/280 degrees (evenly apart, not the
  // somewhat clustered angles the earlier ad-hoc picks landed on -- Home
  // and Reports had drifted to within 2 degrees of each other, for
  // instance). Every value below is individually re-verified against
  // `surface`, not assumed from the shared formula: contrast ranges from
  // ~3.3:1 (Schedules, blue is still the hardest hue to keep light enough)
  // up to ~5.3:1 (Food, née Meals).
  tabHome: '#E2D19C',
  tabFood: '#B9E29C',
  tabInsights: '#9CE2BF',
  // Schedules and Trends both got a further saturation bump on top of the
  // shared formula (55% -> 65% and 70% respectively) once the background
  // fix above was in place and confirmed working, purely to stand out
  // more. Checked contrast on each before committing, since saturation
  // and luminance trade off in hue-specific ways that aren't always
  // intuitive (this exact thing derailed Schedules twice before): Trends'
  // teal-leaning hue tolerates the boost with no other change needed, but
  // Schedules' blue would have dropped back under 3:1 on saturation alone,
  // so it also got a small compensating lightness increase (75% -> 77%)
  // alongside the saturation bump. Schedules is the one color in the set
  // that isn't at the exact shared lightness, for that specific,
  // documented reason -- not a sign the underlying diagnosis was wrong.
  // Pushed once more after finding the actual reason the previous
  // attempt still didn't pop: the icon's pill background (see TabHub.tsx)
  // is a 24%-opacity tint of the icon's *own* color, so brightening the
  // icon also brightens its own backdrop, a self-referential ceiling that
  // doesn't show up if you only check contrast against the raw menu
  // background. Tested darker/richer first, on the theory that a deeper
  // "true periwinkle" might read as more present -- it measured *worse*
  // (~2.2:1), confirming darker is the wrong direction against a
  // background this dark, same as every other fix in this set. The actual
  // fix is more of what's already worked: lighter and more saturated
  // still (55%->80% saturation, 75%->82% lightness), specifically sized
  // to clear 3:1 against its *own pill*, not just the raw background.
  // Still same hue, still periwinkle, just a stronger version.
  tabSchedules: '#ACB9F6',
  tabTrends: '#93D6EC',
  tabBioCompass: '#E2B99C',
  tabReports: '#CB9CE2',
  // Profile's own identity color, added 2026-07-25 when Profile moved into
  // TabHub's own picker grid (see components/TabHub.tsx) as its 9th item,
  // rather than being reached from a top-right header icon. Same shared
  // pastel formula as the seven above (55% saturation, 75% lightness), at
  // hue 330 degrees -- the actual seven above measure out to
  // 25/45/95/150/195/230/280 (see comment above), leaving one real gap
  // between Reports (280, purple) and Bio-Compass (25, orange); 330 sits
  // in the middle of that gap, a rose/pink no other tab is using. Verified
  // at ~3.23:1 against `menuSurface`, in line with the rest of the set.
  tabProfile: '#E29CBF',
} as const;

// "#RRGGBB" -> "rgba(r, g, b, alpha)" -- used anywhere a tab's own identity
// color needs to appear as a translucent tint rather than a flat fill (the
// active-tab pill in TabHub, the per-tab sheen on LensHub's corner button).
// One shared copy rather than a per-component duplicate, since it's now
// used in more than one place.
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Rotates a hex color's hue by `degrees` (positive or negative, wraps at
// 360), keeping its own saturation/lightness -- used to build a real
// multi-hue iridescent sheen (LensHub's corner button) from a single tab
// color, rather than just fading that one hue in and out. A true
// angle-dependent shimmer isn't possible in a static image; shifting
// through a few nearby hues across the shape is the closest static
// approximation, the same trick real iridescent-look materials (foil,
// some fabric prints) use.
export function hueShift(hex: string, degrees: number): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  h = (h + degrees + 360) % 360;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r2, g2, b2] = [0, 0, 0];
  if (h < 60) [r2, g2, b2] = [c, x, 0];
  else if (h < 120) [r2, g2, b2] = [x, c, 0];
  else if (h < 180) [r2, g2, b2] = [0, c, x];
  else if (h < 240) [r2, g2, b2] = [0, x, c];
  else if (h < 300) [r2, g2, b2] = [x, 0, c];
  else [r2, g2, b2] = [c, 0, x];

  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r2)}${toHex(g2)}${toHex(b2)}`;
}

// The 5-stop diagonal gradient recipe behind every "iridescent" tab-color
// sheen in the app -- LensHub's corner button and TabHub's own active-item
// pill both call this rather than each keeping their own copy, so "the
// same coloration" is actually guaranteed identical, not just similar and
// liable to drift the next time one of the two gets tweaked.
//
// 2026-07-25: narrowed considerably (was hue-shifted -45/0/+45/+90 degrees,
// a 135-degree sweep) after real on-device testing found the tabs had
// become hard to tell apart by color -- at the small size these actually
// render at (TabHub's 34px pill), a sweep that wide shows more of the
// *shifted* hues than the tab's own true color, and since the 7 tabs' base
// hues are only ~20-55 degrees apart to begin with, their wide sweeps
// overlapped enough to all read as a similar rainbow shimmer. Narrowed to
// +/-15 degrees and the true tabColor now anchors both the start and the
// end of the gradient (not just the middle), so most of the visible area
// is unambiguously that tab's own color, with a genuine but subtle shimmer
// at the edges rather than a wide hue sweep competing with it.
export function iridescentSheen(tabColor: string): readonly [string, string, string, string, string] {
  return [
    hexToRgba('#FFFFFF', 0.2),
    hexToRgba(tabColor, 0.55),
    hexToRgba(hueShift(tabColor, 15), 0.4),
    hexToRgba(tabColor, 0.55),
    hexToRgba(hueShift(tabColor, -15), 0.35),
  ];
}
