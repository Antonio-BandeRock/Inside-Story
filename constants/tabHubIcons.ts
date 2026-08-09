import type { ImageSourcePropType } from 'react-native';
import type { TabHubIconChoice } from '../lib/visualPreferences';

// A real, raw (require()'d, not wrapped in a component) image source per
// TabHubIconChoice -- 2026-08-09, built for the "personalize the main
// TabHub button's own icon" feature (see TabHubIconChoice's own comment in
// lib/visualPreferences.ts). Kept separate from components/
// DigestConditionIcons.tsx's own already-built icon COMPONENTS (each
// wraps exactly one fixed <Image>, styled for its own single use in
// LensHub's grid or Purple Digest's header card) because TabHub.tsx's own
// button needs the raw source directly: it renders the SAME image up to
// four times per frame while open (one real copy plus several tinted,
// offset copies for its own hand-rolled drop-shadow trick -- see
// TabHub.tsx's own ELEVATION_SHADOW_LAYERS), each with different inline
// styling a pre-wrapped component couldn't accommodate. Every one of these
// 20 real, literal require() calls is necessary -- Metro's bundler needs a
// static, non-dynamic path for each one, the same constraint
// DigestConditionIcons.tsx's own header comment already documents.
//
// Partial, not a full Record -- TabHubIconChoice is 'default' | every real
// DigestCategoryKey, which also includes basicHealth/earthMatters/
// homeGardening (the 3 structural, non-condition categories, real
// DigestCategoryKey values but not "conditions" in the sense this feature
// means, with no bespoke icon of their own) -- the exact same reasoning
// DigestConditionIcons.tsx's own DIGEST_CONDITION_ICONS already uses
// Partial for. Every consumer of this map (TabHub.tsx's own lookup,
// Profile's own picker) already falls back to `.default` / filters out an
// undefined result, so nothing further needed to change once this became
// Partial.
export const TAB_HUB_ICON_SOURCES: Partial<Record<TabHubIconChoice, ImageSourcePropType>> = {
  default: require('../assets/branding/butterfly-transparent.png'),
  hashimotos: require('../assets/branding/digest-icons/hashimotos.png'),
  rheumatoidArthritis: require('../assets/branding/digest-icons/rheumatoid-arthritis.png'),
  psoriasis: require('../assets/branding/digest-icons/psoriasis.png'),
  graves: require('../assets/branding/digest-icons/graves.png'),
  type1Diabetes: require('../assets/branding/digest-icons/type1diabetes.png'),
  celiac: require('../assets/branding/digest-icons/celiac.png'),
  ibd: require('../assets/branding/digest-icons/ibd.png'),
  multipleSclerosis: require('../assets/branding/digest-icons/multiple-sclerosis.png'),
  lupus: require('../assets/branding/digest-icons/lupus.png'),
  sjogrens: require('../assets/branding/digest-icons/sjogrens.png'),
  pcos: require('../assets/branding/digest-icons/pcos.png'),
  chronicKidneyDisease: require('../assets/branding/digest-icons/chronic-kidney-disease.png'),
  fattyLiverDisease: require('../assets/branding/digest-icons/fatty-liver-disease.png'),
  type2Diabetes: require('../assets/branding/digest-icons/type2diabetes.png'),
  ibs: require('../assets/branding/digest-icons/ibs.png'),
  migraine: require('../assets/branding/digest-icons/migraine.png'),
  cardiovascularDisease: require('../assets/branding/digest-icons/cardiovascular-disease.png'),
  gout: require('../assets/branding/digest-icons/gout.png'),
  prostateHealth: require('../assets/branding/digest-icons/prostate-health.png'),
};
