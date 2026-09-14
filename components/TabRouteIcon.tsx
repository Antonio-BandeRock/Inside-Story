import { Ionicons } from '@expo/vector-icons';
import type { TabRoute } from '../constants/tabs';
import { textShadow } from '../constants/typography';
import { PurpleRibbonIcon } from './PurpleRibbonIcon';

// One tab's own glyph, wherever a tab is represented by its icon: the TabHub
// grid, the header box at the top of a tab's resting area, and the corner box
// that says where you are. Pulled out of TabHub.tsx on 2026-09-13 so those
// three draw the same mark; before this the grid alone special-cased the
// Digest and the other two fell back to `route.icon`, Ionicons' plain
// "ribbon", the glyph tried and rejected on 2026-07-28 because it reads as a
// race or award rosette rather than an awareness ribbon (see
// PurpleRibbonIcon.tsx's own history). Direct request: "make sure that the
// icon on the Digest header is the correct icon."
//
// `size` is an Ionicons size, the square glyph's side. The ribbon is 1.71x
// taller than wide, so it is drawn at 23/20 of that height: TabHub's own
// calibration (2026-09-05, PURPLE_RIBBON_SIZE) for a ribbon that sits beside
// 20px glyphs without towering over them, kept as a ratio here so a caller at
// another size gets the same visual weight rather than the grid's fixed
// number.
const RIBBON_HEIGHT_PER_GLYPH_SIZE = 23 / 20;

export function TabRouteIcon({ route, size, color }: { route: TabRoute; size: number; color?: string }) {
  if (route.path === '/purple-digest') {
    // No colour passed by default: the ribbon draws the tab colour, the same
    // shade every other tab's glyph takes from route.color.
    return <PurpleRibbonIcon size={Math.round(size * RIBBON_HEIGHT_PER_GLYPH_SIZE)} color={color} />;
  }
  return <Ionicons name={route.icon} size={size} color={color ?? route.color} style={textShadow} />;
}
