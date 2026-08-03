// A real, cited advisory shown when a plain fruit/vegetable juice item is
// added in Beverage/Fermentation/Smoothie Builder (the three builders whose
// own category allowlist includes `Bev`, see constants/foodBuilderCategories.ts)
// -- 2026-08-02, built the same session and same way as
// lib/alcoholAdvisory.ts and lib/coffeeAdvisory.ts: informational, not a
// blocking confirm, and every claim independently verified via
// WebSearch/WebFetch rather than taken on trust from the summary that
// prompted this.
//
// Several claims in the original prompt did NOT hold up as stated, and are
// deliberately presented differently below rather than repeated as fact:
//
// - "Rapid, concentrated sugar loads spike blood sugar" is true at the
//   population level (Muraki et al. 2013, BMJ, three large prospective
//   cohorts -- habitual fruit JUICE intake tracks with higher type 2
//   diabetes risk, whole fruit with lower), but a 2025 randomized crossover
//   trial in adults with type 2 diabetes (Nutrition & Diabetes, PMC12238372)
//   found NO significant difference in acute glucose/insulin response
//   between 100% orange juice and whole orange pieces when sugar content
//   was matched and both were eaten with a meal. The more consistent
//   mechanism across the literature isn't a fundamentally different
//   absorption curve every time -- it's that fiber removal also removes the
//   natural brake on how much sugar someone drinks in one sitting (the
//   juice of four oranges takes seconds to drink; eating four oranges
//   doesn't).
// - "Insulin spikes elevate cortisol" has the mechanism backwards. It's the
//   glucose CRASH that follows a spike (a real hypoglycemic dip) that
//   triggers cortisol and the other counter-regulatory stress hormones,
//   not the spike/insulin release itself.
// - The juice-and-levothyroxine claim turned out to be the biggest
//   overstatement. The strongest available data (Lilja et al., a real
//   crossover RCT covered in the same systematic review already cited for
//   the coffee advisory, PMC8002057) tested GRAPEFRUIT juice at a high,
//   sustained dose and found only a 9% reduction in levothyroxine
//   absorption with TSH comparable to control -- the review's own authors
//   concluded "the relevance of the... interaction seems to be small" and
//   that patients "should not be discouraged from rational fruit juice
//   consumption." No dedicated study exists for plain orange/other juice at
//   all. The interaction that IS well-documented is specific to
//   CALCIUM-FORTIFIED juice (added calcium chelates T4 in the gut) -- and
//   this app's own Juice list already excludes every calcium-fortified
//   entry (see lib/db.ts's own BEV_JUICE_ALLOWED_NAMES comment), so that
//   specific risk mostly doesn't apply to what's actually selectable here.
export const JUICE_ADVISORY_TITLE = 'Fruit Juice, Blood Sugar & Hashimoto’s';

export const JUICE_ADVISORY_MESSAGE = `Straight juice removes the fiber that would normally slow sugar absorption and limit how much you drink in one sitting -- the juice of four oranges takes seconds to drink; eating four oranges doesn't. At the population level, this shows up in real long-term data: a large study across three prospective cohorts found daily fruit juice intake tracked with up to 21% higher type 2 diabetes risk, while whole fruit -- especially blueberries, grapes, and apples -- tracked with lower risk (Muraki et al., 2013, BMJ). A separate population study (the Maastricht Study, Diabetes Care, 2022) found fructose from fruit juice and sugar-sweetened drinks independently associated with more fat stored in the liver.

That said, the simple "juice always spikes your blood sugar faster than whole fruit" claim doesn't hold up as a guarantee -- a 2025 randomized trial in adults with type 2 diabetes found no real difference in glucose or insulin response between orange juice and whole orange pieces when both were eaten as part of a meal with matched sugar content. The bigger real-world risk is likely portion size and how easy juice makes it to drink a lot of sugar quickly, not a fundamentally different absorption curve every time.

For Hashimoto's specifically, sugar swings are worth caring about, but two pieces of the reasoning need a correction. Blood sugar instability is genuinely linked to more inflammatory immune activity -- unstable glucose can push T cells toward more inflammatory signaling patterns implicated in autoimmune flares. But it's the CRASH after a sugar spike, not the spike or insulin release itself, that triggers a real stress-hormone response (cortisol, along with adrenaline) as your body works to bring glucose back up. Cortisol, in turn, is well-documented to suppress the enzymes that convert inactive thyroid hormone (T4) into active T3, while favoring the pathway that makes inactive reverse T3 instead -- real physiology, but this specific chain (juice -> sugar crash -> cortisol -> measurably less active thyroid hormone) hasn't been directly tested as an outcome of drinking juice; it's a plausible chain built from separately-established pieces, not a proven one.

Gut permeability ("leaky gut") shows up in real research too -- fructose specifically has been linked to disrupted tight-junction proteins in the gut lining in animal studies, and "leaky gut" is a real, if still debated, thread in autoimmune-disease research. Most of the strongest evidence here is still from animal models rather than controlled human trials, so treat it as a real, active area of research rather than settled fact.

On timing with levothyroxine: this is the one place the evidence is weaker than commonly claimed. The best controlled data available (a real crossover trial, cited in a systematic review of levothyroxine-food interactions) tested grapefruit juice specifically and found only a modest, likely-clinically-small effect on absorption. The reviewers' own conclusion: people on levothyroxine shouldn't feel discouraged from normal fruit juice drinking on this basis. The interaction that IS well-established is with CALCIUM-FORTIFIED juice, not juice in general -- and this app's own juice list already leaves fortified products out, so that concern mostly doesn't apply to what you'd pick here.`;

export function isJuiceFood(resolved: { category: string; subcategory: string | null }): boolean {
  return resolved.category === 'Bev' && resolved.subcategory === 'Juice';
}
