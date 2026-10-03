// The phone's audio player for Signals > Calm recordings (D15, rebuild R1,
// 2026-10-02). Wraps expo-audio in the same few parts of the browser's Audio
// element that components/RecordingsBand.tsx already drives on the computer,
// so the band has one way to play, pause, skip and stop on both.
//
// The file is played from the device (lib/recordingsDb.ts fetches it into
// the cache first if the cache had cleared it). Playback stops when the band
// stops it; it does not carry on with the app put away.
import { createAudioPlayer } from 'expo-audio';

export type BandAudio = {
  play: () => Promise<void>;
  pause: () => void;
  currentTime: number;
  duration: number;
  onended: (() => void) | null;
};

export function phoneAudio(uri: string): { audio: BandAudio; release: () => void } {
  const player = createAudioPlayer(uri);
  const audio: BandAudio = {
    onended: null,
    async play() {
      player.play();
    },
    pause() {
      player.pause();
    },
    get currentTime() {
      return player.currentTime;
    },
    set currentTime(seconds: number) {
      void player.seekTo(seconds);
    },
    get duration() {
      return player.duration;
    },
    set duration(_ignored: number) {
      // Read only; the setter keeps the shape the browser's element has.
    },
  };
  const subscription = player.addListener('playbackStatusUpdate', (status) => {
    if (status.didJustFinish) audio.onended?.();
  });
  return {
    audio,
    release: () => {
      subscription.remove();
      player.remove();
    },
  };
}
