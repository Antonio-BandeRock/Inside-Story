// Companion planting (I7, 2026-10-02), in two places on Garden > Plots &
// Plantings. CompanionNeighbours sits on the Add a Planting form beside the
// crop rotation note and says which plants already in the area have
// something recorded about growing beside this one. CompanionSection sits
// under each planting, folded to one line, and lists everything recorded for
// the crop with its evidence tier and sources. Both are captions: nothing
// here stops a planting or changes what is offered. Every pair and sentence
// lives in lib/companionPairs.ts.

import { useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import {
  COMPANION_FLOWERS_NOTE,
  COMPANION_FLOWERS_SOURCES,
  COMPANION_INTRO,
  COMPANION_NONE,
  companionPlantFor,
  companionsFor,
  describeNeighbour,
  describeRelation,
  describeTier,
  familyCompanionNote,
  neighbourNotes,
  type CompanionNote,
  type CompanionPlanting,
} from '../lib/companionPairs';
import type { GuideSource } from '../lib/plantNutrients';

const TAB_COLOR = colors.tabGarden;

function Sources({ sources }: { sources: GuideSource[] }) {
  return (
    <>
      {sources.map((source) => (
        <TouchableOpacity key={source.url} onPress={() => Linking.openURL(source.url)} accessibilityRole="link">
          <Text style={styles.sourceText}>{source.label}</Text>
        </TouchableOpacity>
      ))}
    </>
  );
}

function NoteRow({ note, open, onToggle, line }: { note: CompanionNote; open: boolean; onToggle: () => void; line: string }) {
  return (
    <View style={styles.note}>
      <TouchableOpacity onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        <Text style={styles.rowLabel}>{line}</Text>
      </TouchableOpacity>
      {open ? (
        <View style={styles.noteBody}>
          <Text style={styles.bodyText}>{note.why}</Text>
          <Sources sources={note.sources} />
        </View>
      ) : null}
    </View>
  );
}

/** On the Add a Planting form: the plants already in this area with a pair
 *  recorded against this one. Nothing is drawn when there are none. */
export function CompanionNeighbours({ foodName, areaPlantings }: { foodName: string; areaPlantings: readonly CompanionPlanting[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const notes = neighbourNotes(foodName, areaPlantings);
  if (notes.length === 0) return null;
  return (
    <View style={styles.group}>
      <Text style={styles.fieldLabel}>Companion Planting</Text>
      <Text style={styles.captionText}>Already in this area, with what is said about growing them side by side. Tap one for why.</Text>
      {notes.map((note) => (
        <NoteRow
          key={note.key}
          note={note}
          line={describeNeighbour(note)}
          open={openKey === note.key}
          onToggle={() => setOpenKey(openKey === note.key ? null : note.key)}
        />
      ))}
    </View>
  );
}

type RelationListProps = {
  relation: 'together' | 'apart';
  notes: CompanionNote[];
  here: Set<string>;
  openKey: string | null;
  setOpenKey: (key: string | null) => void;
};

/** One of the two lists under a planting: grown beside it, or kept apart. */
function RelationList({ relation, notes: all, here, openKey, setOpenKey }: RelationListProps) {
  const notes = all.filter((note) => note.relation === relation);
  if (notes.length === 0) return null;
  return (
    <View style={styles.group}>
      <Text style={styles.fieldLabel}>{describeRelation(relation)}</Text>
      {notes.map((note) => (
        <NoteRow
          key={`${relation}:${note.key}`}
          note={note}
          line={`${note.name}${here.has(note.key) ? ' (in this area)' : ''}. ${describeTier(note.tier)}.`}
          open={openKey === `${relation}:${note.key}`}
          onToggle={() => setOpenKey(openKey === `${relation}:${note.key}` ? null : `${relation}:${note.key}`)}
        />
      ))}
    </View>
  );
}

type Props = {
  plantingId: string;
  foodName: string;
  areaPlantings: readonly CompanionPlanting[];
};

/** Under each planting: everything recorded for this crop, folded. */
export function CompanionSection({ plantingId, foodName, areaPlantings }: Props) {
  const [open, setOpen] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [flowersOpen, setFlowersOpen] = useState(false);

  const key = companionPlantFor(foodName);
  const all = companionsFor(key);
  const family = familyCompanionNote(key);
  const here = new Set(neighbourNotes(foodName, areaPlantings, plantingId).map((note) => note.key));

  return (
    <View style={styles.section}>
      <TouchableOpacity onPress={() => setOpen(!open)} accessibilityRole="button">
        <Text style={styles.linkText}>{open ? 'Hide companions for this crop' : 'Companions for this crop'}</Text>
      </TouchableOpacity>
      {open ? (
        <View style={styles.nested}>
          {all.length === 0 && !family ? <Text style={styles.bodyText}>{COMPANION_NONE}</Text> : <Text style={styles.bodyText}>{COMPANION_INTRO}</Text>}
          <RelationList relation="together" notes={all} here={here} openKey={openKey} setOpenKey={setOpenKey} />
          <RelationList relation="apart" notes={all} here={here} openKey={openKey} setOpenKey={setOpenKey} />
          {family ? (
            <View style={styles.group}>
              <Text style={styles.fieldLabel}>{`The whole family. ${describeTier(family.tier)}.`}</Text>
              <Text style={styles.bodyText}>{family.text}</Text>
              <Sources sources={family.sources} />
            </View>
          ) : null}
          <TouchableOpacity onPress={() => setFlowersOpen(!flowersOpen)} accessibilityRole="button">
            <Text style={styles.linkText}>{flowersOpen ? 'Hide flowers among vegetables' : 'Flowers among vegetables'}</Text>
          </TouchableOpacity>
          {flowersOpen ? (
            <View style={styles.noteBody}>
              <Text style={styles.bodyText}>{COMPANION_FLOWERS_NOTE}</Text>
              <Sources sources={COMPANION_FLOWERS_SOURCES} />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 6, marginVertical: 4 },
  nested: { gap: 10, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: TAB_COLOR },
  group: { gap: 6 },
  note: { gap: 4 },
  noteBody: { gap: 6, paddingLeft: 10 },
  fieldLabel: { ...typography.label, color: colors.textPrimary, ...textShadow },
  rowLabel: { ...typography.body, color: colors.primary, ...textShadow },
  bodyText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  captionText: { ...typography.caption, color: colors.textMuted, ...textShadow },
  sourceText: { ...typography.caption, color: colors.primary, ...textShadow },
  linkText: { ...typography.body, color: colors.primary, ...textShadow },
});
