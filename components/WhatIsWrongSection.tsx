// What is wrong with this plant (I25, 2026-09-29), under each planting's row
// in Garden > Plots & Plantings. Folded to one line until opened. Open, it
// lists the three problems the crop is known for, asks where the trouble
// shows first and lists the nutrients and look-alikes that show there,
// then offers Google Lens and the people who answer gardening questions for
// free. Any row can be written down on the planting as a Something wrong
// seen entry. Why no paid service, and the wording, are in
// lib/plantTrouble.ts.

import { useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import type { CropGuide } from '../lib/cropGuides';
import { CROP_PROBLEMS } from '../lib/cropProblems';
import { identifyService } from '../lib/plantIdentify';
import { NUTRIENT_LOOK_ALIKES, PLANT_NUTRIENTS, WHERE_TO_ASK } from '../lib/plantNutrients';
import { addPlantingEvent } from '../lib/plantingEventsDb';
import { dateKey } from '../lib/plainDate';
import {
  TROUBLE_ASK_INTRO,
  TROUBLE_CAUTION,
  TROUBLE_EVENT_KIND,
  TROUBLE_INTRO,
  TROUBLE_LENS_INTRO,
  TROUBLE_NO_CROP_INTRO,
  TROUBLE_WHERE_OPTIONS,
  troubleFor,
  troubleNote,
  type TroubleWhere,
} from '../lib/plantTrouble';
import { PopoverSelect } from './PopoverSelect';
import { openIdentifyService } from './WhatPlantIsThis';

const TAB_COLOR = colors.tabGarden;

type Props = {
  plantingId: string;
  plotId: string;
  guide: CropGuide | null;
  /** After an entry is written down, so What was done can show it. */
  onRecorded: () => void;
};

type Row = { key: string; label: string; lines: { heading?: string; text: string }[] };

export function WhatIsWrongSection({ plantingId, plotId, guide, onRecorded }: Props) {
  const [open, setOpen] = useState(false);
  const [where, setWhere] = useState<TroubleWhere | null>(null);
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [recorded, setRecorded] = useState<string | null>(null);
  const [lensFailed, setLensFailed] = useState(false);

  const cropRows: Row[] = guide
    ? (CROP_PROBLEMS[guide.key] ?? []).map((problem) => ({
        key: `crop:${problem.label}`,
        label: problem.label,
        lines: [
          { text: problem.looks },
          { heading: 'Why', text: problem.why },
          { heading: 'Putting it right', text: problem.fix },
          ...(problem.insteadOf ? [{ heading: 'Why not the bag or bottle', text: problem.insteadOf }] : []),
        ],
      }))
    : [];

  const set = where ? troubleFor(where) : null;
  const nutrientRows: Row[] = set
    ? set.nutrients.flatMap((key) => {
        const nutrient = PLANT_NUTRIENTS.find((candidate) => candidate.key === key);
        if (!nutrient) return [];
        return [
          {
            key: `nutrient:${key}`,
            label: `Short of ${nutrient.name.toLowerCase()}`,
            lines: [
              { text: nutrient.looks },
              { heading: 'Why', text: nutrient.causes },
              { heading: 'Putting it right', text: nutrient.withTheSoil },
              { heading: 'Why not the bag or bottle', text: nutrient.whyNotChemical },
            ],
          },
        ];
      })
    : [];
  const lookAlikeRows: Row[] = set
    ? set.lookAlikes.flatMap((heading) => {
        const found = NUTRIENT_LOOK_ALIKES.find((item) => item.heading === heading);
        return found ? [{ key: `alike:${heading}`, label: heading, lines: [{ text: found.body }] }] : [];
      })
    : [];

  async function writeDown(row: Row) {
    await addPlantingEvent({
      plantingId,
      plotId,
      occurredOn: dateKey(new Date()),
      kind: TROUBLE_EVENT_KIND,
      note: troubleNote(row.label),
    });
    setRecorded(row.key);
    onRecorded();
  }

  async function openLens() {
    const lens = identifyService('lens');
    if (!lens) return;
    setLensFailed(!(await openIdentifyService(lens)));
  }

  function renderRow(row: Row) {
    const isOpen = openRow === row.key;
    return (
      <View key={row.key} style={styles.row}>
        <TouchableOpacity onPress={() => setOpenRow(isOpen ? null : row.key)} accessibilityRole="button">
          <Text style={styles.rowLabel}>{row.label}</Text>
        </TouchableOpacity>
        {isOpen ? (
          <View style={styles.rowBody}>
            {row.lines.map((line, index) => (
              <Text key={index} style={styles.bodyText}>
                {line.heading ? <Text style={styles.lineHeading}>{`${line.heading}: `}</Text> : null}
                {line.text}
              </Text>
            ))}
            {recorded === row.key ? (
              <Text style={styles.captionText}>Written down for today under What was done.</Text>
            ) : (
              <TouchableOpacity onPress={() => writeDown(row)} accessibilityRole="button">
                <Text style={styles.linkText}>It Looks Like This, Write It Down</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <TouchableOpacity onPress={() => setOpen(!open)} accessibilityRole="button">
        <Text style={styles.linkText}>{open ? 'Hide what is wrong with it' : 'What is wrong with it'}</Text>
      </TouchableOpacity>
      {open ? (
        <View style={styles.nested}>
          <Text style={styles.bodyText}>{guide ? TROUBLE_INTRO : TROUBLE_NO_CROP_INTRO}</Text>
          {cropRows.length > 0 && guide ? (
            <View style={styles.group}>
              <Text style={styles.fieldLabel}>{`What ${guide.name.toLowerCase()} is known for`}</Text>
              {cropRows.map(renderRow)}
            </View>
          ) : null}

          <View style={styles.group}>
            <Text style={styles.fieldLabel}>Where does it show first?</Text>
            <PopoverSelect
              options={TROUBLE_WHERE_OPTIONS}
              selected={where}
              onSelect={(value) => {
                setWhere(value as TroubleWhere);
                setOpenRow(null);
              }}
              placeholder="Pick one"
              tabColor={TAB_COLOR}
            />
            {nutrientRows.length > 0 ? (
              <>
                <Text style={styles.fieldLabel}>Shortages that show there</Text>
                {nutrientRows.map(renderRow)}
              </>
            ) : null}
            {lookAlikeRows.length > 0 ? (
              <>
                <Text style={styles.fieldLabel}>Things that look like a shortage and are not</Text>
                {lookAlikeRows.map(renderRow)}
              </>
            ) : null}
          </View>

          <Text style={styles.captionText}>{TROUBLE_CAUTION}</Text>

          <View style={styles.group}>
            <Text style={styles.bodyText}>{TROUBLE_LENS_INTRO}</Text>
            <TouchableOpacity onPress={openLens} accessibilityRole="button">
              <Text style={styles.linkText}>Open Google Lens</Text>
            </TouchableOpacity>
            {lensFailed ? <Text style={styles.errorText}>Google Lens could not be opened on this device.</Text> : null}
          </View>

          <View style={styles.group}>
            <Text style={styles.bodyText}>{TROUBLE_ASK_INTRO}</Text>
            {WHERE_TO_ASK.map((place) => (
              <TouchableOpacity key={place.url} onPress={() => Linking.openURL(place.url)} accessibilityRole="link">
                <Text style={styles.linkText}>{place.heading}</Text>
                <Text style={styles.captionText}>{place.body}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 6, marginVertical: 4 },
  nested: { gap: 10, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: TAB_COLOR },
  group: { gap: 6 },
  row: { gap: 4 },
  rowBody: { gap: 6, paddingLeft: 10 },
  fieldLabel: { ...typography.label, color: colors.textPrimary, ...textShadow },
  rowLabel: { ...typography.body, color: colors.primary, ...textShadow },
  lineHeading: { color: colors.textMuted },
  bodyText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  captionText: { ...typography.caption, color: colors.textMuted, ...textShadow },
  errorText: { color: colors.danger },
  linkText: { ...typography.body, color: colors.primary, ...textShadow },
});
