import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Fragment, useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import {
  FLOATING_BUTTON_SIZE,
  SECONDARY_HUB_CARD_LEFT_MARGIN,
  useBottomLeftHubPosition,
  useMenuCardBottom,
} from '../constants/floatingButton';
import { TAB_ROUTES } from '../constants/tabs';
import { TAB_REVEAL_DURATION_MS } from '../constants/tabReveal';
import { textShadow, typography } from '../constants/typography';
import { HelpSheet, type HelpSection } from './HelpButton';
import { IridescentRingCircle } from './IridescentRingCircle';

export type LensOption<T extends string> = {
  key: T;
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  // Explicitly requested, 2026-07-26: every option gets its own Info
  // entry now (see the new bottom-left Info tile below), not just one
  // page-level explanation -- optional only because it's rolled out
  // per-screen as each one's own content gets written, not because
  // showing nothing is an acceptable end state for a real option.
  help?: HelpSection[];
  // Overrides just the grid item's own label text, independent of `label`
  // (still used everywhere else this option's name appears -- the Info
  // sheet's own heading, activeLensLabel, etc.) -- 2026-08-07, added for
  // Digest's own longer category names. A label left to wrap on its
  // own (see itemLabelLines) breaks wherever plain word-wrap happens to
  // land, which isn't always the most readable split ("Other Autoimmune" /
  // "Diseases" reads fine; a name that wrapped mid-phrase wouldn't).
  // `gridLabel`, when set, carries an explicit "\n" at a deliberately
  // chosen, logical spot (e.g. after a "&") instead -- React Native's Text
  // renders a literal "\n" as a real line break. Optional: every other
  // page's options keep rendering plain `label` as before, letting it wrap
  // (or not) on its own.
  gridLabel?: string;
  // Overrides just this ONE grid item's own icon with a real, custom
  // component (react-native-svg or otherwise) instead of the plain
  // `icon` Ionicons glyph -- 2026-08-09, added for Digest's own 19
  // condition-specific vector icons (see components/DigestConditionIcons.tsx),
  // the same real "swap one icon for a custom component" pattern this app
  // already uses for the Digest TAB icon itself (TabHub.tsx's own
  // renderIcon special-case), just applied per grid item instead of per
  // page. `icon` above is still required regardless -- it's the real
  // fallback for any option that doesn't set this, and stays what every
  // other page's own options render unchanged.
  renderIcon?: (size: number, color: string) => ReactNode;
  // Real, plain-text section label shown once, above the first option of
  // its own kind -- 2026-08-18, added for Insights specifically (13
  // options had grown into one undifferentiated grid, reported directly:
  // "it is hard to know which lenses are for what"). Purely additive:
  // undefined for every existing page's own options, which render exactly
  // as before, one flat grid with no headers at all. When set on ANY
  // option, the grid groups consecutively-same-group options under one
  // real header each (see the render below) -- options must already sit
  // in the right order in the array for this to read correctly; nothing
  // here re-sorts them.
  group?: string;
  // A thin horizontal rule rendered above this option, forcing it (and
  // everything after it) onto a fresh row -- 2026-08-21, added for Digest
  // specifically: "separate the conditions from the rest of the icons by
  // making a separation line below the rest of the icons... if the user
  // selects that they have any of the conditions then the icon for the
  // conditions they say they have can move up to above the line, after
  // the other icons." Deliberately a separate, simpler mechanism from
  // `group` above, not a reuse of it -- `group` always renders a real
  // text header (Insights' "Today"/"Explore & Look Up"/etc.), which isn't
  // wanted here; this is just a plain visual divider with no label of its
  // own. Like `group`, set this on the single option that should have the
  // line above it (the first item below the boundary) -- the grid doesn't
  // infer boundaries on its own.
  dividerBefore?: boolean;
};

// 2026-07-26: widened from 260 -- that size was tuned against Insights/
// Schedule/Signals's own longest labels ("Cooking & Prep",
// "Prescriptions", "Food Reactions"), but Food's own seven builder names
// run longer still ("Fermentation Builder", "Beverage Builder", "Smoothie
// Builder"), and were getting cut off at that width. One shared constant
// already means every page's card is the same size by construction -- the
// fix is sizing that one constant to fit the app's longest real case
// (Food's) instead of a shorter one, so every page benefits, not just Food.
const CARD_WIDTH = 300;

// Caps how far this popup's own text can grow under the device's system
// font-size accessibility setting -- React Native's Text scales with that
// setting by default (allowFontScaling defaults to true, and this app
// never turns it off), which is the right call in general, but this
// popup's own layout (fixed CARD_WIDTH/CARD_HEIGHT, single-line labels
// with ellipsizeMode="tail") is tuned against a specific text size and
// starts truncating hard past a point. Tested directly, 2026-07-27, on a
// Samsung Galaxy A54 (9-step system font scale, step 4 = that phone's own
// default): 2 steps above default stayed readable, anything past that
// didn't. 1.3 is set to land around that same tested "still fine" ceiling
// -- if it's still too cramped (or too conservative) once actually
// retested at the "too high" step, adjust this one number rather than
// hunting down every Text below individually.
const LABEL_MAX_FONT_SCALE = 1.3;

// What the Info tile shows when nothing's selected yet -- 2026-08-07,
// explicitly requested: "When I touch any Info button in any lens prior to
// touching a lens first, there needs to be a short message explaining they
// need to tap one of the functions to see the information about that
// function." Previously the Info tile was simply disabled (a silent no-op)
// until a real selection existed; now it's always tappable, and opens the
// same HelpSheet used for a real option's own content, just with this one
// generic section instead. Deliberately NOT used for a real, selected
// option that just doesn't have its own `help` authored yet (see
// LensOption's own `help?` comment) -- that's a different, narrower case
// (this page's own content rollout still in progress), kept disabled as
// before rather than shown this "pick a function" message, which would be
// actively wrong there since a function IS already picked.
const NO_SELECTION_HELP: HelpSection[] = [
  {
    heading: 'Choose a function first',
    body: 'Tap one of the functions above to see information about it.',
  },
];

// A stronger, more visible shadow than constants/typography.ts's shared
// textShadow -- specifically for this button's icon, which (unlike every
// other icon in this app that already uses textShadow) sits directly on
// the flat dark footer strip with no lighter card behind it, where the
// ordinary shadow's low opacity/tiny radius reads as barely-there. Bigger
// offset and radius, higher opacity, so it still shows up as a real drop
// shadow against a background nearly as dark as the shadow color itself.
const CORNER_ICON_SHADOW = {
  textShadowColor: 'rgba(0, 0, 0, 0.9)',
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 5,
} as const;

