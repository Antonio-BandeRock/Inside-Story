// What is on hand of one med, who fills and prescribes it, and its photos
// (A3, A5 and A6, Phase 2). Shown inside a med's Details on Life > My Meds.
//
// The count is taken once and drawn down by the doses marked taken, so the
// form asks only for what is in the bottle now; the arithmetic and every
// sentence are in lib/medSupply.ts. A phone number is shown as text as well
// as a Call button, since a computer has nothing to dial with.
import { useEffect, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppTextInput } from './AppTextInput';
import { RecordPhotos } from './RecordPhotos';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { saveTreatmentContacts, saveTreatmentSupply, type TreatmentDetails } from '../lib/medDetailsDb';
import { dialable, type SupplyReading } from '../lib/medSupply';

type Props = {
  treatmentId: string;
  treatmentName: string;
  details: TreatmentDetails | undefined;
  reading: SupplyReading | undefined;
  tabColor: string;
  onSaved: () => void;
  onProblem: (title: string, message: string) => void;
};

function numberText(value: number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value);
}

function parseAmount(text: string): number | null {
  const trimmed = text.trim().replace(',', '.');
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 ? value : NaN;
}

export function MedDetailsPanel({ treatmentId, treatmentName, details, reading, tabColor, onSaved, onProblem }: Props) {
  const styles = makeStyles(tabColor);
  const [editingSupply, setEditingSupply] = useState(false);
  const [editingContacts, setEditingContacts] = useState(false);
  const [onHand, setOnHand] = useState('');
  const [unit, setUnit] = useState('');
  const [perDose, setPerDose] = useState('1');
  const [leadDays, setLeadDays] = useState('7');
  const [pharmacyName, setPharmacyName] = useState('');
  const [pharmacyPhone, setPharmacyPhone] = useState('');
  const [prescriberName, setPrescriberName] = useState('');
  const [prescriberPhone, setPrescriberPhone] = useState('');

  useEffect(() => {
    setOnHand(reading?.remaining !== null && reading?.remaining !== undefined ? numberText(reading.remaining) : '');
    setUnit(details?.supplyUnit ?? '');
    setPerDose(numberText(details?.supplyPerDose ?? 1));
    setLeadDays(numberText(details?.refillLeadDays ?? 7));
    setPharmacyName(details?.pharmacyName ?? '');
    setPharmacyPhone(details?.pharmacyPhone ?? '');
    setPrescriberName(details?.prescriberName ?? '');
    setPrescriberPhone(details?.prescriberPhone ?? '');
  }, [details, reading]);

  async function saveSupply(clear = false) {
    const count = clear ? null : parseAmount(onHand);
    const each = parseAmount(perDose);
    const lead = parseAmount(leadDays);
    if (Number.isNaN(count) || Number.isNaN(each) || Number.isNaN(lead)) {
      onProblem('Almost there', 'Use numbers for how many are on hand, how many one dose uses, and the days ahead.');
      return;
    }
    try {
      await saveTreatmentSupply(treatmentId, {
        onHand: count,
        unit: unit || null,
        perDose: each && each > 0 ? each : 1,
        leadDays: lead ?? 7,
      });
      setEditingSupply(false);
      onSaved();
    } catch (error) {
      onProblem('Could not save', error instanceof Error ? error.message : String(error));
    }
  }

  async function saveContacts() {
    try {
      await saveTreatmentContacts(treatmentId, { pharmacyName, pharmacyPhone, prescriberName, prescriberPhone });
      setEditingContacts(false);
      onSaved();
    } catch (error) {
      onProblem('Could not save', error instanceof Error ? error.message : String(error));
    }
  }

  function call(phone: string | null | undefined) {
    const number = dialable(phone);
    if (!number) return;
    Linking.openURL(`tel:${number}`).catch(() =>
      onProblem('Nothing to call with', `This device could not open a call. The number is ${phone}.`),
    );
  }

  function renderContact(role: string, name: string | null | undefined, phone: string | null | undefined) {
    if (!name && !phone) return null;
    const canCall = Platform.OS !== 'web' && dialable(phone) !== null;
    return (
      <View style={styles.contactRow}>
        <View style={styles.contactText}>
          <Text style={styles.contactRole}>{role}</Text>
          <Text style={styles.bodyText} selectable>
            {[name, phone].filter(Boolean).join(', ')}
          </Text>
        </View>
        {canCall ? (
          <TouchableOpacity style={styles.smallButton} onPress={() => call(phone)} accessibilityLabel={`Call ${role.toLowerCase()}`}>
            <Text style={styles.smallButtonText}>Call</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  const hasContacts = Boolean(
    details?.pharmacyName || details?.pharmacyPhone || details?.prescriberName || details?.prescriberPhone,
  );

  return (
    <View style={styles.panel}>
      <View style={styles.section}>
        <Text style={styles.heading}>On hand</Text>
        <Text style={styles.bodyText}>
          {reading?.sentence ??
            'How many are on hand has not been counted. Count it once and the app keeps track from the doses you mark taken.'}
        </Text>
        {editingSupply ? (
          <>
            <Text style={styles.label}>How many are there now</Text>
            <View style={styles.inlineRow}>
              <AppTextInput
                style={[styles.input, styles.numberInput]}
                keyboardType="decimal-pad"
                value={onHand}
                onChangeText={setOnHand}
                placeholder="30"
              />
              <AppTextInput
                style={[styles.input, styles.flexInput]}
                value={unit}
                onChangeText={setUnit}
                placeholder="tablets, capsules, ml"
              />
            </View>
            <Text style={styles.label}>How many one dose uses</Text>
            <AppTextInput
              style={[styles.input, styles.numberInput]}
              keyboardType="decimal-pad"
              value={perDose}
              onChangeText={setPerDose}
            />
            <Text style={styles.label}>Remind me this many days before it runs out</Text>
            <AppTextInput
              style={[styles.input, styles.numberInput]}
              keyboardType="number-pad"
              value={leadDays}
              onChangeText={setLeadDays}
            />
            <View style={styles.actions}>
              {details?.supplyCountedAt ? (
                <TouchableOpacity style={styles.secondaryButton} onPress={() => saveSupply(true)}>
                  <Text style={styles.secondaryButtonText}>Stop counting</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setEditingSupply(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={() => saveSupply()}>
                <Text style={styles.primaryButtonText}>Save the count</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <TouchableOpacity onPress={() => setEditingSupply(true)}>
            <Text style={styles.actionText}>{details?.supplyCountedAt ? 'Count again' : 'Count what is on hand'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Pharmacy and prescriber</Text>
        {hasContacts ? (
          <>
            {renderContact('Pharmacy', details?.pharmacyName, details?.pharmacyPhone)}
            {renderContact('Prescriber', details?.prescriberName, details?.prescriberPhone)}
          </>
        ) : !editingContacts ? (
          <Text style={styles.bodyText}>Who fills it and who prescribes it, so a refill is one call away.</Text>
        ) : null}
        {editingContacts ? (
          <>
            <Text style={styles.label}>Pharmacy</Text>
            <AppTextInput style={styles.input} value={pharmacyName} onChangeText={setPharmacyName} placeholder="Name" />
            <AppTextInput
              style={[styles.input, styles.stacked]}
              value={pharmacyPhone}
              onChangeText={setPharmacyPhone}
              placeholder="Phone"
              keyboardType="phone-pad"
            />
            <Text style={styles.label}>Prescriber</Text>
            <AppTextInput style={styles.input} value={prescriberName} onChangeText={setPrescriberName} placeholder="Name" />
            <AppTextInput
              style={[styles.input, styles.stacked]}
              value={prescriberPhone}
              onChangeText={setPrescriberPhone}
              placeholder="Phone"
              keyboardType="phone-pad"
            />
            <View style={styles.actions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setEditingContacts(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={saveContacts}>
                <Text style={styles.primaryButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <TouchableOpacity onPress={() => setEditingContacts(true)}>
            <Text style={styles.actionText}>{hasContacts ? 'Change' : 'Add who fills and prescribes it'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <RecordPhotos ownerKind="treatment" ownerId={treatmentId} tabColor={tabColor} title={treatmentName} />
    </View>
  );
}

function makeStyles(tabColor: string) {
  return StyleSheet.create({
    actionText: { ...typography.captionEmphasis, color: tabColor, marginTop: 6, ...textShadow },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 10, marginTop: 12 },
    bodyText: { ...typography.body, color: tabColor, ...textShadow },
    contactRole: { ...typography.captionEmphasis, color: tabColor, ...textShadow },
    contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
    contactText: { flex: 1 },
    flexInput: { flex: 1 },
    heading: { ...typography.captionEmphasis, color: tabColor, marginBottom: 4, ...textShadow },
    inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.surface,
      ...typography.body,
      color: tabColor,
      ...textShadow,
    },
    label: { ...typography.label, color: tabColor, marginBottom: 6, marginTop: 10, ...textShadow },
    numberInput: { width: 88 },
    panel: { gap: 14, marginTop: 12 },
    primaryButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: colors.buttonColor, ...BUTTON_SHADOW },
    primaryButtonText: {
      ...typography.bodyEmphasis,
      color: colors.textOnButton,
      textShadowColor: 'transparent',
      textShadowRadius: 0,
    },
    secondaryButton: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    secondaryButtonText: { ...typography.bodyEmphasis, color: tabColor, ...textShadow },
    section: { gap: 2 },
    smallButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: tabColor,
      backgroundColor: colors.surface,
    },
    smallButtonText: { ...typography.captionEmphasis, color: tabColor, ...textShadow },
    stacked: { marginTop: 6 },
  });
}
