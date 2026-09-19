import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { menuLabelShadow, textShadow, typography } from '../constants/typography';
import { useConfirmSheet } from './ConfirmSheet';
import { resolvePhotoTarget } from './EntryPhotoSection';
import { useInfoAlert } from './InfoAlert';
import { PopoverSelect } from './PopoverSelect';
import {
  deleteFavorite,
  getUserProfile,
  scheduleMeal,
  scheduleSingleComponent,
  type BuilderFavoriteItemType,
} from '../lib/db';
import type { DigestEntry } from '../lib/digest/types';
import { getPhotoForTarget } from '../lib/mealPhotos';
import { shareFileIfAvailable } from '../lib/nativeSharing';
import {
  deleteSharedRecipe,
  encodeMealShareLink,
  encodeShareLink,
  promoteSharedRecipeToFavorite,
  promoteSharedRecipeToSaved,
  writeIsFileForComponent,
  writeIsFileForMeal,
} from '../lib/sharing';
import { buildTime24, formatTime12 } from '../lib/timeOfDay';

// 2026-08-15, Schedule/Share actions for a person's saved and favorited
// recipes, direct request: "All items should be available to be added to
// the schedule from here on anytime in the future... there should be a way
// to share the recipes... to anyone else who has this app, or in a textual
// sort of way through messaging." Only ever rendered for an entry that
// carries a dynamicAction (see lib/digestDynamicEntries.ts).
//
// Lifted out of app/(tabs)/purple-digest.tsx on 2026-09-18, when My
// Recipes moved to the Food tab ("I would like the System recipes from
// Digest to move to Food on the Food page"), so the buttons travel with
// the recipes instead of being left behind on a tab that no longer lists
// them. Every colour it paints comes in as tabColor, so the same code
// reads as Food's green there and the Digest's purple wherever the Digest
// still uses it.
const DYNAMIC_ENTRY_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'beverage', 'salad', 'smoothie'];
// Today through 2 years out: generous enough for "anytime in the future"
// without an unbounded list; matches Profile's BIRTH_DAY_OPTIONS
// convention of a flat 1-31 day list with no days-in-month validation (an
// invalid combination like Feb 30 rolls forward via the JS Date
// constructor's overflow behavior, the same accepted quirk Profile's date
// fields already carry).
// A stable module-level constant, computed once at import time, not a
// function called fresh in JSX on every render: PopoverSelect is
// memo()-wrapped, and this app's history already documents in exhaustive
// detail what a fresh array identity on every render does to that memo
// (the Nutrient Ranking freeze investigation).
const FUTURE_YEAR_OPTIONS = Array.from({ length: 3 }, (_, index) => String(new Date().getFullYear() + index));
const SCHEDULE_MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const SCHEDULE_DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => String(index + 1));
const SCHEDULE_HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const SCHEDULE_MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));

// A plain dispatcher, narrowing entry.dynamicAction's three kinds (see
// lib/digest/types.ts) into the right one of two sibling components: a
// not-yet-decided staged share gets its own "try it, then decide" action
// set (SharedRecipeActions), never Schedule/Share; a saved or favorited
// component, or a favorite meal, keeps the Schedule/Share pair
// (SavedOrFavoriteActions).
export function DynamicEntryActions({
  entry,
  tabColor,
  tabTextColor,
  isFavorite,
  onDynamicEntriesChanged,
}: {
  entry: DigestEntry;
  tabColor: string;
  // The same colour read as text on a dark card. The Digest has a
  // lightened variant of its own tab colour for this; Food's green already
  // reads, so it passes the one colour twice.
  tabTextColor: string;
  // Whether this is a favorite rather than a saved record, which decides
  // whether Remove from Favorites appears. The Digest knows it from the
  // category it put the entry in; Food's own list has no categories and
  // says so directly.
  isFavorite?: boolean;
  onDynamicEntriesChanged?: () => void;
}) {
  const action = entry.dynamicAction;
  if (!action) return null;
  if (action.kind === 'shared') {
    return (
      <SharedRecipeActions
        sharedRecipeId={action.sharedRecipeId}
        tabColor={tabColor}
        tabTextColor={tabTextColor}
        onDynamicEntriesChanged={onDynamicEntriesChanged}
      />
    );
  }
  return (
    <SavedOrFavoriteActions
      entry={entry}
      action={action}
      tabColor={tabColor}
      tabTextColor={tabTextColor}
      isFavorite={isFavorite ?? entry.category === 'myFavorites'}
      onDynamicEntriesChanged={onDynamicEntriesChanged}
    />
  );
}

