// Seeds, a lens of Garden (I9, 2026-10-02): the seed packets on hand. One
// fold band per packet, folded to its crop, variety and what is left; open,
// it says how old the packet is and how long its crop's seed usually keeps,
// lists what was sown from it and every germination test, and holds the
// packet's photos. A packet with anything recorded against it is put away
// rather than deleted. Every sentence lives in lib/seedInventory.ts.

import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { removePhotosOf } from '../lib/mediaDb';
import { dateLabel } from '../lib/moonSky';
import { dateKey } from '../lib/plainDate';
import {
  describeKeeping,
  describeRemaining,
  describeTest,
  formatAmount,
  packetTitle,
  readAmount,
  readPackedOn,
  readTest,
  SEED_LONGEVITY_SOURCE,
  SEED_STOCK_OWNER_KIND,
  SEED_UNITS,
  SEEDS_INTRO,
  SEEDS_PUT_AWAY_NOTE,
  SEEDS_TEST_HOW,
  type SeedPacket,
  type SeedTest,
  type SeedUnit,
  type SeedUse,
} from '../lib/seedInventory';
import {
  addSeedTest,
  deleteSeedTest,
  listSeedPackets,
  listSeedTests,
  listSeedUses,
  newSeedPacketId,
  removeSeedPacket,
  saveSeedPacket,
  setSeedPacketPutAway,
} from '../lib/seedInventoryDb';
import { packetDaysRangeLine, readPacketDays } from '../lib/seedPacket';
import { AppTextInput } from './AppTextInput';
import { FoodLookup } from './FoodLookup';
import { HOME_BAND_ACCENT_WIDTH, HomeSectionBand } from './HomeSectionBand';
import { PhotoStrip } from './PhotoStrip';
import { PopoverSelect } from './PopoverSelect';
import { makeTabBandStyles } from './TabBand';
import { ThumbRow } from './ThumbRow';

const TAB_COLOR = colors.tabGarden;
// 1.0.61.7, extended to every Garden lens in 1.0.61.8: the calm look
// (CalmBands in components/HomeSectionBand.tsx), bands a left-accent width
// apart with no hairlines.
const band = makeTabBandStyles(TAB_COLOR, { calm: true });

type Draft = {
  id: string;
  isNew: boolean;
  foodId: number | null;
  source: string | null;
  foodName: string;
  variety: string;
  fromWhere: string;
  packedOn: string;
  amount: string;
  unit: SeedUnit;
  packetDays: string;
  notes: string;
};

function draftFrom(packet: SeedPacket): Draft {
  return {
    id: packet.id,
    isNew: false,
    foodId: packet.foodId,
    source: packet.source,
    foodName: packet.foodName,
    variety: packet.variety ?? '',
    fromWhere: packet.fromWhere ?? '',
    packedOn: packet.packedOn ?? '',
    amount: packet.amount === null ? '' : String(packet.amount),
    unit: packet.amountUnit ?? 'seeds',
    packetDays: packet.packetDays === null ? '' : String(packet.packetDays),
    notes: packet.notes ?? '',
  };
}

function today(): string {
  return dateKey(new Date());
}

