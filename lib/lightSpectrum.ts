// A lamp's lux-to-PPFD ratio worked out from its spectrum (1.0.55.23), with
// no database and no React so node scripts/test_light_spectrum.js can check
// it.
//
// Asked for directly: "There is still nowhere to input the light spectrum of
// the light being tested for lux that needs to have it changed to ppfd. Are
// you not using the formula to include the spectrum?" Until this pass the
// spectrum reached the conversion only through the kind of light picked (one
// published ratio per kind) or through the maker's lumens and PPF. This is
// the formula itself.
//
// Lux weights each wavelength by how bright it looks to an eye: 683 lumens
// per watt times the CIE 1924 photopic curve V(λ), times the power at that
// wavelength. PPFD counts every photon from 400 to 700 nm alike. A photon at
// λ nm carries h·c/λ joules, so one µmol of them carries h·c·N_A/λ, which is
// 119.627/λ joules with λ in nm. So one µmol/m²/s of photons at λ gives
//
//     683 × V(λ) × 119.627 / λ   lux,
//
// which is about 147 at 555 nm, where an eye is most sensitive, and 8 at the
// 660 nm deep red of a grow panel. A lamp's ratio is that figure averaged
// over its photons from 400 to 700 nm, weighted by how many photons it gives
// off at each wavelength. Photons outside 400 to 700 nm are not counted,
// since PPFD does not count them and they add almost nothing to lux.
//
// Checked against the published ratios (Thimijan and Heins 1983): a 2856 K
// filament, which is what an incandescent bulb is, comes out at 50.2 against
// their 50, and daylight-like spectra from 5000 to 6500 K at 54 to 55 against
// their 54 for the sun.
//
// Two ways to describe a spectrum, both from what a spec sheet gives:
//
//  1. Colour shares: the photons in blue (400 to 500 nm), green (500 to 600)
//     and red (600 to 700). Horticultural spec sheets list these as PFD-B,
//     PFD-G and PFD-R in µmol/s, or as percentages; either can be typed,
//     since only the proportions matter. Within each band the photons are
//     taken as spread evenly, which is the approximation this way carries:
//     a band that is one narrow peak reads differently from a flat one.
//  2. Peaks: for a panel of coloured diodes, each diode colour's peak
//     wavelength and its share. Each peak is taken as a bell curve 20 nm
//     wide at half its height, which is typical of coloured LEDs.
//
// The result lands in the same field as a typed ratio or the maker's figures,
// so it is remembered per area and kind of light the same way.

/** CIE 1924 photopic luminous efficiency V(λ), 400 to 700 nm every 5 nm. */
const PHOTOPIC_V: readonly number[] = [
  0.000396, 0.00064, 0.00121, 0.00218, 0.004, 0.0073, 0.0116, 0.01684, 0.023, 0.0298,
  0.038, 0.048, 0.06, 0.0739, 0.09098, 0.1126, 0.13902, 0.1693, 0.20802, 0.2586,
  0.323, 0.4073, 0.503, 0.6082, 0.71, 0.7932, 0.862, 0.9149, 0.954, 0.9803,
  0.99495, 1, 0.995, 0.9786, 0.952, 0.9154, 0.87, 0.8163, 0.757, 0.6949,
  0.631, 0.5668, 0.503, 0.4412, 0.381, 0.321, 0.265, 0.217, 0.175, 0.1382,
  0.107, 0.0816, 0.061, 0.04458, 0.032, 0.0232, 0.017, 0.01192, 0.00821, 0.005723,
  0.004102,
];

export const PAR_START_NM = 400;
export const PAR_END_NM = 700;
/** How wide a coloured LED's peak is taken to be, at half its height. */
export const PEAK_WIDTH_NM = 20;

/** V(λ) at any wavelength from 400 to 700 nm, read between the 5 nm rows. */
export function photopic(nm: number): number {
  if (nm <= PAR_START_NM) return PHOTOPIC_V[0];
  if (nm >= PAR_END_NM) return PHOTOPIC_V[PHOTOPIC_V.length - 1];
  const index = (nm - PAR_START_NM) / 5;
  const low = Math.floor(index);
  return PHOTOPIC_V[low] + (PHOTOPIC_V[low + 1] - PHOTOPIC_V[low]) * (index - low);
}

/** Lux given by one µmol/m²/s of photons at one wavelength. */
export function luxPerMicromoleAt(nm: number): number {
  return (683 * photopic(nm) * 119.627) / nm;
}

/** The ratio for a photon spread over 400 to 700 nm, read every 1 nm, or
 *  null when the spread holds no photons in that range. */
