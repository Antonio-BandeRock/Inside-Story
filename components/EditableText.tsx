// Every Text in this app, so any words on screen can be tapped and changed
// while Tell Claude's Edit wording mode is on (1.0.51.12).
//
// Nothing imports this by name. metro.config.js hands this app's own files
// components/reactNativeWithEditableText.js whenever they import
// 'react-native', and that module is React Native with Text swapped for the
// one below, so none of the files that draw text had to change and a screen
// written later is covered without anybody remembering. TypeScript still
// checks every call site against React Native's own Text, whose props this
// takes unchanged.
//
// While the Tell Claude switch is off this is React Native's Text and
// nothing else: one context read, then the same element. lib/wordingEdits.ts
// holds the state and the reasoning; lib/devNotes.ts decides which edits
// count and how words are read out of a Text's children.
//
// Three rules shape it:
//  1. THE OUTERMOST TEXT OWNS THE SENTENCE. A Text nested inside another is
//     part of the outer one's words, so only the outer one is tappable and
//     only the outer one's words are matched against an edit. Everything
//     under it renders plain (PlainTextZone).
//  2. AN EDIT SHOWN IN PLACE REPLACES THE WHOLE SENTENCE with the words as
//     typed, in the outer Text's style. A bold word inside it comes back in
//     the surrounding style until the source change ships, which is a
//     preview's price and never reaches anybody else.
//  3. THE EDITOR'S OWN WORDS ARE NOT EDITABLE. components/TellClaudeHost.tsx
//     wraps itself in PlainTextZone, so a tap on the editor never opens
//     another editor.
import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type Ref } from 'react';
import type { TextProps } from 'react-native';
import { Text as NativeText } from './reactNativeText';
import { flattenTextChildren } from '../lib/devNotes';
import {
  getWordingEditState,
  reportWordingTap,
  subscribeWordingEdits,
  type WordingEditState,
} from '../lib/wordingEdits';

const WordingContext = createContext<WordingEditState>(getWordingEditState());
const PlainContext = createContext(false);

/** Mounted once at the root of app/_layout.tsx. */
export function WordingEditProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState(getWordingEditState);
  useEffect(() => {
    setValue(getWordingEditState());
    return subscribeWordingEdits(setValue);
  }, []);
  return <WordingContext.Provider value={value}>{children}</WordingContext.Provider>;
}

/** Text under this renders as React Native's, whatever mode is on. */
export function PlainTextZone({ children }: { children: ReactNode }) {
  return <PlainContext.Provider value>{children}</PlainContext.Provider>;
}

type EditableTextProps = TextProps & { ref?: Ref<NativeText> };

function assignRef<T>(ref: Ref<T> | undefined, node: T | null): void {
  if (typeof ref === 'function') ref(node);
  else if (ref && typeof ref === 'object') (ref as { current: T | null }).current = node;
}

export function EditableText(props: EditableTextProps) {
  const wording = useContext(WordingContext);
  const plain = useContext(PlainContext);
  const own = useRef<NativeText | null>(null);

  if (!wording.active || plain) return <NativeText {...props} />;

  const { children, ref, style, onPress, onLongPress, ...rest } = props;
  const originalText = flattenTextChildren(children);
  const edited = wording.showEdits ? wording.edits.get(originalText) : undefined;
  const shownText = edited ?? originalText;
  const content = <PlainContext.Provider value>{edited ?? children}</PlainContext.Provider>;

  if (!wording.editing || !originalText.trim()) {
    return (
      <NativeText {...rest} ref={ref} style={style} onPress={onPress} onLongPress={onLongPress}>
        {content}
      </NativeText>
    );
  }

  return (
    <NativeText
      {...rest}
      ref={(node: NativeText | null) => {
        own.current = node;
        assignRef(ref, node);
      }}
      style={[style, EDITING_STYLE]}
      suppressHighlighting
      onPress={(event) => {
        const fallbackY = event.nativeEvent.pageY;
        const node = own.current as unknown as {
          measureInWindow?: (callback: (x: number, y: number, width: number, height: number) => void) => void;
        } | null;
        if (node?.measureInWindow) {
          node.measureInWindow((_x, y, _width, height) =>
            reportWordingTap({ originalText, shownText, top: y, bottom: y + height }),
          );
        } else {
          reportWordingTap({ originalText, shownText, top: fallbackY, bottom: fallbackY });
        }
      }}
    >
      {content}
    </NativeText>
  );
}

// What marks words as tappable while editing. An underline takes no room,
// so nothing on screen moves when edit mode comes on.
const EDITING_STYLE = { textDecorationLine: 'underline' as const };