// Card WIDTH is already uniform by construction (one shared constant,
// above) -- but HEIGHT wasn't: this card sizes to its own content, so a
// page with fewer options (Reports' single placeholder, one row) rendered
// a visibly smaller card than Food's seven builders (four rows). Explicitly
// requested to be the exact same size as Food's, every page, no exceptions
// -- a first pass used `minHeight` computed to roughly match Food's own
// 4-row footprint, but a *floor* still lets Food's own real content render
// taller than that estimate if the estimate undershoots even slightly
// (font metrics are approximated below, not measured), which would leave
// Food's card larger than every other page's again. `height` (a hard cap,
// paired with `overflow: hidden` on the card itself so nothing bleeds past
// it) instead guarantees every single card -- Food's own included -- comes
// out pixel-identical, regardless of whether this estimate is exactly
// right.
//
// GRID_ITEM_PILL_SIZE (34) and GRID_ITEM_ICON_SIZE (20) match TabHub's own
// ICON_PILL_SIZE/icon size exactly -- explicitly requested so this popup's
// own option icons get the same treatment as the butterfly menu's: a
// plain icon at rest, the same IridescentRingCircle ring when selected
// (see the grid's own render below). The row height below is driven by
// the PILL's footprint (34), not the bare icon's (20), since every row
// reserves that same 34px regardless of which item in it happens to be
// selected -- matching TabHub's own iconPillPlain, which does the same so
// its grid doesn't jump around as the active item changes.
const GRID_ITEM_PILL_SIZE = 34;
const GRID_ITEM_ICON_SIZE = 20;
// 2026-08-09, custom option.renderIcon icons (Digest's own 19 real
// condition-artwork icons, the only current caller) get a real, bigger
// render size than the plain Ionicons glyphs every other page's grid uses
// -- reported directly as reading too small. Deliberately NOT a change to
// GRID_ITEM_ICON_SIZE itself, which every other page's own glyphs (and
// this popup's Info icon) still use unchanged -- a real, custom image
// icon reads differently at a given pixel size than a vector glyph does,
// and this was asked for specifically after the artwork icons shipped,
// not as a general "make every grid icon bigger" request. This doesn't
// touch GRID_ROW_HEIGHT or any other layout math below, which is driven
// only by GRID_ITEM_PILL_SIZE's own footprint, not the icon's.
//
// Raised from 28 to 30, its real technical ceiling given the current pill
// size, same day: "they could be a little bigger still." 30 is the actual
// max this geometry allows without restructuring the pill/ring itself --
// IridescentRingCircle's own inner white circle (what an active item's
// icon sits inside) is `size - ringWidth * 2`, and with GRID_ITEM_PILL_SIZE
// (34) and the ring's own default 2px width, that's exactly 34 - 4 = 30;
// anything larger would visually spill past that inner circle's own edge
// and overlap the animated ring itself once a tile is selected. Going
// bigger than 30 for real would mean growing GRID_ITEM_PILL_SIZE itself
// (or a Purple-Digest-specific pill size), which -- since GRID_ROW_HEIGHT
// and every page's own shared, pixel-identical CARD_HEIGHT are both built
// on that one constant -- would ripple into every other page's grid row
// height too, a real, bigger structural change than what's been asked for
// so far.
const GRID_ITEM_CUSTOM_ICON_SIZE = 30;
const GRID_ITEM_GAP = 2;
const GRID_ITEM_PADDING_VERTICAL = 6;
const GRID_ITEM_LABEL_LINE_HEIGHT = 14; // itemLabel's own fontSize (11) * ~1.3
const GRID_ROW_HEIGHT = GRID_ITEM_PADDING_VERTICAL * 2 + GRID_ITEM_PILL_SIZE + GRID_ITEM_GAP + GRID_ITEM_LABEL_LINE_HEIGHT;
const CARD_HEADER_HEIGHT = 20; // cardHeader's own fontSize (10) * ~1.3 + its marginBottom (6)
const CARD_PADDING_VERTICAL = 8 * 2; // card's own paddingVertical, top + bottom
// Food's own grid switched to 3 columns, 2026-07-27, explicitly requested
// (see `columns`/`infoInGrid` below) -- 9 builders across 3 columns is
// exactly 3 full rows, plus a 4th row for Info (see infoInGrid's own
// comment for why Info moves into the grid, not the floating corner,
// whenever a page passes `columns`). 4 total, actually *fewer* than the
// 5 rows this was set to briefly under the old 2-column layout. Every
// page's card grows or shrinks with this constant, not just Food's -- see
// CARD_HEIGHT's own comment for why that's one shared value.
const FOOD_ROW_COUNT = 4;
// The further `+ 5`, 2026-07-26: even accounting for the taller pill rows
// above, Food's own card was reported as still too short for its content
// -- explicitly requested a flat 5px added on top, applied to every page's
// card (not just Food's) since they're all the same fixed height by
// construction.
//
// A `+ 1` row was added here briefly, same day, to reserve a dedicated row
// for the new Info tile underneath the options grid -- reverted the same
// day once seen on-device: it grew every page's card by a whole extra row,
// which pushed Food's card (the one page with zero existing slack -- see
// below) up into GatedTabContent.tsx's own resting-prompt textbox. Info now
// floats in the card's own bottom-right corner instead (see the render
// below), which needs no extra height at all -- explained next.
//
// Since CARD_HEIGHT is one fixed size shared by every page (built from
// Food's own worst case, FOOD_ROW_COUNT -- still the tallest of any page's
// grid even after moving to 3 columns; Schedule's own 6 options in 2
// columns is the next tallest, at 3 rows), every other 2-column page has
// genuine blank vertical space below its own (shorter) grid, inside this
// same fixed box -- that's where their own Info tile floats (see
// infoCorner below), comfortably clear of their real icons regardless of
// whether their own last row happens to fill both columns. Food itself no
// longer relies on this at all -- see infoInGrid's own comment for why its
// own Info sits inside the grid instead, on its own dedicated 4th row.
const CARD_HEIGHT = CARD_HEADER_HEIGHT + FOOD_ROW_COUNT * GRID_ROW_HEIGHT + CARD_PADDING_VERTICAL + 5;

// card's own paddingHorizontal (left/right, matching CARD_PADDING_VERTICAL's
// naming above, which only covers top+bottom) -- needed below to work out
// exactly where the grid's own right-column icons sit, in absolute terms.
const CARD_PADDING_HORIZONTAL = 8;
// Each grid item is 50% of the card's own inner content width (see the
// `item` style below) -- the right column's own icons sit centered within
// the second of those two halves.
const GRID_COLUMN_WIDTH = (CARD_WIDTH - CARD_PADDING_HORIZONTAL * 2) / 2;
// Explicitly requested, 2026-07-27: the Info tile (see infoCorner below)
// needs to line up, center to center, with the grid's own right-column
// icons above it -- it was just pinned to the card's raw right edge before,
// which put its own icon noticeably further right than the real column of
// icons it sits underneath. Right-column icon center, measured as a
// distance in from the card's own right edge: skip the left column
// entirely, land in the middle of the right one.
const RIGHT_COLUMN_ICON_CENTER_FROM_RIGHT = CARD_WIDTH - CARD_PADDING_HORIZONTAL - GRID_COLUMN_WIDTH * 1.5;
// infoCorner has no explicit width, so it sizes to its own widest child --
// the icon pill (GRID_ITEM_PILL_SIZE), wider than the short "Info" label
// beneath it -- meaning its own icon's center sits exactly half a pill
// width in from wherever `right` is set. Back that out so the icon itself,
// not the tile's outer edge, is what actually lines up with the column
// above.
const INFO_CORNER_RIGHT = RIGHT_COLUMN_ICON_CENTER_FROM_RIGHT - GRID_ITEM_PILL_SIZE / 2;

