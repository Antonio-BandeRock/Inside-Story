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
import { getGroundThemeSync } from '../lib/visualPreferences';

// Ground themes -- 2026-08-19, the Profile-area picker letting someone
// replace the whole navy/teal/etc. "ground" family (background, surface,
// surfaceMuted, border, textMuted, keySurface) at once, rather than editing
// this file by hand every time. Built the same day Deep Navy was actually
// replaced with Deep Teal as the shipped default (see `background`'s own
// comment below for that full story) -- the direct request that followed
// immediately after confirming Teal on-device: "add several additional
// colors... about the same darkness as this one [and] put them in the
// Profile area."
//
// Every family below (Teal included) is generated at the exact same
// relative saturation/lightness offsets from its own background that the
// original Navy family's real, individually-verified values measured out
// to -- surface: S-9/L+10, surfaceMuted: S-1/L+7, border: S-9/L+22,
// textMuted: S-8/L+38, keySurface: S+5/L+38 (all measured from Navy's own
// real shipped hex values, not guessed) -- so a new theme's internal
// contrast relationships start from the same place Navy's own
// individually-tuned ones did, rather than each needing its own from-
// scratch verification pass. Burgundy's own saturation (40 vs the 30-32 the
// others share) is one deliberate exception -- red hues read as muddy brown
// at this same darkness/saturation everyone else uses; same "same color
// family, stronger version" fix already proven repeatedly on the tab-
// identity colors below (see e.g. tabSchedules' own comment).
//
// primary/accent/textPrimary/textOnPrimary/status colors/tab-identity
// colors are NOT part of any ground theme -- scoped deliberately to the
// neutral "ground" family only, matching the original request.
//
// menuSurface is also deliberately excluded -- see its own comment below:
// it's intentionally desaturated toward neutral specifically so it doesn't
// compete with whichever hue is active, and that reasoning holds regardless
// of which ground theme is selected.
export type GroundTheme = 'navy' | 'teal' | 'purple' | 'charcoal' | 'burgundy';

export const GROUND_THEME_LABELS: Record<GroundTheme, string> = {
  navy: 'Deep Navy',
  teal: 'Deep Teal',
  purple: 'Deep Purple',
  charcoal: 'Deep Charcoal',
  burgundy: 'Deep Burgundy',
};

type GroundFamily = {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  textMuted: string;
  keySurface: string;
};

export const GROUND_THEMES: Record<GroundTheme, GroundFamily> = {
  // The app's original ground, sampled from the commissioned butterfly
  // artwork -- kept as a real, selectable option (not just deleted) so
  // switching back is always a two-tap Profile action, never a code change.
  navy: {
    background: '#2B3753',
    surface: 'rgba(69, 84, 111, 0.85)',
    surfaceMuted: 'rgba(56, 69, 106, 0.85)',
    border: '#5C6F94',
    textMuted: '#8B9BB8',
    keySurface: '#7E97C4',
  },
  // The new shipped default as of 2026-08-19. Landed on via the Ground
  // Color Lab explorer artifact: started from a "Deep Teal" preset (H190
  // S32 L25, Navy's own S/L exactly) and settled a touch darker (H190 S32
  // L21) after seeing it live on-device.
  teal: {
    background: '#244147',
    surface: 'rgba(61, 91, 97, 0.85)',
    surfaceMuted: 'rgba(49, 86, 94, 0.85)',
    border: '#547F87',
    textMuted: '#7DA7B0',
    keySurface: '#70B0BD',
  },
  // H280 S30 L21 -- kept a real distance from tabPurpleDigest's own hue
  // (262) and tabProfile's (330) so this ground is never confusable with
  // either of those identity colors; also deliberately clear of the
  // 275-280 "reads as pink, not purple" boundary tabPurpleDigest's own
  // comment documents, which only actually bit at that color's much higher
  // saturation/lightness -- at this dark a ground, that boundary doesn't
  // apply the same way.
  purple: {
    background: '#3B2546',
    surface: 'rgba(85, 62, 96, 0.85)',
    surfaceMuted: 'rgba(78, 51, 92, 0.85)',
    border: '#755785',
    textMuted: '#9E7FAD',
    keySurface: '#A372BB',
  },
  // H222 S6 L20 -- Navy's own hue at near-zero saturation, so this reads as
  // a true neutral gray rather than a colored dark, the one ground option
  // that isn't a hue choice at all.
  charcoal: {
    background: '#303236',
    surface: 'rgba(77, 77, 77, 0.85)',
    surfaceMuted: 'rgba(65, 67, 72, 0.85)',
    border: '#6B6B6B',
    textMuted: '#949494',
    keySurface: '#888FA0',
  },
  // H350 S40 L20 -- see this const's own header comment for why the
  // saturation bump over the 30-32 every other hued theme uses.
  burgundy: {
    background: '#471F25',
    surface: 'rgba(100, 53, 61, 0.85)',
    surfaceMuted: 'rgba(96, 42, 51, 0.85)',
    border: '#8C4A55',
    textMuted: '#B6727D',
    keySurface: '#C46474',
  },
};

