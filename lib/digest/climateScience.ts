import type { DigestEntry } from './types';

// Climate Science & the Weather Machine, a new Earth Matters topic added
// 2026-08-23, direct request: "I am now watching a documentary from 2019
// called Decoding the weather machine. This data is part of the Inside
// Story of our planet and belongs in the Earth Matters area. Research
// everything about the topics discussed in this documentation, branch
// from it to determine what is up to date now about all of that data."
// None of the documentary's own footage or narration is treated as a
// citable source: every entry below traces to the primary agency,
// satellite record, or peer-reviewed study the documentary's own segment
// is actually built on, independently verified via WebSearch, the same
// discipline every entry in this Digest already follows (see
// bodyFatBiology.ts's own header comment for the same approach applied to
// a different documentary).
//
// The film (NOVA, 2019, PBS) covers five throughlines: the physical
// mechanism of the greenhouse effect, direct atmospheric CO2 measurement
// (Ralph Keeling's own Mauna Loa record is a named segment), the
// paleoclimate record preserved in polar ice cores, the emerging science
// of tying specific extreme weather events to a warming climate, and
// climate model reliability. Every one of those five gets its own entry
// below, each explicitly updated past the film's own 2019 vantage point
// with current data: the ice-core record the film describes as
// reaching roughly 800,000 years now reaches 1.2 million as of a January
// 2025 announcement; the film's own attribution science was still young
// in 2019 and has since matured into a repeatable, published methodology;
// atmospheric CO2 has risen further since the film's own 2019 measurement.
// Three more entries branch outward to directly connected current science
// the film itself doesn't cover: satellite-measured sea level rise and
// polar ice sheet mass loss (the direct physical consequence the film's
// own hurricane/drought/wildfire segments describe from the human side),
// a 2022 synthesis of climate tipping-point risk (a term the film uses but
// doesn't quantify), and renewable energy's own cost and deployment
// growth since 2019 (the mitigation side of the story the film's own
// closing segment gestures toward without current numbers to cite).
//
// A first pass, not exhaustive: this is a two-hour documentary built
// around dozens of named scientists and field locations, and this batch
// covers its core scientific throughlines with individually verified,
// current sourcing rather than attempting to reconstruct every scene.
export const CLIMATE_SCIENCE_ENTRIES: DigestEntry[] = [
  {
    id: 'climate-greenhouse-effect-mechanism',
    category: 'earthMatters',
    title: 'The Basic Mechanism Behind a Warming Planet Is Settled, Measurable Physics',
    teaser: 'Certain atmospheric gases let sunlight in but trap the heat Earth radiates back out, and adding more of those gases traps more heat.',
    summary: 'The greenhouse effect is the process by which certain atmospheric gases, mainly carbon dioxide, methane, nitrous oxide, and water vapor, let incoming sunlight through to warm the surface, then absorb and re-radiate the heat that surface tries to release back to space, rather than letting it escape freely. This is not a modeled prediction; it is directly measurable in a laboratory, the same physical property that makes greenhouse glass warm a garden. The distinct chemical fingerprint of the carbon dioxide added to the atmosphere over the last two centuries, its specific ratio of carbon isotopes, matches fossil fuel combustion rather than any natural source, which is how scientists distinguish human-caused CO2 increase from natural background variation rather than merely observing that both are rising together. The Intergovernmental Panel on Climate Change describes human influence on the climate system as unequivocal, a stronger and more direct word than earlier assessment reports used, reflecting an evidence base that has only grown more consistent over successive reports rather than more contested.',
    citations: [
      { source: 'NASA Science: The Causes of Climate Change', url: 'https://science.nasa.gov/climate-change/causes/' },
      { source: 'NASA Science: What Is the Greenhouse Effect?', url: 'https://science.nasa.gov/climate-change/faq/what-is-the-greenhouse-effect/' },
    ],
    overallTier: 'strong',
    relatedIds: ['climate-keeling-curve-co2-record', 'climate-model-track-record'],
  },
  {
    id: 'climate-keeling-curve-co2-record',
    category: 'earthMatters',
    title: 'The Same Direct CO2 Measurement the Film Featured Has Kept Rising Every Year Since',
    teaser: "The continuous Mauna Loa CO2 record featured in the documentary has climbed from roughly 316 parts per million in 1959 to 427 in 2025, with every single year higher than the one before it.",
    summary: "Ralph Keeling, whose own father Charles David Keeling started this measurement in 1958, appears directly in the documentary discussing the continuous atmospheric CO2 record kept at the Mauna Loa Observatory in Hawaii. That record has not paused or reversed since the film's own 2019 vantage point: the annual average climbed from about 316 parts per million in 1959, the first full year of data, to roughly 427 ppm in 2025, with the May 2025 seasonal peak reaching about 432 ppm, and 2026's own annual average is forecast to land near 429 ppm. Every single year on record has measured higher than the year before it. This is the single most direct, least disputable data point in climate science: an unbroken physical air sample measured the same way for nearly seven decades, not a model output or a proxy reconstruction.",
    citations: [
      { source: 'NOAA Global Monitoring Laboratory: Mauna Loa CO2 Trends', url: 'https://gml.noaa.gov/ccgg/trends/mlo.html' },
      { source: 'Scripps Institution of Oceanography: Annual Carbon Dioxide Peak Reaches 432 Parts per Million', url: 'https://scripps.ucsd.edu/news/annual-carbon-dioxide-peak-reaches-432-parts-million' },
    ],
    overallTier: 'strong',
    relatedIds: ['climate-greenhouse-effect-mechanism', 'climate-ice-core-record-extended'],
  },
  {
    id: 'climate-ice-core-record-extended',
    category: 'earthMatters',
    title: "Antarctic Ice Cores Now Reach Back 1.2 Million Years, Well Past What the Film Could Show",
    teaser: "The documentary describes ice-core climate records reaching about 800,000 years into the past. A drilling project reached bedrock in January 2025 and recovered ice more than 1.2 million years old.",
    summary: 'Polar ice sheets trap tiny bubbles of ancient air as snow compacts into ice year by year, so a drilled ice core is a physical archive of the atmosphere\'s own past composition, layer by layer, going back further the deeper the core reaches. At the time the documentary filmed, the deepest continuous ice-core record reached roughly 800,000 years into the past. The Beyond EPICA - Oldest Ice project, drilling at a remote site called Little Dome C in Antarctica, reached bedrock in January 2025 after a multi-year campaign and recovered a 2,800-meter core containing ice more than 1.2 million years old, the oldest ice ever extracted, with the possibility of even older ice preserved near the base. Full laboratory analysis of what this new, older ice actually reveals about that period\'s climate is still ongoing as of this writing, an honest limitation on how much can be said about it today beyond the age itself: reaching the ice is a different milestone from having finished reading what it says.',
    citations: [
      { source: 'British Antarctic Survey: Historic Drilling Campaign Reaches More Than 1.2-Million-Year-Old Ice', url: 'https://www.bas.ac.uk/news/historic-drilling-campaign-reaches-ice-more-than-1-2-million-years-old/' },
    ],
    overallTier: 'moderate',
    stageNote: 'The ice age itself is confirmed; the detailed climate record it contains is still being analyzed.',
    relatedIds: ['climate-keeling-curve-co2-record'],
  },
  {
    id: 'climate-model-track-record',
    category: 'earthMatters',
    title: 'Climate Models From as Far Back as the 1970s Have Tracked What Actually Happened',
    teaser: "A 2020 study checked 17 climate models published between 1970 and 2007 against the warming that actually occurred afterward, and most matched observed temperatures closely once the actual greenhouse gas emissions used as their input are accounted for.",
    summary: "A common line of skepticism about climate projections is that models are unproven guesswork. A 2020 study directly tested this by taking climate models published between 1970 and 2007, the era before the outcome was already known, and checking their projected warming against what was actually observed in the decades since. Most of the models examined were found skillful, closely matching observed global temperature change, once corrected for small differences between the greenhouse gas emissions each model assumed at the time and the emissions that actually occurred, a distinction between a model's own physics being wrong versus its human-behavior input assumptions turning out differently than guessed. NASA's own Goddard Institute for Space Studies published an independent confirmation of the same finding. This does not mean every individual model detail proved correct, and the study's own authors note disagreement in how to weight older, coarser models against newer ones, an honest limitation worth carrying alongside the headline finding rather than treating this as a perfect track record.",
    citations: [
      { source: 'Hausfather et al. 2020, Geophysical Research Letters: Evaluating the Performance of Past Climate Model Projections', url: 'https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2019GL085378' },
      { source: 'NASA GISS: Study Confirms Climate Models Are Getting Future Warming Projections Right', url: 'https://www.giss.nasa.gov/research/features/202001_accuracy/' },
    ],
    overallTier: 'strong',
    relatedIds: ['climate-greenhouse-effect-mechanism', 'climate-extreme-weather-attribution'],
  },
  {
    id: 'climate-extreme-weather-attribution',
    category: 'earthMatters',
    title: 'Scientists Can Now Often Quantify How Much a Specific Storm or Heat Wave Was Made Worse by a Warming Climate',
    teaser: 'Extreme event attribution science, still young when the documentary filmed in 2019, has since matured into a repeatable method that can estimate how much more likely or intense a specific hurricane, drought, or heat wave was because of human-caused warming, often within days of the event itself.',
    summary: "The documentary's own hurricane, drought, wildfire, and extreme-rainfall segments describe a warming climate loading the dice toward worse weather, without always being able to attribute any one specific event to that warming. That is the exact science that has matured since the film released. World Weather Attribution, founded in 2015, has since completed more than 100 rapid studies on individual heat waves, floods, droughts, and wildfires around the world, using a standard, peer-reviewed methodology (26 of these studies have also gone through separate, full journal peer review) to estimate how much more likely, or how much more intense, a specific event was made by human-caused warming, typically published within days to weeks of the event rather than the months or years a full academic study takes. This speed is itself the honest tradeoff: individual rapid studies are released before undergoing the same peer review as most other science in this Digest, even though the underlying method has been peer-reviewed and validated separately.",
    citations: [
      { source: 'World Weather Attribution: 10 Years of Rapidly Disentangling Drivers of Extreme Weather Disasters', url: 'https://www.worldweatherattribution.org/10-years-of-rapidly-disentangling-drivers-of-extreme-weather-disasters/' },
      { source: 'Philip et al. 2021, Climatic Change: Pathways and Pitfalls in Extreme Event Attribution', url: 'https://link.springer.com/article/10.1007/s10584-021-03071-7' },
    ],
    overallTier: 'moderate',
    stageNote: 'The underlying method is peer-reviewed; any single rapid-response study released within days of an event has not itself gone through full journal peer review.',
    relatedIds: ['climate-model-track-record'],
  },
  {
    id: 'climate-warmest-years-on-record',
    category: 'earthMatters',
    title: 'The Eleven Warmest Years Ever Measured Are the Eleven Years Ending in 2025',
    teaser: "The World Meteorological Organization's official multi-agency analysis places 2025 among the three hottest years on record, at roughly 1.43°C above the 1850-1900 average, with 2015 through 2025 standing as the eleven warmest years across every dataset used.",
    summary: "The World Meteorological Organization's State of the Global Climate report combines independent temperature datasets from multiple national and international agencies rather than relying on a single source. Its 2025 edition places that year among the second or third warmest on record, at approximately 1.43 degrees Celsius above the 1850-1900 preindustrial average, and confirms that 2015 through 2025 are the eleven warmest years in every one of the datasets used. The same report identifies Earth's energy imbalance, the difference between incoming solar energy and the energy the planet radiates back to space, at a record high in 2025, with the oceans absorbing more than 90% of that trapped heat, which the report treats as a more fundamental indicator than any single year's surface-temperature ranking since it reflects the underlying physical accumulation rather than a single year's weather variability.",
    citations: [
      { source: 'World Meteorological Organization: WMO Confirms 2025 Was One of Warmest Years on Record', url: 'https://wmo.int/news/media-centre/wmo-confirms-2025-was-one-of-warmest-years-record' },
    ],
    overallTier: 'strong',
    relatedIds: ['climate-greenhouse-effect-mechanism'],
  },
  {
    id: 'climate-tipping-points-risk',
    category: 'earthMatters',
    title: 'A Major Science Synthesis Names Specific Climate Thresholds That Grow More Likely Above 1.5°C',
    teaser: 'A 2022 synthesis of over 200 studies published in the journal Science identified several climate tipping points, including West Antarctic ice sheet collapse and permafrost thaw, that shift from possible to likely once global warming passes 1.5°C.',
    summary: "A climate tipping point is a threshold beyond which a part of the climate system shifts to a different, often self-reinforcing state that does not easily reverse even if warming later slows. A 2022 synthesis in the journal Science reviewed over 200 papers published since tipping points were first rigorously defined in 2008 and concluded that even at today's level of warming, the world is already at risk of passing several of these thresholds, with four moving from possible to likely once global average warming passes 1.5°C above preindustrial levels, and signs of destabilization already visible in parts of the West Antarctic and Greenland ice sheets, permafrost regions, and the Amazon rainforest. This is fundamentally a risk assessment built from paleoclimate evidence and physical modeling rather than a directly observed event, an honest distinction from the directly measured entries elsewhere in this topic: the specific temperature threshold and timing for any one tipping point carry acknowledged uncertainty, even though the existence of the underlying mechanisms is well established.",
    citations: [
      { source: 'Armstrong McKay et al. 2022, Science: Exceeding 1.5°C Global Warming Could Trigger Multiple Climate Tipping Points', url: 'https://pubmed.ncbi.nlm.nih.gov/36074831/' },
    ],
    overallTier: 'moderate',
    stageNote: 'The mechanisms behind each named tipping point are well established; the specific temperature threshold and timing for any one of them carry acknowledged scientific uncertainty.',
    relatedIds: ['climate-ice-sheet-mass-loss', 'climate-warmest-years-on-record'],
  },
  {
    id: 'climate-sea-level-rise-acceleration',
    category: 'earthMatters',
    title: 'Satellite Measurements Show Sea Level Rise Has More Than Doubled Its Pace Since Tracking Began',
    teaser: 'Continuous satellite altimetry since 1993 shows the rate of global sea level rise increasing from about 2.1 millimeters per year in the early 1990s to about 4.5 millimeters per year by the early 2020s.',
    summary: "Since 1992, a continuous series of satellites (TOPEX, followed by the Jason series) has measured global sea level using radar altimetry, a direct physical measurement rather than a model projection. That record shows the rate of rise itself accelerating, not just sea level rising at a steady pace: from roughly 2.1 millimeters per year when satellite tracking began in the early 1990s to roughly 4.5 millimeters per year three decades later, driven by both ocean water expanding as it warms and melting land ice adding new water to the ocean. Year-to-year weather patterns still matter on top of that longer trend: 2024 saw a faster-than-usual rise partly driven by El Niño conditions, while 2025's rise came in below the long-term expected rate, a reminder that any single year's reading should be read against the multi-decade trend rather than in isolation.",
    citations: [
      { source: 'NASA: NASA Analysis Shows La Niña Limited Sea Level Rise in 2025', url: 'https://www.nasa.gov/earth/nasa-analysis-shows-la-nina-limited-sea-level-rise-in-2025/' },
      { source: 'NOAA Climate.gov: Climate Change: Global Sea Level', url: 'https://www.climate.gov/news-features/understanding-climate/climate-change-global-sea-level' },
    ],
    overallTier: 'strong',
    relatedIds: ['climate-ice-sheet-mass-loss'],
  },
  {
    id: 'climate-ice-sheet-mass-loss',
    category: 'earthMatters',
    title: 'Satellite Gravity Measurements Show Greenland and Antarctica Both Losing Ice, at Different Rates',
    teaser: "The GRACE and GRACE-FO satellite missions, which measure ice sheets by their gravitational pull, show Greenland losing roughly 264 gigatons of ice per year and Antarctica roughly 135 gigatons per year on average since 2002.",
    summary: 'The GRACE satellite mission, and its successor GRACE-FO since 2018, measure ice sheet mass directly through tiny, precisely tracked changes in Earth\'s gravitational field rather than estimating ice volume from surface photography. Since 2002, this record shows Greenland losing an average of roughly 264 gigatons of ice per year, contributing about 0.8 millimeters of sea level rise annually on its own, and Antarctica losing an average of roughly 135 gigatons per year, contributing about 0.4 millimeters annually. The two ice sheets are not behaving identically: West Antarctica accounts for most of Antarctica\'s own loss, while East Antarctica has actually gained modest mass from increased snowfall over the same period, a regional difference worth stating rather than treating "Antarctica" as one uniform trend.',
    citations: [
      { source: 'NASA Sea Level Change Portal: GRACE, GRACE-FO Satellite Data Track Ice Loss at the Poles', url: 'https://sealevel.nasa.gov/news/184/grace-grace-fo-satellite-data-track-ice-loss-at-the-poles/' },
    ],
    overallTier: 'strong',
    relatedIds: ['climate-sea-level-rise-acceleration', 'climate-tipping-points-risk'],
  },
  {
    id: 'climate-renewable-energy-growth',
    category: 'earthMatters',
    title: 'Solar Power Has Gotten Cheap Enough to Drive Most of the World\'s New Renewable Capacity, a Real Change Since the Film Released',
    teaser: 'Falling costs and faster permitting have made solar photovoltaic power the fastest-growing source of new electricity generation capacity worldwide, with the International Energy Agency projecting it will drive about 80% of global renewable capacity growth through 2030.',
    summary: "The documentary's own closing segment gestures toward mitigation and adaptation without current numbers to cite, since it filmed in 2019. What has changed since then is a measurable market shift: the International Energy Agency's 2025 renewables report projects global renewable power capacity growing by 4,600 gigawatts by 2030, with solar photovoltaic power alone accounting for roughly 80% of that growth, driven by falling costs and faster permitting rather than subsidy alone, and 2025 itself is on track to be a record year for new solar additions. Renewables are projected to become the largest single source of global electricity generation by the end of the decade. The honest limitation: the IEA's own 2025 forecast is actually lower than its 2024 forecast for the same future period, a roughly 5% downward revision attributed mainly to policy changes in the United States and China, a reminder that this growth trend is driven by policy choices as much as by falling technology costs, and is not a guaranteed trajectory independent of those choices.",
    citations: [
      { source: 'International Energy Agency: Renewables 2025, Executive Summary', url: 'https://www.iea.org/reports/renewables-2025/executive-summary' },
    ],
    overallTier: 'moderate',
    stageNote: 'The cost and deployment data are measured market facts; the multi-year forecast built on top of them depends on policy choices that can and did change between the 2024 and 2025 editions of this same report.',
    relatedIds: ['climate-greenhouse-effect-mechanism'],
  },
];
