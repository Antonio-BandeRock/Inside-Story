import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { useOppositeCornerPosition } from '../constants/floatingButton';
import { typography } from '../constants/typography';

// 2026-07-25: the page title and sub-tab label (e.g. "Insights" / "6
// Dimensions") used to live in ScreenHeader, top of screen, next to the
// help icon. Both moved down here, to the bottom corner OPPOSITE wherever
// the floating hubs (TabHub/LensHub/ScopeHub) sit -- see
// useOppositeCornerPosition -- specifically so they never compete for
// space with those buttons, without the buttons themselves ever being
// resized to make room. ScreenHeader now shows only the app's own
// branding, centered; this shows only "which page/view am I looking at,"
// each on its own row, each centered in the width it takes up.
//
// Purely a label -- pointerEvents: 'none' so it never intercepts a tap
// meant for whatever's underneath it (there usually isn't anything there,
// since it sits opposite the buttons in otherwise-empty space, but this
// keeps it that way even if a future screen's content extends into this
// corner).
export function PageIdentityLabel({ title, activeLensLabel }: { title: string; activeLensLabel?: string }) {
  const position = useOppositeCornerPosition();

  return (
    <View style={[styles.container, position]} pointerEvents="none">
      <Text style={styles.text}>{title}</Text>
      {activeLensLabel ? <Text style={styles.text}>{activeLensLabel}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
  },
  // Same size/color/family the page title used at its old spot in
  // ScreenHeader -- moving where it lives isn't a reason to also resize it.
  text: {
    ...typography.eyebrow,
    fontSize: 13,
    color: colors.primary,
    textAlign: 'center',
  },
});