// Resolved once, synchronously, at module-load time -- see
// getGroundThemeSync's own comment in lib/visualPreferences.ts for exactly
// why this has to be synchronous rather than the normal async preferences
// path every other visual preference uses. This runs before `colors` below
// is even constructed, which is what makes it early enough: every other
// file's own `import { colors } from '.../constants/colors'` can only
// resolve after this module has finished evaluating top to bottom.
const initialGround = GROUND_THEMES[getGroundThemeSync()];

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

  // Neutrals -- Deep Teal ground, chosen 2026-08-19 to replace the original
  // Deep Navy base (still sampled from the wings; see the archived comment
  // history below this block for that value's own reasoning and every
  // surface/border/textMuted tuning pass that was verified against it).
  // Landed on via a live hue/saturation/lightness explorer built specifically
  // for this decision (Ground Color Lab artifact, 2026-08-19): started from a
  // "Deep Teal" preset (H190 S32 L25, matching Deep Navy's own S/L exactly)
  // and settled on a touch darker (H190 S32 L21) after seeing it live.
  // Surface/border/textMuted/keySurface below are recomputed at the *same
  // relative* saturation/lightness offsets from this new base that they
  // already sat at from the old one (surface: S-9/L+10, border: S-9/L+22,
  // textMuted: S-8/L+38, keySurface: S+5/L+38 -- each measured from the old
  // values, not guessed), so the whole neutral family moves together rather
  // than drifting apart. menuSurface is deliberately left alone -- see its
  // own comment below for why it's intentionally desaturated/hue-independent.
  // primary/accent/textPrimary/status/tab-identity colors are all untouched:
  // this was scoped to the ground only, not a full re-theme.
  //
  // As of 2026-08-19 this (and surface/surfaceMuted/border/textMuted/
  // keySurface below) reads from `initialGround` above rather than a bare
  // literal -- Teal is still the shipped default (GROUND_THEMES.teal above
  // holds these exact values), but whichever theme was actually chosen in
  // Profile resolves here instead, synchronously, before any other file's
  // own import of `colors` can run. See GROUND_THEMES' own header comment
  // and getGroundThemeSync's comment in lib/visualPreferences.ts for why.
  background: initialGround.background,
  // Translucent, not flat, 2026-07-26: every tab now has its own photo
  // background behind its content (ScreenBackground.tsx), and a fully
  // opaque card was hiding all of it rather than letting the screen feel
  // like it sits over that photo. 85% opacity was the starting point --
  // enough of the image shows through at rest to feel like a real
  // "sitting over the scene" card rather than a solid box, while staying
  // dark enough for body text on top to stay readable without leaning on
  // textShadow everywhere.
  // Requested again, same day: another +10 points (0.85 -> 0.95) -- this is
  // the shared token, so the bump applies to every card/table/form
  // background across the whole app (not just the 6 main tab pages), since
  // they all read from this one value.
  // Reversed, same day, on seeing it on-device: 0.95 read as too solid --
  // explicitly asked for the *background* to actually show through the
  // card, not just barely. Dropped to 0.2 (target range given was "15 or
  // 20%"), a real swing back past the original 0.85 starting point rather
  // than a small correction -- this is a deliberate "translucent enough to
  // see the scene behind it" card now, leaning on textShadow (see
  // constants/typography.ts) to keep body text legible over a much more
  // visible photo.
  // Nudged back up +10 points, same day (0.2 -> 0.3): 0.2 read as a little
  // too transparent once seen on-device.
  // Nudged again, same day: another +15 points (0.3 -> 0.45) -- still a
  // little too see-through at 0.3. Covers every "text box"/"menu box" that
  // reads this shared token (LensHub's own popup cards among them; TabHub's
  // separate menuSurface token is deliberately NOT part of this -- see its
  // own comment for why that one stays flat/opaque).
  // A bigger jump this time, same day (0.45 -> 0.65): confirmed via an
  // actual on-device screenshot that 0.45 genuinely was rendering (a fresh
  // bundle, not a stale one) -- it just wasn't a visually distinct enough
  // step from 0.3 to read as "less transparent" at these low opacity
  // levels. This is a real swing toward reading as a solid card with the
  // photo as a tint underneath, not just a modest nudge like the last two.
  // One more small nudge, same day (0.65 -> 0.75) -- confirmed as a good
  // landing point via an on-device screenshot, then asked for a little
  // less transparent still.
  // Nudged again, 2026-07-27 (0.75 -> 0.85): seen in actual daytime light
  // (photo much more visible than in the screenshots the earlier passes
  // were judged against), the wildflower background was still showing
  // through Home's cards and every tab's resting-prompt box too strongly.
  surface: initialGround.surface,
  // Translucent as of 2026-07-26, same reasoning as `surface` above --
  // this is the background behind actual typed TextInput fields
  // (styles.input across the form-heavy screens), which was still a flat
  // opaque hex even after `surface` itself moved to translucent, so those
  // boxes stood out as solid rectangles against everything else's
  // "sitting over the photo" look. Same RGB as before, given its own alpha
  // rather than raised toward opaque like `surface`/the resting-prompt
  // card were -- explicitly requested to go the other direction, more
  // see-through, not less.
  // Dropped further, same day, alongside `surface`'s own reversal above --
  // same 0.2 target, so an input field doesn't read as a noticeably more
  // solid rectangle sitting inside a now much more translucent form card.
  // Nudged back up +10 points alongside `surface`'s own, same day (0.2 ->
  // 0.3), for the same "a little too transparent" reason.
  // Nudged again alongside `surface`'s own further +15, same day (0.3 ->
  // 0.45).
  // Bigger jump alongside `surface`'s own, same day (0.45 -> 0.65).
  // One more small nudge alongside `surface`'s own, same day (0.65 -> 0.75).
  // Nudged again alongside `surface`'s own, 2026-07-27 (0.75 -> 0.85).
  surfaceMuted: initialGround.surfaceMuted,
  border: initialGround.border,

  // AppKeyboard's own letter/digit keycap color, added 2026-07-27 -- a
  // lighter blue than `border` above so the keys read as raised/tappable
  // against the keyboard's own container (which deliberately matches the
  // flat footer color, `background`, below -- see AppKeyboard.tsx's own
  // comment). Same ~221-degree blue hue as `background`/`border`, just
  // lighter, rather than an unrelated color, so the keyboard still reads as
  // part of this app's palette instead of a generic gray keypad.
  keySurface: initialGround.keySurface,

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
  // Briefly made translucent, 2026-07-27, alongside `surface`/
  // `surfaceMuted`'s own move to a see-through card look -- reverted the
  // same day, explicitly asked back to flat/opaque. Left out of that
  // transparency pass again, deliberately this time: the butterfly menu's
  // popup reads better solid.
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
  textMuted: initialGround.textMuted,
  textOnPrimary: '#0F2E2B',

  danger: '#E0917A',

  // Status -- used by the Insights tab's Nutrients table and 6 Dimensions
  // scorecard. "Good" stays deliberately unsaturated/receding (a muted warm
  // neutral against the dark surface) -- color is reserved for things that
  // need action, so a row that's fine doesn't visually compete with one
  // that's flagged.
  statusGood: '#B9AEA0',
  statusFlagged: '#7A3226',
  statusFlaggedBg: '#4A2A22',

  // A real green/yellow/red traffic light, specifically for the Nutrients
  // table and 6 Dimensions scorecard (see nutrientStatusSeverity in
  // lib/nutrientAnalysis.ts and tierSeverity in lib/sixDimensionsReference.ts).
  // Backgrounds corrected 2026-08-01 -- these were still pale/cream-and-pink
  // tints straight from the pre-redesign light "Sage & Cream" theme (see
  // this file's own top comment on that redesign), never actually updated
  // when everything else moved to dark tints like primaryTint/accentTint
  // just above. Reported on-device as "very hard on the eyes" once the 6
  // Dimensions lens was actually used against the dark background these
  // rows sit on. Now a dark, muted wash of the same hue instead -- same
  // "self-contained chip" idea the old comment described, just dark-theme
  // correct: statusYellow/danger (the text/border drawn on top) are both
  // meaningfully LIGHTER than these new backgrounds, so the existing
  // positive (light-text-on-dark) contrast this app uses everywhere else
  // still holds without needing to also change those two colors, which are
  // used much more widely (delete buttons, error text, flare markers) and
  // weren't part of what was reported.
  statusRedBg: '#4A2A22',
  statusYellow: '#7A5215',
  statusYellowBg: '#4A3A1E',
  // A second, standalone-legible amber, added 2026-08-18 -- reported
  // directly ("AQI font color is difficult to see") once Home's own sky/
  // weather row moved from colored pills to plain text-only labels (see
  // app/(tabs)/index.tsx's own SkyGridItem). statusYellow above was never
  // meant to work alone: it's a dark olive (#7A5215, ~28% lightness)
  // deliberately built to sit as TEXT on top of its own matching
  // statusYellowBg pill, exactly as DimensionFlags.tsx's own comment already
  // states ("a solid-filled box in it would be close to invisible against
  // this app's dark navy surface") -- and with no pill behind it at all,
  // that's precisely what happens: measured at only ~1.7:1 against
  // colors.background, well under the 3:1 floor every other color in this
  // file is held to. This is the same hue (36 degrees) lifted to a genuinely
  // legible lightness/saturation instead (HSL 36/70%/65%) -- the same "same
  // color family, stronger version" fix already proven on tabSchedules and
  // tabPurpleDigest above -- verified at ~6.1:1 against colors.background,
  // clearing AA text contrast with real room to spare. Scoped as its own
  // token rather than changing statusYellow itself, which every other real
  // caller (DimensionFlags' own boxYellow, the Nutrients table, 6
  // Dimensions scorecard) already pairs correctly with statusYellowBg and
  // hasn't been individually re-verified against a bare-text use.
  statusYellowStandalone: '#E4B267',

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
  // to 81% across the seven, which is exactly why Signals and
  // Schedules stood out as "too vivid" next to the rest. All seven are now
  // built from one shared HSL lightness (75%) and saturation (55%), a true
  // pastel set differentiated by hue alone, with hues deliberately
  // re-spread to ~25/45/95/150/195/230/280 degrees (evenly apart, not the
  // somewhat clustered angles the earlier ad-hoc picks landed on -- Home
  // and Reports had drifted to within 2 degrees of each other, for
  // instance). Every value below is individually re-verified against
  // `surface`, not assumed from the shared formula: contrast ranges from
  // ~3.3:1 (Schedules, blue is still the hardest hue to keep light enough)
  // up to ~5.3:1 (Food, nÃ©e Meals).
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
  // 2026-07-28: reported as reading like a flesh/skin tone rather than
  // orange -- measured, not guessed: sampled the actual butterfly artwork
  // (assets/branding/butterfly-transparent.png) for its own warm accent
  // colors (the small gold/orange highlight dots scattered across the
  // wings), since the user specifically pointed to those as the "nicer
  // orange" this should look more like. The muted body/wing-tip tones
  // that dominate the image by pixel count sit right around this
  // formula's own old values (~S55/L74) -- confirming *why* it read as
  // skin-toned, that's genuinely the same range real flesh tones occupy.
  // The vivid gold/orange dots themselves cluster much more saturated
  // (~S65-85, L78-85). Kept the same hue (25 -- already the deliberately
  // reserved "orange" slot in this palette's own hue spacing, see the
  // comment above tabHome) and boosted toward that sampled range (55%->82%
  // saturation, 75%->76% lightness) -- same "same color family, stronger
  // version" fix already proven on tabSchedules/tabPurpleDigest. Checked,
  // not assumed: contrast against `menuSurface` improves too, ~3.86:1 ->
  // ~4.04:1.
  tabBioCompass: '#F4B990',
  // Deliberately NOT part of the hued pastel set above, 2026-07-27 --
  // Reports' old purple (hue 280) was reassigned to the new Purple Digest
  // area (tabPurpleDigest below), which needed that specific hue for its
  // own real-world meaning (the purple awareness ribbon). Rather than pick
  // yet another hue for Reports, this leans into what Reports actually is: a
  // printed/exported document -- true black-and-white, the one color in
  // this set that reads as "not one of the colorful tabs" specifically
  // because it isn't colorful, which is its own kind of distinct. Same 75%
  // lightness the hued set shares, saturation dropped to 0 -- pure black
  // isn't usable (this whole UI is dark-navy already, so black text/icons
  // would vanish; the dark background itself stands in for "black," this
  // value for "white/paper"). Verified at ~3.8:1 against `menuSurface`,
  // clearing 3:1 with more room than several of the hued colors.
  tabReports: '#BFBFBF',
  // Profile's own identity color, added 2026-07-25 when Profile moved into
  // TabHub's own picker grid (see components/TabHub.tsx) as its 9th item,
  // rather than being reached from a top-right header icon. Same shared
  // pastel formula as the seven above (55% saturation, 75% lightness), at
  // hue 330 degrees -- the actual seven above measure out to
  // 25/45/95/150/195/230/280 (see comment above), leaving one real gap
  // between Reports (280, purple -- see tabReports' own comment for why
  // that hue moved to tabPurpleDigest below, after this color was already
  // placed relative to it) and Signals (25, orange); 330 sits in the
  // middle of that gap, a rose/pink no other tab is using. Verified at
  // ~3.23:1 against `menuSurface`, in line with the rest of the set.
  tabProfile: '#E29CBF',
  // The Purple Digest's own identity color -- the new autoimmune learning/
  // news area (see the 2026-07-27 conversation this was named and designed
  // in -- "Field Notes" and "Autoimmune Intelligence"/AI and "Autoimmune
  // Inside Story"/AIS were all considered and rejected first, the latter
  // two for real collisions with the AI initialism and with Androgen
  // Insensitivity Syndrome respectively). Deliberate, not a coincidence:
  // purple is the real-world universal color for autoimmune disease
  // awareness (the awareness ribbon), which is worth more here than
  // slot-filling an unused hue gap would be.
  // Originally reused Reports' exact former purple (hue 280) verbatim --
  // corrected the same day, reported as reading more pink than purple on
  // an actual device. 280 sits right at the boundary where this palette's
  // shared pastel formula (55% saturation, 75% lightness) starts leaning
  // magenta rather than violet (R and B channels landing close together,
  // both well above G, is what reads as "pink" rather than "purple" to the
  // eye). Rotated to hue 262 instead -- same formula, same neighbors'
  // spacing still comfortable (32 degrees from Schedules at 230, 68 from
  // Profile at 330) -- where B pulls clearly ahead of R, reading as an
  // unambiguous violet-purple instead.
  //
  // 2026-07-28: reported as still not "purply" enough even at the right
  // hue -- same fix already proven on tabSchedules (see that color's own
  // comment): saturation and lightness bumped together, 55%->80% and
  // 75%->82%, same hue (262), same idea as there ("still the same color
  // family, just a stronger version of it"). Checked, not assumed: this
  // also raises contrast against `menuSurface` from ~2.9:1 to ~3.5:1,
  // moving it further above the 3:1 floor this whole set is held to
  // rather than risking it on a change that looked richer but read worse.
  //
  // 2026-07-28 (same day, later): asked to match a real photo of a purple
  // awareness ribbon (Screenshots/purple-ribbon-meaning.png) rather than
  // eyeball a closer purple -- measured, not guessed: decoded the PNG
  // (pngjs) and scanned every pixel for the awareness-ribbon's own
  // purple-ish tones (excluding the photo's black background and deep
  // shadow folds), bucketed by rounded color, ranked by frequency. Hue
  // held remarkably steady across every bucket regardless of how dark or
  // lit that part of the fabric was (277-280 degrees, all consistent).
  // Rotated hue from 262 to 278 to match it -- reverted the same day,
  // reported as reading pink again on an actual device. In hindsight this
  // re-created the exact problem hue 280 already caused earlier in this
  // same comment (R and B channels landing too close together at this
  // saturation/lightness): 278 has an R-B gap of only -27 versus 262's
  // -47, not nearly enough separation to clear the same pink/magenta
  // boundary documented above. The ribbon photo's own real hue simply
  // sits inside that boundary at this palette's saturation/lightness
  // recipe -- now that the ribbon icon itself is a recolorable vector
  // shape (see components/PurpleRibbonIcon.tsx), not a raster photo, there's
  // no remaining reason to chase the photo's exact hue over one that
  // actually reads as purple, so this reverts to 262 for good.
  tabPurpleDigest: '#C7ACF6',
  // Garden's own identity color, changed 2026-08-13, direct request:
  // "let's try using 'Forest Green' (Hex #228B22)" -- a deliberate,
  // real-world color choice, not another member of the computed
  // hue-spread pastel formula every other tab color above uses. That
  // first value's own comment named a real, honest tradeoff and predicted
  // exactly this: "meaningfully darker/more saturated than every other tab
  // color... roughly 1.6:1 [against menuSurface]... worth a real on-device
  // look and a second pass if it reads as hard to see once actually
  // seen." Confirmed the same day, direct report: "This green is a bit
  // too much for the eyes to deal with... I still think it should be a
  // green color but one that isn't so intense." Replaced with Emerald
  // (#50C878), another real, named color rather than a computed one --
  // same green family, genuinely softer and brighter rather than dark and
  // saturated. Real, checked improvement, not just a guess: contrast
  // against `menuSurface` rises from ~1.6:1 to ~3.3:1, clearing the same
  // 3:1 floor every other tab color here is held to.
  tabGarden: '#50C878',
};

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

