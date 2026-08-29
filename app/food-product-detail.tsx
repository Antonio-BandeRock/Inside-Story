import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppTextInput } from '../components/AppTextInput';
import { useConfirmSheet } from '../components/ConfirmSheet';
import { useInfoAlert } from '../components/InfoAlert';
import { TrendLineChart } from '../components/TrendLineChart';
import { VoiceInputButton } from '../components/VoiceInputButton';
import { BUTTON_SHADOW, colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import {
  deleteScannedProduct,
  getFoodNutrients,
  getScannedProduct,
  getScannedProductPriceHistory,
  recordScannedProductPrice,
  updateScannedProduct,
  type ScannedProductPriceRecord,
  type ScannedProductRecord,
} from '../lib/db';
import { formatAmount } from '../lib/nutrientAnalysis';

// The real "My Food Products" detail screen, 2026-08-16 -- direct request:
// "add My Food Products. This is where the scanned in foods from the store
// should go outside of being able to use them in building some food
// thing." Reached from app/food-items.tsx's own itemType==='scannedProduct'
// case, per the same "one shared list screen, a dedicated detail screen
// for each real kind of thing" split every other builder already uses --
// but a scanned product's own real shape (one nutrient panel, one photo,
// real price-over-time history) is genuinely different from a builder's
// own multi-ingredient/6-Dimensions shape food-item-detail.tsx is built
// around, so this is its own real, self-contained screen rather than
// forced into that one.
//
// Closes a real, already-named gap: lib/db.ts's own updateScannedProduct/
// getScannedProductPriceHistory/recordScannedProductPrice were all built
// the same day the barcode-scanning feature shipped, with
// recordScannedProductPrice already wired into scan-product.tsx's own
// "Buy This" step -- the other two sat completely unused until now, exactly
// the "schema exists, no lens uses it" pattern this app's own history has
// already documented and closed more than once.
type NutrientRow = { code: string; displayName: string; unit: string; amountPer100g: number };

export default function FoodProductDetailScreen() {
  const router = useRouter();
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const productId = Number(id);
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [confirmSheet, confirmSheetElement] = useConfirmSheet();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<ScannedProductRecord | null>(null);
  const [nutrients, setNutrients] = useState<NutrientRow[]>([]);
  const [priceHistory, setPriceHistory] = useState<ScannedProductPriceRecord[]>([]);

  const [name, setName] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [saving, setSaving] = useState(false);

  const [priceText, setPriceText] = useState('');
  const [storeNameText, setStoreNameText] = useState('');
  const [loggingPrice, setLoggingPrice] = useState(false);

  const load = useCallback(async () => {
    const [record, nutrientRows, prices] = await Promise.all([
      getScannedProduct(productId),
      getFoodNutrients(productId, 'Scanned'),
      getScannedProductPriceHistory(productId),
    ]);
    setProduct(record);
    setNutrients(nutrientRows);
    setPriceHistory(prices);
    if (record) {
      setName(record.name);
      setIngredientsText(record.ingredientsText ?? '');
    }
    setLoading(false);
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSaveChanges() {
    if (!product) return;
    setSaving(true);
    try {
      await updateScannedProduct(product.id, {
        name: name.trim() || product.name,
        ingredientsText: ingredientsText.trim() || null,
      });
      await load();
      showInfoAlert('Saved', 'Your changes have been saved.');
    } catch {
      showInfoAlert('Something went wrong', 'Could not save your changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogPrice() {
    if (!product) return;
    const price = Number(priceText);
    if (!priceText || Number.isNaN(price) || price <= 0) {
      showInfoAlert('Enter a real price', 'Type in what you actually paid before logging it.');
      return;
    }
    setLoggingPrice(true);
    try {
      await recordScannedProductPrice({ scannedProductId: product.id, price, storeName: storeNameText.trim() || null });
      setPriceText('');
      setStoreNameText('');
      setPriceHistory(await getScannedProductPriceHistory(product.id));
    } catch {
      showInfoAlert('Something went wrong', 'Could not log that price. Please try again.');
    } finally {
      setLoggingPrice(false);
    }
  }

  async function handleDelete() {
    if (!product) return;
    const ok = await confirmSheet({
      title: `Delete "${product.name}"?`,
      message: 'This removes it from My Food Products for good, including its own price history. This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    await deleteScannedProduct(product.id);
    router.back();
  }

  if (loading) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ title: title || 'Food Product' }} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ title: 'Not Found' }} />
        <View style={styles.centerBody}>
          <Text style={styles.text}>This product isn&apos;t here anymore -- it may have already been deleted.</Text>
        </View>
      </View>
    );
  }

  const sortedNutrients = [...nutrients].sort((a, b) => a.displayName.localeCompare(b.displayName));
  const prices = priceHistory.map((entry) => entry.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const pricePad = Math.max((maxPrice - minPrice) * 0.15, 0.5);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: product.name }} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Name + brand + photo -- name is the one real thing this screen
            lets a person correct in place, matching updateScannedProduct's
            own already-established real use case ("a person re-scanning
            the same product later"). Brand stays a plain caption, not
            editable -- a genuine, real name typo is the actual thing worth
            fixing here; brand editing wasn't asked for and would be a
            second, separate field to maintain for real, marginal value. */}
        <View style={styles.card}>
          {product.photoUri ? <Image source={{ uri: product.photoUri }} style={styles.photo} resizeMode="cover" /> : null}
          <Text style={styles.sectionLabel}>Name</Text>
          <View style={styles.textAreaRow}>
            <AppTextInput
              value={name}
              onChangeText={setName}
              style={styles.textInput}
              placeholder="Product name"
              placeholderTextColor={colors.textMuted}
            />
            <VoiceInputButton onResult={setName} />
          </View>
          {product.brand ? <Text style={styles.caption}>{product.brand}</Text> : null}
          <Text style={styles.caption}>Scanned {product.scannedAt.slice(0, 10)} · {product.lookupSource}</Text>
        </View>

        {/* Ingredients -- the OCR'd/typed text from scan-product.tsx's own
            capture flow, still fully editable here for the exact same
            "manually tidying up" real use case updateScannedProduct's own
            comment already names. */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Ingredients</Text>
          <View style={styles.textAreaRow}>
            <AppTextInput
              value={ingredientsText}
              onChangeText={setIngredientsText}
              style={styles.textArea}
              multiline
              placeholder="No ingredients text saved for this product yet."
              placeholderTextColor={colors.textMuted}
            />
            <VoiceInputButton onResult={setIngredientsText} />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, saving ? styles.disabled : null]}
          activeOpacity={0.85}
          onPress={handleSaveChanges}
          disabled={saving}
        >
          <Text style={styles.primaryButtonText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
        </TouchableOpacity>

        {/* Per-100g nutrient panel -- the real, already-saved lookup result,
            reusing formatAmount (lib/nutrientAnalysis.ts) for the same
            µg/mg/g auto-scaling every other nutrient table in this app
            already gets, rather than a third, separately-invented display
            format just for this one screen. */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Nutrients (per 100g)</Text>
          {sortedNutrients.length === 0 ? (
            <Text style={styles.caption}>No nutrient data was found for this product.</Text>
          ) : (
            <View style={styles.dataTable}>
              {sortedNutrients.map((nutrient, index) => (
                <View
                  key={nutrient.code}
                  style={[styles.dataTableRow, index === sortedNutrients.length - 1 ? styles.dataTableRowLast : null]}
                >
                  <Text style={[styles.dataTableCellText, styles.dataTableColNutrient]}>{nutrient.displayName}</Text>
                  <Text style={[styles.dataTableCellText, styles.dataTableColAmount]}>
                    {formatAmount(nutrient.amountPer100g, nutrient.unit)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Real price-over-time tracking -- the actual, real payoff of
            recordScannedProductPrice/getScannedProductPriceHistory, both
            built the same day the scanning feature shipped but, until this
            screen, only ever writable (from scan-product.tsx's "Buy This"
            step), never readable anywhere in the app. */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Price History</Text>
          <TrendLineChart
            points={priceHistory.map((entry) => ({ date: entry.loggedAt.slice(0, 10), value: entry.price }))}
            yMin={Math.max(0, minPrice - pricePad)}
            yMax={maxPrice + pricePad}
            valueFormatter={(value) => `$${value.toFixed(2)}`}
            emptyMessage="Log at least two prices to see a real trend line."
          />
          {priceHistory.length > 0 ? (
            <View style={styles.priceList}>
              {[...priceHistory].reverse().map((entry) => (
                <View key={entry.id} style={styles.priceRow}>
                  <Text style={styles.priceRowDate}>{entry.loggedAt.slice(0, 10)}</Text>
                  <Text style={styles.priceRowAmount}>${entry.price.toFixed(2)}</Text>
                  {entry.storeName ? <Text style={styles.priceRowStore}>{entry.storeName}</Text> : null}
                </View>
              ))}
            </View>
          ) : null}
          <Text style={[styles.sectionLabel, styles.logPriceLabel]}>Log a New Price</Text>
          <View style={styles.textAreaRow}>
            <AppTextInput
              value={priceText}
              onChangeText={setPriceText}
              style={styles.priceInput}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.textAreaRow}>
            <AppTextInput
              value={storeNameText}
              onChangeText={setStoreNameText}
              style={styles.textInput}
              placeholder="Store (optional)"
              placeholderTextColor={colors.textMuted}
            />
            <VoiceInputButton onResult={setStoreNameText} />
          </View>
          <TouchableOpacity
            style={[styles.secondaryButton, loggingPrice ? styles.disabled : null]}
            activeOpacity={0.85}
            onPress={handleLogPrice}
            disabled={loggingPrice || !priceText}
          >
            <Text style={styles.secondaryButtonText}>{loggingPrice ? 'Logging…' : 'Log Price'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.deleteButton} activeOpacity={0.85} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
          <Text style={styles.deleteButtonText}>Delete This Product</Text>
        </TouchableOpacity>
      </ScrollView>
      {infoAlertElement}
      {confirmSheetElement}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 48, gap: 12 },
  centerBody: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  text: { ...typography.body, color: colors.textSecondary, textAlign: 'center', ...textShadow },
  caption: { ...typography.caption, color: colors.textMuted, ...textShadow },
  sectionLabel: { ...typography.bodyEmphasis, color: colors.textPrimary, marginTop: 4, ...textShadow },
  logPriceLabel: { marginTop: 12 },
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 6,
  },
  photo: { width: '100%', height: 160, borderRadius: 10, backgroundColor: colors.border, marginBottom: 4 },
  textAreaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  textInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...textShadow,
  },
  textArea: {
    flex: 1,
    minHeight: 100,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
    ...textShadow,
  },
  priceInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...textShadow,
  },
  disabled: { opacity: 0.6 },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.buttonColor,
    ...BUTTON_SHADOW,
    borderRadius: 10,
    paddingVertical: 12,
  },
  primaryButtonText: { ...typography.bodyEmphasis, color: colors.textOnButton },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 4,
  },
  secondaryButtonText: { ...typography.bodyEmphasis, color: colors.textSecondary, ...textShadow },
  dataTable: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 4,
  },
  dataTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dataTableRowLast: { borderBottomWidth: 0 },
  dataTableCellText: { ...typography.body, color: colors.textPrimary, paddingVertical: 8, paddingHorizontal: 10, ...textShadow },
  dataTableColNutrient: { flex: 2 },
  dataTableColAmount: { flex: 1, textAlign: 'right' },
  priceList: { gap: 4, marginTop: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priceRowDate: { ...typography.caption, color: colors.textMuted, width: 80, ...textShadow },
  priceRowAmount: { ...typography.bodyEmphasis, color: colors.textPrimary, ...textShadow },
  priceRowStore: { ...typography.caption, color: colors.textSecondary, flexShrink: 1, ...textShadow },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 4,
  },
  deleteButtonText: { ...typography.bodyEmphasis, color: colors.danger, ...textShadow },
});
