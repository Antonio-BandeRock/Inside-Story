// A med's injection sites, inside its Details on Life > My Meds (A4): the
// switch saying whether it is a shot, the next and last spot, the recent
// shots, noting one, and the spots in the rotation. The sentences and the
// next-spot rule are in lib/injectionSites.ts.
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppTextInput } from './AppTextInput';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import {
  BUILT_IN_SITES,
  INJECTION_LEAD,
  defaultRotation,
  isInjected,
  isOwnSite,
  lastSiteLine,
  matchInjectable,
  matchLine,
  nextSiteLine,
  orderRotation,
  ownSite,
  siteChoices,
  siteDate,
  toggleSite,
  type InjectionSite,
  type SiteUse,
} from '../lib/injectionSites';
import { recordSite, removeSiteUse, saveInjectionSetting, type InjectionSetting } from '../lib/injectionSitesDb';
import { ThumbEndRow } from './ThumbEndRow';

type Props = {
  treatmentId: string;
  name: string;
  genericName: string | null;
  setting: InjectionSetting | undefined;
  history: SiteUse[];
  today: string;
  tabColor: string;
  onSaved: () => void;
  onProblem: (title: string, message: string) => void;
};

const RECENT_SHOWN = 6;

export function InjectionPanel({ treatmentId, name, genericName, setting, history, today, tabColor, onSaved, onProblem }: Props) {
  const styles = makeStyles(tabColor);
  const [mode, setMode] = useState<'view' | 'record' | 'rotation'>('view');
  const [ownText, setOwnText] = useState('');
  const match = matchInjectable(name, genericName);
  const injected = isInjected(setting?.injected ?? null, match);
  const rotation = setting?.rotation ?? defaultRotation();

  async function save(next: InjectionSetting) {
    try {
      await saveInjectionSetting(treatmentId, next);
      onSaved();
    } catch (error) {
      onProblem('Could not save', error instanceof Error ? error.message : String(error));
    }
  }

  async function note(site: InjectionSite) {
    try {
      await recordSite({ treatmentId, site });
      setMode('view');
      onSaved();
    } catch (error) {
      onProblem('Could not save', error instanceof Error ? error.message : String(error));
    }
  }

  async function takeBack(use: SiteUse) {
    try {
      await removeSiteUse(use.id);
      onSaved();
    } catch (error) {
      onProblem('Could not remove', error instanceof Error ? error.message : String(error));
    }
  }

  function addOwn() {
    const site = ownSite(ownText);
    if (!site) {
      onProblem('Almost there', 'Type the spot the way you would say it, like "Lower belly, left of the scar".');
      return;
    }
    if (rotation.some((s) => s.key === site.key)) {
      setOwnText('');
      return;
    }
    setOwnText('');
    void save({ injected: true, rotation: orderRotation([...rotation, site]) });
  }

  const ownInRotation = rotation.filter(isOwnSite);

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Injection sites</Text>
      <Text style={styles.bodyText}>{matchLine(match, injected)}</Text>
      <TouchableOpacity onPress={() => void save({ injected: !injected, rotation: setting?.rotation ?? null })}>
        <Text style={styles.actionText}>{injected ? 'This is not a shot: turn sites off' : 'This is a shot: keep a site record'}</Text>
      </TouchableOpacity>
      {injected ? (
        <>
          <Text style={styles.stepText}>{INJECTION_LEAD}</Text>
          {nextSiteLine(rotation, history) ? <Text style={styles.bodyEmphasis}>{nextSiteLine(rotation, history)}</Text> : null}
          <Text style={styles.bodyText}>{lastSiteLine(history, today)}</Text>
          {history.slice(0, RECENT_SHOWN).map((use) => (
            <ThumbEndRow key={use.id} style={styles.inlineRow}>
              <Text style={styles.stepText}>{`${siteDate(use.recordedAt)}: ${use.siteLabel}`}</Text>
              <TouchableOpacity onPress={() => void takeBack(use)} accessibilityLabel={`Take back the shot noted ${siteDate(use.recordedAt)}`}>
                <Text style={styles.smallAction}>Take back</Text>
              </TouchableOpacity>
            </ThumbEndRow>
          ))}
          {mode === 'record' ? (
            <>
              <Text style={styles.label}>Where did this shot go?</Text>
              <View style={styles.chipRow}>
                {siteChoices(rotation, history).map(({ site, label }) => (
                  <TouchableOpacity key={site.key} style={styles.chip} onPress={() => void note(site)}>
                    <Text style={styles.chipText}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity onPress={() => setMode('view')}>
                <Text style={styles.actionText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : mode === 'rotation' ? (
            <>
              <Text style={styles.label}>Spots in the rotation</Text>
              <Text style={styles.stepText}>Tap a spot to put it in or take it out. Shots already noted keep their spot either way.</Text>
              <View style={styles.chipRow}>
                {[...BUILT_IN_SITES, ...ownInRotation].map((site) => {
                  const on = rotation.some((s) => s.key === site.key);
                  return (
                    <TouchableOpacity
                      key={site.key}
                      style={[styles.chip, on && styles.chipOn]}
                      onPress={() => void save({ injected: true, rotation: toggleSite(rotation, site) })}
                      accessibilityState={{ selected: on }}
                    >
                      <Text style={[styles.chipText, on && styles.chipTextOn]}>{site.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.label}>Add a spot of your own</Text>
              <ThumbEndRow style={styles.inlineRow}>
                <AppTextInput style={[styles.input, styles.flexInput]} value={ownText} onChangeText={setOwnText} placeholder="Lower belly, left of the scar" />
                <TouchableOpacity style={styles.smallButton} onPress={addOwn}>
                  <Text style={styles.smallButtonText}>Add</Text>
                </TouchableOpacity>
              </ThumbEndRow>
              <TouchableOpacity onPress={() => setMode('view')}>
                <Text style={styles.actionText}>Done</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.actions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setMode('rotation')}>
                <Text style={styles.secondaryButtonText}>Change the spots</Text>
              </TouchableOpacity>
              {rotation.length ? (
                <TouchableOpacity style={styles.primaryButton} onPress={() => setMode('record')}>
                  <Text style={styles.primaryButtonText}>Note a shot</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        </>
      ) : null}
    </View>
  );
}

function makeStyles(tabColor: string) {
  return StyleSheet.create({
    actionText: { ...typography.captionEmphasis, color: tabColor, marginTop: 6, ...textShadow },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 10, marginTop: 10 },
    bodyEmphasis: { ...typography.bodyEmphasis, color: tabColor, marginTop: 6, ...textShadow },
    bodyText: { ...typography.body, color: tabColor, ...textShadow },
    chip: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: tabColor,
      backgroundColor: colors.surface,
    },
    chipOn: { backgroundColor: tabColor },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    chipText: { ...typography.caption, color: tabColor, ...textShadow },
    chipTextOn: { color: colors.textOnButton, textShadowColor: 'transparent', textShadowRadius: 0 },
    flexInput: { flex: 1, minWidth: 140 },
    heading: { ...typography.captionEmphasis, color: tabColor, marginBottom: 4, ...textShadow },
    inlineRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.surface,
      ...typography.body,
      color: tabColor,
      ...textShadow,
    },
    label: { ...typography.label, color: tabColor, marginBottom: 6, marginTop: 10, ...textShadow },
    primaryButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: colors.buttonColor, ...BUTTON_SHADOW },
    primaryButtonText: {
      ...typography.bodyEmphasis,
      color: colors.textOnButton,
      textShadowColor: 'transparent',
      textShadowRadius: 0,
    },
    secondaryButton: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    secondaryButtonText: { ...typography.bodyEmphasis, color: tabColor, ...textShadow },
    section: { gap: 2, marginTop: 12 },
    smallAction: { ...typography.caption, color: tabColor, textDecorationLine: 'underline', ...textShadow },
    smallButton: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: tabColor,
      backgroundColor: colors.surface,
    },
    smallButtonText: { ...typography.captionEmphasis, color: tabColor, ...textShadow },
    stepText: { ...typography.caption, color: tabColor, ...textShadow },
  });
}