// Lightens a hex color by mixing its own lightness toward 100% by
// `fraction` (0-1) -- NOT adding a flat number of percentage points, which
// would clip straight to white for most of this app's own tab colors:
// they're already a light pastel set (55-80% saturation, 75-82%
// lightness -- see e.g. tabFood/tabSchedules' own comments), so there's
// only 18-25 points of headroom left before 100% to begin with. A fixed
// add of, say, 25 points would blow straight past that for nearly every
// tab color and land on flat white regardless of which tab it started
// from -- checked this against tabFood (#B9E29C, L~74%) while building the
// input-box background below and confirmed a flat +25 did exactly that.
// Mixing toward white by a fraction of the REMAINING headroom instead
// keeps a visible trace of the source hue at any starting lightness.
export function lighten(hex: string, fraction: number): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  const newL = l + (1 - l) * fraction;

  const c = (1 - Math.abs(2 * newL - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = newL - c / 2;
  let [r2, g2, b2] = [0, 0, 0];
  if (h < 60) [r2, g2, b2] = [c, x, 0];
  else if (h < 120) [r2, g2, b2] = [x, c, 0];
  else if (h < 180) [r2, g2, b2] = [0, c, x];
  else if (h < 240) [r2, g2, b2] = [0, x, c];
  else if (h < 300) [r2, g2, b2] = [x, 0, c];
  else [r2, g2, b2] = [c, 0, x];

  const toHex2 = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex2(r2)}${toHex2(g2)}${toHex2(b2)}`;
}

// 2026-08-17: the whole iridescent system that used to live here
// (hueShift, IRIDESCENT_PALETTE, rotatedIridescentPalette, iridescentSheen)
// is removed entirely -- a real, confirmed, continuous battery drain, not
// just a visual choice. ScreenHeader.tsx's own app-name text needed the
// rotating rainbow driven through a real JS-thread bridge (react-native-svg's
// <Stop> can't be animated purely on the native thread), which fired up to
// 10 times a second, the whole time the app was open on any tab -- reported
// directly, investigated, and root-caused, not guessed at. What replaces it:
// every screen's header/footer text and lines, TabHub's popup card border,
// and the app's floating hub icon (Home included) are now flat, static
// colors -- see components/GenericBackground.tsx's own GENERIC_BACKGROUND_
// PALETTES (each combination now carries an explicit `lighter` accent used
// for exactly this) and components/IridescentRingCircle.tsx (the "this is
// selected" ring, now a flat colors.primary border, no animation, no
// gradient trick needed since it's one color). "Features that stay active
// but not animated" -- the explicit direction this replacement follows.

// How much lighter than a tab's own identity color an entry/input box's
// background tint is, and at what fixed alpha over whatever sits behind
// it (colors.surface, normally) -- one shared recipe, so that when this
// rolls out beyond the Side Dish Builder it's being previewed on first,
// every input box across the app uses the exact same look rather than a
// close-but-different one per screen. Tune LIGHTEN_FRACTION/ALPHA here,
// not per call site, while the look gets dialed in.
const INPUT_BACKGROUND_LIGHTEN_FRACTION = 0.35;
const INPUT_BACKGROUND_ALPHA = 0.35;

// A fully opaque counterpart to inputBackground above, for a PopoverSelect
// popover's own floating list surface (see PopoverSelect.tsx's own
// `tintedSurface` prop) -- same lighten fraction, so the closed field and
// its own open list read as the same "lighter" family, but opaque rather
// than alpha-blended: the popover floats via a portal over arbitrary
// content (OverlayContext.tsx), not a known card background the way a
// closed field sits on, so alpha isn't a safe option here. 2026-08-08,
// added for Profile's own picker fields: "dark grey [for] the line and
// lighter grey for the field and scrollable table backgrounds" -- the
// existing `inputBackground` above already handles the field; this is the
// missing other half, for the list itself.
export function popoverBackground(tabColor: string): string {
  return lighten(tabColor, INPUT_BACKGROUND_LIGHTEN_FRACTION);
}

export function inputBackground(tabColor: string): string {
  return hexToRgba(lighten(tabColor, INPUT_BACKGROUND_LIGHTEN_FRACTION), INPUT_BACKGROUND_ALPHA);
}
