// Asking openFDA for a medicine label (A11, Phase 2). Everything that
// decides anything is in lib/medicineLabel.ts; this file sends the one
// request and reports what came back. The request carries only the code,
// the name or the document number, never anything about the person.

import {
  codeQueryUrl,
  matchLabels,
  nameQueryUrl,
  setIdQueryUrl,
  whatWasSent,
  type LabelDocument,
  type LookupAsk,
} from './medicineLabel';

export type LookupOutcome =
  | { kind: 'found'; labels: LabelDocument[]; total: number; sent: string; retrievedAt: string }
  | { kind: 'not_found'; sent: string; retrievedAt: string }
  | { kind: 'unreachable'; status: number | null };

function urlFor(ask: LookupAsk): string {
  if (ask.kind === 'code') return codeQueryUrl(ask.reading);
  if (ask.kind === 'name') return nameQueryUrl(ask.name);
  return setIdQueryUrl(ask.setId);
}

export async function lookUpLabel(ask: LookupAsk): Promise<LookupOutcome> {
  const sent = whatWasSent(ask);
  let response: Response;
  try {
    response = await fetch(urlFor(ask), { headers: { Accept: 'application/json' } });
  } catch {
    return { kind: 'unreachable', status: null };
  }
  const retrievedAt = new Date().toISOString();
  // openFDA answers a search that matches nothing with 404 and NOT_FOUND.
  if (response.status === 404) return { kind: 'not_found', sent, retrievedAt };
  if (!response.ok) return { kind: 'unreachable', status: response.status };
  let body: { meta?: { results?: { total?: number } }; results?: unknown[] };
  try {
    body = await response.json();
  } catch {
    return { kind: 'unreachable', status: response.status };
  }
  const results = Array.isArray(body.results) ? body.results : [];
  const total = typeof body.meta?.results?.total === 'number' ? body.meta.results.total : results.length;
  const matched = matchLabels(ask, results, total);
  if (matched.kind === 'not_found') return { kind: 'not_found', sent, retrievedAt };
  return { kind: 'found', labels: matched.labels, total: matched.total, sent, retrievedAt };
}
