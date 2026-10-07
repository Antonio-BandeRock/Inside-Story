// The frame a lens sits in when it shows records that may be in the vault
// (lib/vault.ts, phase 2). Two jobs:
//   1. VaultClosedBand above the lens, saying which records are in the
//      closed vault and opening it right there. Nothing is drawn while the
//      vault is open or holds none of these categories.
//   2. The lens keyed on useVaultReloadKey, so opening the vault remounts it
//      and its own focus callback loads what was refused, and closing it
//      clears what was shown. No lens has to know the vault exists.
//
// The lens's forms keep working underneath the band: the vault holds
// records, never the tools to make them.

import { Fragment, type ReactNode } from 'react';
import { View } from 'react-native';
import type { VaultCategory } from '../lib/vault';
import { useVaultReloadKey } from '../lib/vaultReads';
import { HOME_BAND_GAP } from './HomeSectionBand';
import { VaultClosedBand } from './VaultClosedBand';

export function VaultLensFrame({
  color,
  categories,
  gap = HOME_BAND_GAP,
  children,
}: {
  color: string;
  /** What this lens shows. Empty draws the lens as it is. */
  categories: readonly VaultCategory[];
  /** The space between the band and the lens, the screen's band gap. */
  gap?: number;
  children: ReactNode;
}) {
  const reloadKey = useVaultReloadKey();
  if (categories.length === 0) return <>{children}</>;
  return (
    <View style={{ flex: 1, gap }}>
      <VaultClosedBand color={color} categories={categories} />
      <View style={{ flex: 1 }}>
        <Fragment key={reloadKey}>{children}</Fragment>
      </View>
    </View>
  );
}
