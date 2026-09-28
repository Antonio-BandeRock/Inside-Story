// A list whose rows are moved by dragging a grip, the way Home's arrange
// list moves its groups and cards (1.0.55.15, asked for directly: "Make
// sure that the order of exercizes is able to be reordered like the Home
// page can be reordered"). First used for the exercises in a workout on
// Life > Workouts, and written to take any list of rows.
//
// It keeps every rule HomeArrangeList learned the hard way, and differs
// from it in one thing:
//
//   - React Native's own PanResponder on the grip only, with no drag
//     library, since a new dependency changes the build fingerprint and
//     strands over-the-air updates.
//   - One responder per row, made once and kept, with the row's place
//     handed over through a holder. A responder rebuilt during the gesture
//     has never been granted anything and sends the row to the end of the
//     list (the 1.0.39.16 bug).
//   - The grip refuses to hand the gesture back, and the screen stops its
//     ScrollView scrolling while a row is held (onDragChange), or the
//     scroll wins and the row never moves.
//   - The difference: rows here are measured rather than a fixed height,
//     because an exercise row grows with its note, its sets and reps and
//     the phone's text size. The arithmetic is in lib/dragReorder.ts.
//
// The new order shows the moment the row is let go, before the screen has
// saved and read it back, so the list never flicks to the old order and
// then back again.
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  View,
  type AccessibilityActionEvent,
  type PanResponderInstance,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '../constants/colors';
import { dragShiftFor, dragTargetIndex, moveIndex } from '../lib/dragReorder';

type Props<T> = {
  items: readonly T[];
  keyOf: (item: T) => string;
  // What a screen reader calls the row on its grip.
  labelOf: (item: T) => string;
  // The row's content, drawn to the left of the grip. `index` is the row's
  // place as drawn, which is the new place straight after a drop.
  renderItem: (item: T, index: number) => ReactNode;
  // Called with every key in the new order, once, when a row lands
  // somewhere other than where it started.
  onReorder: (orderedKeys: string[]) => void;
  onDragChange?: (dragging: boolean) => void;
  color: string;
  rowStyle?: StyleProp<ViewStyle>;
};

type Held = { key: string; from: number };

export function DragReorderList<T>({
  items,
  keyOf,
  labelOf,
  renderItem,
  onReorder,
  onDragChange,
  color,
  rowStyle,
}: Props<T>) {
  // The order just dropped, kept until the screen's own list agrees with
  // it (or changes for some other reason, which wins).
  const [pending, setPending] = useState<{ basis: string; keys: string[] } | null>(null);
  const basis = items.map(keyOf).join('\n');
  const byKey = new Map(items.map((item) => [keyOf(item), item]));
  let shown: T[] = [...items];
  if (pending && pending.basis === basis) {
    const reordered = pending.keys.map((key) => byKey.get(key)).filter((item): item is T => item !== undefined);
    if (reordered.length === items.length) shown = reordered;
  }
  const keys = shown.map(keyOf);

  const heights = useRef(new Map<string, number>()).current;
  const [held, setHeld] = useState<Held | null>(null);
  const [to, setTo] = useState(0);
  const heldRef = useRef<Held | null>(null);
  const toRef = useRef(0);
  const dragY = useRef(new Animated.Value(0)).current;

  const latest = useRef({ keys, basis, onReorder, onDragChange });
  latest.current = { keys, basis, onReorder, onDragChange };

  function measured(order: readonly string[]): number[] {
    return order.map((key) => heights.get(key) ?? 0);
  }

  function land(from: number, target: number) {
    const { keys: order, basis: now } = latest.current;
    if (target === from) return;
    const next = moveIndex(order, from, target);
    setPending({ basis: now, keys: next });
    latest.current.onReorder(next);
  }

  function finish() {
    const grabbed = heldRef.current;
    const target = toRef.current;
    heldRef.current = null;
    toRef.current = 0;
    setHeld(null);
    setTo(0);
    dragY.setValue(0);
    latest.current.onDragChange?.(false);
    if (grabbed) land(grabbed.from, target);
  }
  const finishRef = useRef(finish);
  finishRef.current = finish;

  const responders = useRef(new Map<string, { holder: { current: Held }; instance: PanResponderInstance }>()).current;

  function responderFor(key: string, from: number): PanResponderInstance {
    const made = responders.get(key);
    if (made) {
      made.holder.current = { key, from };
      return made.instance;
    }
    const holder = { current: { key, from } };
    const instance = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        heldRef.current = holder.current;
        toRef.current = holder.current.from;
        dragY.setValue(0);
        setHeld(holder.current);
        setTo(holder.current.from);
        latest.current.onDragChange?.(true);
        Haptics.selectionAsync().catch(() => {
          // A phone with no haptics is not a reason to refuse the drag.
        });
      },
      onPanResponderMove: (_event, gesture) => {
        const grabbed = heldRef.current;
        if (!grabbed) return;
        dragY.setValue(gesture.dy);
        const next = dragTargetIndex(measured(latest.current.keys), grabbed.from, gesture.dy);
        if (next !== toRef.current) {
          toRef.current = next;
          setTo(next);
          Haptics.selectionAsync().catch(() => {
            // As above.
          });
        }
      },
      onPanResponderRelease: () => finishRef.current(),
      onPanResponderTerminate: () => finishRef.current(),
    });
    responders.set(key, { holder, instance });
    return instance;
  }

  // A screen reader cannot drag, so the grip answers swipe up and swipe
  // down by moving the row one place.
  function onAccessibilityAction(from: number, event: AccessibilityActionEvent) {
    if (event.nativeEvent.actionName === 'decrement') land(from, from - 1);
    if (event.nativeEvent.actionName === 'increment') land(from, from + 1);
  }

  const order = measured(keys);
  return (
    <View>
      {shown.map((item, index) => {
        const key = keyOf(item);
        const isHeld = held?.key === key;
        const canDrag = shown.length > 1;
        return (
          <Animated.View
            key={key}
            onLayout={(event) => {
              heights.set(key, event.nativeEvent.layout.height);
            }}
            style={[
              rowStyle,
              styles.row,
              isHeld
                ? { transform: [{ translateY: dragY }], zIndex: 2, elevation: 4, opacity: 0.94, backgroundColor: colors.surface }
                : { transform: [{ translateY: held ? dragShiftFor(order, held.from, to, index) : 0 }] },
            ]}
          >
            <View style={styles.content}>{renderItem(item, index)}</View>
            {canDrag ? (
              <View
                style={styles.grip}
                accessible
                accessibilityRole="adjustable"
                accessibilityLabel={`Drag ${labelOf(item)} to another place`}
                accessibilityHint="Swipe up or down to move it one place"
                accessibilityActions={[
                  { name: 'decrement', label: 'Move up' },
                  { name: 'increment', label: 'Move down' },
                ]}
                onAccessibilityAction={(event) => onAccessibilityAction(index, event)}
                {...responderFor(key, index).panHandlers}
              >
                <Ionicons name="reorder-three-outline" size={22} color={isHeld ? color : colors.textSecondary} />
              </View>
            ) : null}
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch' },
  content: { flex: 1 },
  grip: { width: 40, alignItems: 'center', justifyContent: 'center' },
});
