import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { CurrentPageHelpProvider } from '../../components/CurrentPageHelp';
import { TabHub } from '../../components/TabHub';

// headerShown: false everywhere here -- each screen renders its own
// ScreenHeader (title + profile button) at the top of its own content
// instead. The native Tabs header used to duplicate that same title,
// stacking two header bars and wasting vertical space, especially in
// landscape where height is already tight.
//
// tabBarStyle: display 'none' -- the old 7-icon bottom bar is replaced by
// TabHub, a single bottom-center floating button that opens a picker for
// all 7 screens. This is a deliberate thumb-ergonomics choice: a
// bottom-center button is equally reachable one-handed regardless of
// which hand holds the phone, where a row of 7 icons forces some of them
// into a stretch for anyone. Swiping (SwipeableTabScreen) still covers the
// fast path between adjacent tabs; TabHub covers jumping anywhere else.
// The underlying Tabs navigator is kept (not swapped for a Stack) so every
// screen keeps behaving exactly as it did -- still mounted in the
// background on switch, still relying on useFocusEffect to refresh data.
export default function TabLayout() {
  return (
    <CurrentPageHelpProvider>
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: 'none' },
          }}
        >
          <Tabs.Screen name="home" options={{ title: 'Home' }} />
          <Tabs.Screen name="index" options={{ title: 'Food' }} />
          <Tabs.Screen name="insights" options={{ title: 'Insights' }} />
          <Tabs.Screen name="schedule" options={{ title: 'Schedules' }} />
          <Tabs.Screen name="trends" options={{ title: 'Trends' }} />
          <Tabs.Screen name="log" options={{ title: 'Bio-Compass' }} />
          <Tabs.Screen name="reports" options={{ title: 'Reports' }} />
        </Tabs>
        <TabHub />
      </View>
    </CurrentPageHelpProvider>
  );
}