export function ratioForPhotons(photonsAt: (nm: number) => number): number | null {
  let lux = 0;
  let photons = 0;
  for (let nm = PAR_START_NM; nm <= PAR_END_NM; nm += 1) {
    const weight = nm === PAR_START_NM || nm === PAR_END_NM ? 0.5 : 1;
    const count = Math.max(0, photonsAt(nm)) * weight;
    lux += count * luxPerMicromoleAt(nm);
    photons += count;
  }
  return photons > 0 ? lux / photons : null;
}

export type ColourShares = { blue: number; green: number; red: number };

export const COLOUR_BANDS: readonly { key: keyof ColourShares; label: string; from: number; to: number }[] = [
  { key: 'blue', label: 'Blue, 400 to 500 nm', from: 400, to: 500 },
  { key: 'green', label: 'Green, 500 to 600 nm', from: 500, to: 600 },
  { key: 'red', label: 'Red, 600 to 700 nm', from: 600, to: 700 },
];

function readShare(text: string): number | null {
  const trimmed = text.trim().replace(',', '.').replace('%', '');
  if (!trimmed) return 0;
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function rounded(ratio: number | null): number | null {
  return ratio === null ? null : Math.round(ratio * 10) / 10;
}

/** The ratio from blue, green and red photon shares, typed as percentages
 *  or as µmol/s, or null when a figure is not a number or all are zero. A
 *  blank share counts as none. */
export function ratioFromColourShares(texts: { blue: string; green: string; red: string }): number | null {
  const shares: Partial<ColourShares> = {};
  for (const band of COLOUR_BANDS) {
    const value = readShare(texts[band.key]);
    if (value === null) return null;
    shares[band.key] = value;
  }
  const total = (shares.blue ?? 0) + (shares.green ?? 0) + (shares.red ?? 0);
  if (total <= 0) return null;
  return rounded(
    ratioForPhotons((nm) => {
      let count = 0;
      for (const band of COLOUR_BANDS) {
        // Each band's photons spread evenly across its 100 nm; a wavelength
        // on the line between two bands takes half of each.
        if (nm >= band.from && nm <= band.to) {
          const shared = (nm === band.from && nm !== PAR_START_NM) || (nm === band.to && nm !== PAR_END_NM);
          const edge = shared ? 0.5 : 1;
          count += ((shares[band.key] ?? 0) / (band.to - band.from)) * edge;
        }
      }
      return count;
    }),
  );
}

export type PeakText = { nm: string; share: string };

/** The ratio from a list of diode peaks, each a wavelength and a share, or
 *  null when a filled row has a wavelength outside 400 to 700 nm or a share
 *  that is not a number, or when nothing is filled. A row with a wavelength
 *  and no share counts as one equal part. */
export function ratioFromPeaks(rows: readonly PeakText[]): number | null {
  const peaks: { nm: number; share: number }[] = [];
  for (const row of rows) {
    if (!row.nm.trim() && !row.share.trim()) continue;
    const nm = Number(row.nm.trim().replace(',', '.'));
    if (!row.nm.trim() || !Number.isFinite(nm) || nm < PAR_START_NM || nm > PAR_END_NM) return null;
    const share = row.share.trim() ? readShare(row.share) : 1;
    if (share === null) return null;
    if (share > 0) peaks.push({ nm, share });
  }
  if (peaks.length === 0) return null;
  const sigma = PEAK_WIDTH_NM / 2.3548;
  // Each peak's share is of its photons inside 400 to 700 nm, so a peak near
  // an edge is scaled back up for the part of its curve that falls outside.
  const inside = peaks.map((peak) => {
    let sum = 0;
    for (let nm = PAR_START_NM; nm <= PAR_END_NM; nm += 1) sum += Math.exp(-0.5 * ((nm - peak.nm) / sigma) ** 2);
    return sum;
  });
  return rounded(
    ratioForPhotons((nm) =>
      peaks.reduce(
        (total, peak, index) => total + (peak.share * Math.exp(-0.5 * ((nm - peak.nm) / sigma) ** 2)) / inside[index],
        0,
      ),
    ),
  );
}

export const SPECTRUM_SHARES_HOW =
  "A grow light's spec sheet gives the photons in each colour, as PFD-B, PFD-G and PFD-R in µmol/s or as percentages. Type them as the sheet gives them; only how they compare matters. Leave far-red and UV out, since PPFD does not count them. Each colour is taken as spread evenly across its band, so this is closest for broad white light.";

export const SPECTRUM_PEAKS_HOW =
  "For a panel of coloured diodes: each colour's peak wavelength in nm, as the sheet lists it (450, 660), and its share of the photons. If the sheet gives only how many diodes of each colour, type the counts; that is rougher, since diodes of different colours give off different amounts. Leave far-red and UV peaks out.";

export const SPECTRUM_SENSOR_LIMIT =
  "A phone's light sensor follows the eye's curve only roughly, least of all under red and blue diodes, so under a purple panel the PPFD is a rough figure even with the spectrum given.";
