import { Ionicons } from '@expo/vector-icons';
import type { TabRoute } from '../constants/tabs';
import { textShadow } from '../constants/typography';

// One tab's own glyph, wherever a tab is represented by its icon: the TabHub
// grid, the header box at the top of a tab's resting area, and the corner box
// that says where you are. Pulled out of TabHub.tsx on 2026-09-13 so those
// three draw the same mark.
//
// Every tab, the Digest included, is one Ionicons glyph as of 1.0.39.12.
// The Digest used to be the exception, a traced SVG ribbon drawn 1.71x
// taller than the glyphs beside it and needing a calibration ratio, a width
// override, and an inline-layout workaround wherever it appeared. Direct
// instruction: "You gave Digest on the Home screen the system ribbon icon.
// Let's just leave it and change all of the rest to that ribbon instead. It
// will make working with it elsewhere be far easier since it already matches
// the icon sizes of the rest of them." The reading holds up: it is still a
// ribbon, still a nod to autoimmunity, and it carries the other sense the
// tab is named for, a digest of food and of information.
//
// `size` is an Ionicons size, the square glyph's side.
export function TabRouteIcon({ route, size, color }: { route: TabRoute; size: number; color?: string }) {
  return <Ionicons name={route.icon} size={size} color={color ?? route.color} style={textShadow} />;
}
