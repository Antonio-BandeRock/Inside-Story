// Asks before removing a record that carries photos (I13), the way a money
// entry with a receipt photo already did (J4). A record with none is still
// removed in one tap. The photos themselves are removed by the delete
// function the caller passes, which already does so (1.0.53.7).
import { useState, type ReactElement } from 'react';
import { photosGoWithItSentence, type MediaOwnerKind } from '../lib/media';
import { countMediaFor } from '../lib/mediaDb';
import { AppActionSheet } from './AppActionSheet';

export type PhotoOwner = { kind: MediaOwnerKind; id: string };

export function usePhotoRemovalConfirm(): {
  confirmRemoval: (args: { owners: PhotoOwner[]; title: string; onRemove: () => Promise<void> }) => Promise<void>;
  photoRemovalSheet: ReactElement;
} {
  const [pending, setPending] = useState<{ title: string; message: string; onRemove: () => Promise<void> } | null>(null);

  async function confirmRemoval({ owners, title, onRemove }: { owners: PhotoOwner[]; title: string; onRemove: () => Promise<void> }) {
    let count = 0;
    for (const owner of owners) count += await countMediaFor(owner.kind, owner.id).catch(() => 0);
    const message = photosGoWithItSentence(count);
    if (!message) {
      await onRemove();
      return;
    }
    setPending({ title, message, onRemove });
  }

  const photoRemovalSheet = (
    <AppActionSheet
      visible={pending !== null}
      onClose={() => setPending(null)}
      title={pending?.title}
      message={pending?.message}
      actions={[
        {
          label: 'Remove',
          destructive: true,
          onPress: () => {
            const run = pending?.onRemove;
            setPending(null);
            if (run) void run();
          },
        },
        { label: 'Keep it', onPress: () => setPending(null) },
      ]}
    />
  );

  return { confirmRemoval, photoRemovalSheet };
}
