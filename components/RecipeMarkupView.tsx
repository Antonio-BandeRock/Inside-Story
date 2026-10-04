// Opens a web page inside the app so its recipe can be read or marked (G3,
// rebuild R1). The thinking is in lib/recipeMarkup.ts. When the drawn page
// describes its recipe, Use This Recipe hands it to Import a Recipe exactly
// as a link would. Otherwise the person selects text and marks the name,
// the ingredients and the steps, and Done fills Import a Recipe's paste form
// with them, where every line is checked and matched as usual before
// anything is saved. Phone only; the desktop build swaps react-native-webview
// for a stand-in and never shows the button that opens this.
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import { explainNotYet } from '../lib/notYet';
import { extractRecipeFromHtml, siteNameFromUrl, type ImportedRecipe } from '../lib/recipeImport';
import {
  EMPTY_MARKED,
  MARKUP_HOW_TO,
  MARKUP_PAGE_SCRIPT,
  applyMark,
  markedSummary,
  parseMarkupMessage,
  type MarkField,
  type Marked,
} from '../lib/recipeMarkup';

type Props = {
  url: string;
  onClose: () => void;
  onRecipe: (recipe: ImportedRecipe) => void;
  onMarked: (marked: Marked, page: { url: string; site: string }) => void;
};

const MARK_BUTTONS: { field: MarkField; label: string }[] = [
  { field: 'title', label: 'Name' },
  { field: 'ingredients', label: 'Ingredients' },
  { field: 'steps', label: 'Steps' },
];

export function RecipeMarkupView({ url, onClose, onRecipe, onMarked }: Props) {
  const insets = useSafeAreaInsets();
  const selectionRef = useRef('');
  const [hasSelection, setHasSelection] = useState(false);
  const [found, setFound] = useState<ImportedRecipe | null>(null);
  const [read, setRead] = useState(false);
  const [page, setPage] = useState({ url, site: siteNameFromUrl(url) });
  const [marked, setMarked] = useState<Marked>(EMPTY_MARKED);
  const [loadProblem, setLoadProblem] = useState<string | null>(null);
  const source = useMemo(() => ({ uri: url }), [url]);

  function onMessage(event: WebViewMessageEvent) {
    const message = parseMarkupMessage(event.nativeEvent.data);
    if (!message) return;
    if (message.type === 'selection') {
      selectionRef.current = message.text;
      setHasSelection(true);
      return;
    }
    const site = siteNameFromUrl(message.url) || siteNameFromUrl(url);
    setPage({ url: message.url || url, site });
    const recipe = extractRecipeFromHtml(message.html, message.url || url);
    setFound(recipe ? { ...recipe, sourceUrl: url, sourceSite: site || recipe.sourceSite } : null);
    setRead(true);
  }

  function mark(field: MarkField) {
    if (!selectionRef.current.trim()) {
      return explainNotYet('Select some words on the page first, by pressing and dragging over them, then tap what they are.');
    }
    setMarked((current) => applyMark(current, field, selectionRef.current));
  }

  const anythingMarked = marked.title !== '' || marked.ingredients.length > 0 || marked.steps.length > 0;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top + 6, paddingBottom: insets.bottom + 6 }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Close the page">
            <Text style={styles.linkText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.site} numberOfLines={1}>
            {page.site || url}
          </Text>
        </View>

        <View style={styles.webFrame}>
          {loadProblem ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>{loadProblem}</Text>
            </View>
          ) : (
            <WebView
              source={source}
              injectedJavaScript={MARKUP_PAGE_SCRIPT}
              onMessage={onMessage}
              onError={(event) => setLoadProblem(`The page could not be opened (${event.nativeEvent.description}).`)}
              startInLoadingState
              renderLoading={() => <ActivityIndicator style={styles.loading} color={colors.tabFood} />}
              setSupportMultipleWindows={false}
              javaScriptCanOpenWindowsAutomatically={false}
              allowFileAccess={false}
              allowsBackForwardNavigationGestures
            />
          )}
        </View>

        <View style={styles.panel}>
          {!read ? (
            <Text style={styles.panelText}>Reading the page as it loads.</Text>
          ) : found ? (
            <>
              <Text style={styles.panelText}>
                {`This page describes its recipe: ${found.name || 'no name given'}, ${found.ingredientLines.length} ingredient lines.`}
              </Text>
              <TouchableOpacity style={styles.primaryAction} onPress={() => onRecipe(found)}>
                <Text style={styles.primaryActionText}>Use This Recipe</Text>
              </TouchableOpacity>
              <Text style={styles.panelMuted}>Or mark it by hand below, if what it describes is not what the page shows.</Text>
            </>
          ) : (
            <Text style={styles.panelText}>This page does not describe its recipe, so mark it by hand.</Text>
          )}
          <Text style={styles.panelMuted}>{MARKUP_HOW_TO}</Text>
          <View style={styles.markRow}>
            {MARK_BUTTONS.map((button) => (
              <TouchableOpacity
                key={button.field}
                style={[styles.markButton, !hasSelection && styles.disabled]}
                disabled={!hasSelection}
                onPress={() => mark(button.field)}
                accessibilityLabel={`Mark the selected text as the ${button.label.toLowerCase()}`}
              >
                <Text style={styles.markButtonText}>{button.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.panelMuted}>{markedSummary(marked)}</Text>
          <TouchableOpacity
            style={[styles.primaryAction, marked.ingredients.length === 0 && styles.disabled]}
            onPress={() => {
              if (marked.ingredients.length === 0) {
                explainNotYet('Mark at least one ingredient first: select its line on the page, then tap Ingredients.');
                return;
              }
              onMarked(marked, page);
            }}
          >
            <Text style={styles.primaryActionText}>{anythingMarked ? 'Done, Check These Lines' : 'Mark the Ingredients First'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 6 },
  site: { ...typography.caption, color: colors.textMuted, flex: 1, ...textShadow },
  linkText: { ...typography.body, color: colors.primary, ...textShadow },
  webFrame: { flex: 1, backgroundColor: colors.surface },
  loading: { position: 'absolute', top: 24, alignSelf: 'center' },
  notice: { margin: 16, padding: 12, borderRadius: 10, backgroundColor: colors.surfaceMuted },
  noticeText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  panel: { backgroundColor: colors.surfaceMuted, paddingHorizontal: 16, paddingTop: 10, gap: 8 },
  panelText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  panelMuted: { ...typography.caption, color: colors.textMuted, ...textShadow },
  markRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  markButton: {
    borderWidth: 1,
    borderColor: colors.tabFood,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  markButtonText: { ...typography.body, color: colors.tabFood, ...textShadow },
  primaryAction: {
    alignSelf: 'flex-start',
    backgroundColor: colors.buttonColor,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  primaryActionText: {
    ...typography.body,
    color: colors.textOnButton,
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  disabled: { opacity: 0.45 },
});
