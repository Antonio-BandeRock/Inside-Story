// Opening the app's camera (app/photo-camera.tsx) for one owner. One helper
// so every photo strip and card passes the same parameters the same way.
import type { Router } from 'expo-router';
import type { MediaOwnerKind } from './media';

export function openPhotoCamera(
  router: Pick<Router, 'push'>,
  owner: { kind: MediaOwnerKind; id: string },
  options: { guide?: boolean; replace?: boolean; title?: string } = {},
): void {
  router.push({
    pathname: '/photo-camera',
    params: {
      ownerKind: owner.kind,
      ownerId: owner.id,
      guide: options.guide ? '1' : '0',
      replace: options.replace ? '1' : '0',
      ...(options.title ? { title: options.title } : {}),
    },
  });
}
