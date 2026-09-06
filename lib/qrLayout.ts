// The geometry behind a rendered QR code, kept apart from the component that
// draws it so it can actually be tested.
//
// This is worth testing rather than eyeballing, because every way it can be
// wrong produces the same symptom: a code that looks perfectly fine on screen
// and silently will not scan. A missing quiet zone, an off-by-one on a merged
// run, or a path drawn a module short all render as a plausible-looking
// square. There is no visual tell, so the only real check is arithmetic.
import qrcodeGenerator from 'qrcode-generator';

// The spec's own quiet zone. Scanners need this blank margin to find the
// code's edges at all, and leaving it out is a common reason a QR that looks
// right refuses to read.
export const QUIET_ZONE_MODULES = 4;

// Level M recovers about 15% of a damaged code. Level L would make the code
// slightly smaller, but the one realistic failure here is glare on a phone
// screen, which is exactly what recovery margin is for. Worst case (a long
// name plus six shared condition codes) lands at 81x81, well inside what any
// phone camera reads at arm's length.
export const ERROR_CORRECTION = 'M' as const;

export type QrDrawing = {
  /** Width and height of the viewBox, in modules, including both quiet zones. */
  extent: number;
  /** Every dark module, as one SVG path. */
  path: string;
  /** Modules across the code itself, excluding the quiet zone. */
  moduleCount: number;
};

/**
 * Builds the drawing for a value, or null if it could not be encoded.
 *
 * Every dark module goes into ONE path rather than one rect each. An 81x81
 * code is 6,561 possible modules, and mounting thousands of SVG nodes to draw
 * one static image is a real cost on a phone. Horizontal runs are merged, so a
 * typical code comes out as a few hundred subpaths in a single element.
 */
export function buildQrDrawing(value: string): QrDrawing | null {
  let qr: ReturnType<typeof qrcodeGenerator>;
  try {
    // Type number 0 asks for the smallest code the data fits in, so a shorter
    // invite (conditions not shared, which is the default) produces a sparser,
    // easier-to-scan code on its own.
    qr = qrcodeGenerator(0, ERROR_CORRECTION);
    qr.addData(value);
    qr.make();
  } catch {
    // Only reachable if the payload outgrew the largest QR version, which an
    // invite cannot do: it has roughly five times the headroom.
    return null;
  }

  const moduleCount = qr.getModuleCount();
  let path = '';
  for (let row = 0; row < moduleCount; row += 1) {
    let col = 0;
    while (col < moduleCount) {
      if (!qr.isDark(row, col)) {
        col += 1;
        continue;
      }
      let run = 1;
      while (col + run < moduleCount && qr.isDark(row, col + run)) run += 1;
      const x = col + QUIET_ZONE_MODULES;
      const y = row + QUIET_ZONE_MODULES;
      path += `M${x} ${y}h${run}v1h-${run}z`;
      col += run;
    }
  }

  return { extent: moduleCount + QUIET_ZONE_MODULES * 2, path, moduleCount };
}

/**
 * How many modules the drawing actually paints, derived from the path itself.
 *
 * Exists for the test rather than the app: comparing this against a direct
 * count of dark modules is what proves no run was dropped, doubled, or drawn
 * a module short.
 */
export function countPaintedModules(path: string): number {
  let total = 0;
  for (const match of path.matchAll(/h(\d+)v1/g)) {
    total += Number(match[1]);
  }
  return total;
}