// The same floating-hub pattern as TabHub (components/TabHub.tsx), one
// level down: instead of picking which app tab to go to, this picks which
// view within the CURRENT tab is active. Replaces the horizontal row of
// tab pills that used to sit under the header on any screen with more than
// one view (Insights, Schedule, Signals) -- same size, same popup
// format. The screen using this is responsible for showing which option is
// currently selected via PageIdentityLabel's own activeLensLabel prop (see
// components/PageIdentityLabel.tsx), rendered in the screen's bottom
// corner rather than up in ScreenHeader now.
//
// 2026-07-25: the trigger button itself was redesigned to double as a "you
// are in this tab" marker -- rather than a generic list icon, it shows the
// SAME icon this page has in TabHub's own picker (looked up here by
// matching `pageTitle` against TAB_ROUTES), enlarged, tinted in that tab's
// own identity color, with a diagonal light/color sheen meant to echo the
// butterfly artwork's own iridescence. Icon shape still differs per tab
// (calendar vs. compass vs. medical cross) on top of the color, the same
// shape-plus-color pairing already used for TabHub's colorblind-accessible
// active pill -- color is reinforcement here, not the only signal.
// Anchored to the screen's true bottom-left corner (useBottomLeftHubPosition)
// instead of "one slot left of TabHub" -- being the one hub that identifies
// *which tab you're in* earns it the corner. This is also the one spot to
// flip to the opposite corner whenever the deferred left/right-handed
// layout switch (see CLAUDE.md's Next Steps) gets built. Insights' own
// ScopeHub (app/(tabs)/insights.tsx) moved the other direction, into the
// slot this button vacated, to avoid the two overlapping.
export function LensHub<T extends string>({
  pageTitle,
  options,
  selected,
  onSelect,
  icon,
  renderIcon,
  color,
  headerLabel,
  buttonLabel,
  extraTile,
  columns = 2,
  infoInGrid = columns !== 2,
  itemLabelLines = 1,
  autoOpenSignal,
  gridPillSize = GRID_ITEM_PILL_SIZE,
  gridCustomIconSize = GRID_ITEM_CUSTOM_ICON_SIZE,
  gridIconSize = GRID_ITEM_ICON_SIZE,
}: {
  // Used to find this page's own entry in TAB_ROUTES, for the trigger
  // button's icon/color (see below) -- must match a `title` there exactly.
  // Also the popup's own header text, unless headerLabel overrides just
  // that (see below). Every tab except Home now has one of these (Home has
  // nothing else inside it to switch between); Trends and Reports
  // currently pass a single placeholder option each until their real
  // sub-views are designed.
  pageTitle: string;
  options: LensOption<T>[];
  // T | undefined, not just T -- explicitly corrected 2026-07-26. Every
  // screen's own `lens` state defaults to its first option (has to start
  // somewhere), so passing that value straight through here made the
  // first item's ring show immediately on arrival, before anything had
  // actually been tapped -- the ring is supposed to mean "this is what
  // you picked," not "this is what the state happens to default to."
  // Callers now pass `revealed ? lens : undefined` (see e.g.
  // app/(tabs)/food.tsx), so `active` below is only ever true once a real
  // selection has happened.
  selected: T | undefined;
  onSelect: (key: T) => void;
  // Explicit override for the trigger button's icon/color, 2026-07-27 --
  // added for Home's own new corner button into The Digest, which
  // (like Profile) is deliberately NOT in TAB_ROUTES (a Stack push, not a
  // swipeable tab), so the usual pageTitle -> TAB_ROUTES lookup below has
  // nothing to find. Optional: every existing call site keeps working
  // unchanged, since real tabs still resolve their own icon/color from
  // TAB_ROUTES as before.
  icon?: ComponentProps<typeof Ionicons>['name'];
  // Replaces the corner button's icon with fully custom content instead of
  // an Ionicons glyph, 2026-07-28 -- added for Home's own Digest
  // button, whose vector "ribbon" glyph read as a race/award rosette
  // rather than an actual awareness ribbon (see PurpleRibbonIcon.tsx's own
  // history -- a raw photo was tried and reverted first, for not standing
  // out against the dark background and not taking a drop shadow the way
  // every other icon here does). Called with the same pixel size the
  // Ionicons glyph would have rendered at, so custom icons line up with
  // the rest of this button's layout automatically. Takes over the icon
  // slot entirely when passed (still inside the same open/closed
  // IridescentRingCircle treatment as the Ionicons path) -- `icon`/`color`
  // themselves are ignored for the corner button in that case, but every
  // other page keeps using plain `icon` as before.
  renderIcon?: (size: number) => ReactNode;
  color?: string;
  // Overrides just the popup's own header text, independent of pageTitle
  // (still used for the TAB_ROUTES lookup above) -- added for Food's own
  // "Nutrition Builders" header, 2026-07-27: every one of Food's options is
  // a builder, so that's said once here instead of repeated in each
  // option's own label (see FOOD_LENSES in app/(tabs)/food.tsx, which
  // dropped "Builder" from every label the same day). Optional: every
  // other page keeps showing its own pageTitle as before.
  headerLabel?: string;
  // Overrides just the corner trigger button's own label (below its
  // icon, 2026-07-27) -- independent of headerLabel, since the two don't
  // always want the same text. Food's own popup header reads "Nutrition
  // Builders" (headerLabel), but its corner button just says "Food"
  // (this); Home's own Digest corner button says "Digest" (this)
  // while its popup keeps the full "The Digest" (pageTitle, no
  // headerLabel override needed there). Falls back to headerLabel, then
  // pageTitle, same as the popup's own header does -- most callers don't
  // need this at all.
  buttonLabel?: string;
  // A single, extra, real tile pinned at the very FRONT of the grid (top-
  // left), rendered before any of `options` -- 2026-08-16, explicitly
  // requested: "I think maybe the My Foods icon should be where it is AND
  // in the Food LensHub menu at the top left... They can still pop up
  // right where it already is, but only after it closes the Food LensHub
  // menu first." Distinct from a real LensOption on purpose -- it doesn't
  // correspond to any `T` (this page's own set of views), so it never
  // shows the active-selection ring and never calls `onSelect`. Tapping it
  // instead reuses the identical close-then-fire sequencing `choose()`
  // already uses for a real selection (see chooseExtra below): this popup
  // closes first, and only once it's actually gone does `onPress` fire --
  // so a caller wiring this to e.g. MyItemsHub's own new `open`/
  // `onOpenChange` props (see that component) gets the exact "close this
  // menu, THEN open that one, at its own already-established position"
  // sequencing asked for, not the two popups fighting for the screen at
  // the same instant. Optional -- every existing page that doesn't pass
  // this renders its grid exactly as before, with nothing new at the front
  // of it.
  extraTile?: {
    label: string;
    icon: ComponentProps<typeof Ionicons>['name'];
    onPress: () => void;
  };
  // Grid width, default 2 -- every page except Food. Food's own 9 options
  // explicitly asked to lay out 3 wide, 4 tall (2026-07-27), with Info
  // centered on that 4th row (see infoInGrid below) rather than floating
  // in the corner the way every 2-column page's own Info tile still does.
  columns?: number;
  // Whether the Info tile renders as a real grid item (a trailing tile
  // right after the real options) instead of floating over the card's own
  // bottom-right corner. Defaults to `columns !== 2` -- i.e. every existing
  // 3-column page (just Food, historically) already got this for free
  // without asking for it explicitly, and every 2-column page kept the
  // floating corner, matching the behavior this prop replaces.
  //
  // 2026-08-07: made independently settable, not just implied by column
  // count -- Digest needed 2 columns for its own long category
  // labels to read comfortably (see itemLabelLines/gridLabel below), but
  // the floating corner Info tile it fell back to under the old `columns
  // !== 2` rule was then reported as sitting on top of/getting in the way
  // of the real grid content once that grid grew tall enough to scroll --
  // a problem the corner trick was never actually designed to handle (see
  // CARD_HEIGHT's own comment: that trick assumes the card's own bottom-
  // right corner is always blank, true for a short 2-column grid that
  // never scrolls, not true once a grid genuinely overflows). Purple
  // Digest now passes `infoInGrid={true}` explicitly to get a real grid
  // tile at 2 columns, a combination the old `columns !== 2` shortcut
  // couldn't express on its own.
  //
  // When true and `columns` is odd (Food's 3), Info still centers on its
  // own fresh row exactly as before. When true and `columns` is even
  // (Digest's 2), there's no true middle column to center on, so
  // Info simply renders as the next tile after the last real option --
  // filling whatever slot that naturally is (the empty half of an
  // otherwise-odd last row, or alone on a fresh row if the last row was
  // already full).
  infoInGrid?: boolean;
  // How many lines an option's own label can wrap to before truncating,
  // default 1 (every existing page's labels were already tuned to fit one
  // line at CARD_WIDTH's 2-column default). 2026-08-07: added for Purple
  // Digest specifically, whose real category names ("Mitochondria &
  // Metabolism", "Other Autoimmune Diseases") run meaningfully longer than
  // any other page's own lens labels and were reading as truncated,
  // unreadable ellipses at 1 line -- explicitly requested as "two rows"
  // rather than shortening the names themselves, which would have lost
  // real meaning. Only changes numberOfLines on the grid's own item labels
  // (below) -- the corner trigger button's label and the Info tile's own
  // short "Info" text are unaffected regardless of this prop, since
  // neither has ever needed more than one line.
  itemLabelLines?: number;
  // Set to a fresh, ever-changing value (e.g. a timestamp string) whenever
  // this popup should open itself automatically, 2026-08-08 -- see
  // hooks/useAutoOpenLensHubSignal.ts for the full reasoning behind why
  // this is finally safe to reintroduce (scoped to a real "picked from
  // TabHub" signal, unlike the two earlier, reverted attempts named just
  // below). A screen that never wants this can simply omit the prop.
  autoOpenSignal?: string;
  // 2026-08-09, explicitly requested for Digest specifically: "the
  // iridescnt circle that is supposed to go around the tapped icon in
  // Digest isn't big enough on any of them, and... they appear to be
  // smaller than the ones used in the other LensHub menus." True even
  // though option.renderIcon's own real artwork (see
  // components/DigestConditionIcons.tsx) is already asked to render at 30
  // -- GRID_ITEM_CUSTOM_ICON_SIZE's own real technical ceiling given the
  // DEFAULT ring geometry (see that constant's own comment) -- because
  // none of the 19 real condition PNGs are square: `contain` fits each
  // one's own real, measured aspect ratio (0.652-1.362) inside that box,
  // so the shorter edge of most of them renders meaningfully smaller than
  // the full 30px ceiling, reading as smaller/loose inside the ring even
  // though the box itself hasn't changed. Rather than force a page-wide
  // change (GRID_ITEM_PILL_SIZE/GRID_ITEM_CUSTOM_ICON_SIZE stay the
  // shared default for every other page's own grid, including Purple
  // Digest's own 4 non-condition Ionicons tiles unless this is also
  // passed), these three optional overrides let ONE page's grid render at
  // a genuinely bigger ring/icon size without touching GRID_ROW_HEIGHT/
  // CARD_HEIGHT (both stay fixed, shared module constants sized off the
  // DEFAULT pill -- `item`'s own style has no fixed height, so a bigger
  // pill here just makes that one page's own rows taller in the natural
  // content flow, which Digest's grid already scrolls past its
  // one shared CARD_HEIGHT window regardless).
  gridPillSize?: number;
  gridCustomIconSize?: number;
  gridIconSize?: number;
}) {
  // 2026-07-26: used to auto-open on arrival (a `forceOpen` prop, driven by
  // the calling screen's own GatedTabContent.tsx resting state) so the
  // picker was already showing during "select a function" instead of
  // sitting collapsed behind this button. Reverted -- it meant every swipe
  // into a tab landed on an already-open popup that had to be tapped away
  // before the person could then swipe again to keep going. Closed by
  // default now; GatedTabContent's own resting prompt names this exact
  // button (same icon, same color) instead of opening it automatically.
  //
  // 2026-07-27: reintroduced via an `openSignal` prop, then reverted again
  // the same day for the identical reason once actually tried -- same
  // swipe-through friction, confirmed a second time. Don't reintroduce
  // this without a real mitigation for that specific problem (e.g. only
  // auto-opening on a page's true first visit each session, not every
  // arrival).
  //
  // 2026-08-08: reintroduced a third time, this time via `autoOpenSignal`
  // above -- the real mitigation this comment asked for. Unlike both
  // earlier attempts, the signal driving this one is sourced from a real,
  // narrow event (a genuine TabHub tap or Home's Digest shortcut,
  // see useAutoOpenLensHubSignal's own comment) that a horizontal swipe
  // between tabs never produces, so the exact swipe-through friction named
  // above can't recur through this path.
  const [open, setOpen] = useState(false);
  // Same fix as TabHub's own Modal (components/TabHub.tsx) -- see that
  // file's longer comment for the full reasoning and the real, captured
  // timing data behind it: the card's own layout was already correct on
  // its first and only pass, but Android hadn't confirmed its native
  // Dialog window was actually up yet when it committed. Keeping the card
  // invisible until onShow, rather than the instant `open` becomes true,
  // means it can only ever become visible once the window is genuinely
  // ready. Also reset (alongside its own onPress reset below) by the
  // autoOpenSignal effect further down -- see that effect's own comment
  // for why that reset turned out to be load-bearing, not just tidiness.
  const [cardReady, setCardReady] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  // Whether the grid has real content below/above the visible window --
  // drives the fade-plus-chevron scroll hints below. 2026-08-07: added
  // alongside the ScrollView itself (see gridScroll's own comment), once
  // Digest's real category count made scrolling genuinely necessary
  // -- "since the digest LensHub menu scrolls, it should have some
  // characteristic that tells people to scroll it," explicitly requested.
  // Split into two independent booleans (was a single canScrollMore) the
  // same day, direct follow-up describing the exact desired behavior at
  // each scroll position: only a bottom hint at rest (top of the list),
  // BOTH hints while genuinely in the middle, only a top hint once fully
  // scrolled to the bottom (nothing left below, only "scroll back up" left
  // to show) -- and the same in reverse scrolling back up. That's exactly
  // what two independent conditions (canScrollUp / canScrollDown) produce
  // on their own, with no extra state machine needed: canScrollUp is just
  // "not at the top," canScrollDown is just "not at the bottom."
  // Tracked via a plain ref (not state) for the three raw measurements, so
  // onScroll firing repeatedly during a drag doesn't itself force a
  // re-render every time -- only the two derived booleans below (which
  // only flip at the moment either edge is actually reached) cause one.
  // Harmless for every other page: a grid that already fits within
  // CARD_HEIGHT never sets canScrollDown true in the first place
  // (contentHeight never exceeds containerHeight), so neither hint ever
  // renders there.
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const scrollMetrics = useRef({ containerHeight: 0, contentHeight: 0, scrollY: 0 });
  function recomputeScrollHint() {
    const { containerHeight, contentHeight, scrollY } = scrollMetrics.current;
    const remainingBelow = contentHeight - containerHeight - scrollY;
    // Same small slop on both edges so settling exactly at either end
    // doesn't flicker.
    setCanScrollDown((current) => {
      const next = remainingBelow > 4;
      return current === next ? current : next;
    });
    setCanScrollUp((current) => {
      const next = scrollY > 4;
      return current === next ? current : next;
    });
  }
  // Tracks the last autoOpenSignal value this popup has already reacted
  // to, so it opens once per genuinely NEW signal rather than every
  // re-render -- undefined at rest (no signal yet), matching a screen
  // that never received one from a TabHub tap this session. Declared here,
  // after cardReady/canScrollDown/canScrollUp/scrollMetrics above (moved
  // 2026-08-08 -- this effect used to sit right after `open`, before any
  // of those existed yet in the function body), specifically so the reset
  // below can reach all four.
  const lastAutoOpenSignal = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (autoOpenSignal && autoOpenSignal !== lastAutoOpenSignal.current) {
      lastAutoOpenSignal.current = autoOpenSignal;
      // 2026-08-08, a real, root-caused fix for a real, on-device-confirmed
      // "popup drops in from above" report -- reproducible specifically via
      // Digest's own new "Back to Digest" breadcrumb (which drives
      // this same autoOpenSignal path a second, third, etc. time within one
      // screen visit), never via a direct corner-button tap. Traced
      // directly, not guessed: the corner button's own onPress (below)
      // always resets cardReady/the scroll-hint state before setOpen(true),
      // so the card always starts invisible and only shows once a fresh
      // onShow confirms the new native window is actually up -- exactly the
      // fix cardReady's own comment already documents needing. This effect
      // never did any of those resets at all -- harmless the FIRST time a
      // screen's LensHub ever opens (cardReady already starts false, its
      // own real default), but every open after the first leaves cardReady
      // sitting at whatever the PREVIOUS open left it as (onShow's own
      // setCardReady(true), never reset back on close) -- so a second or
      // later auto-triggered open rendered the card at full opacity
      // immediately, before the new Dialog window was actually confirmed
      // up, reproducing the exact glitch the onShow gate exists to prevent.
      // The scroll-hint reset rides along for the same reason (a stale hint
      // from a previous open showing for one frame) -- a smaller version of
      // the identical staleness class, not a separate bug.
      setCardReady(false);
      scrollMetrics.current = { containerHeight: 0, contentHeight: 0, scrollY: 0 };
      setCanScrollDown(false);
      setCanScrollUp(false);
      setOpen(true);
    }
  }, [autoOpenSignal]);
  const insets = useSafeAreaInsets();
  const { bottom: buttonBottom, left: buttonLeft } = useBottomLeftHubPosition();
  // Falls back to the brand teal/list icon only if a page ever passes a
  // pageTitle with no TAB_ROUTES match AND no explicit icon/color override
  // -- shouldn't happen for a real tab, but cheaper than a crash if a
  // future page's title drifts out of sync.
  const tabRoute = TAB_ROUTES.find((route) => route.title === pageTitle);
  const tabIcon = icon ?? tabRoute?.icon ?? 'list';
  const tabColor = color ?? tabRoute?.color ?? colors.primary;
  // What the new bottom-left Info tile (see the render below) shows --
  // whichever option is currently selected, if any. Reacts the same way
  // TabHub's own Info tile does: a ring only once there's something real
  // to pair it with, in that same option's color, opening that option's
  // own help content rather than one generic page-level explanation.
  const selectedOption = options.find((option) => option.key === selected);

  // Closes the menu first, then -- only once it's actually gone, not at
  // the same instant -- calls onSelect, which is what flips the calling
  // screen's own `revealed` state true and pops GatedTabContent's content
  // into place (an instant swap now, not a slide -- see that component's
  // own 2026-07-27 comment). Explicitly requested to be sequenced rather
  // than simultaneous: picking an option used to close this popup and pop
  // in the new content in the same instant, which read as the two
  // fighting for attention at once. TAB_REVEAL_DURATION_MS approximates
  // how long this Modal's own animationType="fade" takes to finish --
  // RN's Modal doesn't expose that duration directly to time against, so
  // this is an estimate, not a measured value.
  function choose(key: T) {
    setOpen(false);
    setTimeout(() => onSelect(key), TAB_REVEAL_DURATION_MS);
  }

  // Same close-then-fire sequencing as choose() just above, for the one
  // real, optional extraTile pinned at the front of the grid (see its own
  // comment) -- kept as a genuinely separate function rather than folded
  // into choose() itself since it fires a plain, no-argument callback
  // (opening some OTHER popup entirely, e.g. MyItemsHub) rather than
  // onSelect(key: T) (picking a real view within THIS same page).
  function chooseExtra() {
    if (!extraTile) return;
    setOpen(false);
    setTimeout(() => extraTile.onPress(), TAB_REVEAL_DURATION_MS);
  }

  // Independent of buttonBottom -- the button itself stays anchored inside
  // the footer band; only the popup card floats clear above it (see
  // useMenuCardBottom's own comment in constants/floatingButton.ts).
  const cardBottom = useMenuCardBottom();

  const itemWidthPercent = 100 / columns;
  // Info moves off the floating corner and into the grid's own flow
  // whenever a page asks for it (see infoInGrid's own comment above for
  // the default and the 2026-08-07 reasoning) -- the corner trick assumes
  // the card's bottom-right corner is always blank (see infoCorner's own
  // comment/CARD_HEIGHT's), true for a short, non-scrolling grid, not true
  // once a page's own grid grows tall enough to scroll.
  const showInfoInGrid = infoInGrid;
  // How many blank cells to render before Info. For an ODD column count
  // (Food's 3), pad out whatever's left of the current partial row, then
  // one more blank places Info at column index floor(columns / 2) of the
  // NEXT row -- the true middle column. For an EVEN column count (Purple
  // Digest's 2), there's no true middle to center on, so no padding at all
  // -- Info just renders as the very next tile after the real options,
  // landing in whatever slot that naturally is.
  // + 1 for extraTile, 2026-08-16 -- it occupies one real cell of its own,
  // rendered first (see the JSX below), so Info's own centering math has to
  // count it the same as any other real tile or it'd land one cell off
  // from where it visually should.
  const effectiveItemCount = options.length + (extraTile ? 1 : 0);
  const itemsInPartialRow = effectiveItemCount % columns;
  const rowPadding = itemsInPartialRow === 0 ? 0 : columns - itemsInPartialRow;
  // Real group headers (below) force a fresh row at every group boundary,
  // 2026-08-18 -- which means the trailing row's own real item count no
  // longer matches effectiveItemCount % columns the way this centering
  // math assumes (it's derived from the FLAT item count, blind to where
  // headers actually broke rows). Rather than recompute this per group,
  // Info just renders as a plain trailing tile whenever groups are in
  // play, wherever that naturally falls right after the last group's own
  // last row -- simpler and safe, at the real cost of not being perfectly
  // centered-alone the way it is on an ungrouped page. Every page without
  // groups keeps the exact same centered placement, unchanged.
  // dividerBefore (2026-08-21) forces the exact same kind of fresh-row
  // break a group header does, so it has to disable this centering math
  // the same way -- otherwise Digest's own divider line would silently
  // throw off where Info lands.
  const hasGroups = options.some((option) => option.group !== undefined || option.dividerBefore);
  const blanksBeforeInfo = hasGroups ? 0 : columns % 2 === 0 ? 0 : rowPadding + Math.floor(columns / 2);

  return (
    <>
      <TouchableOpacity
        style={[styles.button, { bottom: buttonBottom, left: buttonLeft }]}
        onPress={() => {
          setCardReady(false);
          // Fresh measurements each time the popup opens -- stale hint
          // state from a previous open (e.g. this same page re-opened
          // after scrolling to the bottom last time) would otherwise show
          // the wrong hint for one frame before the new ScrollView's own
          // onLayout/onContentSizeChange fire. ScrollView also always
          // remounts scrolled to the top on a fresh open (RN's own default,
          // never overridden here), so canScrollDown/canScrollUp resetting
          // to "top of list" (false/false, corrected to true/false the
          // instant the real measurements land) matches where it will
          // actually be, not just a safe placeholder.
          scrollMetrics.current = { containerHeight: 0, contentHeight: 0, scrollY: 0 };
          setCanScrollDown(false);
          setCanScrollUp(false);
          setOpen(true);
        }}
        activeOpacity={0.85}
        accessibilityLabel={`Choose a view for ${pageTitle}`}
      >
        {/* Plain icon at rest -- same treatment as GatedTabContent.tsx's
            own resting-prompt icon (no circle/background at all). The
            circle + animated ring only appear once the popup is actually
            open, as the "this is open" cue -- see IridescentRingCircle's
            own comment for why it's a ring, not the flat sheen fill this
            used before.
            Uses CORNER_ICON_SHADOW, not the shared textShadow every other
            icon in this file uses -- this one sits directly on the flat
            dark footer strip (colors.background, #2B3753) with nothing
            behind it, not the lighter colors.menuSurface card the popup's
            own grid icons sit on. textShadow's ordinary black, low-opacity
            shadow reads fine against that lighter card but was nearly
            invisible here -- too close in darkness to the footer itself to
            register as a real shadow rather than just vanishing into it. */}
        {open ? (
          <IridescentRingCircle size={FLOATING_BUTTON_SIZE}>
            {renderIcon ? renderIcon(32) : <Ionicons name={tabIcon} size={32} color={tabColor} style={CORNER_ICON_SHADOW} />}
          </IridescentRingCircle>
        ) : renderIcon ? (
          renderIcon(32)
        ) : (
          <Ionicons name={tabIcon} size={32} color={tabColor} style={CORNER_ICON_SHADOW} />
        )}
        {/* The page's own name below the icon, 2026-07-27 -- explicitly
            requested to match the same icon-then-label pairing every
            option already uses inside the popup itself (and the
            butterfly's own grid). Centered as one group with the icon
            above via the button's own alignItems/justifyContent -- this
            box's fixed height (FLOATING_BUTTON_SIZE) doesn't grow to fit
            both, so the pair can render slightly past its nominal bottom
            edge (harmless: nothing else is anchored to read that overflow
            as its own boundary, and this button has no overflow: 'hidden'
            of its own to clip it). Same CORNER_ICON_SHADOW-strength
            treatment as the icon above (textShadow, used inside the
            popup, reads too faint against the same flat dark footer strip
            this sits directly on). */}
        <Text
          style={[styles.buttonLabel, { color: tabColor }]}
          numberOfLines={1}
          maxFontSizeMultiplier={LABEL_MAX_FONT_SCALE}
        >
          {buttonLabel ?? headerLabel ?? pageTitle}
        </Text>
      </TouchableOpacity>

      {/* statusBarTranslucent/navigationBarTranslucent: see the identical
          comment on TabHub's own Modal (components/TabHub.tsx) -- same
          Android edge-to-edge gap, same fix, needed on every full-screen
          modal in this family or the OS's own top/bottom bars flash an
          opaque seam only while that one modal happens to be open. */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onShow={() => setCardReady(true)}
        onRequestClose={() => setOpen(false)}
      >
        {/* A ninth investigated (and disproven) theory for TabHub's own
            "drops in from above" bug -- see that file's own longer comment
            on its Modal for the full record -- was tried here too, since
            this Modal shows the identical symptom under the identical
            condition (a WheelPicker mounted elsewhere in the tree):
            wrapping this Modal's content in its own GestureHandlerRootView.
            Confirmed on-device NOT to change the behavior, removed rather
            than left in as dead, misleading scaffolding. A tenth attempt,
            2026-08-01, backed by real captured timing data this time (see
            TabHub's own comment on cardReady's declaration for the
            reasoning): hold the card invisible until onShow confirms the
            window is genuinely up. */}
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View
            style={[
              styles.card,
              { bottom: cardBottom, left: SECONDARY_HUB_CARD_LEFT_MARGIN, width: CARD_WIDTH, height: CARD_HEIGHT, borderColor: tabColor },
              { opacity: cardReady ? 1 : 0 },
            ]}
            pointerEvents={cardReady ? 'auto' : 'none'}
          >
            <Text style={styles.cardHeader} maxFontSizeMultiplier={LABEL_MAX_FONT_SCALE}>
              {headerLabel ?? pageTitle}
            </Text>
            {/* ScrollView, not a plain View, 2026-08-07 -- Digest
                grew past what CARD_HEIGHT's own shared row budget (sized to
                Food's 9-option worst case) can show at once, and explicitly
                "let's set that up" was the direction rather than growing
                CARD_HEIGHT itself (which every other page's card would also
                grow by, most of them with nothing to fill the extra space).
                Scoped to just the grid's own content -- `card`'s outer
                height stays exactly what it always was, this only lets that
                fixed space scroll internally when a page's own option count
                exceeds it. Harmless for every page whose grid already fits
                (a ScrollView with shorter-than-container content simply
                doesn't scroll) -- not gated behind a per-page flag. */}
            <View style={styles.gridWrapper}>
            <ScrollView
              style={styles.gridScroll}
              contentContainerStyle={styles.grid}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={100}
              onLayout={(event) => {
                scrollMetrics.current.containerHeight = event.nativeEvent.layout.height;
                recomputeScrollHint();
              }}
              onContentSizeChange={(_width, height) => {
                scrollMetrics.current.contentHeight = height;
                recomputeScrollHint();
              }}
              onScroll={(event) => {
                scrollMetrics.current.scrollY = event.nativeEvent.contentOffset.y;
                recomputeScrollHint();
              }}
              // 2026-08-07, reported directly: the bottom hint wasn't
              // reliably disappearing once genuinely scrolled all the way
              // down. `onScroll` alone is throttled (scrollEventThrottle
              // above) -- real on a fast fling that decelerates and comes
              // to rest close to the boundary, the very last position
              // update can land just before the true settled offset,
              // never getting corrected since nothing fires again once
              // the motion actually stops. `onMomentumScrollEnd` (a fling
              // that decelerates to a stop) and `onScrollEndDrag` (a slow
              // drag released directly at the boundary, no momentum
              // phase to end) both fire exactly once, unthrottled, the
              // instant their own kind of scroll motion is genuinely
              // over -- reusing the same recompute here guarantees one
              // more, accurate check right at the moment it matters most.
              onMomentumScrollEnd={(event) => {
                scrollMetrics.current.scrollY = event.nativeEvent.contentOffset.y;
                recomputeScrollHint();
              }}
              onScrollEndDrag={(event) => {
                scrollMetrics.current.scrollY = event.nativeEvent.contentOffset.y;
                recomputeScrollHint();
              }}
            >
              {/* extraTile, 2026-08-16 -- rendered first, so it lands at
                  the true top-left of the grid regardless of how many real
                  options follow it. Always in the plain/inactive pill
                  style (never a ring): it doesn't correspond to any `T`,
                  so there's no `selected` state for it to ever match.
                  Icon color still uses tabColor unconditionally, matching
                  every real option's own icon below (2026-07-26: icon
                  color doesn't vary with active/inactive, only the
                  label's does) -- reads as belonging to this page the same
                  way every other tile here does. */}
              {extraTile ? (
                <TouchableOpacity
                  style={[styles.item, { width: `${itemWidthPercent}%` }]}
                  onPress={chooseExtra}
                  activeOpacity={0.7}
                >
                  <View style={[styles.itemIconPillPlain, { width: gridPillSize, height: gridPillSize }]}>
                    <Ionicons name={extraTile.icon} size={gridIconSize} color={tabColor} style={textShadow} />
                  </View>
                  <Text
                    style={[styles.itemLabel, { color: colors.textMuted }]}
                    numberOfLines={itemLabelLines}
                    ellipsizeMode="tail"
                    maxFontSizeMultiplier={LABEL_MAX_FONT_SCALE}
                  >
                    {extraTile.label}
                  </Text>
                </TouchableOpacity>
              ) : null}
              {(() => {
                // Tracks which group's own header has already been shown,
                // mutated as the map below runs -- a plain closure
                // variable is enough here since .map runs its callback
                // synchronously, in array order, exactly once per item.
                // 2026-08-18, added for Insights specifically -- see
                // LensOption's own `group` field comment. Every other
                // page's options never set `group`, so showGroupHeader is
                // always false there and this renders exactly as it always
                // did, just wrapped in one extra Fragment per item.
                let lastGroupShown: string | undefined;
                return options.map((option) => {
                  const showGroupHeader = option.group !== undefined && option.group !== lastGroupShown;
                  if (option.group !== undefined) lastGroupShown = option.group;
                  const active = option.key === selected;
                  // 2026-08-21 -- see LensOption's own `dividerBefore`
                  // comment. `width: '100%'` on dividerRow (styles below)
                  // is the same "force a fresh row" trick groupHeaderRow
                  // already uses, just with a plain line instead of text.
                  // 2026-07-26: icon color no longer varies with `active` --
                  // matching TabHub's own grid (its icons are always shown
                  // in full color, never muted; the ring alone is what
                  // signals "selected"). The label still dims when inactive,
                  // unchanged -- only the icon's own treatment was asked to
                  // match the butterfly menu's.
                  //
                  // Explicitly corrected, same day: uses `tabColor` (this
                  // page's own identity color, already computed above for
                  // the corner trigger button) instead of the flat brand
                  // colors.primary -- every option inside a given page's
                  // menu should read as belonging to that page, the same
                  // color as its own icon in the corner and in the butterfly
                  // menu's own grid, not a generic shared teal.
                  const labelColor = active ? colors.primary : colors.textMuted;
                  return (
                    <Fragment key={option.key}>
                      {option.dividerBefore ? (
                        <View style={styles.dividerRow}>
                          <View style={[styles.dividerLine, { backgroundColor: tabColor }]} />
                        </View>
                      ) : null}
                      {showGroupHeader ? (
                        <View style={styles.groupHeaderRow}>
                          <Text style={[styles.groupHeaderText, { color: tabColor }]} maxFontSizeMultiplier={LABEL_MAX_FONT_SCALE}>
                            {option.group}
                          </Text>
                        </View>
                      ) : null}
                      <TouchableOpacity
                        style={[styles.item, { width: `${itemWidthPercent}%` }]}
                        onPress={() => choose(option.key)}
                        activeOpacity={0.7}
                      >
                        {active ? (
                          <IridescentRingCircle size={gridPillSize}>
                            {option.renderIcon ? (
                              option.renderIcon(gridCustomIconSize, tabColor)
                            ) : (
                              <Ionicons name={option.icon} size={gridIconSize} color={tabColor} style={textShadow} />
                            )}
                          </IridescentRingCircle>
                        ) : (
                          <View style={[styles.itemIconPillPlain, { width: gridPillSize, height: gridPillSize }]}>
                            {option.renderIcon ? (
                              <View style={styles.conditionIconInactive}>
                                {option.renderIcon(gridCustomIconSize, tabColor)}
                              </View>
                            ) : (
                              <Ionicons name={option.icon} size={gridIconSize} color={tabColor} style={textShadow} />
                            )}
                          </View>
                        )}
                        <Text
                          style={[styles.itemLabel, { color: labelColor }]}
                          numberOfLines={itemLabelLines}
                          ellipsizeMode="tail"
                          maxFontSizeMultiplier={LABEL_MAX_FONT_SCALE}
                        >
                          {option.gridLabel ?? option.label}
                        </Text>
                      </TouchableOpacity>
                    </Fragment>
                  );
                });
              })()}
              {/* Info as a real grid item, centered on its own row, only
                  for pages that asked for this (see showInfoInGrid's own
                  comment) -- every other page keeps the floating
                  infoCorner below instead. Blank spacers first (pointer-
                  events none, no visible content) push it to the middle
                  column rather than wherever the real options leave off. */}
              {showInfoInGrid ? (
                <>
                  {Array.from({ length: blanksBeforeInfo }).map((_, index) => (
                    <View key={`info-pad-${index}`} style={[styles.item, { width: `${itemWidthPercent}%` }]} pointerEvents="none" />
                  ))}
                  <TouchableOpacity
                    style={[styles.item, { width: `${itemWidthPercent}%` }]}
                    onPress={() => setHelpVisible(true)}
                    activeOpacity={0.7}
                    // Only disabled for the narrower "an option IS selected
                    // but has no help authored yet" case -- never disabled
                    // just because nothing's selected, since that case now
                    // has its own real content to show (NO_SELECTION_HELP,
                    // via the HelpSheet's own sections prop below).
                    disabled={Boolean(selectedOption) && !selectedOption?.help}
                    accessibilityLabel={selectedOption ? `About ${selectedOption.label}` : 'Select a function to see information about it'}
                  >
                    {selectedOption ? (
                      <IridescentRingCircle size={gridPillSize}>
                        <Ionicons name="information-circle" size={gridIconSize} color={tabColor} style={textShadow} />
                      </IridescentRingCircle>
                    ) : (
                      <View style={[styles.itemIconPillPlain, { width: gridPillSize, height: gridPillSize }]}>
                        <Ionicons name="information-circle" size={gridIconSize} color={colors.textMuted} style={textShadow} />
                      </View>
                    )}
                    <Text
                      style={[styles.itemLabel, { color: selectedOption ? colors.primary : colors.textMuted }]}
                      numberOfLines={1}
                      maxFontSizeMultiplier={LABEL_MAX_FONT_SCALE}
                    >
                      Info
                    </Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </ScrollView>
            {/* The scroll hints themselves -- a soft fade from transparent
                into the card's own menuSurface color, plus a small
                chevron, pinned to whichever edge of gridWrapper (not the
                whole card) still has real content past it, so each one
                reads as "more of THIS list that way" rather than a stray
                mark near the Info tile. pointerEvents="none" on both: a
                visual cue only, never intercepts the tap that would
                otherwise reach whatever grid item happens to sit under it.
                Rendered after the ScrollView but still inside gridWrapper,
                so each one paints over its own edge's last partially-
                visible row -- exactly the effect that reads as "there's
                more, scroll to see it."
                2026-08-07, direct follow-up describing the exact behavior
                wanted at each scroll position: only the bottom hint at
                rest (top of the list, canScrollUp false), BOTH hints while
                genuinely in the middle of the list, only the top hint once
                fully scrolled to the bottom (canScrollDown false, nothing
                left below) -- and back through the same states in reverse
                while scrolling back up. Two independent conditions
                (canScrollUp/canScrollDown, see their own comment above)
                produce exactly that without any extra state machine. */}
            {canScrollUp ? (
              <View style={styles.scrollHintTop} pointerEvents="none">
                <LinearGradient
                  colors={[colors.menuSurface, 'transparent']}
                  style={StyleSheet.absoluteFillObject}
                />
                <Ionicons name="chevron-up" size={13} color={tabColor} />
              </View>
            ) : null}
            {canScrollDown ? (
              <View style={styles.scrollHintBottom} pointerEvents="none">
                <LinearGradient
                  colors={['transparent', colors.menuSurface]}
                  style={StyleSheet.absoluteFillObject}
                />
                <Ionicons name="chevron-down" size={13} color={tabColor} />
              </View>
            ) : null}
            </View>
            {/* Absolutely positioned over the card's own bottom-right
                corner, deliberately NOT part of the wrapping options grid
                above -- explicitly moved here from a dedicated row (which
                added a whole extra row of card height, see CARD_HEIGHT's
                own comment) and from the bottom-left corner (where it
                first landed, then was reported as overlapping
                GatedTabContent.tsx's own "tap the button below" textbox
                once the card grew). Floating over the corner instead needs
                no layout space of its own: CARD_HEIGHT's own comment
                explains why that corner is guaranteed blank on every page.
                Reacts the same way TabHub's own Info tile does: a ring (in
                this page's own tabColor, not a per-option color -- every
                option's icon already shares that one color) only once
                something is genuinely selected, opening THAT option's own
                help content, not one generic page-level blob covering all
                of them at once.
                Skipped entirely for pages using showInfoInGrid above (see
                that flag's own comment) -- their Info tile already
                rendered as a real grid item, inside the grid View
                closed just above. */}
            {showInfoInGrid ? null : (
              <TouchableOpacity
                style={styles.infoCorner}
                onPress={() => setHelpVisible(true)}
                activeOpacity={0.7}
                disabled={!selectedOption?.help}
                accessibilityLabel={selectedOption ? `About ${selectedOption.label}` : 'Select a function to see information about it'}
              >
                {selectedOption ? (
                  <IridescentRingCircle size={GRID_ITEM_PILL_SIZE}>
                    <Ionicons name="information-circle" size={GRID_ITEM_ICON_SIZE} color={tabColor} style={textShadow} />
                  </IridescentRingCircle>
                ) : (
                  <View style={styles.itemIconPillPlain}>
                    <Ionicons name="information-circle" size={GRID_ITEM_ICON_SIZE} color={colors.textMuted} style={textShadow} />
                  </View>
                )}
                <Text
                  style={[styles.itemLabel, { color: selectedOption ? colors.primary : colors.textMuted }]}
                  numberOfLines={1}
                  maxFontSizeMultiplier={LABEL_MAX_FONT_SCALE}
                >
                  Info
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {/* Defensive fix, same as TabHub's own Modal -- see its comment
              for why navigationBarTranslucent alone isn't trusted here. */}
          <View style={[styles.navBarMask, { height: insets.bottom }]} pointerEvents="none" />
        </View>
      </Modal>

      <HelpSheet
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
        pageTitle={selectedOption?.label ?? pageTitle}
        sections={selectedOption ? (selectedOption.help ?? []) : NO_SELECTION_HELP}
      />
    </>
  );
}

const styles = StyleSheet.create({
  // Just a touch-target box now -- no background/border/shadow of its own
  // at rest, since the plain icon (JSX) has nothing to sit on, matching
  // GatedTabContent.tsx's resting-prompt icon. IridescentRingCircle
  // supplies its own circle/ring/shadow-free look once open; this box only
  // needs to keep that content centered within the same footprint every
  // other floating hub button uses.
  button: {
    position: 'absolute',
    width: FLOATING_BUTTON_SIZE,
    height: FLOATING_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    // Same fix as TabHub.tsx's own button style, same reasoning -- see
    // that file's own comment. This button lives inside a specific
    // screen's own tree (a sibling of that screen's SwipeableTabScreen),
    // so it's even more directly exposed to that same screen's own
    // GatedTabContent animated reveal layer than TabHub's is.
    elevation: 10,
    zIndex: 10,
  },
  // Same reasoning as CORNER_ICON_SHADOW above (this sits on the same flat
  // footer strip, not a lighter card) -- textShadow's own ordinary shadow
  // would be too faint here.
  buttonLabel: {
    ...typography.caption,
    fontSize: 11,
    marginTop: 2,
    ...CORNER_ICON_SHADOW,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.25)' },
  navBarMask: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
  },
  card: {
    position: 'absolute',
    // colors.menuSurface, not colors.surface, 2026-07-27 -- explicitly
    // requested to match the butterfly menu's own popup exactly (see that
    // token's own comment in constants/colors.ts: surface's real blue hue
    // was the actual reason Schedules' icon kept blending in, so this
    // fixes the same class of problem here too, and keeps every popup
    // menu in the app -- TabHub's and every LensHub's -- reading as one
    // consistent "this is a menu" surface rather than two slightly
    // different ones.
    backgroundColor: colors.menuSurface,
    borderRadius: 14,
    // borderWidth 2 (was 1) and borderColor set inline per render to
    // `tabColor` (was the flat colors.border) -- 2026-07-27, extending the
    // same "this box's border is that tab's own identity color" rule from
    // Home's info boxes (see app/(tabs)/index.tsx's own TAB_BORDER_WIDTH
    // comment) to this popup menu too, since it's just as much "this
    // page's own box" as the content boxes it sits above. TabHub's own
    // popup (components/TabHub.tsx) deliberately keeps its plain neutral
    // border instead -- it isn't any one tab's own menu, it's universal.
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 8,
    // Pairs with the fixed `height` set above (CARD_HEIGHT) -- guarantees
    // every page's card comes out the exact same size even if a page's own
    // real content runs slightly taller than that estimate, rather than
    // quietly pushing past the box's bottom edge.
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  cardHeader: {
    ...typography.eyebrow,
    color: colors.primary,
    marginBottom: 6,
    marginLeft: 4,
  },
  // Fills whatever vertical space `card` has left after cardHeader (card's
  // own default column flexDirection + this flex: 1 does that) -- the
  // actual scrolling boundary. `grid` itself is now this ScrollView's
  // contentContainerStyle, not a plain child View's style.
  // Wraps gridScroll so the scroll-hint overlay below has something to
  // anchor to that's scoped to just the grid's own footprint -- not the
  // whole `card`, which would misalign it against cardHeader/infoCorner.
  gridWrapper: { flex: 1 },
  gridScroll: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  // 2026-08-18, added for Insights specifically -- see LensOption's own
  // `group` field comment. `grid`'s own contentContainerStyle is
  // `flexDirection: 'row', flexWrap: 'wrap'`, so a plain width: '100%'
  // here is what actually forces every group header onto its own row,
  // pushing whatever follows it down to a fresh line the same way a
  // too-wide item naturally would -- no separate row-break logic needed.
  groupHeaderRow: {
    width: '100%',
    paddingTop: 10,
    paddingBottom: 2,
    paddingHorizontal: 4,
  },
  groupHeaderText: {
    ...typography.eyebrow,
  },
  // See LensOption's own `dividerBefore` comment -- same `width: '100%'`
  // fresh-row trick as groupHeaderRow above, just wrapping a plain line
  // instead of text. Padding top/bottom gives the line its own breathing
  // room from the row above and below, rather than sitting flush against
  // either.
  dividerRow: {
    width: '100%',
    paddingTop: 8,
    paddingBottom: 4,
  },
  // backgroundColor is set inline per render to `tabColor` (matching every
  // other identity-colored element in this popup) -- opacity here, not a
  // separate rgba computation, is what keeps it reading as a soft divider
  // rather than a solid, attention-grabbing bar.
  dividerLine: {
    height: 1,
    opacity: 0.3,
  },
  // Pinned to gridWrapper's own top/bottom edge -- see the JSX's own
  // comment for why these exist and why each is conditional on its own
  // canScrollUp/canScrollDown. Short (18px) on purpose: just enough for
  // the gradient to read as a fade, not so tall it hides a meaningful
  // slice of the nearest visible row.
  scrollHintTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 18,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  scrollHintBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 18,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  // 2 columns -- wide enough that even this app's longest lens labels
  // ("Cooking & Prep", "Prescriptions", "Food Reactions") sit on one line.
  // width: '50%' here is only ever a fallback -- every real usage overrides
  // it inline with itemWidthPercent (100 / columns), so the grid's own
  // column count can vary per page (see the `columns` prop's own comment).
  item: { width: '50%', alignItems: 'center', gap: 2, paddingVertical: 6 },
  // Pinned to the card's own bottom-right corner, outside the wrapping
  // `grid` above's normal flow -- see CARD_HEIGHT's own comment for why
  // this spot is guaranteed blank on every page. `right` is INFO_CORNER_
  // RIGHT (see its own comment above), not a flat padding match, so the
  // icon itself lines up center-to-center with the grid's right-column
  // icons above it, not just flush with the card's own edge inset.
  infoCorner: { position: 'absolute', right: INFO_CORNER_RIGHT, bottom: 8, alignItems: 'center', gap: 2 },
  // The inactive/plain state -- same footprint as IridescentRingCircle's
  // own `size` (GRID_ITEM_PILL_SIZE), just centering a bare icon with no
  // circle or ring, so every item in the grid lines up at the same height
  // either way -- mirrors TabHub.tsx's own iconPillPlain exactly.
  itemIconPillPlain: {
    width: GRID_ITEM_PILL_SIZE,
    height: GRID_ITEM_PILL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 2026-08-09, explicitly requested: unselected condition icons (Purple
  // Digest's own real per-condition artwork, the option.renderIcon path --
  // no other page sets this prop, so this can't affect any Ionicons glyph
  // used elsewhere) sit at 65% transparent until selected, at which point
  // the active branch below renders them at the ordinary, unwrapped full
  // opacity. Deliberately scoped to just the renderIcon wrapper rather than
  // added to itemIconPillPlain itself, which every other page's own
  // inactive Ionicons icons also use at full opacity/color by design (see
  // this file's own 2026-07-26 comment on that).
  conditionIconInactive: {
    opacity: 0.35,
  },
  // textAlign: 'center', 2026-08-07 -- alignItems: 'center' on `item`
  // (above) only ever centered the label's own text BLOCK as a whole
  // within its column; once a label wraps to more than one line (see
  // itemLabelLines/gridLabel), each individual line still defaulted to
  // left-aligned within that block, reading as ragged rather than
  // centered underneath its icon. Harmless for every single-line label
  // (this app's existing majority) -- centering a one-line block that
  // already sizes to its own text content changes nothing visible.
  itemLabel: { ...typography.caption, fontSize: 11, textAlign: 'center' },
});
