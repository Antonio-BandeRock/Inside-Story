// A picker over one of the grow setup's open lists: the kinds of equipment,
// the kinds of light, the materials a container can be made of.
//
// Added 2026-09-21 with the grow setup (lib/growSetup.ts). The same shape
// as GardenSpaceField and the Kind picker on a growing cost, so the three
// read alike: the built-ins, then the terms the person has named, then
// Add a ... of your own, which opens a one-line form in place. Saving
// picks the new term and keeps it on the list for every piece after. A
// term the person made shows Rename and Remove beside the picker while it
// is the chosen one; removing one that current equipment reads asks which
// term to move that equipment to first, and nothing is deleted but the
// list entry itself. Retired equipment keeps its term as documentation.
//
// The field takes the person's terms from its parent rather than loading
// them, since a setup form has three of these and one load serves all
// three; onTermsChanged asks the parent to reload after a save or removal.

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import {
  findTerm,
  replacementTermChoices,
  TERM_LIST_WORDS,
  termChoices,
  termRemovalNote,
  termSaveNote,
  type CustomGardenTerm,
  type GardenTermList,
} from '../lib/growSetup';
import { countRecordsUnderTerm, createGardenTerm, removeGardenTerm, renameGardenTerm } from '../lib/growSetupDb';
import { useState } from 'react';
import { AppTextInput } from './AppTextInput';
import { PopoverSelect } from './PopoverSelect';

const TAB_COLOR = colors.tabGarden;
const PRIMARY_BUTTON_BACKGROUND = colors.buttonColor;
const ADD_TERM = '__add_term__';

type Props = {
  list: GardenTermList;
  label: string;
  selected: string | null;
  onSelect: (code: string | null) => void;
  terms: CustomGardenTerm[];
  onTermsChanged: () => Promise<void> | void;
  width?: number;
  /** Shown under the picker for a built-in, when the parent has nowhere
   *  better to put it. */
  showHelp?: boolean;
};

export function GardenTermField({ list, label, selected, onSelect, terms, onTermsChanged, width = 220, showHelp = false }: Props) {
  const [form, setForm] = useState<{ id: string | null; name: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [removal, setRemoval] = useState<{ id: string; name: string; counts: { current: number; past: number }; moveTo: string | null } | null>(null);
  const words = TERM_LIST_WORDS[list];

  const options = [
    ...termChoices(list, terms).map((entry) => ({ label: entry.label, value: entry.code })),
    { label: `Add a ${words.singular} of your own`, value: ADD_TERM },
  ];
  const chosen = selected ? findTerm(list, selected, terms) : null;

  function startForm(entry: CustomGardenTerm | null) {
    setForm({ id: entry?.id ?? null, name: entry?.name ?? '' });
    setFormError(null);
  }

  async function handleSave() {
    if (!form) return;
    if (!form.name.trim()) {
      setFormError(`Give the ${words.singular} a name.`);
      return;
    }
    let id = form.id;
    if (id) await renameGardenTerm(id, form.name);
    else id = await createGardenTerm(list, form.name);
    await onTermsChanged();
    onSelect(id);
    setForm(null);
  }

  async function handleRemove(id: string) {
    const counts = await countRecordsUnderTerm(list, id);
    setForm(null);
    if (counts.current > 0) {
      const entry = terms.find((term) => term.id === id);
      setRemoval({ id, name: entry?.name ?? '', counts, moveTo: null });
      return;
    }
    await finishRemoval(id, null, counts);
  }

  async function finishRemoval(id: string, moveTo: string | null, counts: { current: number; past: number }) {
    const done = await removeGardenTerm(list, id, moveTo);
    if (!done) return;
    setRemoval(null);
    if (selected === id) onSelect(counts.current > 0 ? moveTo : null);
    await onTermsChanged();
  }

  return (
    <View style={styles.field}>
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <PopoverSelect
          options={options}
          selected={selected}
          onSelect={(value) => {
            if (value === ADD_TERM) {
              setRemoval(null);
              startForm(null);
              return;
            }
            setForm(null);
            setRemoval(null);
            onSelect(value);
          }}
          tabColor={TAB_COLOR}
          width={width}
          placeholder={`Pick a ${words.singular}`}
        />
        {chosen?.mine && !form && !removal ? (
          <>
            <TouchableOpacity onPress={() => startForm(terms.find((entry) => entry.id === selected) ?? null)}>
              <Text style={styles.linkText}>Rename</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => selected && handleRemove(selected)}>
              <Text style={[styles.linkText, { color: colors.danger }]}>Remove</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>
      {showHelp && chosen?.help && !form && !removal ? <Text style={styles.captionText}>{chosen.help}</Text> : null}
      {form ? (
        <View style={styles.nestedForm}>
          <Text style={styles.fieldLabel}>{form.id ? `Rename this ${words.singular}` : `A ${words.singular} of your own`}</Text>
          <AppTextInput
            style={styles.textInput}
            value={form.name}
            onChangeText={(name) => setForm({ ...form, name })}
            placeholder={words.example}
          />
          <Text style={styles.captionText}>{termSaveNote(list)}</Text>
          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]} onPress={handleSave}>
              <Text style={styles.primaryButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setForm(null)}>
              <Text style={styles.linkText}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
      {removal ? (
        <View style={styles.nestedForm}>
          <Text style={styles.fieldLabel}>Before {removal.name} is removed</Text>
          <Text style={styles.captionText}>{termRemovalNote(list, removal.name, removal.counts)}</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Move to</Text>
            <PopoverSelect
              options={replacementTermChoices(list, removal.id, terms).map((entry) => ({ label: entry.label, value: entry.code }))}
              selected={removal.moveTo}
              onSelect={(value) => setRemoval({ ...removal, moveTo: value })}
              tabColor={TAB_COLOR}
              width={width}
              placeholder={`Pick a ${words.singular}`}
            />
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: removal.moveTo ? PRIMARY_BUTTON_BACKGROUND : colors.border }]}
              disabled={!removal.moveTo}
              onPress={() => finishRemoval(removal.id, removal.moveTo, removal.counts)}
            >
              <Text style={styles.primaryButtonText}>{removal.counts.current === 1 ? 'Move It' : 'Move Them'} and Remove {removal.name}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setRemoval(null)}>
              <Text style={styles.linkText}>Keep it</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  fieldLabel: { ...typography.label, color: colors.textPrimary, ...textShadow },
  captionText: { ...typography.caption, color: colors.textMuted, ...textShadow },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.textPrimary,
  },
  nestedForm: { gap: 8, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: TAB_COLOR, marginVertical: 4 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
  primaryButton: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', ...BUTTON_SHADOW },
  primaryButtonText: {
    color: colors.textOnButton,
    fontWeight: '400',
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  errorText: { color: colors.danger },
  linkText: { ...typography.body, color: colors.primary, ...textShadow },
});
