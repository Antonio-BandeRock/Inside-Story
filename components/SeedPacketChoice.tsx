// "From a packet you have" on Garden > Plots & Plantings' Add a Planting
// form (I9, 2026-10-02). Lists the packets on hand for the crop being
// planted; picking one fills in its variety and days to maturity, and the
// amount typed here is taken off what the packet has left once the planting
// is saved. Shows nothing at all when there is no packet for the crop.

import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { describeRemaining, packetsForCrop, packetTitle, readAmount, SEED_UNITS, SEED_USE_CAPTION, type SeedPacket, type SeedUse } from '../lib/seedInventory';
import { listSeedPackets, listSeedUses } from '../lib/seedInventoryDb';
import { AppTextInput } from './AppTextInput';
import { PopoverSelect } from './PopoverSelect';

const NONE = '__none__';

export function SeedPacketChoice({
  foodId,
  source,
  foodName,
  selectedSeedId,
  onPick,
  amountText,
  onAmountText,
}: {
  foodId: number;
  source: string;
  foodName: string;
  selectedSeedId: string | null;
  onPick: (packet: SeedPacket | null) => void;
  amountText: string;
  onAmountText: (text: string) => void;
}) {
  const [packets, setPackets] = useState<SeedPacket[]>([]);
  const [uses, setUses] = useState<SeedUse[]>([]);

  useEffect(() => {
    let live = true;
    Promise.all([listSeedPackets(), listSeedUses()]).then(([p, u]) => {
      if (!live) return;
      setPackets(packetsForCrop(p, { foodId, source, name: foodName }));
      setUses(u);
    });
    return () => {
      live = false;
    };
  }, [foodId, source, foodName]);

  if (packets.length === 0) return null;
  const picked = packets.find((p) => p.id === selectedSeedId) ?? null;
  const amount = readAmount(amountText);
  const unitLabel = SEED_UNITS.find((u) => u.code === (picked?.amountUnit ?? 'seeds'))?.label.toLowerCase() ?? 'seeds';

  return (
    <View style={styles.section}>
      <Text style={styles.fieldLabel}>From a Packet You Have</Text>
      <PopoverSelect
        options={[{ value: NONE, label: 'Not from a packet' }, ...packets.map((p) => ({ value: p.id, label: packetTitle(p) }))]}
        selected={picked ? picked.id : NONE}
        onSelect={(value) => onPick(value === NONE ? null : packets.find((p) => p.id === value) ?? null)}
        tabColor={colors.tabGarden}
        width={260}
      />
      {picked ? (
        <>
          <Text style={styles.captionText}>
            {describeRemaining(
              picked,
              uses.filter((u) => u.seedId === picked.id),
            )}
          </Text>
          <Text style={styles.captionText}>{SEED_USE_CAPTION}</Text>
          <AppTextInput
            style={styles.textInput}
            value={amountText}
            onChangeText={onAmountText}
            placeholder={`How many ${unitLabel} went in`}
            keyboardType="decimal-pad"
          />
          {amount.status === 'invalid' ? <Text style={styles.errorText}>A number above zero, or leave it blank.</Text> : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 6 },
  fieldLabel: { ...typography.label, color: colors.textPrimary, ...textShadow },
  captionText: { ...typography.caption, color: colors.textMuted, ...textShadow },
  errorText: { ...typography.caption, color: colors.danger, ...textShadow },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: colors.textPrimary,
  },
});
