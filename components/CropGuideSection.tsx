import { Ionicons } from '@expo/vector-icons';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { makeDigestRowStyles } from './DigestEntryRow';
import { EntryScrollAnchor, type EntryScrollTarget } from './EntryScrollAnchor';
import { EntrySearchInput, searchFieldStyle } from './EntrySearchInput';
import { HOME_BAND_GAP, HomeSectionBand, useBandGap } from './HomeSectionBand';
import { PopoverSelect } from './PopoverSelect';
import { colors } from '../constants/colors';
import { textShadow, typography } from '../constants/typography';
import {
  CROP_GROUP_LABELS,
  CROP_GUIDES,
  FEEDING_LABELS,
  SEASON_LABELS,
  cropSources,
  findCropGuideByKey,
  formatPh,
  searchCropGuides,
  type CropGroup,
  type CropGuide,
} from '../lib/cropGuides';
import { CROP_PROBLEMS, type CropProblem } from '../lib/cropProblems';
import {
  CROP_SIGN_BATCH_LINE,
  CROP_SIGN_CAUTION,
  CROP_SIGN_CONFIRM,
  CROP_SIGN_INTRO,
  CROP_SIGN_KIND_LABELS,
  CROP_SIGN_KIND_ORDER,
  cropProblemsShowing,
  cropSignHeading,
  cropSignsFor,
  cropSymptomChoices,
  cropsWithSigns,
  type CropSign,
} from '../lib/cropSigns';
import { findSymptom, type SymptomKey } from '../lib/cropSymptoms';
import {
  LIVING_SOIL_GUIDE,
  LIVING_SOIL_SOURCES,
  NUTRIENT_LOOK_ALIKES,
  PLANT_NUTRIENTS,
  SOIL_GUIDE_SOURCES,
  SOIL_PH_GUIDE,
  type GuideSource,
  type PlantNutrient,
  type PlantNutrientKey,
  WHERE_TO_ASK,
} from '../lib/plantNutrients';

// How to grow each crop, and how to read a plant's leaves, on the
// Horticulture lens above the long-form reading. 2026-09-26, direct
// request: "information about how to grow each thing, what type of soil
// it likes, what deficiencies of nutrients look like and how to fix it
// based on real world gardening advice they can be pointed to, like
// PubMed, outside of the device."
//
// Two bands. How to Grow Each Crop holds one fold per group with a
// compact row per crop that opens in place, the same shape as the
// reading rows below it. Reading a Plant's Leaves splits the nutrients by
// where the shortage shows first, which is the first thing to look at,
// then the things that look like a shortage and are not, then soil pH.
// Every crop and nutrient ends with the pages it stands on, opened in the
// browser, and a crop's disorder names its nutrient as a link that opens
// that nutrient's account here.
//
// Each crop carries the three problems it is known for, each put right
// from the soil first (lib/cropProblems.ts), and two more bands say how
// living soil and Korean Natural Farming work and where to ask a person
// for help. 2026-09-26: "we are trying to promote not using chemicals to
// grow their crops and instead make live soil through composting and
// other methods such as Korean Natural Farming."
//
// The data is lib/cropGuides.ts, lib/cropProblems.ts and lib/plantNutrients.ts; a planting on
// Plots & Plantings opens its crop here through openCropKey.
//
// The first band, What Is Wrong With a Plant (I26, reworked 2026-09-29),
// starts from the crop, because each crop shows trouble differently:
// pick the crop, then what it is doing, and it lists that crop's signs
// from lib/cropSigns.ts (too little or too much of a nutrient, watering,
// soil pH, and the diseases that look like a shortage, each citing a page
// about that crop), the crop's known problems that show that way, and how
// to confirm it. Only crops with signs are offered; they come in batches.

type Band = 'symptoms' | 'crops' | 'leaves' | 'soil' | 'help' | null;

const EVERY_SIGN = 'every';
const SIGN_CROP_OPTIONS = cropsWithSigns()
  .flatMap((key) => findCropGuideByKey(key) ?? [])
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((guide) => ({ value: guide.key, label: guide.name }));

const GROUP_ORDER: CropGroup[] = ['vegetables', 'herbs', 'fruit', 'warm'];

