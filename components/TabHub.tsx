import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as NavigationBar from 'expo-navigation-bar';
import { usePathname, useRouter, type Href } from 'expo-router';
import { useRef, useState, type ReactNode } from 'react';
import { Image, Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { colors, rotatedIridescentPalette } from '../constants/colors';
import { FLOATING_BUTTON_BOTTOM_OFFSET, FLOATING_BUTTON_SIZE, useMenuCardBottom } from '../constants/floatingButton';
import { getTabHubIconRenderSize, TAB_HUB_ICON_SOURCES } from '../constants/tabHubIcons';
import { TAB_ROUTES, type TabRoute } from '../constants/tabs';
import { textShadow, typography } from '../constants/typography';
import { useIridescentHueRotation, useThrottledHueDegrees } from '../hooks/useIridescentHueRotation';
import { useVisualPreferences } from '../hooks/useVisualPreferences';
import type { TabHubIconChoice } from '../lib/visualPreferences';
import { useCurrentPageHelp } from './CurrentPageHelp';
import { DessertBuilderIcon } from './FoodBuilderIcons';
import { HelpSheet } from './HelpButton';
import { IridescentRingCircle } from './IridescentRingCircle';
import { PurpleRibbonIcon } from './PurpleRibbonIcon';

// Thickness of the iridescent line around the popup menu card, below --
// same two-layer "gradient-filled outer shape + slightly inset solid inner
// shape" trick as IridescentRingCircle.tsx (a plain View border can't take
// a gradient directly in React Native), just around a rounded rectangle
// instead of a circle. Matches the old card's own borderWidth (1, replaced
// by this ring) exactly, not just visually close -- the ring's padding
// adds to the card's total footprint the same way a border would have,
// and since the whole card is bottom-anchored (see cardBottom below) with
// no fixed height, any extra footprint here pushes its top edge upward.
// A first pass at 2 (double the old border's 1) made the card visibly sit
// a couple pixels higher than its correct static position once opened --
// this value is what actually fixed that, not just a coincidentally close
// number.
const CARD_RING_WIDTH = 1;

const BUTTON_SIZE = FLOATING_BUTTON_SIZE;
const BOTTOM_OFFSET = FLOATING_BUTTON_BOTTOM_OFFSET;
// The button's own artwork -- whichever icon is currently chosen, not just
// the butterfly -- is rendered at ITS OWN real aspect ratio rather than
// forced into BUTTON_SIZE's square, so nothing gets cropped or distorted.
// It renders larger than the tap target itself in both dimensions (see
// `overflow: visible` + `hitSlop` on the button below) so the *layout*
// footprint other floating hubs (LensHub, ScopeHub) position themselves
// against stays exactly BUTTON_SIZE -- only the visible artwork is larger.
//
// 2026-08-09: what used to be a single fixed BUTTERFLY_WIDTH/HEIGHT pair
// (calibrated only for the default butterfly artwork's own 1606:1080
// ratio) is now computed per-render via getTabHubIconRenderSize
// (constants/tabHubIcons.ts) -- real, measured data confirmed the 19
// condition icons span a genuinely wide range of real aspect ratios
// (0.652 to 1.362), so a single fixed box sized for the butterfly's own
// much wider 1.487 ratio left every condition icon rendering noticeably
// smaller than the butterfly, height-constrained inside that box rather
// than reaching its own true visual size. getTabHubIconRenderSize instead
// scales each icon so its own LONGER edge reaches the same target the
// butterfly's own width always has, which is what actually makes a tall
// icon (Gout) and a wide one (PCOS) both read as similarly "present" the
// way the butterfly always has -- see that function's own header comment
// for the full reasoning. No longer a static export -- PageIdentityLabel.tsx
// and MyItemsHub.tsx, the other two real consumers of this geometry (see
// their own history), now each call getTabHubIconRenderSize directly with
// their own live useVisualPreferences() read, rather than importing a
// value from this specific component that could only ever reflect the
// butterfly.
const ICON_PILL_SIZE = 34;
// A bit bigger than the 20px the Ionicons "ribbon" glyph this replaced
// rendered at (2026-07-28, explicitly asked for -- see PurpleRibbonIcon.tsx
// for the full history of what this replaced and why).
const PURPLE_RIBBON_SIZE = 26;

// 2026-07-26: replaced the traced iridescent outline that used to render
// here -- explicitly asked to remove it in favor of a shadow that reads as
// the button lifting OFF the page instead. Same underlying technique as a
// single drop shadow (see ELEVATION_SHADOW_LAYERS below and its own
// comment), just several graduated copies instead of one, which is what
// actually sells "elevated" rather than "flat with a dark smudge under
// it" -- mirrors ScreenHeader.tsx's own SHADOW_LAYERS recipe (several
// darker, increasingly offset/faded copies, furthest and faintest drawn
// first) for the exact same reason: one flat shadow reads as a hard-edged
// cutout, a soft graduated stack reads as real depth.
const ELEVATION_SHADOW_LAYERS: readonly { offsetY: number; opacity: number }[] = [
  { offsetY: 14, opacity: 0.12 },
  { offsetY: 9, opacity: 0.2 },
  { offsetY: 5, opacity: 0.3 },
  { offsetY: 2, opacity: 0.4 },
];

// A real, separate rendering path for any TabHubIconChoice backed by a
// VECTOR icon (components/FoodBuilderIcons.tsx) rather than a real,
// cropped raster asset (every other choice in TAB_HUB_ICON_SOURCES,
// constants/tabHubIcons.ts) -- 2026-08-14, starting with Dessert Builder,
// originally a real, hand-drawn cupcake shape; 2026-08-16 switched to
// rendering the real Ionicons "ice-cream" glyph as SVG text instead (see
// FoodBuilderIcons.tsx's own header comment for why), still through this
// exact same (size, color) => ReactNode renderer shape, so nothing here
// needed to change. Checked FIRST, below, before ever falling back to the
// raster <Image> path, so a genuinely vector-backed choice never silently
// renders the default butterfly just because it has no entry in
// TAB_HUB_ICON_SOURCES.
//
// colors.tabFood, not an arbitrary pick -- Dessert Builder lives on the
// Food tab, so its own identity color gives this choice real, deliberate
// meaning (this icon came from the Food tab) rather than a color chosen
// for no particular reason.
const TAB_HUB_VECTOR_ICONS: Partial<Record<TabHubIconChoice, (size: number, color: string) => ReactNode>> = {
  dessertBuilder: (size, color) => <DessertBuilderIcon size={size} color={color} />,
};
const DESSERT_BUILDER_TAB_HUB_COLOR = colors.tabFood;

// 'ionicons', not 'Ionicons' -- the exact font family name @expo/vector-
// icons registers this font under (see node_modules/@expo/vector-icons/
// build/Ionicons.js: createIconSet(glyphMap, 'ionicons', font)), which SVG
// text needs to match exactly to find the right glyph shapes.
const IONICONS_FONT_FAMILY = 'ionicons';
// Read directly from node_modules/@expo/vector-icons/build/vendor/
// react-native-vector-icons/glyphmaps/Ionicons.json -- SVG text has no
// "look up this icon by name" helper of its own the way <Ionicons name=.../>
// does, so the raw codepoint for each name this file needs stands in for it.
const HOME_GLYPH_CODEPOINT = 0xf382; // "home"
const INFORMATION_CIRCLE_GLYPH_CODEPOINT = 0xf398; // "information-circle"

// Renders one Ionicons glyph as real SVG text with a gradient fill, using
// the IDENTICAL rotatedIridescentPalette values IridescentRingCircle's own
// ring uses, rather than a single hue-shifted color -- a plain Text/
// Ionicons `color` prop can only ever be one flat color, which can't look
// like the multi-stop-gradient ring around it no matter how that one color
// is animated (two earlier passes on Home's own icon proved that: a full
// 0-360 hue sweep, then a narrowed +/-15-degree wobble, both still read as
// the icon slowly turning into another tab's own color). Rendering the
// glyph as SVG text with a real gradient fill instead is the same
// technique ScreenHeader.tsx's own app-name text already uses, for the same
// underlying reason. react-native-svg's <Stop> can't be driven straight off
// the UI thread (see ScreenHeader.tsx's own history for why) -- this reuses
// that same throttled useThrottledHueDegrees bridge rather than inventing a
// second one. `gradientId` just needs to be unique among whichever of these
// happen to be on screen at once (currently at most two: Home's own grid
// icon, and Info's, when Home is the active route -- see TabInfoIcon below).
function IridescentGlyphIcon({ glyphCodepoint, size, gradientId }: { glyphCodepoint: number; size: number; gradientId: string }) {
  const hueRotation = useIridescentHueRotation();
  const gradientColors = rotatedIridescentPalette(useThrottledHueDegrees(hueRotation));
  return (
    <Svg width={size} height={size}>
      <Defs>
        <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          {gradientColors.map((stopColor, index) => (
            <Stop key={index} offset={index / (gradientColors.length - 1)} stopColor={stopColor} />
          ))}
        </SvgLinearGradient>
      </Defs>
      <SvgText
        x={size / 2}
        y={size / 2}
        fontFamily={IONICONS_FONT_FAMILY}
        fontSize={size}
        fill={`url(#${gradientId})`}
        textAnchor="middle"
        alignmentBaseline="central"
      >
        {String.fromCodePoint(glyphCodepoint)}
      </SvgText>
    </Svg>
  );
}

function TabHomeIcon({ size }: { size: number }) {
  return <IridescentGlyphIcon glyphCodepoint={HOME_GLYPH_CODEPOINT} size={size} gradientId="tabHomeIconGradient" />;
}

// The Info tile (see its own render below) pairs with whichever tab item is
// currently active, in that same tab's own color -- when Home is active,
// "that same color" is now a gradient, not a flat one, so Info's own icon
// needs the identical gradient treatment to actually match, 2026-07-28
// (explicitly requested). Every other tab still pairs with Info via a flat
// color, unchanged.
function TabInfoIcon({ size }: { size: number }) {
  return <IridescentGlyphIcon glyphCodepoint={INFORMATION_CIRCLE_GLYPH_CODEPOINT} size={size} gradientId="tabInfoIconGradient" />;
}

// Centralizes the "Home gets a different color treatment" check in one
// place so the grid's own active/inactive branches below don't each need
// their own copy of it.
//
// 2026-08-05: also special-cases Purple Digest, now that it's a real tab in
// TAB_ROUTES (previously rendered from its own hardcoded 4th-row block,
// which called PurpleRibbonIcon directly at PURPLE_RIBBON_SIZE rather than
// through this shared helper). A bare Ionicons "ribbon" glyph (what
// route.icon falls back to for any other consumer of this list) was already
// tried and rejected here once -- see LensHub.tsx's own history: it read as
// a race/award rosette, not an awareness ribbon -- so this renders the real
// custom mark instead, same as it always has. PURPLE_RIBBON_SIZE, not the
// passed-through `size` (always 20 from this grid's own call site below),
// deliberately -- that constant was itself tuned specifically to visually
// match a 20px Ionicons glyph's footprint (see its own comment), so
// preserving it here keeps that same calibration rather than silently
// changing it.
function TabRouteIcon({ route, size }: { route: TabRoute; size: number }) {
  if (route.path === '/') {
    return <TabHomeIcon size={size} />;
  }
  if (route.path === '/purple-digest') {
    return <PurpleRibbonIcon size={PURPLE_RIBBON_SIZE} color={route.color} />;
  }
  return <Ionicons name={route.icon} size={size} color={route.color} style={textShadow} />;
}

// The popup menu card's own iridescent border -- the same shared Reanimated
// value already used for ScreenHeader's app-name text, ScreenBackground's
// footer line, and every IridescentRingCircle in this same menu, rather
// than a separately invented animation for this one card. A plain
// LinearGradient can't be driven straight off the UI thread the way the
// other consumers are (see this card's own history: two theories about
// *how* it was driven were tried and ruled out), so it uses the same
// throttled JS-bridge as ScreenHeader's gradient text.
//
// 2026-07-28: this hook call used to live at TabHub's own top level, which
// meant its ~10-times-a-second state update re-rendered the ENTIRE modal
// (every grid item, all 10 of them) the whole time the menu was open, not
// just this ring -- LensHub.tsx's own card has zero such churn (a flat,
// unanimated border). Isolating it in this own small wrapper means only
// THIS component re-renders that often; `children` (the actual grid)
// keeps the same element reference across those re-renders since TabHub
// itself no longer re-renders to produce a new one, so React bails out of
// reconciling it entirely -- the actual fix for the "drops in a few
// pixels except the very first open" bug, if the re-render churn itself
// (not any one specific technique) was the real cause all along.
function TabHubCardRing({ children }: { children: ReactNode }) {
  const hueRotation = useIridescentHueRotation();
  const cardRingColors = rotatedIridescentPalette(useThrottledHueDegrees(hueRotation));
  return (
    <View style={styles.cardRing}>
      <LinearGradient colors={cardRingColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
      {children}
    </View>
  );
}

// 3 columns -- room for up to 9 icons across 3 rows before a 4th row would
// be needed. Sized just wide enough for a 3-column grid of small icons,
// not a percentage of screen width, so columns stay tight together
// instead of spreading out on a wider phone.
const CARD_WIDTH = 216;
const CARD_LEFT_MARGIN = 16;

// 2026-07-28: `card` below used to have no fixed height at all -- it sized
// itself to its own flexWrap content, recomputed fresh every time this
// Modal remounts its children (which happens on every single open, not
// just the first -- Modal unmounts its subtree while `visible={false}`).
// Reported as the whole card visibly dropping down a few pixels to its
// real resting spot on every open: since the card is bottom-anchored with
// no fixed height, any difference between that first content-driven layout
// pass and whatever it settles to next shows up as the box's own top edge
// moving. LensHub.tsx's own popup (components/LensHub.tsx) never showed
// this because its card already uses a real fixed `height`, not
// content-sizing -- giving this card the same fixed-height treatment,
// computed the same way (row math, not a measured/guessed constant),
// removes the auto-sizing step entirely rather than trying to chase why it
// was unstable from one mount to the next.
const CARD_ITEM_PADDING_VERTICAL = 4; // matches `item`'s own paddingVertical below
const CARD_ITEM_GAP = 1; // matches `item`'s own gap below
const CARD_ITEM_LABEL_LINE_HEIGHT = 13; // itemLabel's own fontSize (10) * ~1.3, same estimate approach as LensHub.tsx's own GRID_ITEM_LABEL_LINE_HEIGHT
const CARD_ROW_HEIGHT = CARD_ITEM_PADDING_VERTICAL * 2 + ICON_PILL_SIZE + CARD_ITEM_GAP + CARD_ITEM_LABEL_LINE_HEIGHT;
// Real nav items rendered before Info: every TAB_ROUTES entry, plus Profile
// (which isn't itself one of TAB_ROUTES -- see its own comment below -- but
// renders in the same grid slot sequence right after them).
const CARD_GRID_COLUMNS = 3;
const ITEMS_BEFORE_INFO = TAB_ROUTES.length + 1;
// Info renders immediately after Profile, no blank spacers -- 2026-08-13,
// direct request: "Move the Info icon up one row so it is in the middle
// spot, just to the right of the Profile icon." With 9 real tabs, Profile
// (item index 9, 0-indexed) lands at column 0 of its own row (9 % 3 = 0),
// so the very next item -- Info, with nothing padded in between -- falls
// naturally into column 1, the middle slot of that same row, immediately
// to Profile's right. Computed from the real item count rather than
// hardcoded, so this keeps landing correctly if TAB_ROUTES' own length
// ever changes to something else where Profile isn't at column 0 -- in
// that case Info simply continues on directly from wherever Profile fell,
// same as any other real grid item, rather than always forcing a shared
// row.
const CARD_ROW_COUNT = Math.ceil((ITEMS_BEFORE_INFO + 1) / CARD_GRID_COLUMNS);
const CARD_PADDING_VERTICAL = 4; // matches `card`'s own paddingVertical below, top + bottom
const CARD_HEIGHT = CARD_ROW_COUNT * CARD_ROW_HEIGHT + CARD_PADDING_VERTICAL * 2;

// The single floating "hub" button that replaced the old 7-icon bottom tab
// bar -- stays bottom-center. The picker it opens is deliberately NOT
// centered under it, though -- it's anchored to the left edge instead, so
// the whole group of icons sits inside a left thumb's natural sweep for
// one-handed use. Swiping (see SwipeableTabScreen) remains the fast path
// between adjacent tabs; this is the fast path to anywhere else.
export function TabHub() {
  const [open, setOpen] = useState(false);
  // A tenth attempt at the "card drops in from above" bug, 2026-08-01 --
  // unlike the nine before it (see the Modal's own long comment below),
  // this one is backed by real, captured timing data, not another guess
  // from reading code alone: on-device logs showed the card's own layout
  // committing correctly on its FIRST and only pass, but Android not
  // confirming its native Dialog window was actually up until ~34ms
  // later. The card was never mispositioned; it was painting onto a
  // window that hadn't finished settling its own edge-to-edge geometry
  // yet. Keeping the card invisible until onShow -- the same signal this
  // file already trusts for the identical "is the window really ready"
  // question (see handleModalShow's own NavigationBar call) -- means it
  // can only ever become visible once that's true, regardless of the
  // underlying window-geometry mechanism. Reset to false the instant the
  // menu is asked to open (see the button's own onPress below); there's
  // no other path that sets `open` true, so nothing else needs to reset
  // it back.
  const [cardReady, setCardReady] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { currentHelp, activeTabPath } = useCurrentPageHelp();
  // 2026-08-09, "make it so each icon is available in the user profile to
  // choose to use in the TabHub menu icon position" -- live-reactive the
  // same way every other visualPreferences consumer already is (Profile's
  // own picker, the shared background), so choosing a new icon there shows
  // up on this button immediately, no restart needed. Falls back to the
  // default butterfly if the stored choice somehow doesn't resolve to a
  // real source (e.g. a future app update removes a condition) -- a
  // defensive, never-blank fallback rather than trusting the stored value
  // unconditionally.
  const { tabHubIcon } = useVisualPreferences();
  // Checked BEFORE the raster fallback below -- a real, vector-backed
  // choice (see TAB_HUB_VECTOR_ICONS' own comment) has no entry in
  // TAB_HUB_ICON_SOURCES at all, so resolving buttonIconSource first would
  // have silently rendered the default butterfly in its place.
  const vectorIconRenderer = TAB_HUB_VECTOR_ICONS[tabHubIcon];
  // The trailing `!` is safe, not just convenient -- TAB_HUB_ICON_SOURCES.default
  // is a real, always-present literal key in that object (never removed),
  // so this can only be undefined if the earlier lookup itself resolved to
  // a real source, making the fallback moot either way. Only actually used
  // when vectorIconRenderer above is unset.
  const buttonIconSource = TAB_HUB_ICON_SOURCES[tabHubIcon] ?? TAB_HUB_ICON_SOURCES.default!;
  // See getTabHubIconRenderSize's own header comment (constants/
  // tabHubIcons.ts) for why this is computed per-render from the chosen
  // icon's own real aspect ratio, not a fixed size -- the actual fix for
  // condition icons rendering smaller than the butterfly. Overhang follows
  // the exact same formula the old static BUTTERFLY_OVERHANG_X/Y always
  // used, just against whichever width/height is actually showing right
  // now, so the touch target (hitSlop, below) always covers the real,
  // currently-visible artwork rather than staying calibrated to the
  // butterfly's own shape regardless of what's chosen.
  const { width: buttonIconWidth, height: buttonIconHeight } = getTabHubIconRenderSize(tabHubIcon);
  const buttonIconOverhangX = Math.max(0, Math.ceil((buttonIconWidth - BUTTON_SIZE) / 2));
  const buttonIconOverhangY = Math.max(0, Math.ceil((buttonIconHeight - BUTTON_SIZE) / 2));

  // TEMPORARY diagnostic instrumentation, 2026-08-01 -- for the still-
  // unresolved "card drops in from above" bug (see this file's own long
  // comment on the Modal below for the full history: nine attempts so
  // far, all reasoned, all disproven). Every prior attempt guessed at a
  // mechanism from reading code alone; this instead prints real,
  // millisecond-timestamped events -- when the card's own layout actually
  // settles, relative to the tap and to Android confirming its Dialog
  // window is up -- to the Metro/adb log, so the NEXT reproduction (open
  // TabHub while a WheelPicker is mounted, the confirmed trigger)
  // produces real data instead of another theory. Remove this block, its
  // two call sites below, and the card's own onLayout prop once that data
  // has actually been captured and used -- it's not meant to ship long
  // term.
  const dropTimingOpenedAtRef = useRef<number | null>(null);
  function logDropTiming(label: string) {
    const openedAt = dropTimingOpenedAtRef.current;
    const elapsed = openedAt === null ? 0 : Date.now() - openedAt;
    console.log(`[TabHub drop-timing] +${elapsed}ms: ${label}`);
  }

  // The root layout (app/_layout.tsx) already sets this once for the main
  // Activity window, but this Modal opens as its own separate Android
  // Dialog window (see the comment on the Modal itself, below) -- that
  // setting doesn't necessarily carry over automatically, so it's
  // reasserted specifically whenever this menu opens, as a second attempt
  // at the same "dark strip behind the nav bar" bug navBarMask already
  // tries to patch further down.
  //
  // 2026-07-28: moved from a useEffect keyed on `open` to the Modal's own
  // onShow below -- reported as the whole card visibly dropping a few
  // pixels on every open EXCEPT the very first one of the app session,
  // regardless of which tab it was opened from (two earlier, disproven
  // theories: content-driven card height, and the card ring's own
  // Animated.createAnimatedComponent mount timing -- see this file's own
  // history). A useEffect keyed on `open` fires the instant React commits
  // that state change, which can be BEFORE Android's own native Dialog
  // window has actually finished appearing -- racing this async native
  // call (which can itself trigger a window-insets recalculation on
  // Android, changing the Dialog's own usable height) against the Dialog's
  // own first layout pass. onShow only fires once Android confirms the
  // Dialog is actually up, removing that race outright rather than timing
  // around it.
  function handleModalShow() {
    logDropTiming('Modal onShow (Android Dialog window confirmed up)');
    setCardReady(true);
    if (Platform.OS === 'android') {
      NavigationBar.setStyle('dark');
    }
  }

  // 2026-07-27: this used to bump a shared dropRequestId (see
  // TabRevealContext.tsx, since removed) and delay navigation by
  // TAB_REVEAL_DURATION_MS, the same drop-then-navigate sequencing as
  // SwipeableTabScreen's own onEnd, giving GatedTabContent's own risen
  // panel time to visibly retreat first. Removed along with that
  // component's rise/drop animation -- dropping back to resting is
  // instant now, so there's nothing left to wait for before navigating.
  function go(path: Href) {
    setOpen(false);
    // Appends a fresh, ever-changing openLensHub query param, 2026-08-08,
    // explicitly requested: picking a tab from this menu should land with
    // that tab's own LensHub already open, ready to pick a function --
    // see hooks/useAutoOpenLensHubSignal.ts for the full reasoning
    // (including why this is safe now, unlike two earlier, reverted
    // attempts at auto-opening on arrival) and LensHub.tsx's own
    // `autoOpenSignal` prop, which actually reacts to it. Every real
    // TAB_ROUTES path is a plain string, not the {pathname, params}
    // object form Href also allows, so a plain query-string append (cast
    // back to Href) is simpler here than trying to type an object literal
    // against that broader union.
    const target = typeof path === 'string' ? (`${path}?openLensHub=${Date.now()}` as Href) : path;
    router.navigate(target);
  }

  function openHelpForCurrentPage() {
    setOpen(false);
    if (currentHelp) {
      setHelpVisible(true);
    }
  }

  // Profile isn't one of TAB_ROUTES (see constants/tabs.ts) -- it's a Stack
  // push outside the (tabs) group entirely, not a sibling screen in the
  // swipeable tab order, so it deliberately never registers an
  // activeTabPath the way a real tab does (see ScreenHeader's tabPath
  // comment). usePathname() directly is a fine, self-contained substitute
  // for this one exception rather than threading Profile through machinery
  // that's meant to stay scoped to actual tabs.
  const profileActive = pathname === '/profile';

  function openProfile() {
    setOpen(false);
    // push, not TabHub's own go()/navigate -- Profile is a Stack screen you
    // land on and back out of, not a sibling tab to switch to.
    router.push('/profile');
  }

  // The Purple Digest used to be a Stack-push exception here too (like
  // Profile, above) -- promoted to a real tab 2026-08-05 (see
  // constants/tabs.ts), so it now flows through the ordinary TAB_ROUTES.map()
  // loop and go() below like every other tab; no special handling left here.

  // The Info tile opens the help sheet for whichever page is currently
  // open (see openHelpForCurrentPage below) -- it should read as "about
  // THIS page," so it borrows that page's own identity color/sheen rather
  // than sitting permanently muted like a generic utility icon. No match
  // (e.g. activeTabPath hasn't been registered yet on a cold launch) falls
  // back to the same muted treatment Info always used before this.
  const activeRoute = TAB_ROUTES.find((route) => route.path === activeTabPath);

  const buttonBottom = insets.bottom + BOTTOM_OFFSET;
  // Independent of buttonBottom -- the button itself stays anchored inside
  // the footer band; only the popup card floats clear above it (see
  // useMenuCardBottom's own comment in constants/floatingButton.ts).
  const cardBottom = useMenuCardBottom();

  return (
    <>
      <TouchableOpacity
        style={[styles.button, { bottom: buttonBottom }]}
        onPress={() => {
          dropTimingOpenedAtRef.current = Date.now();
          logDropTiming('tap (setOpen(true) about to run)');
          setCardReady(false);
          setOpen(true);
        }}
        activeOpacity={0.85}
        accessibilityLabel="Open navigation menu"
        hitSlop={{ left: buttonIconOverhangX, right: buttonIconOverhangX, top: buttonIconOverhangY, bottom: buttonIconOverhangY }}
      >
        {/* No circle, no fill, no border at rest -- the artwork itself is
            the button. Its own background was removed (see
            assets/branding/butterfly-transparent.png), so it sits directly
            on whatever the screen behind it is, rather than needing to
            color-match a solid backdrop.
            Open only: a graduated drop shadow (ELEVATION_SHADOW_LAYERS)
            meant to read as the button lifting off the page, not just a
            dark smudge under it. Each layer is another copy of the same
            transparent PNG, tinted solid black (recoloring only its own
            opaque pixels, keeping its exact alpha shape) and nudged
            straight down by its own amount, furthest/faintest painted
            first so nearer/darker ones layer over them -- this works on
            both platforms without a native shadow API, which turned out
            invisible for this specific case (Android has no alpha-aware
            View/Image shadow; shadowColor/shadowOpacity/shadowRadius/
            shadowOffset are iOS-only, and elevation, its one real
            mechanism, shadows a view's rectangular bounds, not a
            transparent PNG's actual silhouette). */}
        {vectorIconRenderer ? (
          // A real, separate rendering path for a vector-backed choice (see
          // TAB_HUB_VECTOR_ICONS' own comment) -- no Image/tintColor at
          // all, since the icon function already takes color directly.
          // Shadow copies reuse styles.butterflyRealCopy (plain position:
          // absolute/top/left, with no tintColor key -- unlike
          // styles.butterflyShadowCopy, which isn't a valid View style)
          // as their own base, with opacity/offset applied the identical
          // way the raster path applies them, just via a wrapping View
          // instead of an Image style prop, since Svg itself takes no
          // opacity/transform of its own here.
          open ? (
            <View style={[styles.butterflyOpenWrap, { width: buttonIconWidth, height: buttonIconHeight }]}>
              {ELEVATION_SHADOW_LAYERS.map((layer, index) => (
                <View
                  key={index}
                  style={[
                    styles.butterflyRealCopy,
                    { opacity: layer.opacity, transform: [{ translateX: -2 }, { translateY: layer.offsetY }] },
                  ]}
                >
                  {vectorIconRenderer(buttonIconWidth, '#000000')}
                </View>
              ))}
              <View style={[styles.butterflyRealCopy, { transform: [{ translateX: -2 }] }]}>
                {vectorIconRenderer(buttonIconWidth, DESSERT_BUILDER_TAB_HUB_COLOR)}
              </View>
            </View>
          ) : (
            <View style={{ transform: [{ translateX: -2 }] }}>
              {vectorIconRenderer(buttonIconWidth, DESSERT_BUILDER_TAB_HUB_COLOR)}
            </View>
          )
        ) : open ? (
          <View style={[styles.butterflyOpenWrap, { width: buttonIconWidth, height: buttonIconHeight }]}>
            {ELEVATION_SHADOW_LAYERS.map((layer, index) => (
              <Image
                key={index}
                source={buttonIconSource}
                style={[
                  styles.butterflyImage,
                  { width: buttonIconWidth, height: buttonIconHeight },
                  styles.butterflyShadowCopy,
                  { opacity: layer.opacity, transform: [{ translateX: -2 }, { translateY: layer.offsetY }] },
                ]}
                resizeMode="contain"
              />
            ))}
            <Image
              source={buttonIconSource}
              style={[styles.butterflyImage, { width: buttonIconWidth, height: buttonIconHeight }, styles.butterflyRealCopy]}
              resizeMode="contain"
            />
          </View>
        ) : (
          <Image
            source={buttonIconSource}
            style={[styles.butterflyImage, { width: buttonIconWidth, height: buttonIconHeight }]}
            resizeMode="contain"
          />
        )}
      </TouchableOpacity>

      {/* statusBarTranslucent/navigationBarTranslucent: Android's Modal opens
          as its own separate window, which does NOT inherit the main
          Activity's edge-to-edge configuration (see app.json's
          edgeToEdgeEnabled) -- without both of these, that window falls
          back to its own defaults: an opaque status bar AND an opaque
          (black) navigation bar, visible as a seam/bar in exactly the areas
          the OS's own icons sit, top and bottom, only while this modal is
          open. Both props are required together -- RN warns if only one is
          set, since Android itself requires the pair to make a dialog
          window fully edge-to-edge. */}
      {/* A NINTH investigated (and disproven) theory for the "drops in a
          few pixels/from above" bug, 2026-08-01, joining the eight already
          on record in CLAUDE.md: wrapping this Modal's content in its own
          GestureHandlerRootView, on the reasoning that a Modal opens a
          separate native window that doesn't automatically inherit the
          app root's own instance (a real, documented react-native-gesture-
          handler gotcha). This one had real, fresh, cross-component
          evidence behind it (confirmed gated on a WheelPicker being
          mounted elsewhere, AND that LensHub's own Modal shows the
          identical symptom under the identical condition -- ruling out
          anything TabHub-specific, which is exactly what the eight prior
          attempts couldn't do). Tried and confirmed on-device NOT to
          change the behavior at all, same as every attempt before it --
          removed rather than left in as dead, misleading scaffolding. The
          real trigger is confirmed narrowed to WheelPicker's own live
          Reanimated content (components/WheelPicker.tsx) coexisting with
          ANY subsequently-opened Modal, but the actual mechanism inside
          that is still unknown. Next real step needs on-device profiling
          (a screen recording at minimum, ideally Android's own "Profile
          GPU rendering" or a Flipper/systrace capture) rather than a
          tenth blind guess. */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onShow={handleModalShow}
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          {/* Shadow lives on this outermost box -- overflow: 'hidden' on
              cardRing below (needed to clip the gradient into the same
              rounded rect) would otherwise clip the shadow too. */}
          <View
            style={[
              styles.cardShadowWrap,
              { bottom: cardBottom, left: CARD_LEFT_MARGIN, width: CARD_WIDTH },
              // Invisible (not just unmounted -- see cardReady's own
              // comment above) until Android confirms its Dialog window
              // is genuinely up, so nothing ever paints during whatever
              // window-geometry settling produced the drop-in. Still laid
              // out and logged the whole time (opacity/pointerEvents don't
              // affect layout), so the diagnostic data above stays
              // meaningful for comparison against how this actually looks
              // on-device now.
              { opacity: cardReady ? 1 : 0 },
            ]}
            pointerEvents={cardReady ? 'auto' : 'none'}
            onLayout={(event) => {
              const { x, y, width, height } = event.nativeEvent.layout;
              logDropTiming(`card onLayout: x=${Math.round(x)} y=${Math.round(y)} w=${Math.round(width)} h=${Math.round(height)}`);
            }}
          >
            <TabHubCardRing>
              <View style={styles.card}>
                {TAB_ROUTES.map((route) => {
              // activeTabPath (see CurrentPageHelp.tsx), not the router's
              // own usePathname() -- kept as a direct, router-independent
              // tracking mechanism (see CurrentPageHelp.tsx's own comment
              // for the cold-launch ambiguity this was originally built to
              // avoid, since fixed at the routing level).
              const active = activeTabPath === route.path;
              // 2026-07-26: the icon itself is now always shown in its own
              // full identity color, active or not -- the same plain,
              // colored-icon-no-background treatment GatedTabContent.tsx's
              // resting prompt already uses ("Tap the [icon] button...").
              // The label still dims when inactive (menuLabelMuted); the
              // ring below (IridescentRingCircle, active only) is now the
              // real "you are here" signal, a shape-based cue independent
              // of color the same way the pill used to be, just a ring
              // instead of a filled circle.
              const labelColor = active ? route.color : colors.menuLabelMuted;
              return (
                <TouchableOpacity
                  key={route.title}
                  style={styles.item}
                  onPress={() => go(route.path)}
                  activeOpacity={0.7}
                >
                  {active ? (
                    <IridescentRingCircle size={ICON_PILL_SIZE}>
                      <TabRouteIcon route={route} size={20} />
                    </IridescentRingCircle>
                  ) : (
                    <View style={styles.iconPillPlain}>
                      <TabRouteIcon route={route} size={20} />
                    </View>
                  )}
                  <Text style={[styles.itemLabel, { color: labelColor }]} numberOfLines={1} ellipsizeMode="tail">
                    {route.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {/* Rendered right after every real TAB_ROUTES tab -- Profile used to be reached from a
                person-icon in every screen's own top-right header (see
                ScreenHeader.tsx); it lives here instead now, with its own
                identity color (colors.tabProfile) like a real tab, rather
                than permanently muted like Info. It still isn't a real tab
                in constants/tabs.ts -- see profileActive's comment above
                for why -- so it doesn't participate in the swipe order.
                Rendered before Info (was the reverse), 2026-07-27,
                explicitly requested so Info lands in the true last grid
                cell (bottom-right) instead of the middle of the last row
                -- see Info's own comment just below for why that spot was
                asked for specifically, matching LensHub's own Info tile
                moving to the same corner the same day. */}
            <TouchableOpacity key="profile" style={styles.item} onPress={openProfile} activeOpacity={0.7}>
              {profileActive ? (
                <IridescentRingCircle size={ICON_PILL_SIZE}>
                  <Ionicons name="person-circle" size={20} color={colors.tabProfile} style={textShadow} />
                </IridescentRingCircle>
              ) : (
                <View style={styles.iconPillPlain}>
                  <Ionicons name="person-circle" size={20} color={colors.menuIconMuted} style={textShadow} />
                </View>
              )}
              <Text
                style={[styles.itemLabel, { color: profileActive ? colors.tabProfile : colors.menuLabelMuted }]}
                numberOfLines={1}
              >
                Profile
              </Text>
            </TouchableOpacity>

            {/* No blank spacers -- 2026-08-13, direct request, Info moved to
                sit immediately right of Profile in the middle column of
                Profile's own row, rather than centered alone on its own
                final row (see CARD_ROW_COUNT's own comment above for why
                this lands there with zero padding needed). */}
            {/* Opens the help sheet for whichever page
                is currently open (see CurrentPageHelp) -- lets someone
                check "what does this page do" from the same picker they'd
                use to navigate, without first closing it and hunting for
                the info icon in the header. Colored in that page's own
                identity color (2026-07-25) rather than permanently muted --
                unlike the tab items above, this one has no "inactive"
                state at all: it's always about whichever page you're
                already on, so it always shows that page's color.
                2026-07-26, twice over: first the ring was made
                unconditional (wrong -- Info was never really "selected"
                the way a real tab is), then removed entirely to fix that.
                Explicitly corrected again: the ring belongs back, but
                gated on activeRoute specifically (not unconditional) --
                its whole point is to visually PAIR with whichever tab item
                above is showing its own ring right now, both the same
                color, so the two read as connected ("this info is about
                that highlighted page") -- not "Info itself is selected."
                No activeRoute match (e.g. a cold launch) means nothing to
                pair with, so no ring, same as the tab items' own inactive
                state. */}
            <TouchableOpacity style={styles.item} onPress={openHelpForCurrentPage} activeOpacity={0.7}>
              {activeRoute ? (
                <IridescentRingCircle size={ICON_PILL_SIZE}>
                  {activeRoute.path === '/' ? (
                    <TabInfoIcon size={20} />
                  ) : (
                    <Ionicons name="information-circle" size={20} color={activeRoute.color} style={textShadow} />
                  )}
                </IridescentRingCircle>
              ) : (
                <View style={styles.iconPillPlain}>
                  <Ionicons name="information-circle" size={20} color={colors.menuIconMuted} style={textShadow} />
                </View>
              )}
              <Text
                style={[styles.itemLabel, { color: activeRoute ? activeRoute.color : colors.menuLabelMuted }]}
                numberOfLines={1}
              >
                Info
              </Text>
            </TouchableOpacity>
              </View>
            </TabHubCardRing>
          </View>
          {/* Defensive fix, 2026-07-25: navigationBarTranslucent (above) is
              supposed to let the real Activity's own dark colors.background
              show through behind the nav bar, but Android's Dialog-based
              Modal doesn't reliably composite that in the system-bar-inset
              strip itself -- reported as that strip turning solid black
              specifically while this menu is open, on a 3-button (not
              gesture) nav bar. Rather than depend on that compositing being
              correct, this paints real colors.background pixels there
              directly, so it's right regardless of what Android does
              underneath. pointerEvents: 'none' -- purely cosmetic, must
              never intercept a tap meant for the OS's own nav buttons. */}
          <View style={[styles.navBarMask, { height: insets.bottom }]} pointerEvents="none" />
        </View>
      </Modal>

      <HelpSheet
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
        pageTitle={currentHelp?.title ?? ''}
        sections={currentHelp?.sections ?? []}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    alignSelf: 'center',
    // Layout footprint stays BUTTON_SIZE (a square) so LensHub/ScopeHub's
    // own position math, which is anchored relative to this exact size,
    // stays correct -- only the artwork rendered inside is allowed to
    // spill wider than the box (see overflow: 'visible' + hitSlop above).
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    // elevation/zIndex, 2026-07-27: without either, this button was
    // getting visually covered by a tab's own revealed content
    // (GatedTabContent.tsx's Animated.View, translateY-animated via
    // Reanimated) once risen -- JSX paint order alone (this button
    // renders after <Tabs> in app/(tabs)/_layout.tsx, so it should already
    // be on top) isn't reliably respected on Android once an animated
    // transform is involved, since Reanimated views are commonly promoted
    // to their own hardware-composited layer there, which can render
    // above plain siblings regardless of tree order. Explicit elevation
    // forces Android's own real stacking to respect this; zIndex is the
    // cross-platform sibling-ordering counterpart RN's own style system
    // understands (iOS was never affected, but this keeps both platforms
    // governed by the same explicit rule instead of one relying on
    // implicit paint order).
    elevation: 10,
    zIndex: 10,
  },
  butterflyImage: {
    // width/height used to live here as fixed BUTTERFLY_WIDTH/HEIGHT --
    // 2026-08-09, moved to a per-render inline style instead (see
    // buttonIconWidth/Height above), since the actual rendered size now
    // depends on which icon is currently chosen, not a single fixed
    // butterfly-only box. Every OTHER style property here stays static,
    // unrelated to which icon is showing.
    //
    // Re-added 2026-07-27, explicitly requested despite no diagnosed
    // cause -- a near-identical -2px leftward nudge lived here before,
    // was removed the same day pixel analysis showed the asset itself
    // centered to within 1px (attributing the perceived offset to the OS's
    // own nav-bar button, not this component), and was then reported as
    // making things look off-center *to the left*. This time the report
    // is the opposite direction (slightly right of center), so this is a
    // small leftward correction again -- still experimental, not a fix
    // for any bug found in the position math itself (there isn't one; see
    // the button style's own alignSelf: 'center' and floatingButton.ts,
    // neither references any left/right inset that could skew this).
    // Adjust or remove based on how it actually looks on-device.
    transform: [{ translateX: -2 }],
  },
  // Open-only wrapper -- sized to the artwork's own full footprint (the
  // per-render buttonIconWidth/Height, not BUTTON_SIZE -- see the inline
  // override at this style's own usage) so the shadow/outline/real-image
  // children below, all absolutely positioned within it, have a large
  // enough box to be positioned against. `button`'s own alignItems/
  // justifyContent center this wrapper exactly the way it used to center
  // the bare Image directly, so the closed <-> open switch doesn't shift
  // anything.
  butterflyOpenWrap: {},
  // No transform of its own -- butterflyImage's own translateX: -2
  // survives the style merge (RN merges style OBJECTS key-by-key, and
  // this one simply doesn't declare a `transform` key to override it).
  butterflyRealCopy: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  // opacity/transform are set per-layer inline (see ELEVATION_SHADOW_LAYERS)
  // -- each layer's own opacity there is the ONLY darkness control, so
  // tintColor here is solid, fully-opaque black (not a translucent black),
  // otherwise the two would multiply together and every layer would come
  // out fainter than ELEVATION_SHADOW_LAYERS' own numbers suggest. Recolors
  // only the artwork's own opaque pixels, keeping its exact alpha shape --
  // see this file's own comment on why this replaces a native shadow prop
  // entirely rather than pairing with one.
  butterflyShadowCopy: {
    position: 'absolute',
    top: 0,
    left: 0,
    tintColor: '#000000',
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.25)' },
  // `height` set inline (insets.bottom) -- see the comment where this is
  // rendered.
  navBarMask: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
  },
  // Positioned + shadowed, nothing else -- see this View's own JSX comment
  // for why the shadow lives here rather than on cardRing/card below.
  cardShadowWrap: {
    position: 'absolute',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  // The gradient-filled outer layer of the card's iridescent border --
  // padding: CARD_RING_WIDTH is what actually gives the line its
  // thickness, leaving that much of the gradient showing around `card`
  // below rather than being fully covered by it. overflow: 'hidden' clips
  // the gradient (a rectangle by default) to this box's own rounded
  // corners, same trick as IridescentRingCircle.tsx.
  cardRing: {
    borderRadius: 14,
    padding: CARD_RING_WIDTH,
    overflow: 'hidden',
  },
  // A compact card anchored to the left edge -- same small icon/label
  // sizing as before, wrapped into a tight 3-column grid with minimal
  // padding so the whole group of icons sits close together. Replaces its
  // old flat borderWidth/borderColor -- cardRing above is what now reads
  // as this card's edge.
  card: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // colors.menuSurface, not colors.surface -- see the comment on that
    // token: surface's own blue hue was the real reason Schedules' icon
    // kept blending in, not a lack of darkness/lightness.
    backgroundColor: colors.menuSurface,
    borderRadius: 14 - CARD_RING_WIDTH,
    paddingVertical: CARD_PADDING_VERTICAL,
    paddingHorizontal: 2,
    // Fixed, not auto-sized from flexWrap content -- see CARD_HEIGHT's own
    // comment above for the "drops in a few pixels on every open" bug this
    // fixes. overflow: 'hidden' pairs with it the same way LensHub.tsx's
    // own fixed-height card does, so a slightly-off row-height estimate
    // clips rather than visibly overflowing the card's own rounded edge.
    height: CARD_HEIGHT,
    overflow: 'hidden',
  },
  item: { width: '33.33%', alignItems: 'center', gap: 1, paddingVertical: 4 },
  // The inactive/plain state -- same footprint as IridescentRingCircle's
  // own `size` (ICON_PILL_SIZE), just centering a bare icon with no circle
  // or ring, so every item in the grid lines up at the same height either
  // way.
  iconPillPlain: {
    width: ICON_PILL_SIZE,
    height: ICON_PILL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: { ...typography.caption, fontSize: 10 },
});
