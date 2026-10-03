// Plays an exercise's video inside the app (rebuild R1, 2026-10-02), for a
// link straight to a video file (isVideoFileLink in lib/workouts.ts). Made
// only when the person presses Play, so a card with a video loads nothing
// until then. expo-video has a web build, so the desktop app plays it too.
import { StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

export function ExerciseVideo({ url }: { url: string }) {
  const player = useVideoPlayer(url, (created) => {
    created.loop = false;
    created.play();
  });
  return (
    <View style={styles.frame}>
      <VideoView player={player} style={styles.video} nativeControls contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', borderRadius: 8, overflow: 'hidden', marginVertical: 6 },
  video: { width: '100%', height: '100%' },
});