export function SeedsLens({ scrollBottomPadding }: { scrollBottomPadding: number }) {
  const [packets, setPackets] = useState<SeedPacket[]>([]);
  const [uses, setUses] = useState<SeedUse[]>([]);
  const [tests, setTests] = useState<SeedTest[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [putAwayOpen, setPutAwayOpen] = useState(false);

  const load = useCallback(async () => {
    const [p, u, t] = await Promise.all([listSeedPackets(), listSeedUses(), listSeedTests()]);
    setPackets(p);
    setUses(u);
    setTests(t);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (picking) {
    return (
      <View style={styles.pickerScreen}>
        <TouchableOpacity onPress={() => setPicking(false)}>
          <Text style={[styles.linkText, styles.chip]}>‹ Cancel</Text>
        </TouchableOpacity>
        <View style={styles.chip}>
          <Text style={styles.bodyText}>Which crop is the packet for?</Text>
        </View>
        <FoodLookup
          tabColor={TAB_COLOR}
          showNutrients={false}
          allowHarvestPick={false}
          onFoodResolved={(resolved) => {
            setDraft({
              id: newSeedPacketId(),
              isNew: true,
              foodId: resolved.foodId,
              source: resolved.source,
              foodName: resolved.baseName,
              variety: '',
              fromWhere: '',
              packedOn: '',
              amount: '',
              unit: 'seeds',
              packetDays: '',
              notes: '',
            });
            setPicking(false);
          }}
        />
      </View>
    );
  }

  const onHand = packets.filter((p) => !p.finishedAt);
  const putAway = packets.filter((p) => p.finishedAt);
  const usesOf = (id: string) => uses.filter((u) => u.seedId === id);
  const testsOf = (id: string) => tests.filter((t) => t.seedId === id);

  return (
    <ScrollView contentContainerStyle={[styles.body, { paddingBottom: scrollBottomPadding }]}>
      <View style={[band.box, styles.card]}>
        <Text style={styles.bodyText}>{SEEDS_INTRO}</Text>
        {draft ? (
          <PacketForm
            draft={draft}
            onChange={setDraft}
            onCancel={async () => {
              if (draft.isNew) await removePhotosOf(SEED_STOCK_OWNER_KIND, draft.id).catch(() => undefined);
              setDraft(null);
            }}
            onSaved={async (id) => {
              setDraft(null);
              setOpenId(id);
              await load();
            }}
          />
        ) : (
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.buttonColor }]} onPress={() => setPicking(true)}>
            <Text style={styles.primaryButtonText}>Add a Packet</Text>
          </TouchableOpacity>
        )}
      </View>

      {onHand.length === 0 ? (
        <View style={band.boxMuted}>
          <Text style={styles.captionText}>No packets on hand yet.</Text>
        </View>
      ) : (
        onHand.map((packet) => (
          <PacketBand
            key={packet.id}
            packet={packet}
            uses={usesOf(packet.id)}
            tests={testsOf(packet.id)}
            expanded={openId === packet.id}
            onToggle={() => setOpenId(openId === packet.id ? null : packet.id)}
            onEdit={() => setDraft(draftFrom(packet))}
            onChanged={load}
          />
        ))
      )}

      {putAway.length > 0 ? (
        <HomeSectionBand
          kind="fold"
          title="Put Away"
          icon="archive-outline"
          color={TAB_COLOR}
          expanded={putAwayOpen}
          onToggle={() => setPutAwayOpen(!putAwayOpen)}
          foldedCaption={putAway.length === 1 ? '1 packet' : `${putAway.length} packets`}
        >
          <View style={styles.card}>
            <Text style={styles.captionText}>{SEEDS_PUT_AWAY_NOTE}</Text>
            {putAway.map((packet) => (
              <PutAwayRow key={packet.id} packet={packet} uses={usesOf(packet.id)} onChanged={load} />
            ))}
          </View>
        </HomeSectionBand>
      ) : null}
    </ScrollView>
  );
}

function PacketForm({
  draft,
  onChange,
  onCancel,
  onSaved,
}: {
  draft: Draft;
  onChange: (next: Draft) => void;
  onCancel: () => void;
  onSaved: (id: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const packed = readPackedOn(draft.packedOn);
  const amount = readAmount(draft.amount);
  const days = readPacketDays(draft.packetDays);
  const set = (patch: Partial<Draft>) => onChange({ ...draft, ...patch });

  async function save() {
    if (packed.status === 'invalid' || amount.status === 'invalid' || days.status === 'invalid') {
      setError('Something above needs another look before the packet can be saved.');
      return;
    }
    const clean = (text: string) => text.trim() || null;
    await saveSeedPacket(draft.id, {
      foodId: draft.foodId,
      source: draft.source,
      foodName: draft.foodName,
      variety: clean(draft.variety),
      fromWhere: clean(draft.fromWhere),
      packedOn: packed.status === 'date' ? packed.value : null,
      amount: amount.status === 'amount' ? amount.value : null,
      amountUnit: amount.status === 'amount' ? draft.unit : null,
      packetDays: days.status === 'days' ? days.days : null,
      notes: clean(draft.notes),
    });
    onSaved(draft.id);
  }

  return (
    <View style={styles.card}>
      <Text style={styles.fieldLabel}>{draft.isNew ? `New Packet of ${draft.foodName}` : `Change ${draft.foodName}`}</Text>
      <AppTextInput style={styles.textInput} value={draft.variety} onChangeText={(t) => set({ variety: t })} placeholder="Variety, as printed on the packet" />
      <AppTextInput style={styles.textInput} value={draft.fromWhere} onChangeText={(t) => set({ fromWhere: t })} placeholder="Where it came from: a seller, a swap, saved seed" />
      <AppTextInput style={styles.textInput} value={draft.packedOn} onChangeText={(t) => set({ packedOn: t })} placeholder="Packed for: a year such as 2025, or a date" />
      {packed.status === 'invalid' ? <Text style={styles.errorText}>A year such as 2025, or a date such as 2025-03-14.</Text> : null}
      <View style={styles.row}>
        <AppTextInput
          style={[styles.textInput, styles.shortInput]}
          value={draft.amount}
          onChangeText={(t) => set({ amount: t })}
          placeholder="How much"
          keyboardType="decimal-pad"
        />
        <PopoverSelect
          options={SEED_UNITS.map((u) => ({ value: u.code, label: u.label }))}
          selected={draft.unit}
          onSelect={(value) => set({ unit: value as SeedUnit })}
          tabColor={TAB_COLOR}
          width={140}
        />
      </View>
      {amount.status === 'invalid' ? <Text style={styles.errorText}>A number above zero.</Text> : null}
      <AppTextInput
        style={styles.textInput}
        value={draft.packetDays}
        onChangeText={(t) => set({ packetDays: t })}
        placeholder="Days to maturity, if the packet gives them"
        keyboardType="number-pad"
      />
      {days.status === 'invalid' ? <Text style={styles.errorText}>{packetDaysRangeLine()}</Text> : null}
      <AppTextInput style={styles.textInput} value={draft.notes} onChangeText={(t) => set({ notes: t })} placeholder="Notes" multiline />
      <PhotoStrip ownerKind={SEED_STOCK_OWNER_KIND} ownerId={draft.id} tabColor={TAB_COLOR} addLabel="Photo of the Packet" title={`${draft.foodName} seed packet`} />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <ThumbRow primary="first" style={styles.row}>
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.buttonColor }]} onPress={save}>
          <Text style={styles.primaryButtonText}>Save Packet</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.linkText}>Cancel</Text>
        </TouchableOpacity>
      </ThumbRow>
    </View>
  );
}

