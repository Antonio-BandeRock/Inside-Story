// What each tab is for, 1.0.52.5 (lib/yourStoryInterview.ts holds every
// sentence). Direct instruction, 2026-09-25: "I want it to tell the user what
// they can do with all of the Life tab or all of the Food tab, etc. Then they
// can start to drill into the key aspects of how to get started with each
// tab, explaining as it goes in as short but informative way as possible."
//
// One fold per tab, the tab chosen to start from first and open. Opened, a
// tab says what it is for as a whole, then its lenses in named groups (each
// lens name opens that lens), then a few ways to get started, each ticked
// once its record exists.
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { TAB_ROUTES } from '../constants/tabs';
import { textShadow, typography } from '../constants/typography';
import type { StoryDestination } from '../lib/yourStory';
import {
  TOUR_GETTING_STARTED,
  TOUR_HEADING,
  TOUR_LEAD,
  TOUR_OPEN_LABEL,
  TOUR_START_LABEL,
  lensDestination,
  lensName,
  type TourTabView,
} from '../lib/yourStoryInterview';
import { HOME_BAND_CONTENT_PADDING, HOME_BAND_GAP, homeBandStyle } from './HomeSectionBand';

type Props = {
  tour: TourTabView[];
  go: (destination: Exclude<StoryDestination, { kind: 'beats' }>) => void;
};

function routable(destination: StoryDestination): Exclude<StoryDestination, { kind: 'beats' }> | null {
  return destination.kind === 'beats' ? null : destination;
}

export function YourStoryTour({ tour, go }: Props) {
  const chosen = tour.find((tab) => tab.chosen)?.def.path ?? null;
  const [openPaths, setOpenPaths] = useState<string[]>(chosen ? [chosen] : []);

  // A tab chosen later, with Change, opens as well.
  useEffect(() => {
    if (chosen) setOpenPaths((paths) => (paths.includes(chosen) ? paths : [chosen, ...paths]));
  }, [chosen]);

  const toggle = (path: string) =>
    setOpenPaths((paths) => (paths.includes(path) ? paths.filter((entry) => entry !== path) : [...paths, path]));

  return (
    <View style={styles.page}>
      <View style={[styles.band, styles.bandLead]}>
        <Text style={styles.heading}>{TOUR_HEADING}</Text>
        <Text style={styles.body}>{TOUR_LEAD}</Text>
      </View>
      {tour.map((tab) => {
        const route = TAB_ROUTES.find((entry) => entry.path === tab.def.path);
        const tint = route?.color ?? colors.primary;
        const isOpen = openPaths.includes(tab.def.path);
        return (
          <View key={tab.def.path} style={[styles.band, { borderLeftColor: tint }]}>
            <TouchableOpacity
              style={styles.head}
              onPress={() => toggle(tab.def.path)}
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
            >
              <Ionicons name={route?.icon ?? 'ellipse-outline'} size={20} color={tint} style={textShadow} />
              <View style={styles.headText}>
                <Text style={styles.title}>{tab.def.title}</Text>
                <Text style={styles.caption}>{tab.chosen ? TOUR_START_LABEL : tab.def.question}</Text>
              </View>
              <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primary} style={textShadow} />
            </TouchableOpacity>
            {isOpen ? (
              <View style={styles.inside}>
                <Text style={styles.body}>{tab.def.answer}</Text>
                {tab.def.groups.map((group) => (
                  <View key={group.title} style={styles.group}>
                    <Text style={styles.groupTitle}>{group.title}</Text>
                    <Text style={styles.caption}>{group.line}</Text>
                    {group.lenses.length > 0 ? (
                      <View style={styles.lenses}>
                        {group.lenses.map((key) => {
                          const destination = routable(lensDestination(tab.def.path, key));
                          return (
                            <TouchableOpacity
                              key={key}
                              style={[styles.lens, { borderColor: tint }]}
                              onPress={() => destination && go(destination)}
                              accessibilityRole="button"
                            >
                              <Text style={styles.lensText}>{lensName(tab.def.path, key)}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ) : null}
                  </View>
                ))}
                {tab.steps.length > 0 ? (
                  <View style={styles.group}>
                    <Text style={styles.groupTitle}>{TOUR_GETTING_STARTED}</Text>
                    {tab.steps.map((step) => {
                      const destination = routable(step.destination);
                      return (
                        <View key={step.def.doThis} style={styles.stepRow}>
                          <Ionicons
                            name={step.done ? 'checkmark-circle' : 'ellipse-outline'}
                            size={16}
                            color={step.done ? colors.primary : colors.textMuted}
                            style={[textShadow, styles.stepIcon]}
                          />
                          <Text style={step.done ? styles.stepDone : styles.stepText}>{step.def.doThis}</Text>
                          {destination ? (
                            <TouchableOpacity style={styles.link} onPress={() => go(destination)} accessibilityRole="button">
                              <Text style={styles.linkText}>{step.done ? 'Open' : 'Go there'}</Text>
                              <Ionicons name="arrow-forward" size={13} color={colors.primary} style={textShadow} />
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                ) : null}
                {routable(tab.def.open) ? (
                  <TouchableOpacity
                    style={styles.link}
                    onPress={() => {
                      const destination = routable(tab.def.open);
                      if (destination) go(destination);
                    }}
                    accessibilityRole="button"
                  >
                    <Text style={styles.linkText}>{TOUR_OPEN_LABEL(tab.def.title)}</Text>
                    <Ionicons name="arrow-forward" size={13} color={colors.primary} style={textShadow} />
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: HOME_BAND_GAP },
  band: {
    ...homeBandStyle,
    borderColor: colors.border,
    borderLeftWidth: 4,
    padding: HOME_BAND_CONTENT_PADDING,
    gap: 10,
    backgroundColor: colors.surface,
  },
  bandLead: { borderColor: colors.primary, borderLeftColor: colors.primary },
  heading: { ...typography.sectionTitle, color: colors.textPrimary, ...textShadow },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headText: { flex: 1, gap: 1 },
  title: { ...typography.label, color: colors.textPrimary, ...textShadow },
  body: { ...typography.body, color: colors.textSecondary, ...textShadow },
  caption: { ...typography.caption, color: colors.textSecondary, ...textShadow, flexShrink: 1 },
  inside: { gap: 12, backgroundColor: colors.surface },
  group: { gap: 4, backgroundColor: colors.surface },
  groupTitle: { ...typography.label, color: colors.textPrimary, ...textShadow },
  lenses: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2, backgroundColor: colors.surface },
  lens: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: colors.surface },
  lensText: { ...typography.caption, color: colors.textPrimary, ...textShadow },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap', backgroundColor: colors.surface },
  stepIcon: { marginTop: 2 },
  stepText: { ...typography.body, color: colors.textPrimary, ...textShadow, flex: 1, minWidth: 160 },
  stepDone: { ...typography.body, color: colors.textSecondary, ...textShadow, flex: 1, minWidth: 160 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2 },
  linkText: { ...typography.caption, color: colors.primary, ...textShadow },
});
