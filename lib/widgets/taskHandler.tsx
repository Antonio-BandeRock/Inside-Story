// The home screen widgets' task (L2, rebuild R1, 2026-10-02). Android asks
// for a widget's look when it is added, resized, every half hour for the
// ones that change through the day, and when one is tapped with an action
// of its own. This answers all of them from lib/widgetData.ts.
//
// Registered from index.js before Expo Router starts, the same way the
// reminder task is, so it exists on a start Android causes with the app
// closed. Android only: widgets are an Android feature here.
import { Platform } from 'react-native';
import { registerWidgetTaskHandler, requestWidgetUpdate, type WidgetTaskHandlerProps } from 'react-native-android-widget';
import { glassContent, isWidgetName, LOG_GLASS_ACTION, WIDGET_NAMES, type WidgetName } from '../widgetContent';
import { logWidgetGlass, widgetContentFor } from '../widgetData';
import { renderLifesteadWidget } from './LifesteadWidget';

async function handle({ widgetInfo, widgetAction, clickAction, renderWidget }: WidgetTaskHandlerProps): Promise<void> {
  const name = widgetInfo.widgetName;
  if (!isWidgetName(name) || widgetAction === 'WIDGET_DELETED') return;
  if (widgetAction === 'WIDGET_CLICK' && clickAction === LOG_GLASS_ACTION) {
    const now = new Date();
    try {
      await logWidgetGlass(now);
      renderWidget(renderLifesteadWidget(name, glassContent(now.getTime(), now.getTime())));
    } catch (error) {
      console.error('[widgets] glass not logged', error);
      renderWidget(renderLifesteadWidget(name, glassContent(null, now.getTime(), 'Not logged. Open the app to log it.')));
      return;
    }
    // The water total moved, so the other widgets that read today follow.
    void refreshWidgets(['FuelGauges']);
    return;
  }
  renderWidget(renderLifesteadWidget(name, await widgetContentFor(name)));
}

/** Redraws the named widgets, or all of them, wherever they are on the home screen. */
export async function refreshWidgets(names: readonly WidgetName[] = WIDGET_NAMES): Promise<void> {
  if (Platform.OS !== 'android') return;
  for (const name of names) {
    try {
      await requestWidgetUpdate({
        widgetName: name,
        renderWidget: async () => renderLifesteadWidget(name, await widgetContentFor(name)),
      });
    } catch (error) {
      console.error('[widgets] refresh failed', name, error);
    }
  }
}

if (Platform.OS === 'android') {
  try {
    registerWidgetTaskHandler(handle);
  } catch (error) {
    console.error('[widgets] task handler not registered', error);
  }
}
