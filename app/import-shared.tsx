// 2026-08-15 -- the real receiving screen for a shared item. Reached via a
// real hashimotosapp://import-shared?data=... deep link (see
// lib/sharing.ts's own encodeShareLink/encodeMealShareLink/
// encodeShareLinkFromCuratedRecipe) -- Expo Router already resolves that
// link straight to this route and hands `data` here as an already-decoded
// query param.
//
// Direct request: "When they receive it, it shows up in their My Kitchen
// area under a heading of Recipes Shared With Me. It stays there until
// they try it and decide if they want to add it to their own saved
// recipes or as a favorite, then it moves out... if they didn't like the
// recipe they can just delete it." This screen's own real job is only the
// FIRST half of that -- a genuine, explicit, informed local confirmation
// (the one real safety gate this app can offer before the real invitation-
// based pairing/encryption layer named in CLAUDE.md's own standing
// security-requirement note exists) before anything gets written at all --
// stageSharedItem writes a real staging row (lib/sharing.ts's own
// shared_recipes table), never a permanent saved record directly. The
// "try it, then decide" half lives on the resulting Digest card
// itself (see DynamicEntryActions' own 'shared' branch in
// app/(tabs)/purple-digest.tsx).
//
// Never writes anything before a real, explicit confirmation -- the same
// discipline this app already holds every other "external, unverified
// input" boundary to. decodeShareEnvelope is defensive by design (returns
// null for anything genuinely malformed OR whose signature doesn't check
// out -- step 5 of the real device-pairing prerequisite list, 2026-08-15,
// see lib/sharing.ts's own header comment), so a bad/corrupted/tampered
// link shows one plain, honest "this link doesn't look right" state
// instead of crashing or leaking which specific check failed. A real
// photo, when the envelope carries one, previews directly from its own
// base64 bytes (a plain data: URI -- no need to write a real file just to
// show a preview); stageSharedItem is the one real place that decodes it
// into a genuine local file, once the person actually confirms.
//
// A genuine, decoded/verified envelope is ALWAYS shown here regardless of
// whether its sender is already a known Connection -- this app's own
// core sharing feature is explicitly meant to work with anyone, not just
// people already paired. The one real, additional thing a known
// Connection buys: a real "Verified" badge below, computed via
// getConnectionByPublicKey (lib/connections.ts) against the envelope's
// own already-signature-checked senderPublicKeyBase64 -- genuine
// cryptographic confidence this specific share really did come from that
// specific person, not just a claimed display name.
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { textShadow, typography } from '../constants/typography';
import { getConnectionByPublicKey } from '../lib/connections';
import { decodeShareEnvelope, stageSharedItem, type ShareEnvelope } from '../lib/sharing';

function previewIngredientLines(envelope: ShareEnvelope): string[] {
  if (envelope.payload.kind === 'component') {
    return envelope.payload.builder.ingredients.map(
      (ingredient) => `${ingredient.quantity} ${ingredient.unit} ${ingredient.foodName}`,
    );
  }
  return envelope.payload.components.flatMap((component) =>
    component.builder.ingredients.map((ingredient) => `${ingredient.quantity} ${ingredient.unit} ${ingredient.foodName}`),
  );
}

function previewName(envelope: ShareEnvelope): string {
  return envelope.payload.kind === 'component' ? envelope.payload.builder.name : envelope.payload.name;
}

