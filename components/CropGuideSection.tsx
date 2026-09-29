import { Ionicons } from '@expo/vector-icons';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { makeDigestRowStyles } from './DigestEntryRow';
import { EntryScrollAnchor, type EntryScrollTarget } from './EntryScrollAnchor';
import { EntrySearchInput, searchFieldStyle } from './EntrySearchInput';
import { HOME_BAND_GAP, HomeSectionBand } from './HomeSectionBand';
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
  SYMPTOMS,
  SYMPTOM_GUIDE_CAUTION,
  SYMPTOM_GUIDE_INTRO,
  SYMPTOM_NO_CROP_LINE,
  cropProblemsFor,
  cropsWithSymptom,
  findSymptom,
  symptomHeading,
  symptomSources,
  type SymptomKey,
} from '../lib/cropSymptoms';
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
// The first band, What Is Wrong With a Plant (I26, 2026-09-29), reads the
// same data from the other end: pick what the plant is doing, and a crop
// if known, and it lists that crop's problems that show that way, the
// shortages that show that way and the look-alikes. The index between
// them is lib/cropSymptoms.ts.

type Band = 'symptoms' | 'crops' | 'leaves' | 'soil' | 'help' | null;

const ANY_CROP = 'any';
const CROP_OPTIONS = [
  { value: ANY_CROP, label: 'Any crop' },
  ...[...CROP_GUIDES].sort((a, b) => a.name.localeCompare(b.name)).map((guide) => ({ value: guide.key, label: guide.name })),
];

const GROUP_ORDER: CropGroup[] = ['vegetables', 'herbs', 'fruit', 'warm'];

const CROP_ANCHOR = (key: string) => `crop:${key}`;
const NUTRIENT_ANCHOR = (key: PlantNutrientKey) => `nutrient:${key}`;

export const CROP_GUIDE_HELP = {
  heading: 'Growing Crops with Living Soil',
  body: 'The five bands at the top of this lens. What Is Wrong With a Plant starts from what you see, yellow lower leaves, spots, flowers falling, and lists what it can be for the crop you pick: the problems that crop is known for that show that way, the soil shortages that do, and the things that look like a shortage and are not, each with the pages it stands on. How to Grow Each Crop covers vegetables, herbs, fruit and warm-climate and tropical crops: the sun and soil each one wants, the soil pH it grows best in, how hungry it is, how to sow and space it, when it is ready, how to water it, and three problems that crop is known for, each with what it looks like, why it happens and how to put it right by feeding the soil rather than the plant. Reading a Plant’s Leaves starts from where the trouble shows, the older leaves or the newest ones, since that alone halves the list. Living Soil explains compost, no-dig, cover crops and Korean Natural Farming, and says plainly how strong the evidence for each is. Where to Ask for Help lists people who answer gardening questions for free. Figures are the ranges the advisory services commonly give; the page linked under each guide has the detail for your climate, and PubMed has the research. A planting on Plots & Plantings with a guide shows a How to grow link that opens it here.',
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
  const styles = useMemo(() => makeStyles(tabColor), [tabColor]);
  const [openBand, setOpenBand] = useState<Band>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [symptomKey, setSymptomKey] = useState<SymptomKey | null>(null);
  const [symptomCrop, setSymptomCrop] = useState<string | null>(null);

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

  const renderSymptomGuide = () => {
    const symptom = symptomKey ? findSymptom(symptomKey) : undefined;
    if (!symptom) return null;
    const cropGuide = symptomCrop ? findCropGuideByKey(symptomCrop) : undefined;
    const problems = cropGuide ? cropProblemsFor(cropGuide.key, symptom.key) : [];
    const knownFor = cropGuide ? [] : cropsWithSymptom(symptom.key).flatMap((key) => findCropGuideByKey(key) ?? []);
    const nutrients = symptom.nutrients.flatMap((key) => PLANT_NUTRIENTS.find((nutrient) => nutrient.key === key) ?? []);
    const lookAlikes = symptom.lookAlikes.flatMap((heading) => NUTRIENT_LOOK_ALIKES.find((item) => item.heading === heading) ?? []);
    return (
      <View style={styles.detailBody}>
        <View style={styles.fact}>
          <Text style={styles.detailLabel}>{symptomHeading(symptom, cropGuide?.name ?? null)}</Text>
          <Text style={styles.detailText}>{symptom.about}</Text>
        </View>
        {cropGuide ? (
          <View style={styles.fact}>
            <Text style={styles.detailLabel}>{`Known for ${cropGuide.name.toLowerCase()}`}</Text>
            {problems.length > 0 ? (
              problems.map(renderProblem)
            ) : (
              <Text style={styles.detailText}>
                None of the three problems {cropGuide.name.toLowerCase()} is best known for shows this way, so start with the shortages and look-alikes below.
              </Text>
            )}
            <TouchableOpacity onPress={() => openCrop(cropGuide)} activeOpacity={0.7}>
              <Text style={styles.inlineLink}>How to grow {cropGuide.name.toLowerCase()}</Text>
            </TouchableOpacity>
          </View>
        ) : knownFor.length > 0 ? (
          <View style={styles.fact}>
            <Text style={styles.detailLabel}>Crops known for this</Text>
            <Text style={styles.detailText}>{SYMPTOM_NO_CROP_LINE}</Text>
            <View style={styles.cropChips}>
              {knownFor.map((guide) => (
                <TouchableOpacity key={guide.key} onPress={() => setSymptomCrop(guide.key)} activeOpacity={0.7}>
                  <Text style={styles.inlineLink}>{guide.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}
        {nutrients.length > 0 ? (
          <View style={styles.fact}>
            <Text style={styles.detailLabel}>Soil shortages that show this way</Text>
            {nutrients.map(renderNutrientRow)}
          </View>
        ) : null}
        {lookAlikes.length > 0 ? (
          <View style={styles.fact}>
            <Text style={styles.detailLabel}>Looks like a shortage, is not</Text>
            {lookAlikes.map((item) => (
              <View key={item.heading} style={styles.watchItem}>
                <Text style={styles.watchLabel}>{item.heading}</Text>
                <Text style={styles.detailText}>{item.body}</Text>
              </View>
            ))}
          </View>
        ) : null}
        <Text style={styles.topicDescription}>{SYMPTOM_GUIDE_CAUTION}</Text>
        {renderSources(symptomSources(symptom))}
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
        <Text style={styles.topicDescription}>{SYMPTOM_GUIDE_INTRO}</Text>
        <View style={styles.fact}>
          <Text style={styles.detailLabel}>What do you see?</Text>
          <PopoverSelect
            options={SYMPTOMS.map((symptom) => ({ value: symptom.key, label: symptom.label }))}
            selected={symptomKey}
            onSelect={(value) => {
              setSymptomKey(value as SymptomKey);
              setOpenItem(null);
            }}
            placeholder="Pick what the plant is doing"
            tabColor={tabColor}
          />
        </View>
        <View style={styles.fact}>
          <Text style={styles.detailLabel}>On which crop?</Text>
          <PopoverSelect
            options={CROP_OPTIONS}
            selected={symptomCrop ?? ANY_CROP}
            onSelect={(value) => {
              setSymptomCrop(value === ANY_CROP ? null : value);
              setOpenItem(null);
            }}
            searchable
            searchPlaceholder="Find a crop..."
            tabColor={tabColor}
          />
        </View>
        {renderSymptomGuide()}
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

function makeStyles(tabColor: string) {
  return StyleSheet.create({
    ...makeDigestRowStyles(tabColor),
    wrapper: { gap: HOME_BAND_GAP },
    bandBody: { gap: HOME_BAND_GAP },
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
