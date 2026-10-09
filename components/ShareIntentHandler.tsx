// Takes in whatever another app shares to Lifestead (C11, rebuild R1,
// lib/shareIntake.ts decides where it goes). A recipe link opens Food >
// Import a Recipe with the link in its box and nothing fetched; text or a
// link becomes a Capture note marked as shared; images become one Capture
// note with every photo on it. Capture opens afterwards so the person sees
// where it went. Mounted in the tabs layout beside QuickActionRouter, for
// the same reason: navigating needs a layout that is ready to navigate.
// Renders nothing. Phone only: the desktop has no Share sheet, and its build
// swaps the package for a stand-in.
import { Platform } from 'react-native';
import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useShareIntent } from 'expo-share-intent';
import { isDesktopApp } from '../lib/desktop/bridge';
import { planShare, type SharedThing } from '../lib/shareIntake';
import { createCaptureNote } from '../lib/captureNotesDb';
import { PHOTO_CAPTURE_TEXT } from '../lib/captureNotes';
import { keepPhoto } from '../lib/mediaDb';

const ON_PHONE = Platform.OS !== 'web' && !isDesktopApp();

function PhoneShareIntake() {
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
  // One share is taken in once, even if the hook reports it twice before
  // the reset lands.
  const busyRef = useRef(false);

  useEffect(() => {
    if (!hasShareIntent || busyRef.current) return;
    busyRef.current = true;
    const thing: SharedThing = {
      text: shareIntent.text ?? null,
      webUrl: shareIntent.webUrl ?? null,
      images: (shareIntent.files ?? [])
        .filter((file) => file.mimeType?.startsWith('image/') && file.path)
        .map((file) => ({ uri: file.path, width: file.width, height: file.height })),
      title: shareIntent.meta?.title ?? null,
    };
    const plan = planShare(thing);
    (async () => {
      try {
        if (plan.kind === 'recipe') {
          router.push({ pathname: '/food', params: { openFoodLens: 'importRecipe', importRecipeUrl: plan.url } });
        } else if (plan.kind === 'capture') {
          await createCaptureNote(plan.text, 'shared');
          router.push('/capture');
        } else if (plan.kind === 'photos') {
          const id = await createCaptureNote(plan.text ?? PHOTO_CAPTURE_TEXT, 'shared');
          if (id) {
            for (const image of plan.images) {
              await keepPhoto(image.uri, image.width ?? 0, image.height ?? 0, { kind: 'capture_note', id });
            }
          }
          router.push('/capture');
        }
      } catch (error) {
        console.warn('[ShareIntentHandler] could not take in the share', error);
      } finally {
        resetShareIntent();
        busyRef.current = false;
      }
    })();
  }, [hasShareIntent, shareIntent, resetShareIntent, router]);

  return null;
}

export function ShareIntentHandler() {
  return ON_PHONE ? <PhoneShareIntake /> : null;
}