export default function ImportSharedScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams<{ data?: string }>();
  const scrollPadding = useFloatingButtonScrollPadding();

  const envelope = useMemo(() => (typeof data === 'string' ? decodeShareEnvelope(data) : null), [data]);
  const [status, setStatus] = useState<'preview' | 'saving' | 'saved' | 'error'>('preview');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verifiedConnectionName, setVerifiedConnectionName] = useState<string | null>(null);

  useEffect(() => {
    if (!envelope) {
      setVerifiedConnectionName(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const connection = await getConnectionByPublicKey(envelope.senderPublicKeyBase64);
      if (!cancelled) setVerifiedConnectionName(connection?.name ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [envelope]);

  async function handleAdd() {
    if (!envelope) return;
    setStatus('saving');
    try {
      await stageSharedItem(envelope);
      setStatus('saved');
    } catch (error) {
      console.error('[ImportSharedScreen] Failed to stage shared item', error);
      setErrorMessage("Something went wrong saving this. Please try again.");
      setStatus('error');
    }
  }

  if (!envelope) {
    return (
      <View style={styles.screen}>
        <View style={styles.body}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.textMuted} />
          <Text style={styles.title}>This link doesn&apos;t look right</Text>
          <Text style={styles.text}>
            It may be incomplete, corrupted, or from an older version of the app. Ask whoever sent it to share it again.
          </Text>
        </View>
      </View>
    );
  }

  if (status === 'saved') {
    return (
      <View style={styles.screen}>
        <View style={styles.body}>
          <Ionicons name="checkmark-circle-outline" size={40} color={colors.accent} />
          <Text style={styles.title}>Saved to Shared Recipes</Text>
          <Text style={styles.text}>
            {previewName(envelope)} is now under Recipes Shared With Me, in My Kitchen -- shared by {envelope.fromName}. Try
            it, then save it to your own recipes or as a favorite, or just delete it if it&apos;s not for you.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={() => router.replace({ pathname: '/(tabs)/purple-digest' })}
          >
            <Text style={styles.primaryButtonText}>Open My Kitchen</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const ingredientLines = previewIngredientLines(envelope);
  const photoBase64 = envelope.payload.photoBase64;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
      <Text style={styles.fromLine}>Shared with you by {envelope.fromName}</Text>
      <Text style={styles.title}>{previewName(envelope)}</Text>

      {verifiedConnectionName ? (
        <View style={styles.verifiedRow}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.accent} />
          <Text style={styles.verifiedText}>
            Verified: this really is your connection {verifiedConnectionName}
            {verifiedConnectionName !== envelope.fromName ? ` (shown here as "${envelope.fromName}")` : ''}
          </Text>
        </View>
      ) : (
        <Text style={styles.unverifiedText}>
          {envelope.fromName} isn&apos;t one of your connections yet, so this can&apos;t be verified as really coming from
          them -- it&apos;s still safe to review, since the link itself checked out fine.
        </Text>
      )}

      {photoBase64 ? (
        <Image source={{ uri: `data:image/jpeg;base64,${photoBase64}` }} style={styles.photo} resizeMode="cover" />
      ) : null}

      <Text style={styles.sectionLabel}>Ingredients</Text>
      {ingredientLines.map((line, index) => (
        <Text key={index} style={styles.ingredientLine}>
          {'•'} {line}
        </Text>
      ))}

      {status === 'error' && errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.primaryButton, styles.actionButton, status === 'saving' ? styles.primaryButtonDisabled : null]}
          activeOpacity={0.85}
          onPress={handleAdd}
          disabled={status === 'saving'}
        >
          <Text style={styles.primaryButtonText}>{status === 'saving' ? 'Saving…' : 'Save to Shared Recipes'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryButton, styles.actionButton]}
          activeOpacity={0.85}
          onPress={() => router.back()}
        >
          <Text style={styles.secondaryButtonText}>Discard</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  fromLine: { ...typography.caption, color: colors.textMuted, marginBottom: 4,

    ...textShadow,

  },
  title: { ...typography.sectionTitle, color: colors.textPrimary, textAlign: 'center',

    ...textShadow,

  },
  text: { ...typography.body, color: colors.textSecondary, textAlign: 'center',

    ...textShadow,

  },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  verifiedText: { ...typography.caption, color: colors.accent, flexShrink: 1,

    ...textShadow,

  },
  unverifiedText: { ...typography.caption, color: colors.textMuted, marginTop: 10,

    ...textShadow,

  },
  photo: { width: '100%', height: 200, borderRadius: 12, marginTop: 16, backgroundColor: colors.surface },
  sectionLabel: { ...typography.bodyEmphasis, color: colors.textPrimary, marginTop: 20, marginBottom: 6,

    ...textShadow,

  },
  ingredientLine: { ...typography.body, color: colors.textPrimary, lineHeight: 20,

    ...textShadow,

  },
  errorText: { ...typography.caption, color: colors.danger, marginTop: 16,

    ...textShadow,

  },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  actionButton: { flex: 1 },
  primaryButton: {
    backgroundColor: colors.buttonColor,
    ...BUTTON_SHADOW,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { ...typography.bodyEmphasis, color: colors.textOnButton,

    // Dark text: cancel any shadow inherited from a base style it is

    // composed with. See constants/typography.ts.

    textShadowColor: 'transparent',

    textShadowRadius: 0,

  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: { ...typography.bodyEmphasis, color: colors.textSecondary,

    ...textShadow,

  },
});
