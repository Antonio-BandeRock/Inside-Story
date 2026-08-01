import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';

// Animated.createAnimatedComponent should only wrap a given base component
// once, not fresh in every file that needs it -- shared here so
// ScreenBackground.tsx, TabHub.tsx, IridescentRingCircle.tsx, and Home
// (app/(tabs)/index.tsx) -- all four driving LinearGradient's own `colors`
// prop from the shared iridescent hue rotation (see
// hooks/useIridescentHueRotation.ts) -- reuse the exact same wrapped
// component instead of each creating its own separate copy.
export const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
