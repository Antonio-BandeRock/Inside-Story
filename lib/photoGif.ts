// Making a GIF from a Photo Series, on the device (1.0.53.7). Nothing leaves
// the phone to make it: each frame is shrunk to the GIF size, decoded to
// pixels, given its own 256-colour palette and written into the GIF by
// gifenc, a small encoder in plain JavaScript.
//
// On the phone the shrinking is expo-image-manipulator and the decoding is
// jpeg-js. The desktop app draws each frame onto a canvas instead, which is
// both at once and is what a browser already does well.
//
// The sizes and the choice of frames are in lib/photoSeries.ts (pure,
// tested). The finished GIF is kept as a photo of the series itself
// (SERIES_GIF_OWNER_KIND in lib/photoSeriesDb.ts), never of the thing the
// series is of, so it is never read back as a frame.

import { Platform } from 'react-native';
import { base64ToBytes, bytesToBase64 } from './deviceIdentity';
import type { MediaItem } from './media';
import { keepGeneratedFile, mediaDisplayUri, mediaFile } from './mediaDb';
import { frameDelayMs, gifFrameSize, pickGifFrames } from './photoSeries';
import { SERIES_GIF_OWNER_KIND } from './photoSeriesDb';
import { shareFileIfAvailable } from './nativeSharing';

export type GifProgress = (done: number, total: number) => void;

export type GifResult =
  | { status: 'made'; item: MediaItem; frameCount: number; totalFrames: number }
  | { status: 'too-few' }
  | { status: 'error'; message: string };

async function framePixelsNative(item: MediaItem, width: number, height: number): Promise<Uint8Array | null> {
  const file = await mediaFile(item.fileName);
  if (!file.exists) return null;
  const ImageManipulator = await import('expo-image-manipulator');
  const shrunk = await ImageManipulator.manipulateAsync(file.uri, [{ resize: { width, height } }], {
    compress: 0.9,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
  if (!shrunk.base64) return null;
  const decode = (await import('jpeg-js/lib/decoder')).default;
  const decoded = decode(base64ToBytes(shrunk.base64), { useTArray: true, formatAsRGBA: true, maxMemoryUsageInMB: 64 });
  if (decoded.width !== width || decoded.height !== height) return null;
  return decoded.data;
}

async function framePixelsWeb(item: MediaItem, width: number, height: number): Promise<Uint8Array | null> {
  const uri = await mediaDisplayUri(item);
  if (!uri) return null;
  const image = new (globalThis as unknown as { Image: new () => HTMLImageElement }).Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('The photo could not be read.'));
    image.src = uri;
  });
  const canvas = (globalThis as unknown as { document: Document }).document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.drawImage(image, 0, 0, width, height);
  return new Uint8Array(context.getImageData(0, 0, width, height).data.buffer);
}

/**
 * Makes a GIF from the frames of a series, oldest first, at `fps`. Frames
 * that cannot be read (a photo still on its way from the other device) are
 * left out rather than failing the whole GIF.
 */
export async function makeSeriesGif(
  seriesId: string,
  frames: readonly MediaItem[],
  fps: number,
  onProgress?: GifProgress,
): Promise<GifResult> {
  if (frames.length < 2) return { status: 'too-few' };
  try {
    const { GIFEncoder, applyPalette, quantize } = await import('gifenc');
    const chosen = pickGifFrames(frames);
    const first = chosen[0];
    const size = gifFrameSize(first.width ?? 0, first.height ?? 0);
    const read = Platform.OS === 'web' ? framePixelsWeb : framePixelsNative;
    const encoder = GIFEncoder();
    const delay = frameDelayMs(fps);
    let written = 0;
    for (let i = 0; i < chosen.length; i += 1) {
      const pixels = await read(chosen[i], size.width, size.height).catch(() => null);
      if (pixels) {
        const palette = quantize(pixels, 256);
        encoder.writeFrame(applyPalette(pixels, palette), size.width, size.height, { palette, delay });
        written += 1;
      }
      onProgress?.(i + 1, chosen.length);
      // Lets the screen redraw the progress between frames.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    if (written < 2) return { status: 'too-few' };
    encoder.finish();
    const item = await keepGeneratedFile(bytesToBase64(encoder.bytes()), 'gif', size.width, size.height, {
      kind: SERIES_GIF_OWNER_KIND,
      id: seriesId,
    });
    return { status: 'made', item, frameCount: written, totalFrames: frames.length };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : String(error) };
  }
}

/** Hands a kept GIF to the phone's share sheet, or the Save As dialog on
 *  the desktop app. False when neither is available. */
export async function shareSeriesGif(item: MediaItem): Promise<boolean> {
  try {
    const file = await mediaFile(item.fileName);
    if (!file.exists) return false;
    return shareFileIfAvailable(file.uri, { mimeType: 'image/gif', dialogTitle: 'Share the GIF' });
  } catch {
    return false;
  }
}