function PacketBand({
  packet,
  uses,
  tests,
  expanded,
  onToggle,
  onEdit,
  onChanged,
}: {
  packet: SeedPacket;
  uses: SeedUse[];
  tests: SeedTest[];
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onChanged: () => void;
}) {
  return (
    <HomeSectionBand
      kind="fold"
      title={packetTitle(packet)}
      icon="albums-outline"
      color={TAB_COLOR}
      expanded={expanded}
      onToggle={onToggle}
      foldedCaption={describeRemaining(packet, uses)}
    >
      <View style={styles.card}>
        <Text style={styles.bodyText}>{describeKeeping(packet.foodName, packet.packedOn, today())}</Text>
        <TouchableOpacity onPress={() => Linking.openURL(SEED_LONGEVITY_SOURCE.url)}>
          <Text style={styles.sourceText}>{SEED_LONGEVITY_SOURCE.title}</Text>
        </TouchableOpacity>
        <PacketFacts packet={packet} uses={uses} />
        <UseList uses={uses} unit={packet.amountUnit} />
        <TestSection seedId={packet.id} tests={tests} onChanged={onChanged} />
        <PhotoStrip ownerKind={SEED_STOCK_OWNER_KIND} ownerId={packet.id} tabColor={TAB_COLOR} addLabel="Photo of the Packet" title={`${packet.foodName} seed packet`} />
        <PacketActions packet={packet} uses={uses} tests={tests} onEdit={onEdit} onChanged={onChanged} />
      </View>
    </HomeSectionBand>
  );
}

function PacketFacts({ packet, uses }: { packet: SeedPacket; uses: SeedUse[] }) {
  const facts: string[] = [describeRemaining(packet, uses)];
  if (packet.fromWhere) facts.push(`From ${packet.fromWhere}.`);
  if (packet.packetDays !== null) facts.push(`${packet.packetDays} days to maturity on the packet.`);
  return (
    <>
      {facts.map((line) => (
        <Text key={line} style={styles.captionText}>
          {line}
        </Text>
      ))}
      {packet.notes ? <Text style={styles.bodyText}>{packet.notes}</Text> : null}
    </>
  );
}

function UseList({ uses, unit }: { uses: SeedUse[]; unit: SeedUnit | null }) {
  if (uses.length === 0) return <Text style={styles.captionText}>Nothing sown from this packet yet. Add a Planting offers it.</Text>;
  return (
    <>
      <Text style={styles.fieldLabel}>Sown From It</Text>
      {uses.map((use) => (
        <Text key={use.id} style={styles.captionText}>
          {`${dateLabel(use.usedOn)} ${use.usedOn.slice(0, 4)}`}
          {use.amount !== null ? `, ${formatAmount(use.amount, unit)}` : ''}
          {use.plantingLabel === null ? ', planting since removed' : use.plantingLabel ? `, in ${use.plantingLabel}` : ''}
        </Text>
      ))}
    </>
  );
}

