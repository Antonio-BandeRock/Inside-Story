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
  surface: 'rgba(69, 84, 111, 0.85)',
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
  surfaceMuted: 'rgba(56, 69, 106, 0.85)',
  border: '#5C6F94',

  // AppKeyboard's own letter/digit keycap color, added 2026-07-27 -- a
  // lighter blue than `border` above so the keys read as raised/tappable
  // against the keyboard's own container (which deliberately matches the
  // flat footer color, `background`, below -- see AppKeyboard.tsx's own
  // comment). Same ~221-degree blue hue as `background`/`border`, just
  // lighter, rather than an unrelated color, so the keyboard still reads as
  // part of this app's palette instead of a generic gray keypad.
  keySurface: '#7E97C4',

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
  // hue-spread pastel formula every other tab color above uses. Real,
  // honest tradeoff worth naming directly rather than silently glossing
  // over: this is meaningfully darker/more saturated than every other tab
  // color, and its own real luminance-contrast ratio against
  // `menuSurface` (computed via the same WCAG relative-luminance formula
  // this whole palette is otherwise held to) comes out to roughly 1.6:1 --
  // well below the 3:1 floor every OTHER tab color here clears. Left as
  // the person's own explicit, named choice rather than silently
  // adjusted or reverted; worth a real on-device look and a second pass
  // if it reads as hard to see once actually seen.
  tabGarden: '#228B22',
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
  // 2026-07-28: marked as a Reanimated worklet -- rotatedIridescentPalette
  // below (which calls this once per stop) now runs entirely on the UI
  // thread, driven by a Reanimated shared value instead of a JS setInterval
  // forcing React re-renders (see hooks/useIridescentHueRotation.ts's own
  // history for why). The 'worklet' directive is what lets Reanimated's
  // Babel plugin generate a UI-thread-runnable copy of this function --
  // without it, calling this from a worklet context throws at runtime.
  'worklet';
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

// Every tab's real identity color (constants/tabs.ts's TAB_ROUTES, sampled
// from the butterfly artwork), swept in hue order -- warm gold, green,
// teal, periwinkle, sky blue, purple (Purple Digest, added 2026-08-05 when
// it was promoted from a Stack-push screen to a real tab -- see
// constants/tabs.ts), grayscale Reports, warm terracotta, Forest Green
// (Garden, added 2026-08-13, then changed to a deliberate real-world green
// -- see tabGarden's own comment above -- the one real, deliberate break
// from the rest of this palette's own computed-pastel hue-spread system).
// The one shared
// base palette for every iridescent element in the app (the header's own
// app-name text, its divider line, and the footer's divider line above
// TabHub) so all of them cycle through the exact same colors rather than
// each defining its own separate set that could drift apart.
export const IRIDESCENT_PALETTE: readonly [
  string, string, string, string, string, string, string, string, string,
] = [
  colors.tabHome,
  colors.tabFood,
  colors.tabInsights,
  colors.tabSchedules,
  colors.tabTrends,
  colors.tabPurpleDigest,
  colors.tabReports,
  colors.tabBioCompass,
  colors.tabGarden,
];

// IRIDESCENT_PALETTE, hue-rotated by the same amount for every stop --
// pass a value from useIridescentHueRotation (hooks/useIridescentHueRotation.ts)
// to get every iridescent element's colors at the current moment, all in
// lockstep since that hook derives its value from the wall clock rather
// than a per-component counter.
//
// Note: every real consumer of this function (ScreenHeader, ScreenBackground,
// IridescentRingCircle) hands the whole returned array straight to a
// LinearGradient's own `colors` prop -- none of them destructure by a fixed
// position -- so widening this array's own length (as just happened for
// Garden, above) is always safe without touching any consumer.
export function rotatedIridescentPalette(
  hueRotation: number,
): readonly [string, string, string, string, string, string, string, string, string] {
  'worklet';
  return IRIDESCENT_PALETTE.map((color) => hueShift(color, hueRotation)) as [
    string, string, string, string, string, string, string, string, string,
  ];
}
