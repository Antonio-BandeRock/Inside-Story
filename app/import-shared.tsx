// 2026-08-15 -- the real receiving screen for a shared item, direct
// request: "If they send to has the app, it gets added to their own app
// under Saved and is identified as having been shared from whomever sent
// it to them, but not in a big way. Sort of a footnote." Reached via a
// real hashimotosapp://import-shared?data=... deep link (see
// lib/db.ts's own encodeShareLink/encodeMealShareLink) -- Expo Router
// already resolves that link straight to this route and hands `data`
// here as an already-decoded query param.
//
// Never writes anything before a real, explicit confirmation -- the same
// discipline this app already holds every other "external, unverified
// input" boundary to. decodeShareEnvelope is defensive by design (returns
// null for anything genuinely malformed), so a bad/corrupted link shows a
// plain, honest "this link doesn't look right" state instead of crashing.
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { useFloatingButtonScrollPadding } from '../constants/floatingButton';
import { typography } from '../constants/typography';
import { decodeShareEnvelope, importSharedItem, type ShareEnvelope } from '../lib/db';

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

  async function handleAdd() {
    if (!envelope) return;
    setStatus('saving');
    try {
      await importSharedItem(envelope);
      setStatus('saved');
    } catch (error) {
      console.error('[ImportSharedScreen] Failed to import shared item', error);
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
          <Text style={styles.title}>Added to My Kitchen</Text>
          <Text style={styles.text}>
            {previewName(envelope)} is now saved, with a small note showing it was shared by {envelope.fromName}.
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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: scrollPadding }]}>
      <Text style={styles.fromLine}>Shared with you by {envelope.fromName}</Text>
      <Text style={styles.title}>{previewName(envelope)}</Text>

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
          <Text style={styles.primaryButtonText}>{status === 'saving' ? 'Adding…' : 'Add to My Kitchen'}</Text>
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
  fromLine: { ...typography.caption, color: colors.textMuted, marginBottom: 4 },
  title: { ...typography.sectionTitle, color: colors.textPrimary, textAlign: 'center' },
  text: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  sectionLabel: { ...typography.bodyEmphasis, color: colors.textPrimary, marginTop: 20, marginBottom: 6 },
  ingredientLine: { ...typography.body, color: colors.textPrimary, lineHeight: 20 },
  errorText: { ...typography.caption, color: colors.danger, marginTop: 16 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  actionButton: { flex: 1 },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { ...typography.bodyEmphasis, color: colors.background },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: { ...typography.bodyEmphasis, color: colors.textSecondary },
});