// "Try it, then decide," 2026-08-15 direct request: "It stays there until
// they try it and decide if they want to add it to their own saved
// recipes or as a favorite... if they didn't like the recipe they can just
// delete it." Deliberately no Schedule/Share here: there is nothing to
// schedule or re-share until the person has decided what to do with a
// share someone else sent them.
function SharedRecipeActions({
  sharedRecipeId,
  tabColor,
  tabTextColor,
  onDynamicEntriesChanged,
}: {
  sharedRecipeId: string;
  tabColor: string;
  tabTextColor: string;
  onDynamicEntriesChanged?: () => void;
}) {
  const styles = useMemo(() => makeActionStyles(tabColor, tabTextColor), [tabColor, tabTextColor]);
  const [busy, setBusy] = useState<'saved' | 'favorite' | 'delete' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showInfoAlert, infoAlertElement] = useInfoAlert();

  async function handleSaveToRecipes() {
    setBusy('saved');
    try {
      const result = await promoteSharedRecipeToSaved(sharedRecipeId);
      if (result && result.length > 0) {
        setMessage('Saved to My Recipes, under the tool that makes it.');
        onDynamicEntriesChanged?.();
      }
    } catch (error) {
      console.error('[SharedRecipeActions] Failed to save', error);
      showInfoAlert('Something went wrong', "This couldn't be saved. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function handleSaveAsFavorite() {
    setBusy('favorite');
    try {
      const result = await promoteSharedRecipeToFavorite(sharedRecipeId);
      if (result) {
        setMessage('Saved to your Favorites.');
        onDynamicEntriesChanged?.();
      }
    } catch (error) {
      console.error('[SharedRecipeActions] Failed to save as favorite', error);
      showInfoAlert('Something went wrong', "This couldn't be saved. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    setBusy('delete');
    try {
      await deleteSharedRecipe(sharedRecipeId);
      onDynamicEntriesChanged?.();
    } catch (error) {
      console.error('[SharedRecipeActions] Failed to delete', error);
      showInfoAlert('Something went wrong', "This couldn't be deleted. Please try again.");
      setBusy(null);
    }
  }

  return (
    <View>
      {infoAlertElement}
      <View style={styles.dynamicActionRow}>
        <TouchableOpacity style={styles.dynamicActionButton} activeOpacity={0.85} onPress={handleSaveToRecipes} disabled={busy !== null}>
          <Ionicons name="bookmark-outline" size={16} color={tabColor} />
          <Text style={styles.dynamicActionButtonText}>{busy === 'saved' ? 'Saving…' : 'Save to My Recipes'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dynamicActionButton} activeOpacity={0.85} onPress={handleSaveAsFavorite} disabled={busy !== null}>
          <Ionicons name="heart-outline" size={16} color={tabColor} />
          <Text style={styles.dynamicActionButtonText}>{busy === 'favorite' ? 'Saving…' : 'Save as Favorite'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dynamicActionButton} activeOpacity={0.85} onPress={handleDelete} disabled={busy !== null}>
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
          <Text style={[styles.dynamicActionButtonText, styles.dynamicActionButtonTextDanger]}>
            {busy === 'delete' ? 'Deleting…' : 'Delete'}
          </Text>
        </TouchableOpacity>
      </View>
      {message ? <Text style={styles.dynamicActionConfirm}>{message}</Text> : null}
    </View>
  );
}

function SavedOrFavoriteActions({
  entry,
  action,
  tabColor,
  tabTextColor,
  isFavorite,
  onDynamicEntriesChanged,
}: {
  entry: DigestEntry;
  action: { kind: 'component'; componentType: BuilderFavoriteItemType; componentId: string } | { kind: 'meal'; mealFavoriteId: string };
  tabColor: string;
  tabTextColor: string;
  isFavorite: boolean;
  onDynamicEntriesChanged?: () => void;
}) {
  const styles = useMemo(() => makeActionStyles(tabColor, tabTextColor), [tabColor, tabTextColor]);
  const today = useMemo(() => new Date(), []);
  const [schedulingOpen, setSchedulingOpen] = useState(false);
  const [scheduleMealType, setScheduleMealType] = useState<string | null>(null);
  const [scheduleYear, setScheduleYear] = useState(String(today.getFullYear()));
  const [scheduleMonth, setScheduleMonth] = useState(String(today.getMonth() + 1));
  const [scheduleDay, setScheduleDay] = useState(String(today.getDate()));
  const [scheduleHour, setScheduleHour] = useState('');
  const [scheduleMinute, setScheduleMinute] = useState('');
  const [scheduleAmpm, setScheduleAmpm] = useState<'AM' | 'PM' | ''>('');
  const [scheduling, setScheduling] = useState(false);
  const [scheduledMessage, setScheduledMessage] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [confirmSheet, confirmSheetElement] = useConfirmSheet();

  async function handleConfirmSchedule() {
    if (!scheduleMealType || !scheduleYear || !scheduleMonth || !scheduleDay) return;
    // Hour/minute/AM-PM are optional: an honest noon default rather than
    // forcing a time nobody asked to specify. buildTime24 already returns
    // null for an incomplete answer (see its own comment), which this
    // treats as "no time given" rather than an error.
    const time24 = buildTime24(scheduleHour, scheduleMinute, scheduleAmpm) ?? '12:00';
    const pad2 = (value: string) => value.padStart(2, '0');
    const scheduledFor = `${scheduleYear.padStart(4, '0')}-${pad2(scheduleMonth)}-${pad2(scheduleDay)}T${time24}`;

    setScheduling(true);
    try {
      if (action.kind === 'meal') {
        await scheduleMeal({
          title: entry.title,
          mealType: scheduleMealType,
          scheduledFor,
          sourceFavoriteId: action.mealFavoriteId,
        });
      } else {
        await scheduleSingleComponent({
          componentType: action.componentType,
          componentId: action.componentId,
          title: entry.title,
          mealType: scheduleMealType,
          scheduledFor,
        });
      }
      setScheduledMessage(
        `Scheduled for ${scheduleMonth}/${scheduleDay}/${scheduleYear}${
          scheduleHour ? ` at ${formatTime12(time24)}` : ''
        }. Find it on the Schedule tab's Meals lens.`,
      );
      setSchedulingOpen(false);
    } catch (error) {
      console.error('[DynamicEntryActions] Failed to schedule', error);
      showInfoAlert('Something went wrong', "This couldn't be scheduled. Please try again.");
    } finally {
      setScheduling(false);
    }
  }

  async function handleShare() {
    setSharing(true);
    try {
      const profile = await getUserProfile();
      const fromName = profile.firstName?.trim() || 'A friend';
      const link =
        action.kind === 'meal'
          ? await encodeMealShareLink(action.mealFavoriteId, fromName)
          : await encodeShareLink(action.componentType, action.componentId, fromName);
      if (!link) {
        showInfoAlert('Nothing to share', "This couldn't be prepared for sharing. Try again once it's fully saved.");
        return;
      }
      // 2026-08-15, on-device report: embedding the deep link in this
      // plain-text message meant everyone, including someone without the
      // app, saw a long, unreadable encoded blob at the bottom of a
      // normal-looking text message. Base64-encoding it (see
      // lib/sharing.ts's encodeEnvelope) made that blob look like an
      // opaque token instead of visibly broken text, but it is still a
      // wall of characters nobody without the app has any use for, and
      // the same day's follow-up named the right fix directly: once
      // device-to-device sharing exists (the Connections list plus an
      // OS-registered .is file format, see CLAUDE.md's security note),
      // THAT is the mechanism for a rich, ready-to-import share reaching
      // someone who has the app. Plain text is just plain text, for
      // anyone, with nothing hidden in it. `link` above is still built and
      // checked (it confirms this is shareable before bothering the OS
      // share sheet), just never shown: the envelope/base64 encoding it
      // produces is what the .is file reuses, written to a file instead of
      // embedded in a URL.
      const ingredientLines = (entry.recipeCard?.ingredients ?? []).map((ingredient) => ingredient.text).join('\n');
      const message = [entry.title, entry.recipeCard?.yield ?? '', ingredientLines, `Shared from Inside Story by ${fromName}.`]
        .filter(Boolean)
        .join('\n\n');
      // Step 6, 2026-08-15: the .is file the comment block above named as
      // "the right fix" now exists (see lib/sharing.ts's writeIsFile and
      // app.json's android.intentFilters). Preferred over the plain photo
      // below since the photo already travels embedded inside the .is
      // file's content, matching what a deep-link share already does.
      // Anyone without the app sees exactly the same plain message either
      // way: the .is file (like the deep link before it) is inert to them.
      //
      // Two separate native actions, not one combined share, 2026-08-16.
      // See lib/nativeSharing.ts's header comment for the confirmed
      // reason: React Native's core Share module silently drops its `url`
      // field on Android before it ever reaches native code, so a combined
      // `{message, url}` call was never attaching this file on Android at
      // all, only ever sending the plain message. Share.share({message})
      // still fires first, unconditionally, since that half already worked
      // correctly, then shareFileIfAvailable offers the attachment as its
      // own second step.
      const isFileUri =
        action.kind === 'meal'
          ? await writeIsFileForMeal(action.mealFavoriteId, fromName)
          : await writeIsFileForComponent(action.componentType, action.componentId, fromName);
      const photoTarget = resolvePhotoTarget(entry);
      const photoUri = !isFileUri && photoTarget ? await getPhotoForTarget(photoTarget) : null;
      const attachmentUri = isFileUri ?? photoUri;
      await Share.share({ message });
      if (attachmentUri) {
        await shareFileIfAvailable(attachmentUri, {
          mimeType: isFileUri ? '*/*' : 'image/jpeg',
          dialogTitle: isFileUri ? 'Share this' : 'Share this photo',
        });
      }
    } catch (error) {
      console.error('[DynamicEntryActions] Failed to share', error);
      showInfoAlert('Something went wrong', "This couldn't be shared. Please try again.");
    } finally {
      setSharing(false);
    }
  }

  // 2026-08-21, direct report: "Once I add a prebuilt item... it ends up
  // in My Favorites, there doesn't appear to be a way to remove it from my
  // favorites for any reason I might have to do that. There should always
  // be a way to do that." This component is shared by saved items and
  // favorites alike: Schedule and Share make sense for either, but this
  // third button only makes sense for a favorite (see the isFavorite guard
  // on the button itself below), not a saved builder record. Same
  // confirmSheet pattern the favorite-delete flow in My Recipes already
  // uses, for the same "this cannot be undone" reason: a favorite's
  // ingredient list lives only in its payload_json (see
  // lib/digestDynamicEntries.ts's header comment), not tied to a
  // still-existing saved record elsewhere that could rebuild it.
  async function handleRemoveFavorite() {
    const ok = await confirmSheet({
      title: `Remove "${entry.title}" from Favorites?`,
      message: 'This cannot be undone.',
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (!ok) return;
    setRemoving(true);
    try {
      await deleteFavorite(action.kind === 'meal' ? action.mealFavoriteId : action.componentId);
      onDynamicEntriesChanged?.();
    } catch (error) {
      console.error('[DynamicEntryActions] Failed to remove favorite', error);
      showInfoAlert('Something went wrong', "This couldn't be removed. Please try again.");
      setRemoving(false);
    }
  }


  return (
    <View>
      {infoAlertElement}
      {confirmSheetElement}
      <View style={styles.dynamicActionRow}>
        <TouchableOpacity
          style={styles.dynamicActionButton}
          activeOpacity={0.85}
          onPress={() => setSchedulingOpen((open) => !open)}
          disabled={removing}
        >
          <Ionicons name="calendar-outline" size={16} color={tabColor} />
          <Text style={styles.dynamicActionButtonText}>Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dynamicActionButton} activeOpacity={0.85} onPress={handleShare} disabled={sharing || removing}>
          <Ionicons name="share-outline" size={16} color={tabColor} />
          <Text style={styles.dynamicActionButtonText}>{sharing ? 'Preparing…' : 'Share'}</Text>
        </TouchableOpacity>
        {isFavorite ? (
          <TouchableOpacity style={styles.dynamicActionButton} activeOpacity={0.85} onPress={handleRemoveFavorite} disabled={removing}>
            <Ionicons name="heart-dislike-outline" size={16} color={colors.danger} />
            <Text style={[styles.dynamicActionButtonText, styles.dynamicActionButtonTextDanger]}>
              {removing ? 'Removing…' : 'Remove from Favorites'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {scheduledMessage ? <Text style={styles.dynamicActionConfirm}>{scheduledMessage}</Text> : null}

      {schedulingOpen ? (
        <View style={styles.dynamicScheduleForm}>
          <Text style={styles.detailLabel}>Meal type</Text>
          <PopoverSelect
            options={DYNAMIC_ENTRY_MEAL_TYPES}
            selected={scheduleMealType}
            onSelect={setScheduleMealType}
            tabColor={tabColor}
            placeholder="Choose"
          />

          <Text style={styles.detailLabel}>Date</Text>
          <View style={styles.dynamicScheduleRow}>
            <PopoverSelect options={FUTURE_YEAR_OPTIONS} selected={scheduleYear} onSelect={setScheduleYear} tabColor={tabColor} minWidth={64} />
            <PopoverSelect options={SCHEDULE_MONTH_OPTIONS} selected={scheduleMonth} onSelect={setScheduleMonth} tabColor={tabColor} minWidth={44} />
            <PopoverSelect options={SCHEDULE_DAY_OPTIONS} selected={scheduleDay} onSelect={setScheduleDay} tabColor={tabColor} minWidth={44} />
          </View>

          <Text style={styles.detailLabel}>Time (optional, defaults to noon)</Text>
          <View style={styles.dynamicScheduleRow}>
            <PopoverSelect
              options={SCHEDULE_HOUR_OPTIONS}
              selected={scheduleHour}
              onSelect={setScheduleHour}
              tabColor={tabColor}
              minWidth={44}
              placeholder="Hr"
            />
            <PopoverSelect
              options={SCHEDULE_MINUTE_OPTIONS}
              selected={scheduleMinute}
              onSelect={setScheduleMinute}
              tabColor={tabColor}
              minWidth={44}
              placeholder="Min"
            />
            <View style={styles.ampmRow}>
              {(['AM', 'PM'] as const).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.ampmPill, scheduleAmpm === option ? styles.ampmPillActive : null]}
                  activeOpacity={0.85}
                  onPress={() => setScheduleAmpm(scheduleAmpm === option ? '' : option)}
                >
                  <Text style={[styles.ampmPillText, scheduleAmpm === option ? styles.ampmPillTextActive : null]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.confirmButton, !scheduleMealType || scheduling ? styles.confirmButtonDisabled : null]}
            activeOpacity={0.85}
            onPress={handleConfirmSchedule}
            disabled={!scheduleMealType || scheduling}
          >
            <Text style={styles.confirmButtonText}>{scheduling ? 'Scheduling…' : 'Confirm'}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

// A StyleSheet cannot take a colour argument, so the two that vary are
// bound here and the result memoised per tab, the same shape
// components/RecipeDetailCard.tsx already uses.
function makeActionStyles(tabColor: string, tabTextColor: string) {
  return StyleSheet.create({
    detailLabel: { ...typography.eyebrow, ...textShadow, fontWeight: '400', color: tabTextColor, marginTop: 8, marginBottom: 2 },
    // A lighter touch than a solid fill, since these are co-equal
    // secondary actions sitting side by side rather than the one
    // unambiguous CTA a curated recipe's "Build This Recipe" button is.
    dynamicActionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
    dynamicActionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: tabColor,
      borderRadius: 10,
      paddingVertical: 10,
    },
    dynamicActionButtonText: { ...typography.bodyEmphasis, ...menuLabelShadow, fontWeight: '400', color: tabTextColor },
    dynamicActionButtonTextDanger: { color: colors.danger },
    dynamicActionConfirm: { ...typography.caption, color: colors.accent, marginTop: 8, ...textShadow },
    dynamicScheduleForm: {
      marginTop: 12,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    dynamicScheduleRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    ampmRow: { flexDirection: 'row', gap: 6 },
    ampmPill: {
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    ampmPillActive: { backgroundColor: tabColor, borderColor: tabColor },
    ampmPillText: { ...typography.caption, color: colors.textSecondary, ...textShadow },
    ampmPillTextActive: {
      color: colors.background,
      // Dark text: cancel any shadow inherited from a base style it is
      // composed with. See constants/typography.ts.
      textShadowColor: 'transparent',
      textShadowRadius: 0,
    },
    confirmButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: tabColor,
      borderRadius: 10,
      paddingVertical: 12,
      marginTop: 12,
    },
    confirmButtonText: {
      ...typography.bodyEmphasis,
      color: colors.background,
      textShadowColor: 'transparent',
      textShadowRadius: 0,
    },
    confirmButtonDisabled: { opacity: 0.5 },
  });
}
