// Keeping a medicine label with a med (A11, Phase 2). The copy is stored as
// it was retrieved and changes only when the person replaces it after
// Check for a Newer Version. The sentences are in lib/medicineLabel.ts.

import { getDatabase } from './db';
import { labelName, type LabelDocument } from './medicineLabel';

export type SavedLabel = {
  treatmentId: string;
  document: LabelDocument;
  howFound: 'code' | 'name';
  whatWasSent: string;
  retrievedAt: string;
};

type Row = {
  treatment_id: string;
  how_found: string;
  what_was_sent: string;
  document_json: string;
  retrieved_at: string;
};

export async function getSavedLabel(treatmentId: string): Promise<SavedLabel | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Row>(
    'SELECT treatment_id, how_found, what_was_sent, document_json, retrieved_at FROM medicine_labels WHERE treatment_id = ?',
    treatmentId,
  );
  if (!row) return null;
  let document: LabelDocument;
  try {
    document = JSON.parse(row.document_json) as LabelDocument;
  } catch {
    return null;
  }
  return {
    treatmentId: row.treatment_id,
    document,
    howFound: row.how_found === 'name' ? 'name' : 'code',
    whatWasSent: row.what_was_sent,
    retrievedAt: row.retrieved_at,
  };
}

/** The ids of every treatment with a kept label, for the My Meds rows. */
export async function getTreatmentIdsWithLabels(): Promise<Set<string>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ treatment_id: string }>('SELECT treatment_id FROM medicine_labels');
  return new Set(rows.map((r) => r.treatment_id));
}

export async function saveLabel(label: SavedLabel): Promise<void> {
  const db = await getDatabase();
  const doc = label.document;
  await db.runAsync(
    `INSERT INTO medicine_labels
       (treatment_id, set_id, version, effective_date, title, maker, how_found, what_was_sent, document_json, retrieved_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(treatment_id) DO UPDATE SET
       set_id = excluded.set_id, version = excluded.version, effective_date = excluded.effective_date,
       title = excluded.title, maker = excluded.maker, how_found = excluded.how_found,
       what_was_sent = excluded.what_was_sent, document_json = excluded.document_json,
       retrieved_at = excluded.retrieved_at, updated_at = excluded.updated_at`,
    label.treatmentId,
    doc.setId,
    doc.version,
    doc.effective,
    labelName(doc),
    doc.maker,
    label.howFound,
    label.whatWasSent,
    JSON.stringify(doc),
    label.retrievedAt,
    new Date().toISOString(),
  );
}

export async function removeSavedLabel(treatmentId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM medicine_labels WHERE treatment_id = ?', treatmentId);
}