function TestSection({ seedId, tests, onChanged }: { seedId: string; tests: SeedTest[]; onChanged: () => void }) {
  const [adding, setAdding] = useState(false);
  const [sown, setSown] = useState('10');
  const [sprouted, setSprouted] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const read = readTest(sown, sprouted);
    if (read.status === 'invalid') {
      setError(read.message);
      return;
    }
    await addSeedTest({ seedId, testedOn: today(), sown: read.sown, sprouted: read.sprouted });
    setAdding(false);
    setSprouted('');
    setError(null);
    onChanged();
  }

  return (
    <>
      <Text style={styles.fieldLabel}>Germination Tests</Text>
      {tests.map((test) => (
        <View key={test.id} style={styles.rowTop}>
          <Text style={[styles.captionText, styles.flex]}>{`${dateLabel(test.testedOn)} ${test.testedOn.slice(0, 4)}: ${describeTest(test)}`}</Text>
          <TouchableOpacity
            onPress={async () => {
              await deleteSeedTest(test.id);
              onChanged();
            }}
          >
            <Text style={styles.linkText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ))}
      {adding ? (
        <>
          <Text style={styles.captionText}>{SEEDS_TEST_HOW}</Text>
          <View style={styles.row}>
            <AppTextInput style={[styles.textInput, styles.shortInput]} value={sown} onChangeText={setSown} placeholder="Set" keyboardType="number-pad" />
            <Text style={styles.bodyText}>set to sprout,</Text>
            <AppTextInput
              style={[styles.textInput, styles.shortInput]}
              value={sprouted}
              onChangeText={setSprouted}
              placeholder="Sprouted"
              keyboardType="number-pad"
            />
            <Text style={styles.bodyText}>sprouted</Text>
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <ThumbRow primary="first" style={styles.row}>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.buttonColor }]} onPress={save}>
              <Text style={styles.primaryButtonText}>Save Test</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAdding(false)}>
              <Text style={styles.linkText}>Cancel</Text>
            </TouchableOpacity>
          </ThumbRow>
        </>
      ) : (
        <TouchableOpacity onPress={() => setAdding(true)}>
          <Text style={styles.linkText}>Record a Germination Test</Text>
        </TouchableOpacity>
      )}
    </>
  );
}

function PacketActions({
  packet,
  uses,
  tests,
  onEdit,
  onChanged,
}: {
  packet: SeedPacket;
  uses: SeedUse[];
  tests: SeedTest[];
  onEdit: () => void;
  onChanged: () => void;
}) {
  const hasRecord = uses.length > 0 || tests.length > 0;
  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={onEdit}>
        <Text style={styles.linkText}>Change</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={async () => {
          await setSeedPacketPutAway(packet.id, true);
          onChanged();
        }}
      >
        <Text style={styles.linkText}>Put Away</Text>
      </TouchableOpacity>
      {hasRecord ? null : (
        <TouchableOpacity
          onPress={async () => {
            await removeSeedPacket(packet.id);
            onChanged();
          }}
        >
          <Text style={styles.linkText}>Delete</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function PutAwayRow({ packet, uses, onChanged }: { packet: SeedPacket; uses: SeedUse[]; onChanged: () => void }) {
  return (
    <View style={styles.rowTop}>
      <View style={styles.flex}>
        <Text style={styles.bodyText}>{packetTitle(packet)}</Text>
        <Text style={styles.captionText}>{describeRemaining(packet, uses)}</Text>
      </View>
      <TouchableOpacity
        onPress={async () => {
          await setSeedPacketPutAway(packet.id, false);
          onChanged();
        }}
      >
        <Text style={styles.linkText}>Bring Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingBottom: 32, gap: HOME_BAND_ACCENT_WIDTH },
  card: { gap: 8 },
  pickerScreen: { flex: 1, padding: 16, gap: 8 },
  chip: { backgroundColor: colors.surface, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, alignSelf: 'flex-start' },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  flex: { flex: 1 },
  fieldLabel: { ...typography.label, color: colors.textPrimary, ...textShadow },
  bodyText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  captionText: { ...typography.caption, color: colors.textMuted, ...textShadow },
  sourceText: { ...typography.caption, color: colors.primary, ...textShadow },
  errorText: { ...typography.caption, color: colors.danger, ...textShadow },
  linkText: { ...typography.body, color: colors.primary, ...textShadow },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: colors.textPrimary,
  },
  shortInput: { width: 90 },
  primaryButton: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', alignSelf: 'flex-start', ...BUTTON_SHADOW },
  primaryButtonText: {
    ...typography.body,
    color: colors.textOnButton,
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
});
