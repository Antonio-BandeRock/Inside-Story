import { useCallback, useMemo, useState } from 'react';
import { Linking, Platform, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { isDesktopApp } from '../lib/desktop/bridge';
import { useFocusEffect } from '@react-navigation/native';
import { AppActionSheet, type AppActionSheetAction } from './AppActionSheet';
import { AppTextInput } from './AppTextInput';
import { NotesInput } from './NotesInput';
import { useInfoAlert } from './InfoAlert';
import { TabBand, makeTabBandStyles } from './TabBand';
import { useBandFolds } from '../hooks/useBandFolds';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import {
  DIRECTIVE_NOTE,
  ESSENTIALS_IN_ORDER,
  NOT_A_MEDICAL_ALERT,
  buildEmergencyCard,
  describeFreshness,
  describeMissing,
  freshness,
  missingEssentials,
  type EmergencyContact,
  type EmergencyFromApp,
  type EmergencyProfile,
} from '../lib/emergency';
import {
  confirmEmergencyProfile,
  deleteEmergencyContact,
  gatherFromApp,
  getEmergencyProfile,
  listEmergencyContacts,
  saveEmergencyProfile,
  upsertEmergencyContact,
} from '../lib/emergencyDb';
import { useWalkMark } from './WalkMark';
import {
  LOCK_SCREEN_PARTS,
  LOCK_SCREEN_WARNING,
  buildWalletCardHtml,
  medicalIdEntries,
  medicalIdWhere,
  type LockScreenPart,
} from '../lib/emergencyOutside';
import {
  askLockScreenPermission,
  getLockScreenParts,
  lockScreenSupported,
  refreshLockScreenNotice,
  setLockScreenParts,
} from '../lib/emergencyLockScreen';
import { exportHtmlAsPdf } from '../lib/reportPdf';
import { confirmItsYou } from '../lib/freshAuth';
import { dialable } from '../lib/medSupply';
import { copyLine, textNumber } from '../lib/phoneReach';
import { CAN_PICK_CONTACTS, pickContact } from '../lib/contactPick';

// Emergency & Essentials: what someone else needs to know when you cannot tell
// them. Life's fifth area, 2026-09-05.
//
// THE WARNING GOES FIRST, ABOVE EVERYTHING, AND IT IS NOT DISMISSIBLE.
//
// An app on a locked phone is not reachable by a paramedic. If someone comes
// away from this screen thinking it replaces a bracelet or the medical ID screen their phone
// already has, they have been made worse off. So the first thing on the screen
// says exactly that, in plain words, before the card or any field.
//
// The screen has three jobs after that: hold the one field nothing else in the
// app holds (drug allergies), say how old the card is, and produce something
// that can actually be handed to a person.

type Props = { tabColor: string };

function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type ContactForm = {
  id: string | null;
  name: string;
  relationship: string;
  phone: string;
  primary: boolean;
  notes: string;
};

function blankContact(): ContactForm {
  return { id: null, name: '', relationship: '', phone: '', primary: false, notes: '' };
}

// One row per field, so the form is a list rather than fourteen hand-written
// blocks that drift apart. The order is the order the card prints in, not the order the
// columns happen to sit in.
const PROFILE_FIELDS: {
  key: keyof Omit<EmergencyProfile, 'confirmedAt'>;
  label: string;
  placeholder: string;
  hint?: string;
  multiline?: boolean;
}[] = [
  {
    key: 'drugAllergies',
    label: 'Drug allergies',
    placeholder: 'Penicillin (anaphylaxis), sulfa drugs (rash)',
    hint: 'The most important thing on this screen, and the only thing here the app has nowhere else to keep. Your food allergies are recorded separately and are not the same thing. Write it exactly as you would say it out loud, including what happens.',
    multiline: true,
  },
  {
    key: 'devices',
    label: 'Implants or devices',
    placeholder: 'Insulin pump, left abdomen',
    hint: 'A pacemaker, a pump, a port, a stent, metal in a joint. Changes which scans are safe.',
  },
  {
    key: 'language',
    label: 'Languages you can be spoken to in',
    placeholder: 'English, some Spanish',
  },
  { key: 'bloodType', label: 'Blood type', placeholder: 'O+' },
  { key: 'doctorName', label: 'Your doctor', placeholder: 'Dr Alvarez' },
  { key: 'doctorPhone', label: 'Their number', placeholder: '555-0134' },
  { key: 'preferredHospital', label: 'Hospital you would rather go to', placeholder: 'San Javier' },
  {
    key: 'directiveLocation',
    label: 'Where an advance directive is kept',
    placeholder: 'Filing cabinet, top drawer',
    hint: DIRECTIVE_NOTE,
  },
  {
    key: 'otherNotes',
    label: 'Anything else someone should know',
    placeholder: 'Hard of hearing on the right.',
    multiline: true,
  },
];

export function EmergencySection({ tabColor }: Props) {
  // The outline on a button a Your Story walk line names (components/WalkMark.ts).
  const walkMark = useWalkMark();
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [profile, setProfile] = useState<EmergencyProfile | null>(null);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [fromApp, setFromApp] = useState<EmergencyFromApp | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Partial<EmergencyProfile> | null>(null);
  const [contactForm, setContactForm] = useState<ContactForm | null>(null);
  // Which Medical ID line was copied last, so its button says Copied.
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showCard, setShowCard] = useState(false);
  const [lockParts, setLockParts] = useState<LockScreenPart[]>([]);
  const [lockPicking, setLockPicking] = useState<LockScreenPart[] | null>(null);
  const [printing, setPrinting] = useState(false);
  const [confirm, setConfirm] = useState<{ title: string; message?: string; actions: AppActionSheetAction[] } | null>(null);

  const styles = useMemo(() => makeStyles(tabColor), [tabColor]);
  const band = useMemo(() => makeTabBandStyles(tabColor), [tabColor]);
  const folds = useBandFolds();

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([getEmergencyProfile(), listEmergencyContacts(), gatherFromApp(), getLockScreenParts()])
      .then(([p, c, a, parts]) => {
        setProfile(p);
        setContacts(c);
        setFromApp(a);
        setLockParts(parts);
        // Whatever was just saved reaches the lock screen too (A19).
        if (parts.length > 0) void refreshLockScreenNotice();
      })
      .catch((error) => showInfoAlert('Could not load', error instanceof Error ? error.message : String(error)))
      .finally(() => setLoading(false));
  }, [showInfoAlert]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const fresh = useMemo(
    () => freshness(profile?.confirmedAt ?? null, todayLocal()),
    [profile?.confirmedAt],
  );

  const gaps = useMemo(
    () =>
      profile && fromApp
        ? missingEssentials({ profile, fromApp, contactCount: contacts.length })
        : [],
    [profile, fromApp, contacts.length],
  );

  const card = useMemo(
    () =>
      profile && fromApp
        ? buildEmergencyCard({ profile, fromApp, contacts, today: todayLocal() })
        : '',
    [profile, fromApp, contacts],
  );

  const medicalId = useMemo(
    () => (profile && fromApp ? medicalIdEntries({ profile, fromApp, contacts, today: todayLocal() }) : []),
    [profile, fromApp, contacts],
  );

  function callContact(phone: string) {
    const number = dialable(phone);
    if (!number) return;
    Linking.openURL(`tel:${number}`).catch(() =>
      showInfoAlert('Nothing to call with', `This device could not open a call. The number is ${phone}.`),
    );
  }

  async function textContact(phone: string) {
    const outcome = await textNumber(phone);
    if (!outcome.ok) showInfoAlert('Nothing to text with', outcome.reason);
  }

  async function fillContactFromPhone() {
    const outcome = await pickContact();
    if (outcome.kind === 'problem') showInfoAlert('Could not open contacts', outcome.reason);
    if (outcome.kind !== 'picked') return;
    const picked = outcome.contact;
    setContactForm((form) =>
      form ? { ...form, name: picked.name || form.name, phone: picked.phone || form.phone } : form,
    );
  }

  async function copyMedicalIdLine(field: string, value: string) {
    if (await copyLine(value)) {
      setCopiedField(field);
    } else {
      showInfoAlert('Could not copy', 'This device would not take the line. Share sends it to another app instead.');
    }
  }

  function openPhoneSettings() {
    const fallback = () => Linking.openSettings().catch(() => undefined);
    if (Platform.OS === 'android') {
      Linking.sendIntent('android.settings.SETTINGS').catch(fallback);
    } else {
      fallback();
    }
  }

  async function printWalletCard() {
    if (!profile || !fromApp) return;
    if (!(await confirmItsYou('Before the card is made'))) return;
    setPrinting(true);
    try {
      const html = buildWalletCardHtml({ profile, fromApp, contacts, today: todayLocal() });
      const result = await exportHtmlAsPdf(html, `inside-story-emergency-card-${todayLocal()}`, 'Share the wallet card');
      if (result.status === 'failed') showInfoAlert('Could not make the card', result.message);
      else if (result.status === 'savedOnly') showInfoAlert('Card made', 'This device has nothing to share it with, so it was kept in the app.');
    } finally {
      setPrinting(false);
    }
  }

  async function saveLockScreen(parts: LockScreenPart[]) {
    if (parts.length > 0 && !(await askLockScreenPermission())) {
      showInfoAlert(
        'Notifications are off',
        "The lines go on the lock screen as a notification, and this phone has notifications from Inside Story turned off. Turn them on in the phone's settings and try again.",
      );
      return;
    }
    await setLockScreenParts(parts);
    setLockParts(parts);
    setLockPicking(null);
  }

  async function saveProfile() {
    if (!editing) return;
    await saveEmergencyProfile(editing);
    setEditing(null);
    load();
  }

  async function saveContact() {
    if (!contactForm) return;
    if (!contactForm.name.trim()) {
      showInfoAlert('Almost there', 'A name, so whoever reads this knows who they are calling.');
      return;
    }
    if (!contactForm.phone.trim()) {
      showInfoAlert('Almost there', 'A number. A name with no number is not someone anybody can reach.');
      return;
    }
    await upsertEmergencyContact({
      id: contactForm.id ?? undefined,
      name: contactForm.name,
      relationship: contactForm.relationship,
      phone: contactForm.phone,
      primary: contactForm.primary,
      notes: contactForm.notes,
    });
    setContactForm(null);
    load();
  }

  if (loading || !profile || !fromApp) {
    return <View style={band.boxMuted}><Text style={styles.bodyText}>Loading…</Text></View>;
  }

  const draft = editing ?? {};
  const valueFor = (key: keyof Omit<EmergencyProfile, 'confirmedAt'>) =>
    (editing ? draft[key] : profile[key]) ?? '';

  return (
    <View style={band.column}>
      {infoAlertElement}
      <AppActionSheet
        visible={confirm !== null}
        title={confirm?.title ?? ''}
        message={confirm?.message}
        actions={confirm?.actions ?? []}
        onClose={() => setConfirm(null)}
      />

      {/* Not a card among cards, and deliberately not dismissible. Everything
          below it is only safe to build on top of this being read. */}
      <View style={[band.box, styles.warningCard]}>
        <Text style={styles.warningTitle}>This is not a medical alert</Text>
        <Text style={styles.warningText}>{NOT_A_MEDICAL_ALERT}</Text>
      </View>

      <TabBand folds={folds} color={tabColor} id="life:emergency:how-old-this-is" title="How old this is" icon="medkit-outline">
        <Text style={[styles.bodyText, fresh.stale ? styles.warn : null]}>{describeFreshness(fresh)}</Text>
        <Text style={styles.helperText}>
          Confirming means going through the whole thing and saying it is still right. It is a
          separate act from editing a field, so changing your hospital does not quietly declare a
          six-month-old medication list current.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            setConfirm({
              title: 'All of this still right?',
              message:
                'Read down the card first, medications especially. Confirming records today as the day you checked it, and that date goes onto the card itself so whoever reads it knows how old it is.',
              actions: [
                {
                  label: 'Yes, it is right',
                  onPress: async () => {
                    setConfirm(null);
                    await confirmEmergencyProfile();
                    load();
                  },
                },
                { label: 'Let me check', onPress: () => setConfirm(null) },
              ],
            })
          }
        >
          <Text style={styles.primaryButtonText}>I have checked it</Text>
        </TouchableOpacity>
      </TabBand>

      {gaps.length > 0 ? (
        <TabBand folds={folds} color={tabColor} id="life:emergency:still-empty" title="Still empty" icon="medkit-outline">
          <Text style={styles.bodyText}>{describeMissing(gaps)}</Text>
          <Text style={styles.helperText}>
            Listed by how much each one actually matters rather than in the order the fields sit
            in, because they are nowhere near equally useful.
          </Text>
          {gaps.map((gap) => (
            <View key={gap.code} style={styles.row}>
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle}>{gap.label}</Text>
                <Text style={styles.rowMeta}>{gap.why}</Text>
              </View>
            </View>
          ))}
        </TabBand>
      ) : null}

      {/* Contacts first among the editable parts. One name and one number is
          the difference between a card and a piece of paper. */}
      <TabBand folds={folds} color={tabColor} id="life:emergency:who-to-call" title="Who to call" icon="medkit-outline">
        {contacts.length === 0 ? (
          <Text style={styles.bodyText}>
            Nobody yet. One person who would answer their phone and knows enough to speak for you
            is worth more than everything else on this screen put together.
          </Text>
        ) : (
          contacts.map((contact) => (
            <View key={contact.id} style={styles.row}>
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle}>
                  {contact.name}
                  {contact.relationship ? ` (${contact.relationship})` : ''}
                </Text>
                <Text style={styles.rowMeta}>
                  {contact.phone}
                  {contact.primary ? ' · try first' : ''}
                </Text>
                {contact.notes ? <Text style={styles.rowMeta}>{contact.notes}</Text> : null}
                <View style={styles.rowActions}>
                  {Platform.OS !== 'web' && dialable(contact.phone) ? (
                    <>
                      <TouchableOpacity onPress={() => callContact(contact.phone)} accessibilityLabel={`Call ${contact.name}`}>
                        <Text style={styles.actionText}>Call</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => void textContact(contact.phone)} accessibilityLabel={`Text ${contact.name}`}>
                        <Text style={styles.actionText}>Text</Text>
                      </TouchableOpacity>
                    </>
                  ) : null}
                  <TouchableOpacity
                    onPress={() =>
                      setContactForm({
                        id: contact.id,
                        name: contact.name,
                        relationship: contact.relationship ?? '',
                        phone: contact.phone,
                        primary: contact.primary,
                        notes: contact.notes ?? '',
                      })
                    }
                  >
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      setConfirm({
                        title: `Remove ${contact.name}?`,
                        actions: [
                          {
                            label: 'Remove',
                            destructive: true,
                            onPress: async () => {
                              setConfirm(null);
                              await deleteEmergencyContact(contact.id);
                              load();
                            },
                          },
                          { label: 'Keep them', onPress: () => setConfirm(null) },
                        ],
                      })
                    }
                  >
                    <Text style={styles.actionTextRemove}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}

        {contactForm ? (
          <View style={styles.inlineForm}>
            {CAN_PICK_CONTACTS ? (
              <TouchableOpacity onPress={() => void fillContactFromPhone()} accessibilityLabel="Pick this person from contacts">
                <Text style={styles.actionText}>Pick from contacts</Text>
              </TouchableOpacity>
            ) : null}
            <Text style={styles.label}>Name</Text>
            <View style={styles.inlineRow}>
              <AppTextInput
                onVoiceResult={(t) => setContactForm({ ...contactForm, name: t })}
                style={[styles.input, { flex: 1 }]}
                placeholder="Tony"
                value={contactForm.name}
                onChangeText={(t) => setContactForm({ ...contactForm, name: t })}
              />
            </View>
            <Text style={styles.label}>How you know them</Text>
            <AppTextInput
              style={styles.input}
              placeholder="Husband, neighbour, sister"
              value={contactForm.relationship}
              onChangeText={(t) => setContactForm({ ...contactForm, relationship: t })}
            />
            <Text style={styles.label}>Number</Text>
            <AppTextInput
              style={[styles.input, styles.shortInput]}
              placeholder="555-0122"
              value={contactForm.phone}
              onChangeText={(t) => setContactForm({ ...contactForm, phone: t })}
            />
            <Text style={styles.label}>Anything worth knowing</Text>
            <NotesInput
              style={styles.input}
              placeholder="Works nights, try the landline first"
              value={contactForm.notes}
              onChangeText={(t) => setContactForm({ ...contactForm, notes: t })}
            />
            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => setContactForm({ ...contactForm, primary: !contactForm.primary })}
            >
              <View style={[styles.checkBox, contactForm.primary ? styles.checkBoxOn : null]}>
                {contactForm.primary ? <Text style={styles.checkMark}>✓</Text> : null}
              </View>
              <Text style={styles.checkLabel}>Try this person first</Text>
            </TouchableOpacity>
            <Text style={styles.helperText}>
              Only one person can be first, so choosing this moves it off whoever had it. A card
              that names two people to try first has not answered the question.
            </Text>
            <View style={styles.formActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setContactForm(null)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={saveContact}>
                <Text style={styles.primaryButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={[styles.primaryButton, walkMark('emergency.addPerson')]} onPress={() => setContactForm(blankContact())}>
            <Text style={styles.primaryButtonText}>Add someone</Text>
          </TouchableOpacity>
        )}
      </TabBand>

      <TabBand folds={folds} color={tabColor} id="life:emergency:what-only-you-can-tell-it" title="What only you can tell it" icon="medkit-outline">
        <Text style={styles.helperText}>
          Your conditions, medications and food allergies are already recorded elsewhere in the app
          and are read straight onto the card, so they are not asked for again here. These are the
          ones the app has nowhere else to keep.
        </Text>

        {PROFILE_FIELDS.map((field) => {
          const value = String(valueFor(field.key));
          return (
            <View key={field.key}>
              <Text style={styles.label}>{field.label}</Text>
              {field.hint ? <Text style={styles.helperText}>{field.hint}</Text> : null}
              {editing ? (
                <NotesInput
                  style={[styles.input, field.multiline ? styles.multilineInput : null]}
                  placeholder={field.placeholder}
                  multiline={field.multiline}
                  value={value}
                  onChangeText={(t) => setEditing({ ...draft, [field.key]: t })}
                />
              ) : (
                <Text style={[styles.bodyText, !value ? styles.rowMeta : null]}>
                  {value || 'Nothing recorded.'}
                </Text>
              )}
            </View>
          );
        })}

        {editing ? (
          <View style={styles.formActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setEditing(null)}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.primaryButton, walkMark('emergency.save')]} onPress={saveProfile}>
              <Text style={styles.primaryButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.primaryButton} onPress={() => setEditing({ ...profile })}>
            <Text style={styles.primaryButtonText}>Edit these</Text>
          </TouchableOpacity>
        )}
      </TabBand>

      <TabBand folds={folds} color={tabColor} id="life:emergency:the-card" title="The card" icon="medkit-outline">
        <Text style={styles.helperText}>
          Everything above, assembled with what the app already holds, as plain text you can read
          off the screen or send to someone. Anything you have not filled in is left out rather than
          printed as blank, so nothing on it can be read as saying you have no allergies.
        </Text>
        <View style={styles.rowActions}>
          <TouchableOpacity onPress={() => setShowCard((prev) => !prev)}>
            <Text style={styles.actionText}>{showCard ? 'Hide it' : 'Show it'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => {
              try {
                await Share.share({ message: card });
              } catch (error) {
                showInfoAlert('Could not share', error instanceof Error ? error.message : String(error));
              }
            }}
          >
            <Text style={styles.actionText}>Send it to someone</Text>
          </TouchableOpacity>
        </View>
        {showCard ? (
          <View style={styles.cardPreview}>
            <Text style={styles.cardPreviewText}>{card}</Text>
          </View>
        ) : null}
        <Text style={styles.helperText}>
          Somewhere it can actually be found matters more than this screen. Written on paper in a
          wallet, or set up on the medical ID screen your phone already has, it is reachable when
          your phone is locked and you are not able to unlock it.
        </Text>
      </TabBand>

      <TabBand folds={folds} color={tabColor} id="life:emergency:medical-id" title="Your phone's Medical ID" icon="medkit-outline">
        <Text style={styles.helperText}>
          Your phone has a screen for this that anyone can open from the lock screen, and this app
          cannot fill it in for you. Here is what goes in each of its fields, laid out under the
          names the phone uses. Copy a line, then paste it across.
        </Text>
        <Text style={styles.helperText}>
          {medicalIdWhere(Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'other')}
        </Text>
        {medicalId.length === 0 ? (
          <Text style={styles.helperText}>Nothing to copy yet. Fill in the bands above first.</Text>
        ) : (
          medicalId.map((entry) => (
            <View key={entry.field} style={styles.row}>
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle}>{entry.field}</Text>
                <Text style={styles.rowMeta} selectable>{entry.value}</Text>
              </View>
              <TouchableOpacity
                onPress={() => void copyMedicalIdLine(entry.field, entry.value)}
                accessibilityLabel={`Copy the ${entry.field} line`}
                style={styles.lineAction}
              >
                <Text style={styles.actionText}>{copiedField === entry.field ? 'Copied' : 'Copy'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => Share.share({ message: entry.value }).catch(() => undefined)}
                accessibilityLabel={`Share the ${entry.field} line`}
              >
                <Text style={styles.actionText}>Share</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
        {Platform.OS !== 'web' ? (
          <View style={styles.rowActions}>
            <TouchableOpacity onPress={openPhoneSettings}>
              <Text style={styles.actionText}>Open the phone&apos;s settings</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </TabBand>

      <TabBand folds={folds} color={tabColor} id="life:emergency:wallet-card" title="A card for your wallet" icon="medkit-outline">
        <Text style={styles.helperText}>
          The same card, printed at the width of a bank card with a front and a back, to cut out and
          fold. Drug allergies and who to call go on the front. A long list makes the card longer
          rather than leaving anything off, and the date it was confirmed is printed on it.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={printWalletCard} disabled={printing}>
          <Text style={styles.primaryButtonText}>{printing ? 'Making the card…' : 'Make the wallet card'}</Text>
        </TouchableOpacity>
      </TabBand>

      {lockScreenSupported() ? (
        <TabBand folds={folds} color={tabColor} id="life:emergency:lock-screen" title="On the lock screen" icon="medkit-outline">
          <Text style={styles.helperText}>
            {lockParts.length > 0
              ? `Showing on this phone's lock screen: ${LOCK_SCREEN_PARTS.filter((p) => lockParts.includes(p.key)).map((p) => p.label.toLowerCase()).join(', ')}.`
              : "Off. Turned on, the lines you pick sit on this phone's lock screen as a notification that cannot be swiped away."}
          </Text>
          <Text style={styles.helperText}>{LOCK_SCREEN_WARNING}</Text>
          {lockPicking ? (
            <View>
              {LOCK_SCREEN_PARTS.map((part) => {
                const on = lockPicking.includes(part.key);
                return (
                  <TouchableOpacity
                    key={part.key}
                    style={styles.checkRow}
                    onPress={() =>
                      setLockPicking(on ? lockPicking.filter((k) => k !== part.key) : [...lockPicking, part.key])
                    }
                  >
                    <View style={[styles.checkBox, on ? styles.checkBoxOn : null]}>
                      {on ? <Text style={styles.checkMark}>✓</Text> : null}
                    </View>
                    <Text style={styles.checkLabel}>{part.label}</Text>
                  </TouchableOpacity>
                );
              })}
              <View style={styles.rowActions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setLockPicking(null)}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={() => saveLockScreen(lockPicking)}>
                  <Text style={styles.primaryButtonText}>
                    {lockPicking.length > 0 ? 'Show these on the lock screen' : 'Turn it off'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.rowActions}>
              <TouchableOpacity onPress={() => setLockPicking([...lockParts])}>
                <Text style={styles.actionText}>{lockParts.length > 0 ? 'Change what shows' : 'Choose what shows'}</Text>
              </TouchableOpacity>
              {lockParts.length > 0 ? (
                <TouchableOpacity onPress={() => saveLockScreen([])}>
                  <Text style={styles.actionText}>Turn it off</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        </TabBand>
      ) : (
        <TabBand folds={folds} color={tabColor} id="life:emergency:lock-screen" title="On the lock screen" icon="medkit-outline">
          <Text style={styles.helperText}>
            {Platform.OS === 'ios' && !isDesktopApp()
              ? "On an Android phone, the lines you pick can sit on the lock screen as a notification that cannot be swiped away. An iPhone does not let an app keep one there, so on an iPhone the Medical ID above is what shows from the lock screen."
              : 'On an Android phone, the lines you pick can sit on the lock screen as a notification that cannot be swiped away. The computer version, Windows or Mac, has no lock screen to put them on, so turn it on from Inside Story on an Android phone.'}
          </Text>
        </TabBand>
      )}

      <TabBand folds={folds} color={tabColor} id="life:emergency:why-the-order-is-what-it-is" title="Why the order is what it is" icon="medkit-outline">
        {ESSENTIALS_IN_ORDER.map((entry, index) => (
          <View key={entry.code} style={styles.row}>
            <View style={styles.rowMain}>
              <Text style={styles.rowTitle}>{`${index + 1}. ${entry.label}`}</Text>
              <Text style={styles.rowMeta}>{entry.why}</Text>
            </View>
          </View>
        ))}
      </TabBand>
    </View>
  );
}

function makeStyles(tabColor: string) {
  return StyleSheet.create({
    // Its own colour, because it is the one thing on this screen that is not a
    // feature. Danger rather than the tab colour: reading it wrong is the
    // failure mode this whole area has to guard against.
    warningCard: { borderColor: colors.danger },
    warningTitle: { ...typography.sectionTitle, color: colors.danger, marginBottom: 8, ...textShadow },
    warningText: { ...typography.body, color: colors.textPrimary, ...textShadow },

    cardTitle: { ...typography.sectionTitle, color: colors.textPrimary, marginBottom: 8, ...textShadow },
    bodyText: { ...typography.body, color: colors.textSecondary, ...textShadow },
    helperText: { ...typography.caption, color: colors.textMuted, marginTop: 6, marginBottom: 4, ...textShadow },
    warn: { color: colors.statusYellowStandalone },

    label: { ...typography.label, color: colors.menuLabelMuted, marginTop: 12, marginBottom: 4, ...textShadow },
    input: {
      backgroundColor: colors.surfaceMuted, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
      paddingHorizontal: 12, paddingVertical: 10, color: colors.textPrimary,
    },
    multilineInput: { minHeight: 72, textAlignVertical: 'top' },
    shortInput: { maxWidth: 180 },
    inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    inlineForm: {
      marginTop: 10, paddingHorizontal: 12, paddingBottom: 12, borderRadius: 10,
      backgroundColor: colors.surfaceMuted, borderLeftWidth: 3, borderLeftColor: tabColor,
    },

    checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
    checkBox: {
      width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: tabColor,
      alignItems: 'center', justifyContent: 'center',
    },
    checkBoxOn: { backgroundColor: tabColor },
    checkMark: { ...typography.caption, color: colors.textOnPrimary, textShadowColor: 'transparent', textShadowRadius: 0 },
    checkLabel: { ...typography.body, color: colors.textPrimary, flex: 1, ...textShadow },

    row: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
      paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border,
    },
    rowMain: { flex: 1 },
    rowTitle: { ...typography.body, color: colors.textPrimary, ...textShadow },
    rowMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2, ...textShadow },
    rowActions: { flexDirection: 'row', gap: 14, marginTop: 10, flexWrap: 'wrap' },
    lineAction: { marginRight: 14 },
    actionText: { ...typography.caption, color: tabColor, ...textShadow },
    actionTextRemove: { ...typography.caption, color: colors.danger, ...textShadow },

    cardPreview: {
      marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: colors.surfaceMuted,
      borderLeftWidth: 3, borderLeftColor: tabColor,
    },
    cardPreviewText: { ...typography.caption, color: colors.textPrimary, ...textShadow },

    formActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
    primaryButton: {
      backgroundColor: colors.buttonColor, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 18,
      alignItems: 'center', marginTop: 12, ...BUTTON_SHADOW,
    },
    primaryButtonText: { ...typography.body, color: colors.textOnButton, textShadowColor: 'transparent', textShadowRadius: 0 },
    secondaryButton: {
      backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
      paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center', marginTop: 12,
    },
    secondaryButtonText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  });
}
