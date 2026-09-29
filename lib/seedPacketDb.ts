// Seed packet photos kept in step with their plantings (I17, 2026-09-28).
//
// The Add a Planting form chooses the planting's id before it is saved, so
// a photo of the packet can be taken while the form is open. Cancel removes
// that photo, but the app can close before Cancel is pressed, which would
// leave a photo filed under a planting that never came to be. This sweep,
// run once when Garden opens and before any form is open, removes those.
// A planting that is deleted takes its packet photos with it in
// deleteGardenPlanting (lib/db.ts), so nothing else needs sweeping.

import { getDatabase } from './db';
import { listMediaOfKind, removePhoto } from './mediaDb';
import { SEED_PACKET_OWNER_KIND } from './seedPacket';

export async function removeUnclaimedPacketPhotos(): Promise<number> {
  const photos = await listMediaOfKind(SEED_PACKET_OWNER_KIND);
  if (photos.length === 0) return 0;
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ id: string }>('SELECT id FROM garden_plantings');
  const plantings = new Set(rows.map((row) => row.id));
  let removed = 0;
  for (const photo of photos) {
    if (plantings.has(photo.ownerId)) continue;
    await removePhoto(photo);
    removed += 1;
  }
  return removed;
}
