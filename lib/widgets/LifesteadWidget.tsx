// How every home screen widget is drawn (L2, rebuild R1, 2026-10-02). One
// layout for all seven: a heading, a few lines, one quiet caption, the
// whole widget a tap to where its line comes from. Glass is the exception
// whose tap logs the drink rather than opening the app, with a small
// "Open" at the side for Hydration itself.
//
// Drawn with react-native-android-widget's own primitives, which become
// Android RemoteViews; nothing from react-native renders here. Text scales
// with the phone's font size, since all of it is reading text.
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { LOG_GLASS_ACTION, type WidgetContent, type WidgetName } from '../widgetContent';

type Palette = { background: `#${string}`; heading: `#${string}`; text: `#${string}`; quiet: `#${string}`; accent: `#${string}` };

const LIGHT: Palette = { background: '#F4F1EA', heading: '#244147', text: '#1E2A2C', quiet: '#5B6B6E', accent: '#244147' };
const DARK: Palette = { background: '#1C2B2E', heading: '#9FD3D9', text: '#ECEFEF', quiet: '#A7B4B6', accent: '#9FD3D9' };

const TINY: WidgetName[] = ['Capture', 'Glass'];

function Body({ name, content, palette }: { name: WidgetName; content: WidgetContent; palette: Palette }) {
  const tiny = TINY.includes(name);
  const isGlass = name === 'Glass';
  return (
    <FlexWidget
      clickAction={isGlass ? LOG_GLASS_ACTION : 'OPEN_URI'}
      clickActionData={isGlass ? {} : { uri: content.uri }}
      accessibilityLabel={isGlass ? 'Log a glass of water' : `${content.heading}. ${content.lines.join('. ')}`}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: palette.background,
        borderRadius: 16,
        borderLeftWidth: 4,
        borderLeftColor: palette.accent,
        paddingHorizontal: 12,
        paddingVertical: tiny ? 6 : 10,
        flexDirection: tiny ? 'row' : 'column',
        alignItems: tiny ? 'center' : 'flex-start',
        justifyContent: tiny ? 'space-between' : 'flex-start',
        flexGap: tiny ? 8 : 3,
      }}
    >
      <FlexWidget style={{ flexDirection: 'column', flexGap: 2 }}>
        <TextWidget text={content.heading} maxLines={1} truncate="END" style={{ fontSize: 14, fontWeight: '600', color: palette.heading }} />
        {content.lines.map((line, index) => (
          <TextWidget
            key={`${index}-${line}`}
            text={line}
            maxLines={tiny ? 1 : 2}
            truncate="END"
            style={{ fontSize: 13, color: palette.text }}
          />
        ))}
        {content.caption ? (
          <TextWidget text={content.caption} maxLines={1} truncate="END" style={{ fontSize: 11, color: palette.quiet }} />
        ) : null}
      </FlexWidget>
      {isGlass ? (
        <FlexWidget clickAction="OPEN_URI" clickActionData={{ uri: content.uri }} accessibilityLabel="Open Hydration" style={{ paddingHorizontal: 6, paddingVertical: 4 }}>
          <TextWidget text="Open" style={{ fontSize: 12, color: palette.accent }} />
        </FlexWidget>
      ) : null}
    </FlexWidget>
  );
}

/** Both looks, so the widget follows the phone's dark theme. */
export function renderLifesteadWidget(name: WidgetName, content: WidgetContent) {
  return {
    light: <Body name={name} content={content} palette={LIGHT} />,
    dark: <Body name={name} content={content} palette={DARK} />,
  };
}
