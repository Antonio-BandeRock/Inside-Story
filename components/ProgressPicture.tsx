import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { TAB_ROUTES } from '../constants/tabs';
import { useVisualPreferences } from '../hooks/useVisualPreferences';
import type { ProgressTabPath } from '../lib/progress';
import { loadProgressShared } from '../lib/progressDb';
import { buildProgressScene, PICTURE_TABS, type ProgressScene, SCENE_HEIGHT, SCENE_WIDTH } from '../lib/progressScene';
import { isProgressPictureShown } from '../lib/visualPreferences';

// A tab's progress picture (C17, docs/progress-design.md): a quiet scene on
// the empty tab screen made of the person's records, the pantry filling on
// Food, the garden on Garden, the night sky on Signals and so on. It is
// composed when the tab comes into focus and never animates, which is the
// standing rule since AnimatedSky came out for battery drain. It draws no
// text, takes no touches (pointerEvents none, so the swipe between tabs and
// the corner hubs behave exactly as they did), and draws nothing at all
// until the records have something in them.
//
// Whether it shows is isProgressPictureShown in lib/visualPreferences.ts:
// on by default over the built-in backgrounds, off over a photo the person
// added, and always off under Low Stimulation. Profile > Appearance holds
// the per-tab switches. Everything it draws is decided in
// lib/progressScene.ts; this file only turns shapes into SVG.
export function ProgressPicture({ routeKey }: { routeKey: string | undefined }) {
  const prefs = useVisualPreferences();
  const route = TAB_ROUTES.find((entry) => entry.path === routeKey);
  const eligible = Boolean(route && (PICTURE_TABS as readonly string[]).includes(String(route.path)));
  const shown = eligible && routeKey ? isProgressPictureShown(prefs, routeKey) : false;
  const [scene, setScene] = useState<ProgressScene | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!shown || !route) return undefined;
      let live = true;
      loadProgressShared()
        .then(({ inputs, bands }) => {
          if (live) setScene(buildProgressScene(route.path as ProgressTabPath, inputs, bands, route.color));
        })
        .catch(() => {
          if (live) setScene(null);
        });
      return () => {
        live = false;
      };
    }, [shown, route]),
  );

  if (!shown || !scene || scene.shapes.length === 0) return null;

  return (
    <View pointerEvents="none" style={styles.frame}>
      <ProgressSceneSvg scene={scene} />
    </View>
  );
}

/** The shapes of one scene as SVG, filling its box. Used on the tab screen
 *  and inside each band of Your Progress, so a picture turned off on its
 *  tab can still be looked at there. */
export function ProgressSceneSvg({ scene }: { scene: ProgressScene }) {
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`} preserveAspectRatio="xMidYMax meet">
      {scene.shapes.map((shape, index) => {
        if (shape.type === 'circle') {
          return <Circle key={index} cx={shape.cx} cy={shape.cy} r={shape.r} fill={shape.fill} opacity={shape.opacity} />;
        }
        if (shape.type === 'rect') {
          return <Rect key={index} x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={shape.rx} fill={shape.fill} opacity={shape.opacity} />;
        }
        return (
          <Path
            key={index}
            d={shape.d}
            stroke={shape.stroke ?? 'none'}
            fill={shape.fill ?? 'none'}
            strokeWidth={shape.strokeWidth}
            strokeLinecap="round"
            opacity={shape.opacity}
          />
        );
      })}
    </Svg>
  );
}

const styles = StyleSheet.create({
  // Held clear of the corner hubs at the bottom and the header at the top,
  // so the picture never sits under a button.
  frame: { ...StyleSheet.absoluteFillObject, top: '14%', bottom: '16%', left: '6%', right: '6%' },
});
