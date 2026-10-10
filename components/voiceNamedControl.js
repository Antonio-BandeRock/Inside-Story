// Puts every button and scrolling view in this app's own files into
// lib/voiceControlRegistry.ts while it is mounted, so voice control can press
// any of them by the words on it and scroll the screen (1.0.66.11). Used by
// the Metro swap: components/reactNativeWithEditableText.js on the phone, and
// the voiceWeb*.js files on the desktop, wrap React Native's own components
// with these and hand the wrapped ones to the app in their place. Nothing a
// button does changes: the same props reach the same component, plus a ref
// this file keeps a copy of so it can ask where on screen the button is.
//
// Requires only 'react' and the registry, which imports nothing, so neither
// can resolve back to the swap.
const React = require('react');
const { focusOf, registerVoiceControl, registerVoiceScroller, wordsInside } = require('../lib/voiceControlRegistry');

// Read on first use rather than at load: this file loads the moment anything
// in the app first imports 'react-native', before navigation has.
let navigationContext = null;
function useScreenNavigation() {
  if (navigationContext === null) navigationContext = require('@react-navigation/native').NavigationContext;
  return React.useContext(navigationContext);
}

function copyStatics(Wrapped, Original) {
  for (const key of Object.keys(Original)) {
    if (!(key in Wrapped)) {
      try {
        Wrapped[key] = Original[key];
      } catch {
        // A read-only static stays on the original only.
      }
    }
  }
}

function useSharedRef(ref) {
  const own = React.useRef(null);
  const setRef = React.useCallback(
    (node) => {
      own.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  return [own, setRef];
}

function withVoiceName(Original, displayName) {
  const Wrapped = React.forwardRef(function VoiceNamed(props, ref) {
    const latest = React.useRef(props);
    latest.current = props;
    const [own, setRef] = useSharedRef(ref);
    const navigation = useScreenNavigation();
    React.useEffect(
      () =>
        registerVoiceControl({
          focused: focusOf(navigation),
          name: () => {
            const p = latest.current;
            const label = p.accessibilityLabel ?? p['aria-label'];
            if (typeof label === 'string' && label.trim()) return label;
            return typeof p.children === 'function' ? '' : wordsInside(p.children);
          },
          canPress: () => {
            const p = latest.current;
            return typeof p.onPress === 'function' && !p.disabled && p.accessible !== false;
          },
          press: () => {
            const p = latest.current;
            if (typeof p.onPress === 'function') p.onPress({ nativeEvent: {}, voice: true });
          },
          node: () => own.current,
        }),
      [own, navigation],
    );
    return React.createElement(Original, Object.assign({}, props, { ref: setRef }));
  });
  Wrapped.displayName = displayName;
  copyStatics(Wrapped, Original);
  return Wrapped;
}

// A FlatList or SectionList has no scrollTo or measureInWindow of its own;
// the ScrollView it draws does.
function innerScroll(node) {
  if (!node) return null;
  if (typeof node.measureInWindow === 'function' && typeof node.scrollTo === 'function') return node;
  if (typeof node.getNativeScrollRef === 'function') {
    const inner = node.getNativeScrollRef();
    if (inner) return inner;
  }
  if (typeof node.getScrollResponder === 'function') {
    const inner = node.getScrollResponder();
    if (inner) return inner;
  }
  return node;
}

function withVoiceScroll(Original, displayName) {
  const Wrapped = React.forwardRef(function VoiceScrollView(props, ref) {
    const latest = React.useRef(props);
    latest.current = props;
    const [own, setRef] = useSharedRef(ref);
    const offset = React.useRef({ x: 0, y: 0 });
    const content = React.useRef(0);
    const navigation = useScreenNavigation();
    React.useEffect(
      () =>
        registerVoiceScroller({
          focused: focusOf(navigation),
          vertical: () => !latest.current.horizontal && latest.current.scrollEnabled !== false,
          scroll: (move, viewportHeight) => {
            const node = own.current;
            if (!node) return;
            if (move === 'bottom') {
              if (typeof node.scrollToEnd === 'function') node.scrollToEnd({ animated: true });
              return;
            }
            const scroller = innerScroll(node);
            if (!scroller || typeof scroller.scrollTo !== 'function') return;
            const step = Math.max(120, Math.round(viewportHeight * 0.8));
            const max = content.current > 0 ? Math.max(0, content.current - viewportHeight) : Infinity;
            let y = 0;
            if (move === 'down') y = Math.min(max, offset.current.y + step);
            if (move === 'up') y = Math.max(0, offset.current.y - step);
            offset.current = { x: offset.current.x, y };
            scroller.scrollTo({ x: 0, y, animated: true });
          },
          node: () => innerScroll(own.current),
        }),
      [own, navigation],
    );
    const onScroll = props.onScroll;
    const handleScroll = React.useCallback(
      (event) => {
        const native = event && event.nativeEvent;
        if (native && native.contentOffset) offset.current = native.contentOffset;
        if (native && native.contentSize) content.current = native.contentSize.height;
        if (typeof onScroll === 'function') onScroll(event);
      },
      [onScroll],
    );
    const onContentSizeChange = props.onContentSizeChange;
    const handleContentSize = React.useCallback(
      (width, height) => {
        content.current = height;
        if (typeof onContentSizeChange === 'function') onContentSizeChange(width, height);
      },
      [onContentSizeChange],
    );
    // An onScroll that is not a plain function (an Animated.event running on
    // the native driver) is passed through untouched; the offset is then
    // only known from what voice itself scrolled.
    const extra = { ref: setRef, onContentSizeChange: handleContentSize };
    if (onScroll === undefined || typeof onScroll === 'function') {
      extra.onScroll = handleScroll;
      if (props.scrollEventThrottle === undefined) extra.scrollEventThrottle = 100;
    }
    return React.createElement(Original, Object.assign({}, props, extra));
  });
  Wrapped.displayName = displayName;
  copyStatics(Wrapped, Original);
  return Wrapped;
}

module.exports = { withVoiceName, withVoiceScroll };