const CROP_ANCHOR = (key: string) => `crop:${key}`;
const NUTRIENT_ANCHOR = (key: PlantNutrientKey) => `nutrient:${key}`;

export const CROP_GUIDE_HELP = {
  heading: 'Growing Crops with Living Soil',
  body: 'The five bands at the top of this lens. What Is Wrong With a Plant starts from the crop, since each crop shows trouble differently. Pick the crop, then what you see, and it lists the signs that crop is known to show that way: too little or too much of a nutrient, watering, soil pH, and the diseases that look like a shortage, each from a page about that crop, then how to confirm it with a soil or leaf test. Crops are added a few at a time, starting with tomato, hops and cannabis. How to Grow Each Crop covers vegetables, herbs, fruit and warm-climate and tropical crops: the sun and soil each one wants, the soil pH it grows best in, how hungry it is, how to sow and space it, when it is ready, how to water it, and three problems that crop is known for, each with what it looks like, why it happens and how to put it right by feeding the soil rather than the plant. Reading a Plant’s Leaves starts from where the trouble shows, the older leaves or the newest ones, since that alone halves the list. Living Soil explains compost, no-dig, cover crops and Korean Natural Farming, and says plainly how strong the evidence for each is. Where to Ask for Help lists people who answer gardening questions for free. Figures are the ranges the advisory services commonly give; the page linked under each guide has the detail for your climate, and PubMed has the research. A planting on Plots & Plantings with a guide shows a How to grow link that opens it here.',
};

