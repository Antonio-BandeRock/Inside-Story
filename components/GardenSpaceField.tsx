// The Space picker for a garden area, shared by the New Garden Area form on
// Plots & Plantings and the short area form inside Growing Costs.
//
// Added 2026-09-20, from "The same needs to be applied for Spaces where
// the grow might be. LED Lights, Hydroponic, and Temperature & Humidity,
// and Not Said yet are all not spaces, they are expenses." The picker lists
// the built-in spaces (lib/gardenSpaces.ts), then the spaces the person has
// named, then Add a space of your own, which opens a one-line form in
// place. Saving picks the new space and keeps it on the list for every
// area after. A space the person made shows Rename and Remove beside the
// picker while it is the chosen one. The same shape as the Kind picker on
// a growing cost, so the two read alike.
//
// Removing, since 2026-09-21 ("I don't think anything should be orphaned
// if the user deletes a field label they created"): when current areas
// are recorded under the space, a short form in place says how many and
// asks which space to move them to, and Remove goes through only once one
// is picked. A past area keeps the space as documentation (the row is
// retired, off the picker and still readable), and nothing is deleted but
// the list entry itself. With no area under it, Remove is immediate.
//
// A screen that shows a current area still holding a retired value (a
// built-in the list no longer offers, or a removed space) can render this
// field with selected null and a "Move this area to" label; the picker
// then reads Pick a space until the person moves it.
//
// The field loads the person's spaces itself when it mounts, so a screen
// that only needs the picker has nothing to wire up. A screen that also
// reads plot labels (Plots & Plantings) lists the spaces on its own for
// gardenSpaceLabel.

import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import {
  findGardenSpace,
  gardenSpaceChoices,
  replacementSpaceChoices,
  type CustomGardenSpace,
  type SpaceUseCounts,
} from '../lib/gardenSpaces';
import {
  countAreasUnderSpace,
  createGardenSpace,
  listGardenSpaces,
  removeGardenSpace,
  renameGardenSpace,
} from '../lib/gardenSpacesDb';
import { AppTextInput } from './AppTextInput';
import { PopoverSelect } from './PopoverSelect';

const TAB_COLOR = colors.tabGarden;
const PRIMARY_BUTTON_BACKGROUND = colors.buttonColor;
const ADD_SPACE = '__add_space__';

type Props = {
  label: string;
  selected: string | null;
  onSelect: (code: string | null) => void;
  width?: number;
};

export function GardenSpaceField({ label, selected, onSelect, width = 220 }: Props) {
  const [customSpaces, setCustomSpaces] = useState<CustomGardenSpace[]>([]);
  const [form, setForm] = useState<{ id: string | null; name: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  // The move-first step of removing a space that current areas read.
  const [removal, setRemoval] = useState<{ id: string; name: string; counts: SpaceUseCounts; moveTo: string | null } | null>(null);

  useEffect(() => {
    let live = true;
    listGardenSpaces().then((rows) => {
      if (live) setCustomSpaces(rows);
    });
    return () => {
      live = false;
    };
  }, []);

  const options = [
    ...gardenSpaceChoices(customSpaces).map((entry) => ({ label: entry.label, value: entry.code })),
    { label: 'Add a space of your own', value: ADD_SPACE },
  ];
  const chosen = selected ? findGardenSpace(selected, customSpaces) : null;

  function startForm(entry: CustomGardenSpace | null) {
    setForm({ id: entry?.id ?? null, name: entry?.name ?? '' });
    setFormError(null);
  }

  // Saves the space, picks it and closes the one-line form; nothing else on
  // the surrounding form is touched.
  async function handleSave() {
    if (!form) return;
    if (!form.name.trim()) {
      setFormError('Give the space a name.');
      return;
    }
    let id = form.id;
    if (id) await renameGardenSpace(id, form.name);
    else id = await createGardenSpace(form.name);
    setCustomSpaces(await listGardenSpaces());
    onSelect(id);
    setForm(null);
  }

  // Remove goes straight through when no current area reads the space;
  // otherwise it opens the move-first step and waits for a pick.
  async function handleRemove(id: string) {
    const counts = await countAreasUnderSpace(id);
    setForm(null);
    if (counts.current > 0) {
      const entry = customSpaces.find((space) => space.id === id);
      setRemoval({ id, name: entry?.name ?? '', counts, moveTo: null });
      return;
    }
    await finishRemoval(id, null, counts);
  }

  async function finishRemoval(id: string, moveTo: string | null, counts: SpaceUseCounts) {
    const done = await removeGardenSpace(id, moveTo);
    if (!done) return;
    setRemoval(null);
    // The area being edited follows its neighbours to the picked space.
    if (selected === id) onSelect(counts.current > 0 ? moveTo : null);
    setCustomSpaces(await listGardenSpaces());
  }

  return (
    <View style={styles.field}>
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <PopoverSelect
          options={options}
          selected={selected}
          onSelect={(value) => {
            if (value === ADD_SPACE) {
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
          placeholder="Pick a space"
        />
        {chosen?.mine && !form && !removal ? (
          <>
            <TouchableOpacity onPress={() => startForm(customSpaces.find((entry) => entry.id === selected) ?? null)}>
              <Text style={styles.linkText}>Rename</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => selected && handleRemove(selected)}>
              <Text style={[styles.linkText, { color: colors.danger }]}>Remove</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>
      {form ? (
        <View style={styles.nestedForm}>
          <Text style={styles.fieldLabel}>{form.id ? 'Rename this space' : 'A space of your own'}</Text>
          <AppTextInput
            style={styles.textInput}
            value={form.name}
            onChangeText={(name) => setForm({ ...form, name })}
            placeholder="Hoop house"
          />
          <Text style={styles.captionText}>
            Saving picks it for this area, and it is on the list for every area after this one. Removing a space later asks where to move the areas recorded under it, and deletes none of them.
          </Text>
          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: PRIMARY_BUTTON_BACKGROUND }]} onPress={handleSave}>
              <Text style={styles.primaryButtonText}>Save Space</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setForm(null)}>
              <Text style={styles.linkText}>Back to the area</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
      {removal ? (
        <View style={styles.nestedForm}>
          <Text style={styles.fieldLabel}>Before {removal.name} is removed</Text>
          <Text style={styles.captionText}>
            {removal.counts.current === 1 ? '1 area is' : `${removal.counts.current} areas are`} recorded under {removal.name}. Pick the space to move {removal.counts.current === 1 ? 'it' : 'them'} to; nothing is deleted.
            {removal.counts.past > 0 ? ` ${removal.counts.past === 1 ? 'A past area keeps' : `${removal.counts.past} past areas keep`} ${removal.name} as part of ${removal.counts.past === 1 ? 'its' : 'their'} record.` : ''}
          </Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Move to</Text>
            <PopoverSelect
              options={replacementSpaceChoices(removal.id, customSpaces).map((entry) => ({ label: entry.label, value: entry.code }))}
              selected={removal.moveTo}
              onSelect={(value) => setRemoval({ ...removal, moveTo: value })}
              tabColor={TAB_COLOR}
              width={width}
              placeholder="Pick a space"
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