export function CropGuideSection({
  tabColor,
  openCropKey,
  scrollToY,
}: {
  tabColor: string;
  // A crop to open on arrival, from a planting's How to grow link. Opened
  // once per key.
  openCropKey?: string | null;
  // The host ScrollView, measured from this section's top.
  scrollToY?: (y: number) => void;
}) {
  const bandGap = useBandGap();
  const styles = useMemo(() => makeStyles(tabColor, bandGap), [tabColor, bandGap]);
  const [openBand, setOpenBand] = useState<Band>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [signCrop, setSignCrop] = useState<string | null>(null);
  const [signSymptom, setSignSymptom] = useState<SymptomKey | null>(null);

  const sectionRef = useRef<View>(null);
  const pending = useRef<string | null>(null);
  const scrollTarget = useMemo<EntryScrollTarget | undefined>(
    () => (scrollToY ? { pending, relativeTo: sectionRef, onMeasured: scrollToY } : undefined),
    [scrollToY],
  );

  const openCrop = useCallback((guide: CropGuide) => {
    setOpenBand('crops');
    setOpenGroup(guide.group);
    setOpenItem(CROP_ANCHOR(guide.key));
    pending.current = CROP_ANCHOR(guide.key);
  }, []);

  const openNutrient = useCallback((key: PlantNutrientKey) => {
    const nutrient = PLANT_NUTRIENTS.find((candidate) => candidate.key === key);
    if (!nutrient) return;
    setOpenBand('leaves');
    setOpenGroup(nutrient.showsOn);
    setOpenItem(NUTRIENT_ANCHOR(key));
    pending.current = NUTRIENT_ANCHOR(key);
  }, []);

  const consumed = useRef<string | null>(null);
  useEffect(() => {
    if (!openCropKey) {
      consumed.current = null;
      return;
    }
    if (consumed.current === openCropKey) return;
    consumed.current = openCropKey;
    const guide = findCropGuideByKey(openCropKey);
    if (guide) {
      setQuery('');
      openCrop(guide);
    }
  }, [openCropKey, openCrop]);

  const matches = useMemo(() => (query.trim() ? searchCropGuides(query) : null), [query]);

  const toggleBand = (band: Exclude<Band, null>) => {
    setOpenBand(openBand === band ? null : band);
    setOpenGroup(null);
    setOpenItem(null);
  };
  const toggleGroup = (key: string) => {
    setOpenGroup(openGroup === key ? null : key);
    setOpenItem(null);
  };
  const toggleItem = (id: string) => setOpenItem(openItem === id ? null : id);

  const renderSources = (sources: GuideSource[]) => (
    <View style={styles.sourceList}>
      <Text style={styles.detailLabel}>Read more outside the app</Text>
      {sources.map((source) => (
        <TouchableOpacity key={source.url} onPress={() => Linking.openURL(source.url)} activeOpacity={0.7} style={styles.sourceRow}>
          <Ionicons name="open-outline" size={14} color={tabColor} />
          <Text style={styles.sourceText}>{source.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const fact = (label: string, value: string) => (
    <View style={styles.fact}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailText}>{value}</Text>
    </View>
  );

  const renderProblem = (problem: CropProblem) => (
    <View key={problem.label} style={styles.watchItem}>
      <Text style={styles.watchLabel}>{problem.label}</Text>
      <Text style={styles.detailText}>{problem.looks}</Text>
      <Text style={styles.detailText}>
        <Text style={styles.watchLabel}>Why. </Text>
        {problem.why}
      </Text>
      <Text style={styles.detailText}>
        <Text style={styles.watchLabel}>Put it right. </Text>
        {problem.fix}
      </Text>
      {problem.insteadOf ? (
        <Text style={styles.detailText}>
          <Text style={styles.watchLabel}>Why not the bag or bottle. </Text>
          {problem.insteadOf}
        </Text>
      ) : null}
      {problem.nutrient ? (
        <TouchableOpacity onPress={() => openNutrient(problem.nutrient!)} activeOpacity={0.7}>
          <Text style={styles.inlineLink}>
            What {PLANT_NUTRIENTS.find((n) => n.key === problem.nutrient)?.name.toLowerCase()} shortage looks like
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const renderCropRow = (guide: CropGuide, index: number, showGroup: boolean) => {
    const id = CROP_ANCHOR(guide.key);
    const expanded = openItem === id;
    return (
      <Fragment key={guide.key}>
        {index > 0 ? <View style={styles.rowDivider} /> : null}
        <EntryScrollAnchor id={id} target={scrollTarget}>
          <View style={styles.itemRow}>
            <TouchableOpacity style={styles.itemTapArea} onPress={() => toggleItem(id)} activeOpacity={0.85}>
              <View style={styles.itemTextWrap}>
                {showGroup ? <Text style={styles.itemGroupLabel}>{CROP_GROUP_LABELS[guide.group]}</Text> : null}
                <Text style={styles.itemTitle}>{guide.name}</Text>
                <Text style={styles.itemSubtitle}>
                  {formatPh(guide.ph)} · {FEEDING_LABELS[guide.feeding]} · {SEASON_LABELS[guide.season]}
                </Text>
              </View>
              <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            {expanded ? (
              <View style={[styles.itemDetail, styles.detailBody]}>
                <Text style={styles.latin}>
                  {guide.latin} · {guide.family}
                </Text>
                {fact('Sun', guide.sun)}
                {fact('Soil', `${guide.soil} Grows best at ${formatPh(guide.ph)}.`)}
                {fact('Sowing and planting', guide.sow)}
                {fact('Spacing', guide.spacing)}
                {fact('Ready', guide.ready)}
                {fact('Water', guide.water)}
                {fact('Growing it well', guide.grow)}
                <View style={styles.fact}>
                  <Text style={styles.detailLabel}>Three problems to know</Text>
                  {(CROP_PROBLEMS[guide.key] ?? []).map(renderProblem)}
                </View>
                {renderSources(cropSources(guide))}
              </View>
            ) : null}
          </View>
        </EntryScrollAnchor>
      </Fragment>
    );
  };

  const renderNutrientRow = (nutrient: PlantNutrient, index: number) => {
    const id = NUTRIENT_ANCHOR(nutrient.key);
    const expanded = openItem === id;
    return (
      <Fragment key={nutrient.key}>
        {index > 0 ? <View style={styles.rowDivider} /> : null}
        <EntryScrollAnchor id={id} target={scrollTarget}>
          <View style={styles.itemRow}>
            <TouchableOpacity style={styles.itemTapArea} onPress={() => toggleItem(id)} activeOpacity={0.85}>
              <View style={styles.itemTextWrap}>
                <Text style={styles.itemTitle}>{nutrient.name}</Text>
                <Text style={styles.itemSubtitle} numberOfLines={1}>
                  {nutrient.looks}
                </Text>
              </View>
              <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            {expanded ? (
              <View style={[styles.itemDetail, styles.detailBody]}>
                {fact('What it does', nutrient.role)}
                {fact('What it looks like', nutrient.looks)}
                {fact('Why it happens', nutrient.causes)}
                {fact('Working with the soil', nutrient.withTheSoil)}
                {fact('Why not the bag or bottle', nutrient.whyNotChemical)}
                {fact('Before you treat', nutrient.caution)}
                {renderSources(nutrient.sources)}
              </View>
            ) : null}
          </View>
        </EntryScrollAnchor>
      </Fragment>
    );
  };

  const fold = (key: string, title: string, body: () => React.ReactNode) => {
    const open = openGroup === key;
    return (
      <View key={key} style={styles.topicFold}>
        <TouchableOpacity style={styles.topicTapArea} onPress={() => toggleGroup(key)} activeOpacity={0.85}>
          <Text style={styles.topicTitle}>{title}</Text>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        {open ? <View style={styles.topicBody}>{body()}</View> : null}
      </View>
    );
  };

  const renderSign = (sign: CropSign) => (
    <View key={sign.label} style={styles.watchItem}>
      <Text style={styles.watchLabel}>{sign.label}</Text>
      <Text style={styles.detailText}>{sign.looks}</Text>
      {sign.why ? (
        <Text style={styles.detailText}>
          <Text style={styles.watchLabel}>Why. </Text>
          {sign.why}
        </Text>
      ) : null}
      <Text style={styles.detailText}>
        <Text style={styles.watchLabel}>Put it right. </Text>
        {sign.fix}
      </Text>
      {sign.nutrient ? (
        <TouchableOpacity onPress={() => openNutrient(sign.nutrient!)} activeOpacity={0.7}>
          <Text style={styles.inlineLink}>
            What {PLANT_NUTRIENTS.find((n) => n.key === sign.nutrient)?.name.toLowerCase()} does in any plant
          </Text>
        </TouchableOpacity>
      ) : null}
      {sign.sources.map((source) => (
        <TouchableOpacity key={source.url} onPress={() => Linking.openURL(source.url)} activeOpacity={0.7} style={styles.sourceRow}>
          <Ionicons name="open-outline" size={14} color={tabColor} />
          <Text style={styles.sourceText}>{source.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSignGuide = () => {
    const cropGuide = signCrop ? findCropGuideByKey(signCrop) : null;
    if (!cropGuide) return null;
    const symptom = signSymptom ? (findSymptom(signSymptom) ?? null) : null;
    const signs = cropSignsFor(cropGuide.key, signSymptom);
    const problems = cropProblemsShowing(cropGuide.key, signSymptom);
    const confirm = CROP_SIGN_CONFIRM[cropGuide.key];
    return (
      <View style={styles.detailBody}>
        <Text style={styles.detailLabel}>{cropSignHeading(symptom, cropGuide.name)}</Text>
        {CROP_SIGN_KIND_ORDER.map((kind) => {
          const ofKind = signs.filter((sign) => sign.kind === kind);
          if (ofKind.length === 0) return null;
          return (
            <View key={kind} style={styles.fact}>
              <Text style={styles.detailLabel}>{CROP_SIGN_KIND_LABELS[kind]}</Text>
              {ofKind.map(renderSign)}
            </View>
          );
        })}
        {problems.length > 0 ? (
          <View style={styles.fact}>
            <Text style={styles.detailLabel}>Known problems of {cropGuide.name.toLowerCase()}</Text>
            {problems.map(renderProblem)}
          </View>
        ) : null}
        {confirm ? (
          <View style={styles.fact}>
            <Text style={styles.detailLabel}>How to confirm it</Text>
            <Text style={styles.detailText}>{confirm.text}</Text>
            {renderSources(confirm.sources)}
          </View>
        ) : null}
        <Text style={styles.topicDescription}>{CROP_SIGN_CAUTION}</Text>
        <TouchableOpacity onPress={() => openCrop(cropGuide)} activeOpacity={0.7}>
          <Text style={styles.inlineLink}>How to grow {cropGuide.name.toLowerCase()}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const olderFirst = PLANT_NUTRIENTS.filter((nutrient) => nutrient.showsOn === 'older');
  const newerFirst = PLANT_NUTRIENTS.filter((nutrient) => nutrient.showsOn === 'newer');

  return (
    <View ref={sectionRef} style={styles.wrapper}>
      <HomeSectionBand
        kind="fold"
        title="What Is Wrong With a Plant"
        icon="search-outline"
        color={tabColor}
        expanded={openBand === 'symptoms'}
        onToggle={() => toggleBand('symptoms')}
        contentStyle={styles.bandBody}
      >
        <Text style={styles.topicDescription}>{CROP_SIGN_INTRO}</Text>
        <View style={styles.fact}>
          <Text style={styles.detailLabel}>Which crop?</Text>
          <PopoverSelect
            options={SIGN_CROP_OPTIONS}
            selected={signCrop}
            onSelect={(value) => {
              setSignCrop(value);
              setSignSymptom(null);
              setOpenItem(null);
            }}
            placeholder="Pick the crop"
            tabColor={tabColor}
          />
          <Text style={styles.detailText}>{CROP_SIGN_BATCH_LINE}</Text>
        </View>
        {signCrop ? (
          <View style={styles.fact}>
            <Text style={styles.detailLabel}>What do you see?</Text>
            <PopoverSelect
              options={[
                { value: EVERY_SIGN, label: 'Show every sign' },
                ...cropSymptomChoices(signCrop).map((symptom) => ({ value: symptom.key, label: symptom.label })),
              ]}
              selected={signSymptom ?? EVERY_SIGN}
              onSelect={(value) => {
                setSignSymptom(value === EVERY_SIGN ? null : (value as SymptomKey));
                setOpenItem(null);
              }}
              tabColor={tabColor}
            />
          </View>
        ) : null}
        {renderSignGuide()}
      </HomeSectionBand>

      <HomeSectionBand
        kind="fold"
        title={`How to Grow Each Crop (${CROP_GUIDES.length})`}
        icon="nutrition-outline"
        color={tabColor}
        expanded={openBand === 'crops'}
        onToggle={() => toggleBand('crops')}
        contentStyle={styles.bandBody}
      >
        <Text style={styles.topicDescription}>
          Sun, soil, pH, sowing, spacing, water and three problems each crop is known for, each put right from the soil first, with the advisory page, an organic growing guide and the research behind it. Figures are typical ranges; the linked page has the detail for your climate. In a hot climate, cool-season crops go in during the coolest months.
        </Text>
        <EntrySearchInput placeholder="Find a crop..." style={styles.searchField} tabColor={tabColor} onDebouncedChange={setQuery} />
        {matches ? (
          matches.length === 0 ? (
            <Text style={styles.topicDescription}>No crop guide matches “{query.trim()}”.</Text>
          ) : (
            <View>{matches.map((guide, index) => renderCropRow(guide, index, true))}</View>
          )
        ) : (
          GROUP_ORDER.map((group) => {
            const guides = CROP_GUIDES.filter((guide) => guide.group === group).sort((a, b) => a.name.localeCompare(b.name));
            return fold(group, `${CROP_GROUP_LABELS[group]} (${guides.length})`, () => guides.map((guide, index) => renderCropRow(guide, index, false)));
          })
        )}
      </HomeSectionBand>

      <HomeSectionBand
        kind="fold"
        title="Reading a Plant’s Leaves"
        icon="leaf-outline"
        color={tabColor}
        expanded={openBand === 'leaves'}
        onToggle={() => toggleBand('leaves')}
        contentStyle={styles.bandBody}
      >
        <Text style={styles.topicDescription}>
          Look first at where it shows. A nutrient the plant can move is drawn out of the old leaves to feed the new, so the old leaves show it first; one it cannot move shows on the newest growth. Then check the look-alikes, and test the soil before adding anything.
        </Text>
        {fold('older', `Shows on Older Leaves First (${olderFirst.length})`, () => olderFirst.map(renderNutrientRow))}
        {fold('newer', `Shows on the Newest Leaves First (${newerFirst.length})`, () => newerFirst.map(renderNutrientRow))}
        {fold('lookalikes', `Looks Like a Shortage, Is Not (${NUTRIENT_LOOK_ALIKES.length})`, () =>
          NUTRIENT_LOOK_ALIKES.map((item) => (
            <View key={item.heading} style={styles.fact}>
              <Text style={styles.detailLabel}>{item.heading}</Text>
              <Text style={styles.detailText}>{item.body}</Text>
            </View>
          )),
        )}
        {fold('ph', 'Soil pH', () => (
          <View style={styles.detailBody}>
            {SOIL_PH_GUIDE.map((item) => (
              <View key={item.heading} style={styles.fact}>
                <Text style={styles.detailLabel}>{item.heading}</Text>
                <Text style={styles.detailText}>{item.body}</Text>
              </View>
            ))}
            {renderSources(SOIL_GUIDE_SOURCES)}
          </View>
        ))}
      </HomeSectionBand>

      <HomeSectionBand
        kind="fold"
        title="Living Soil: Compost and Korean Natural Farming"
        icon="earth-outline"
        color={tabColor}
        expanded={openBand === 'soil'}
        onToggle={() => toggleBand('soil')}
        contentStyle={styles.bandBody}
      >
        <Text style={styles.topicDescription}>
          Feed the soil and the soil feeds the plant. How compost, no-dig beds, cover crops, liquid feeds and Korean Natural Farming work, why this app leans away from synthetic fertiliser and sprays, and how strong the evidence is for each.
        </Text>
        <View style={styles.detailBody}>
          {LIVING_SOIL_GUIDE.map((item) => (
            <View key={item.heading} style={styles.fact}>
              <Text style={styles.detailLabel}>{item.heading}</Text>
              <Text style={styles.detailText}>{item.body}</Text>
            </View>
          ))}
          {renderSources(LIVING_SOIL_SOURCES)}
        </View>
      </HomeSectionBand>

      <HomeSectionBand
        kind="fold"
        title={`Where to Ask for Help (${WHERE_TO_ASK.length})`}
        icon="help-buoy-outline"
        color={tabColor}
        expanded={openBand === 'help'}
        onToggle={() => toggleBand('help')}
        contentStyle={styles.bandBody}
      >
        <Text style={styles.topicDescription}>
          People and organisations who answer gardening questions, most of them for free. A clear photo of the whole plant and a close one of the problem gets the best answer.
        </Text>
        <View style={styles.detailBody}>
          {WHERE_TO_ASK.map((place) => (
            <View key={place.url} style={styles.fact}>
              <TouchableOpacity onPress={() => Linking.openURL(place.url)} activeOpacity={0.7} style={styles.sourceRow}>
                <Ionicons name="open-outline" size={14} color={tabColor} />
                <Text style={styles.sourceText}>{place.heading}</Text>
              </TouchableOpacity>
              <Text style={styles.detailText}>{place.body}</Text>
            </View>
          ))}
        </View>
      </HomeSectionBand>
    </View>
  );
}

function makeStyles(tabColor: string, bandGap: number = HOME_BAND_GAP) {
  return StyleSheet.create({
    ...makeDigestRowStyles(tabColor),
    wrapper: { gap: bandGap },
    bandBody: { gap: bandGap },
    topicDescription: { ...typography.caption, color: colors.textSecondary, ...textShadow },
    searchField: { ...typography.body, ...searchFieldStyle, borderColor: tabColor, ...textShadow },
    detailBody: { gap: HOME_BAND_GAP },
    fact: { gap: 2 },
    latin: { ...typography.caption, color: colors.textSecondary, fontStyle: 'italic', ...textShadow },
    detailLabel: { ...typography.eyebrow, color: tabColor, ...textShadow },
    detailText: { ...typography.body, color: colors.textPrimary, ...textShadow },
    watchItem: { gap: 2, marginTop: 4 },
    watchLabel: { ...typography.bodyEmphasis, color: colors.textPrimary },
    cropChips: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 4 },
    inlineLink: { ...typography.caption, color: tabColor, textDecorationLine: 'underline', ...textShadow },
    sourceList: { gap: 6 },
    sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    sourceText: { ...typography.caption, color: tabColor, textDecorationLine: 'underline', flex: 1, ...textShadow },
  });
}
