import type { DigestEntry } from './types';

// Built 2026-08-09, a genuinely new Digest topic, direct request: "Let's
// provide information in the Digest, outside of Basic Health, about
// subsidizing their own food by grown fresh fruits and vegetables at
// home... For Home Gardening, name it that and put all of the information
// in it. Make sure to include what to grow in the area where they live."
//
// Every citation below was independently verified via WebSearch/WebFetch
// before being written in, the same standing discipline this whole Digest
// runs on. "The area where they live" is answered through a real,
// established climate-zone framework (the USDA Plant Hardiness Zone Map,
// plus a short, honest note on international equivalents) instead of a
// personalized feature -- Profile carries no location or zone field this
// app could build a real per-person calculator against yet, so this is
// organized so someone can look up their own zone and read the matching
// guidance, the same reasonable, honest first pass this Digest has already
// taken with several other not-yet-personalized topics.
//
// A first, deliberately bounded batch: 14 entries covering the real
// economics of growing food at home, how to find and read a growing zone,
// four climate bands (cold/short-season, moderate, warm, tropical), a real
// inverted-calendar fact for hot climates most people never hear, container
// and small-space growing, an honest note on which crops return the most
// grocery value, the easiest crops for a first-time gardener, real season-
// extension techniques, a measured freshness/nutrient benefit over shipped
// produce, a soil-safety caution for urban soil, and a direct link back to
// this app's own Earth Matters pollinator research. Growing even a small
// amount of food at home is a concrete answer to "what can one person
// actually do."
//
// A second batch, same day, direct instruction: "Keep going with more
// research on this topic." 9 more entries covering the real, practical
// mechanics the first batch didn't reach: composting, choosing seeds vs.
// buying transplants, no-dig raised beds, water-efficient irrigation,
// pest management without pesticides, growing perennial fruit (a real,
// different planning horizon from annual vegetables), preserving a real
// harvest surplus, saving seeds, and vertical/trellised growing. Several
// cross-link directly back to Earth Matters (composting counters real soil
// depletion; no-dig mirrors the same soil-biology principle Earth Matters'
// own Brazil case study documents at commercial scale; drip irrigation is a
// small-scale answer to the same water-scarcity problem the Ogallala
// Aquifer entry documents; avoiding home pesticide use directly protects
// the same pollinators the neonicotinoid-loophole entry covers; seed
// saving is a real, individual-level counter to the seed-diversity-loss
// entry). Every citation independently verified via WebSearch/WebFetch.
//
// A third batch, same day, direct instruction to keep going. 7 more
// entries: indoor/windowsill herb growing, microgreens and sprouts (the
// fastest, smallest-footprint real food option this category covers, with
// an honest, separate food-safety caution for raw sprouts specifically),
// mulching, crop rotation, cover crops for a home garden (a direct,
// individual-level counterpart to Earth Matters' own finding that cover
// cropping remains rare even at commercial scale), the real but honestly
// mixed-quality evidence on gardening's mental-health benefit, and
// community gardens for anyone with no private growing space at all,
// closing with a real randomized controlled trial's quantified vegetable-
// intake result. This session's own WebSearch budget was exhausted
// partway through this batch (confirmed via a direct tool-system message)
// -- every citation from that point on was found via the established
// WebFetch-against-real-pages fallback (a DuckDuckGo HTML search-result
// page fetched and read directly, then the real source page itself
// fetched and verified), never fabricated.
export const HOME_GARDENING_ENTRIES: DigestEntry[] = [
  {
    id: 'garden-economics-subsidizing-food',
    category: 'homeGardening',
    title: 'What a Home Vegetable Garden Actually Saves',
    teaser: 'A well-tended 600-square-foot vegetable garden costs about $70 to plant and can produce roughly $600 worth of fresh food over one season.',
    summary:
      "The most commonly cited figure behind the idea that a home garden subsidizes groceries traces to a National Gardening Association survey: a national-average 600-square-foot food garden, run with an average investment of about $70 in seeds, plants, and supplies, produces an estimated 300 pounds of fresh produce worth roughly $600 at in-season market prices, a net return around $530. That figure has held up across independent restatements since, including a University of Connecticut Extension article on gardening economics that cites the same $70-to-$600 relationship directly. A separate, independently sourced yield estimate from University of Kentucky Cooperative Extension states that a well-planned garden should produce 600 to 700 pounds of produce per 1,000 square feet, which lines up closely with the National Gardening Association's own roughly 500-pound-per-1,000-square-foot figure. The exact dollar amount depends heavily on local grocery prices, which crops are actually planted, and how much labor and water go into the garden, none of which the underlying survey can control for precisely. What holds up across every source is the basic shape of the trade: the cost of seeds and a few supplies sits far below the grocery-store value of what a modestly sized, reasonably maintained garden produces, and the ratio scales down proportionally for a much smaller plot or a handful of containers.",
    citations: [
      {
        source: 'National Gardening Association / Garden Research: The Impact of Home and Community Gardening in America',
        url: 'https://gardenresearch.com/files/2009-Impact-of-Gardening-in-America-White-Paper.pdf',
      },
      {
        source: 'University of Connecticut Extension: Grow Vegetables, Save Money',
        url: 'https://homegarden.cahnr.uconn.edu/2024/04/04/grow_veggies_save_money/',
      },
      {
        source: 'University of Kentucky Cooperative Extension: Vegetable Garden Planning publication (yield-per-area estimate)',
        url: 'https://publications.mgcafe.uky.edu/id-128',
      },
    ],
    overallTier: 'moderate',
    stageNote: 'The exact dollar figure is a survey-based estimate, not a controlled trial, and moves with local grocery prices and what actually gets planted. The underlying pattern (input cost well below harvest value) holds up across independent sources.',
    relatedIds: ['foodhistory-regen-food-desert-access-inequality', 'garden-highest-value-crops', 'garden-understanding-your-zone', 'foodhistory-regen-how-to-get-involved'],
    chart: {
      title: 'A National-Average 600-Square-Foot Garden, One Season',
      unit: '$',
      data: [
        { label: 'Average investment', value: 70 },
        { label: 'Produce value at market prices', value: 600 },
      ],
      sourceNote: 'National Gardening Association / Garden Research white paper, real survey-based figures',
    },
  },
  {
    id: 'garden-understanding-your-zone',
    category: 'homeGardening',
    title: 'Finding a Real Growing Zone Before Planting Anything',
    teaser: 'The USDA updated its Plant Hardiness Zone Map in 2023 using three real decades of weather data, and most other countries run their own different version of the same idea.',
    summary:
      "The USDA Plant Hardiness Zone Map, updated in November 2023 for the first time in 11 years, divides the US and its territories into 13 zones based on the average annual extreme minimum winter temperature, each split into 10-degree Fahrenheit bands with a and b half-zones. The 2023 update used weather data from 1991 to 2020 (versus data running only through 2005 in the prior 2012 map) drawn from 13,412 weather stations, nearly double the 7,983 stations used before, and added two new zones (12 and 13) that only appear in Hawaii and Puerto Rico. Anyone in the US or its territories can find their own zone by entering a zip code at planthardiness.ars.usda.gov. Other countries run genuinely different systems that don't translate directly. Canada's own official map, maintained by Natural Resources Canada, factors in frost-free days, summer rainfall, and snow cover alongside minimum temperature, not minimum temperature alone, so a plant rated for USDA Zone 5 is not automatically safe in Canadian Zone 5. The UK's Royal Horticultural Society uses a plant-based rating (H1a through H7) rather than a location-based map. Australia uses 5-degree-Celsius bands numbered roughly six lower than the equivalent USDA zone, so Australian Zone 3 corresponds to roughly USDA Zone 9. One honest limit worth stating directly: a hardiness zone describes winter cold tolerance for perennial plants. Most food crops are annuals, and what actually determines whether a vegetable garden succeeds is the length of the frost-free growing season and the average last and first frost dates for that specific location, a related but different number worth looking up alongside the zone itself.",
    citations: [
      {
        source: 'USDA Agricultural Research Service: 2023 USDA Plant Hardiness Zone Map',
        url: 'https://planthardiness.ars.usda.gov/',
      },
      {
        source: 'Natural Resources Canada: Plant Hardiness Site',
        url: 'https://planthardiness.gc.ca/',
      },
      {
        source: 'Wikipedia: Hardiness zone (international systems, including the UK Royal Horticultural Society and Australia)',
        url: 'https://en.wikipedia.org/wiki/Hardiness_zone',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A zone number describes winter cold, not growing-season length. The entries below use it as a rough regional guide alongside real frost-date and calendar information, not as a precise planting calculator.',
    relatedIds: ['garden-cold-short-season-crops', 'garden-moderate-climate-crops', 'garden-warm-climate-crops', 'garden-tropical-subtropical-crops'],
  },
  {
    id: 'garden-cold-short-season-crops',
    category: 'homeGardening',
    title: 'Zones 3 Through 5: Growing Inside a Real, Short Window',
    teaser: 'A cold-climate garden still produces a real harvest by leaning on crops that tolerate frost and mature fast, not the same lineup a warmer garden would choose.',
    summary:
      "Zones 3 through 5 cover much of the northern US and typically see around 145 frost-free days in a place like Minnesota, meaning the entire growing season has to be planned around that window rather than around the calendar year. University of Minnesota Extension splits the real strategy into two groups. Cool-season crops go in as soon as soil temperature reaches 40 to 50 degrees Fahrenheit, typically late April to early May: peas, spinach, lettuce, radishes, carrots, beets, kale, Swiss chard, onions from sets or transplants, and potatoes all tolerate cold soil and light frost. Warm-season crops (tomatoes, peppers, eggplant, summer squash, basil) wait until after the last spring frost, usually mid-to-late May in this zone band, since a hard frost at 28 degrees or colder kills most of them outright. Kale is a useful example of the real range within cool-season crops: it takes about as long to mature as bush snap beans, but keeps growing in cool weather and can survive down to roughly 20 degrees Fahrenheit, well past what most other vegetables tolerate. The Midwestern Regional Climate Center maintains an interactive map of average first and last freeze dates by location, the single most useful planning number for anyone gardening in this zone band specifically.",
    citations: [
      {
        source: 'University of Minnesota Extension: Extending the Growing Season',
        url: 'https://extension.umn.edu/planting-and-growing-guides/extending-growing-season',
      },
      {
        source: 'University of Minnesota Extension: Planting the Vegetable Garden',
        url: 'https://extension.umn.edu/planting-and-growing-guides/planting-vegetable-garden',
      },
    ],
    overallTier: 'strong',
    stageNote: 'The same cool-season crop list works in the early spring or late fall of any zone, not only a genuinely cold one. The real difference in zones 3 through 5 is how much of the year has to be spent inside that cool-season window.',
    relatedIds: ['garden-understanding-your-zone', 'garden-extending-the-season', 'garden-easiest-beginner-crops'],
  },
  {
    id: 'garden-moderate-climate-crops',
    category: 'homeGardening',
    title: 'Zones 6 Through 8: The Widest Real Range of Crops',
    teaser: 'This zone band, home to most of the mid-Atlantic, Midwest, and Pacific Northwest, is where a real spring round and a real summer round often both fit into a single season.',
    summary:
      "Zones 6 through 8 cover the broadest population base of any US zone band, and much of the generic gardening advice found online is quietly written for it without saying so. The growing season here is typically long enough to run cool-season spring crops (lettuce, peas, broccoli, spinach) to harvest, then follow directly with warm-season summer crops (tomatoes, beans, corn, squash, melons) in the same bed, and often still have room for a second cool-season round in fall before the first frost. University of Maryland Extension describes this as succession planting: staggering which crop occupies a given bed across the season, either by following one crop directly with another as soon as it's harvested, or by making several smaller plantings of the same crop two to three weeks apart to spread the harvest out instead of getting it all at once. A practical spring-to-fall sequence might run peas in early spring, bush beans once the soil warms, and carrots or beets again once the weather cools, keeping a given bed producing food for most of the growing season rather than for one harvest window.",
    citations: [
      {
        source: 'University of Maryland Extension: Planting Vegetables in Succession',
        url: 'https://extension.umd.edu/resource/planting-vegetables-succession',
      },
      {
        source: 'University of Minnesota Extension: Planting the Vegetable Garden',
        url: 'https://extension.umn.edu/planting-and-growing-guides/planting-vegetable-garden',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Succession planting matters most in exactly this zone band, since it is the one with enough real season length to run two or three real rounds through the same bed.',
    relatedIds: ['garden-understanding-your-zone', 'garden-highest-value-crops'],
  },
  {
    id: 'garden-warm-climate-crops',
    category: 'homeGardening',
    title: 'Zones 9 and 10: A Real, Inverted Growing Calendar',
    teaser: 'In much of Florida and the Gulf South, winter is the real peak vegetable season, and summer is often too hot for tomatoes to set fruit at all.',
    summary:
      "Warm zones flip the calendar most gardening advice assumes. University of Florida IFAS Extension's own Florida Vegetable Gardening Guide states that most vegetables cannot set fruit once temperatures consistently exceed 92 degrees Fahrenheit, which makes much of a real Florida summer largely unsuitable for warm-season fruiting crops like tomatoes and peppers, even though those same crops thrive there the rest of the year. The dry season, roughly November through April, is described directly as when Florida gardens actually shine, the opposite of the spring-to-fall pattern that governs a cooler zone. UF/IFAS publishes three distinct regional planting windows, North, Central, and South Florida, since a single statewide calendar would be wrong for large parts of the state; the Central Florida (Zone 9b) window can generally be shifted four to six weeks earlier for Zone 10 and four to six weeks later for Zone 8. The practical takeaway for anyone in a warm zone: treat late fall through early spring as the real primary growing season, and check a regional planting calendar rather than assuming a spring-planting rule written for a colder climate applies.",
    citations: [
      {
        source: 'University of Florida IFAS Extension: Florida Vegetable Gardening Guide (SP 103/VH021)',
        url: 'https://ask.ifas.ufl.edu/publication/VH021',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, specific, regionally documented finding, not a general rule of thumb -- the 92-degree fruit-set threshold and the three-region planting-window structure both come directly from University of Florida\'s own extension guide.',
    relatedIds: ['garden-understanding-your-zone', 'garden-tropical-subtropical-crops'],
  },
  {
    id: 'garden-tropical-subtropical-crops',
    category: 'homeGardening',
    title: 'Zones 10 Through 13: True Year-Round, With Its Own Real Rules',
    teaser: 'A frost-free climate can grow food every month of the year, but the crop list looks genuinely different from a temperate garden, not just a warmer version of the same one.',
    summary:
      "In a genuinely tropical or subtropical climate, frost essentially never occurs, so gardening is a year-round activity rather than a seasonal one, per University of Hawaii Cooperative Extension guidance. That doesn't mean every crop grows every month, though. Heat-loving crops like eggplant, okra, and peppers thrive during the hottest stretch of the year, while cooler-weather crops like lettuce, broccoli, and carrots need to be timed to the coolest months even in a climate that never truly freezes, since constant heat and humidity cause many temperate crops to bolt or fail regardless of frost. Root and starch crops well suited to tropical soil and heat, sweet potato, taro, and cassava, along with heat-tolerant legumes like yard-long beans, fill a real role in a tropical garden that a temperate-zone crop list doesn't usually cover at all. This is a genuinely different crop planning problem from a simple warmer version of a temperate garden: the constraint shifts from surviving winter cold to timing each crop to whichever part of the year actually suits it, which can mean real month-by-month rotation even without a single frost anywhere in the calendar.",
    citations: [
      {
        source: 'University of Hawaii Cooperative Extension Service (CTAHR): Home Garden Vegetable production guide',
        url: 'https://www.ctahr.hawaii.edu/oc/freepubs/pdf/hgv-2.pdf',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Sourced from a real, dedicated tropical-agriculture extension program rather than a temperate-zone guide extrapolated downward, since tropical crop timing genuinely doesn\'t follow the same logic.',
    relatedIds: ['garden-understanding-your-zone', 'garden-warm-climate-crops'],
  },
  {
    id: 'garden-container-small-space',
    category: 'homeGardening',
    title: 'Growing Real Food Without a Yard',
    teaser: 'A handful of containers on a balcony or patio can produce a genuine harvest, not just herbs, with the right crop choices.',
    summary:
      "Container gardening removes the biggest real barrier to growing food at all: not having a yard. Colorado State University Extension's own container-vegetable guidance names compact, bush, and patio varieties of the same crops that thrive in a full garden bed, tomatoes (cherry, patio, and compact bush types especially), peppers, bush beans, bush cucumbers grown on a small trellis, peas, and compact zucchini varieties, all reported to do well in containers with adequate soil volume and consistent watering. Leafy greens and arugula are especially well suited to container growing since they mature fast and can be harvested repeatedly from the same planting rather than pulled all at once, which stretches a single container's real output over weeks. Herbs are close to ideal container crops: a single well-tended basil plant, for example, can be harvested continually for months from a pot no larger than a dinner plate. None of this requires a yard, a raised bed, or even direct access to ground soil, only enough sun (most fruiting vegetables need at least six hours a day) and a container deep enough for the crop's own root system.",
    citations: [
      {
        source: 'Colorado State University Extension (PlantTalk Colorado): Container Vegetable Varieties',
        url: 'https://planttalk.colostate.edu/topics/vegetables/1838-container-vegetable-varieties/',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Directly relevant to anyone without land access, including renters and apartment dwellers, and a real, practical individual-level counterpart to this app\'s own Earth Matters research on food access.',
    relatedIds: ['garden-easiest-beginner-crops', 'foodhistory-regen-food-desert-access-inequality'],
  },
  {
    id: 'garden-highest-value-crops',
    category: 'homeGardening',
    title: 'Which Crops Actually Return the Most Grocery Value',
    teaser: 'Herbs, leafy greens harvested repeatedly, and tomatoes consistently return the most grocery-store value for the least growing space, not the crops most people assume.',
    summary:
      "Not every crop returns the same value for the space it takes up. University of Connecticut Extension's own gardening-economics guidance points to two real patterns behind the highest-value choices. First, herbs and any crop harvested repeatedly rather than all at once (cut-and-come-again lettuce, kale, chard, arugula) return more value over a season than a once-and-done crop occupying the same square footage, since a single plant keeps producing for weeks or months instead of yielding one harvest. Second, a genuine price gap between the store-bought and home-grown version matters more than sheer pounds produced: a head of lettuce costs a few dollars at a grocery store, while a seed packet with hundreds of seeds costs about the same amount and can supply multiple plantings across two or three growing seasons. Tomatoes remain the most widely grown home-garden vegetable in the US for a related reason: a well-tended plant produces a genuinely large volume of fruit that would be comparatively expensive to buy fresh, especially outside of peak season. The lowest-value choices tend to be crops that are already cheap and shelf-stable at the store (potatoes, onions in bulk), where the real savings from growing them at home are smaller relative to the growing space and time required.",
    citations: [
      {
        source: 'University of Connecticut Extension: Grow Vegetables, Save Money',
        url: 'https://homegarden.cahnr.uconn.edu/2024/04/04/grow_veggies_save_money/',
      },
    ],
    overallTier: 'moderate',
    stageNote: 'A real, general pattern rather than a precise per-crop dollar ranking. Exact value depends heavily on local grocery prices for the specific crop being compared.',
    relatedIds: ['garden-economics-subsidizing-food', 'garden-moderate-climate-crops'],
  },
  {
    id: 'garden-easiest-beginner-crops',
    category: 'homeGardening',
    title: 'The Easiest Real Crops for a First Garden',
    teaser: 'University of Georgia horticulturists call radishes "practically bomb-proof," ready to harvest in under a month.',
    summary:
      "A first garden succeeds or fails largely on crop choice, and University of Georgia Cooperative Extension horticulturists recommend a short, specific list for exactly that reason. Radishes mature fastest of any common vegetable, often ready to harvest in as few as 24 to 28 days from seed, and tolerate a wide range of soil and care levels well enough to be described directly as practically bomb-proof. Lettuce is called the most forgiving plant for a beginner garden: many varieties are ready in about 30 days, and since leaves can be snipped as needed rather than the whole plant pulled at once, a single sowing keeps producing for weeks. Bush beans mature quickly and produce prolifically with minimal care, and green beans overall are named among the easiest vegetables to grow reliably. Zucchini rounds out the list: a small number of plants, often as few as three, reliably produces more squash than most households can use. None of these four require a greenhouse, raised bed, or any prior gardening experience, only consistent watering and a reasonably sunny spot.",
    citations: [
      {
        source: 'University of Georgia Cooperative Extension: Horticulturists recommend five plants for beginning gardeners',
        url: 'https://news.uga.edu/five-plants-for-beginning-gardeners',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, named extension recommendation aimed specifically at first-time gardeners, not a general "easy crops" list assembled from popular opinion.',
    relatedIds: ['garden-container-small-space', 'garden-cold-short-season-crops'],
  },
  {
    id: 'garden-extending-the-season',
    category: 'homeGardening',
    title: 'Real Ways to Stretch a Growing Season by Six to Eight Weeks',
    teaser: 'A floating row cover, a cold frame, or a simple hoop house can each add real weeks onto both ends of a growing season, in any zone.',
    summary:
      "Season-extension tools work by creating a small, unheated microclimate around a plant, and Clemson Cooperative Extension's Home & Garden Information Center describes several real, low-cost options that apply in any zone. A floating row cover is a lightweight, permeable fabric laid directly over plants, raising the humidity and temperature around them enough to protect against light frost without any support structure. A hooped row cover, or low tunnel, suspends that same fabric over a series of wire or PVC hoops, giving better protection against cold, wind, and hail than a floating cover alone. A cold frame is a small, bottomless box with a clear lid that relies entirely on the sun for heat during the day and a closed lid to slow heat loss at night, useful both for hardening off seedlings and for growing genuinely cold-tolerant crops through the shoulder seasons. A hoop house, also called a high tunnel, is a larger, walk-in version of the same basic idea, essentially an unheated greenhouse. Used well, these tools extend a growing season by a real six to eight weeks combined, spring and fall, letting a gardener in almost any zone start earlier and harvest later than the raw frost dates alone would allow.",
    citations: [
      {
        source: 'Clemson Cooperative Extension, Home & Garden Information Center: Extending the Growing Season in South Carolina',
        url: 'https://hgic.clemson.edu/extending-the-growing-season-in-south-carolina-row-covers-cold-frames-and-other-tricks/',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Most useful in a shorter-season zone, but the same techniques genuinely help in any climate by protecting an early spring or late fall planting from an unexpected cold snap.',
    relatedIds: ['garden-cold-short-season-crops', 'garden-moderate-climate-crops'],
  },
  {
    id: 'garden-freshness-nutrient-retention',
    category: 'homeGardening',
    title: 'A Real, Measured Freshness Benefit Shipped Produce Structurally Can\'t Match',
    teaser: 'Refrigerated spinach loses about half its folate and carotenoids within four to eight days of harvest, faster the warmer it\'s kept.',
    summary:
      "A real 2004 Journal of Food Science study by Penn State researchers Pandrangi and LaBorde measured how fast spinach loses nutrients after harvest at three different storage temperatures. Kept at 39 degrees Fahrenheit, typical refrigerator temperature, spinach retained only 53 percent of its folate after eight days. At 50 degrees, it took just six days to lose the same roughly 47 percent, and at 68 degrees, room temperature, it took only four days. Carotenoid loss followed the same pattern: faster at every step the warmer the storage temperature. This isn't unique to spinach; broccoli loses over half its vitamin C within a week when stored at room temperature, though refrigeration slows that loss considerably too. The real, structural point behind these numbers: grocery-store produce has already spent real days between harvest and refrigerated display, then more time in a home refrigerator before it's eaten, meaning meaningful nutrient loss has already happened before it reaches a plate no matter how well it's handled afterward. Produce harvested and eaten within hours, the norm for a home garden, sidesteps most of this loss entirely, a real freshness benefit distinct from the cost savings covered elsewhere in this category.",
    citations: [
      {
        source: 'ScienceDaily, summarizing Pandrangi & LaBorde 2004, Journal of Food Science: Storage Time and Temperature Effects Nutrients in Spinach',
        url: 'https://www.sciencedaily.com/releases/2005/03/050323124809.htm',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, controlled, published measurement, not an estimate. The exact retention percentage varies by nutrient and crop, but the direction (faster loss at higher temperature, meaningful loss within days) is well established.',
    relatedIds: ['garden-economics-subsidizing-food'],
    chart: {
      title: 'Days Before Refrigerated Spinach Loses About Half Its Folate and Carotenoids',
      unit: 'days',
      data: [
        { label: '39°F, typical refrigerator', value: 8 },
        { label: '50°F', value: 6 },
        { label: '68°F, room temperature', value: 4 },
      ],
      sourceNote: 'Pandrangi & LaBorde 2004, Journal of Food Science, real measured spinach nutrient retention',
    },
  },
  {
    id: 'garden-soil-safety-lead',
    category: 'homeGardening',
    title: 'A Real, Responsible Caution Before Planting Directly in Urban Soil',
    teaser: 'Soil near an older painted structure, a busy road, or a former industrial site can carry elevated lead, and it\'s worth a real, cheap test before planting food directly in the ground there.',
    summary:
      "University of Maryland Extension's own guidance on lead in garden soils gives real, specific thresholds worth knowing before planting a food garden in an urban or older-property setting. Natural background lead levels typically run under 50 parts per million. Between 50 and 400 ppm, all vegetables are considered safe to grow. Between 401 and 1,000 ppm, only fruiting crops, tomatoes, peppers, cucumbers, squash, and corn, are recommended, since they accumulate far less lead in their edible parts than leafy greens or root vegetables (carrots in particular readily take up lead and store it in the part that gets eaten). Above 1,000 ppm, the safer approach is a raised bed with at least eight inches of clean topsoil and compost placed on top of the contaminated ground rather than planting directly into it, and above 5,000 ppm, soil removal is recommended outright. A cheap soil test through a local extension office is the real first step before planting a food garden anywhere the soil history is unknown, especially near an older home (lead paint), a busy roadway (historical leaded-gasoline residue), or a former industrial site. Practical mitigation that helps at moderate contamination levels: keeping soil pH in the 6.0 to 7.0 range, ensuring at least a third of the top eight inches of soil is organic matter by volume, applying mulch to reduce dust and soil contact, and washing all produce and peeling root crops before eating.",
    citations: [
      {
        source: 'University of Maryland Extension: Lead in Garden Soils',
        url: 'https://extension.umd.edu/resource/lead-garden-soils',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, specific, extension-sourced set of thresholds, not a general "test your soil" gesture. Worth acting on before planting directly in ground with an unknown history, not after.',
    relatedIds: ['garden-understanding-your-zone'],
    chart: {
      title: 'Soil Lead Level and What It Means for a Vegetable Garden',
      unit: 'ppm',
      data: [
        { label: 'Typical natural background', value: 50 },
        { label: 'Safe for all vegetables, up to', value: 400 },
        { label: 'Restricted to fruiting crops, up to', value: 1000 },
        { label: 'Soil removal recommended, above', value: 5000 },
      ],
      sourceNote: 'University of Maryland Extension, real soil-lead thresholds for vegetable gardening',
    },
  },
  {
    id: 'garden-composting-at-home',
    category: 'homeGardening',
    title: 'Turning Kitchen and Yard Scraps Into Real, Free Soil Amendment',
    teaser: 'A backyard compost pile turns food scraps and yard trimmings into finished compost in about three to five months, at essentially no cost.',
    summary:
      "Backyard composting is a real, direct way to feed a garden without buying fertilizer, and the EPA's own guidance lays out exactly how it works. A pile built from roughly two to three parts \"browns\" (dry leaves, shredded cardboard, straw) to one part \"greens\" (fruit and vegetable scraps, grass clippings, coffee grounds), kept moist and turned occasionally, produces finished compost in about three to five months. A worm bin, or vermicomposting system, uses red wiggler worms instead and works on a similar three-to-six-month timeline, a real option for anyone without outdoor space for a pile. What to leave out matters as much as what to include: meat, fish, bones, dairy, fats and oils, pet waste, and diseased plant material should stay out of a home compost system, since they attract pests or fail to break down safely at typical backyard pile temperatures. Beyond the free soil amendment itself, the EPA notes finished compost improves water retention and soil structure, and applying it to land keeps carbon stored in the soil rather than released to the atmosphere, a small, real, individual-level version of the same soil-carbon principle covered at a much larger scale in this app's own Earth Matters research.",
    citations: [
      {
        source: 'US EPA: Composting At Home',
        url: 'https://www.epa.gov/recycle/composting-home',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, EPA-sourced practical guide, not a general "compost is good" gesture. The three-to-five-month timeline and the browns-to-greens ratio are both directly stated by the source, not estimated.',
    relatedIds: ['garden-no-dig-raised-beds', 'foodhistory-soil-real-depletion'],
  },
  {
    id: 'garden-seed-starting-vs-transplants',
    category: 'homeGardening',
    title: 'Seeds Can Cost Up to 20 Times Less Than Buying Transplants',
    teaser: 'A single seed packet can produce far more plants than the equivalent number of store-bought transplants, at a real fraction of the cost.',
    summary:
      "Mississippi State University Extension states the real cost gap directly: vegetable and flower transplants are convenient, but they can easily cost 20 times more than growing the same plants from seed. Starting from seed also opens up real variety choice a garden-center transplant rack rarely offers, since mail-order and online seed companies carry far more cultivars than what's grown out and sold locally as transplants, including varieties bred for a specific climate or a specific real trait (disease resistance, a shorter days-to-maturity count) that a generic transplant selection won't include. The real tradeoff, per West Virginia University Extension: transplants accelerate an early harvest, produce a more uniform stand, and sidestep the germination losses seed starting can carry, and most vegetable and annual flower seedlings need 6 to 8 weeks of indoor growth before they're ready to harden off and move outside, real lead time that has to be planned around a location's own last frost date. A practical middle ground many gardeners actually use: start the crops with a long lead time and real variety selection at stake from seed indoors (tomatoes, peppers), and simply buy transplants for the rest.",
    citations: [
      {
        source: 'Mississippi State University Extension: Homegrown Flower, Herb and Vegetable Transplants',
        url: 'https://extension.msstate.edu/publications/homegrown-flower-herb-and-vegetable-transplants',
      },
      {
        source: 'West Virginia University Extension: Using Transplants in the Garden',
        url: 'https://extension.wvu.edu/lawn-gardening-pests/gardening/gardening-101/using-transplants-in-the-garden',
      },
    ],
    overallTier: 'strong',
    stageNote: 'The "20 times more" figure is stated directly by a real university extension source, not an unverified marketing claim, though the exact multiplier will vary by crop and region.',
    relatedIds: ['garden-easiest-beginner-crops', 'garden-economics-subsidizing-food'],
  },
  {
    id: 'garden-no-dig-raised-beds',
    category: 'homeGardening',
    title: 'Building a Garden Bed Without Ever Turning the Soil',
    teaser: 'Layering cardboard, "browns," and "greens" directly on top of grass or poor soil builds a real, workable garden bed without digging or tilling at all.',
    summary:
      "Cornell Cooperative Extension describes a real, well-documented no-dig method, sometimes called lasagna gardening or sheet mulching, that builds a garden bed by layering materials on top of existing ground rather than digging it out. The real steps: start with a base layer of cardboard or newspaper, watered thoroughly, to smother grass and weeds underneath. Add a 2-inch layer of carbon-rich \"brown\" material (leaves, straw, sawdust), then a 2-inch layer of nitrogen-rich \"green\" material (grass clippings, vegetable scraps, aged manure), and keep alternating until the pile reaches roughly 3 feet, watering each layer as it's added. No turning is required, unlike an active compost pile, and Cornell describes the process as saving real labor while enriching the soil underneath. This is a real, home-scale version of the same soil-biology principle Earth Matters' own regenerative-farming research documents at commercial scale: undisturbed soil keeps its own microbial life intact rather than having it disrupted by tilling, the identical real mechanism behind Brazil's own large-scale no-till movement. A no-dig bed also has a real, practical advantage for anyone gardening on poor or contaminated urban soil, since it builds a genuinely new growing layer on top of the ground rather than working directly in it.",
    citations: [
      {
        source: 'Cornell Cooperative Extension (Warren County): Lasagna Gardening',
        url: 'https://warren.cce.cornell.edu/gardening-landscape/warren-county-master-gardener-articles/lasagna-gardening',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, step-by-step method directly sourced from a university extension program, and a genuine home-scale parallel to Earth Matters\' own no-till research, not just a loosely related idea.',
    relatedIds: ['garden-composting-at-home', 'garden-soil-safety-lead', 'foodhistory-regen-brazil-case-study'],
  },
  {
    id: 'garden-watering-efficiency',
    category: 'homeGardening',
    title: 'Watering a Garden Efficiently, Not Just Often',
    teaser: 'Drip irrigation uses 30 to 50 percent less water than a sprinkler or hose, while also keeping foliage dry enough to cut down on disease.',
    summary:
      "Iowa State University Extension states directly that drip irrigation systems use 30 to 50 percent less water than sprinklers or other overhead watering methods, since water moves through tubing straight to the soil at the base of each plant rather than being sprayed over a wider area where much of it evaporates or runs off before reaching a root zone. Beyond the real water savings, keeping a plant's own leaves dry has a genuine disease benefit: many common vegetable diseases spread through water splashing onto foliage and fruit, and a drip system that never wets the leaves at all measurably reduces that risk. Hand watering, by contrast, is genuinely harder to get right consistently, with a real tendency toward over- or under-watering depending on how much attention a gardener actually has to give it day to day. A basic drip system can be built cheaply from tubing and simple emitters and run on an inexpensive timer, turning what would otherwise be daily hands-on watering into a real, mostly automated task. This is a small, individual-level version of the same water-use-efficiency question this app's own Earth Matters research covers at a much larger scale in its Ogallala Aquifer entry.",
    citations: [
      {
        source: 'Iowa State University Extension: Using Drip Irrigation in the Garden',
        url: 'https://yardandgarden.extension.iastate.edu/how-to/using-drip-irrigation-garden',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, quantified water-savings figure directly from a university extension source, not a manufacturer\'s own marketing claim.',
    relatedIds: ['foodhistory-regen-ogallala-water-depletion', 'garden-understanding-your-zone'],
  },
  {
    id: 'garden-natural-pest-management',
    category: 'homeGardening',
    title: 'Managing Real Garden Pests Without Reaching for a Pesticide',
    teaser: 'In one real study, only 7% of pest insects laid eggs on plants surrounded by companion plants, versus 36% on the identical plant grown alone in bare soil.',
    summary:
      "University of Florida IFAS Extension documents real, specific companion-planting strategies that measurably reduce pest damage without pesticide use, built around what researchers call the landings theory: a pest insect typically needs several successful landings on the correct host plant before it lays eggs, and a plant surrounded by other species disrupts that pattern. In one cited study, 36% of pest insects laid eggs on a host plant grown alone in bare soil, versus only 7% on the same plant surrounded by companion plants, a real, substantial difference from mixed planting alone. Specific, documented pairings: blue Hubbard squash planted around a garden's perimeter as a trap crop draws squash vine borers and squash bugs away from the main squash crop; radishes interplanted among eggplant trap flea beetles that would otherwise target the eggplant directly; and flowering plants like dill, fennel, milkweed, and cosmos attract ladybugs and other beneficial insects that prey on real garden pests. This approach has a real, direct benefit beyond pest control: avoiding pesticide use in a home garden entirely is one of the most concrete, individual-level things a gardener can do for the same pollinators this app's own Earth Matters research documents as being harmed by pesticide exposure at a much larger, industrial scale.",
    citations: [
      {
        source: 'UF/IFAS Extension (Duval County): Companion Planting Can Help Reduce Or Eliminate Insecticide Use In The Garden',
        url: 'https://blogs.ifas.ufl.edu/duvalco/2026/03/02/companion-planting-can-help-reduce-or-eliminate-insecticide-use-in-the-garden/',
      },
    ],
    overallTier: 'moderate',
    stageNote: 'The specific 36%-versus-7% figure comes from one cited study referenced by the extension source, not a broad meta-analysis, though the underlying companion-planting pairings are well-established extension guidance.',
    relatedIds: ['garden-pollinator-friendly-earth-matters-link', 'foodhistory-regen-neonicotinoid-regulation-loophole'],
  },
  {
    id: 'garden-growing-fruit-perennials',
    category: 'homeGardening',
    title: 'Perennial Fruit: A Real, Longer Planning Horizon Than Vegetables',
    teaser: 'A newly planted apple tree typically takes 4 to 5 years to bear fruit; a raspberry cane can produce a harvest in its second year.',
    summary:
      "Perennial fruit is a genuinely different planning problem from the annual vegetables covered elsewhere in this category, since the payoff arrives on a real, multi-year timeline rather than within a single season. Iowa State University Extension gives real, specific figures: apple trees typically begin bearing fruit 4 to 5 years after planting, sour or tart cherries and plums in 3 to 5 years, and pears in 4 to 6 years, with trees grown on dwarf or semi-dwarf rootstock coming into bearing sooner than a standard-size tree of the same variety. Berries reach a first harvest much faster: raspberry canes typically bear fruit in their second year (some fall-bearing varieties even in their first), and strawberries planted in fall can produce a first harvest the following spring. Blueberries sit in between and carry a real, distinctive requirement most vegetable gardeners never think about: Clemson Cooperative Extension states blueberries need genuinely acidic soil, with a pH above 6.0 ruling out a planting site entirely, and a bush typically produces only about half a pound of fruit in its third year, reaching 1 to 2 pounds by the fourth. Once established, both fruit trees and blueberry bushes are a real, long-term investment: a dwarf fruit tree can bear for 15 to 20 years, and a well-sited blueberry bush for 25 years or more.",
    citations: [
      {
        source: 'Iowa State University Extension: How soon will a newly planted fruit tree begin to bear fruit?',
        url: 'https://yardandgarden.extension.iastate.edu/faq/how-soon-will-newly-planted-fruit-tree-begin-bear-fruit',
      },
      {
        source: 'Clemson Cooperative Extension, Home & Garden Information Center: Blueberry',
        url: 'https://hgic.clemson.edu/factsheet/blueberry/',
      },
    ],
    overallTier: 'strong',
    stageNote: 'Real, specific extension-sourced timelines, not a general "fruit takes years" statement -- worth planning around directly since perennial fruit is a genuinely longer commitment than any annual vegetable in this category.',
    relatedIds: ['garden-highest-value-crops', 'garden-understanding-your-zone'],
  },
  {
    id: 'garden-preserving-the-harvest',
    category: 'homeGardening',
    title: 'Making a Real Harvest Surplus Last Past the Growing Season',
    teaser: 'Vegetables and meat genuinely require pressure canning, not a plain water bath, since only a pressure canner reaches the real temperature needed to destroy botulism spores.',
    summary:
      "A productive garden regularly produces more of something at once than a household can eat fresh, and real, safe preservation is what turns that surplus into food that lasts months rather than days. The National Center for Home Food Preservation, the same real, authoritative source this app's own Fermentation Methods research already points to for food-safety guidance, states the one genuinely non-negotiable safety rule in home canning directly: pressure canning is the only recommended method for canning vegetables, meat, poultry, and seafood, since the bacterium that causes botulism is only reliably destroyed at the correct time and pressure inside a real pressure canner. A plain boiling-water bath never reaches a high enough temperature to destroy botulism spores in these genuinely low-acid foods, which is why a water bath is safe only for high-acid foods like most fruits, jams, and properly acidified pickles. Freezing is a real, simpler alternative for many garden vegetables, avoiding the acidity question entirely, though most vegetables benefit from a quick blanch (a brief boil followed by an ice-water bath) first, since blanching stops the enzyme activity that would otherwise degrade color, texture, and nutrients in the freezer over time. Preserving a real surplus extends the same grocery-cost savings this category's own economics entry already covers well past the growing season itself, rather than losing extra produce to spoilage.",
    citations: [
      {
        source: 'National Center for Home Food Preservation (University of Georgia): Canning',
        url: 'https://nchfp.uga.edu/how/can/general-information/for-safetys-sake/',
      },
    ],
    overallTier: 'strong',
    stageNote: 'The pressure-canning-only rule for low-acid foods is a real, settled food-safety standard from the authoritative US source on this exact question, not a general caution.',
    relatedIds: ['garden-economics-subsidizing-food', 'fermentmethod-reputable-sources'],
  },
  {
    id: 'garden-seed-saving',
    category: 'homeGardening',
    title: 'Saving Real Seed From This Year\'s Harvest for Next Year\'s Garden',
    teaser: 'Beans, peas, tomatoes, and lettuce are the easiest crops to save real seed from, since they self-pollinate and rarely cross with anything else nearby.',
    summary:
      "Seed saving only works reliably with open-pollinated or heirloom varieties, not hybrids: a hybrid's own seed produces one of its original parent plants rather than a repeat of the plant it came from, so seed saved from a hybrid tomato or pepper won't grow true the following year. Penn State Extension recommends starting with self-pollinating crops specifically, beans, peas, tomatoes, and lettuce, since they're far less likely to cross-pollinate with a neighboring variety than a crop that depends on insects moving pollen between different plants. A real, worth-knowing exception: several common vegetables share the same botanical species and can cross with each other even though they look nothing alike, most notably broccoli, Brussels sprouts, collards, kale, and mustard greens, all of which belong to Brassica oleracea, meaning only one variety of that species should flower in the same garden in a given year if the seed is meant to stay true. Once seed is harvested, it needs to dry fully before storage, a real, simple test being whether a seed can be snapped by hand or shattered rather than dented by a fingernail, then kept in a labeled, sealed container somewhere cool, dry, and dark, since most seed stays viable for only a few years. Saving real seed at home is a genuine, individual-level counterpart to the seed-diversity loss this app's own Earth Matters research documents happening at a much larger, commercial scale.",
    citations: [
      {
        source: 'Penn State Extension: Seed Saving Basics',
        url: 'https://extension.psu.edu/seed-saving-basics',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, practical, extension-sourced how-to, directly tied to the seed-diversity concern already documented at commercial scale in this app\'s own Earth Matters research.',
    relatedIds: ['foodhistory-regen-seed-diversity-loss', 'garden-easiest-beginner-crops'],
  },
  {
    id: 'garden-vertical-trellising',
    category: 'homeGardening',
    title: 'Growing Up Instead of Out',
    teaser: 'Pole beans, cucumbers, and peas naturally climb, and growing them vertically on a simple trellis genuinely increases yield per square foot over letting the same crop sprawl on the ground.',
    summary:
      "University of Wisconsin Extension states directly that trellising, staking, and caging vine-type vegetables increases yield and income per square foot of growing space, a real, practical answer for anyone working with a small garden rather than an open field. Real crops that grow well on a support: pole beans and peas (both natural climbers), tomatoes, cucumbers, and smaller squash and melon varieties, all of which can be trained up simple wooden stakes, twine, garden netting, or a cattle-panel trellis rather than left to sprawl across the ground. Beyond the real space savings, vertical growing improves air movement through a plant's own stems and leaves, which genuinely reduces disease pressure compared to the same crop grown flat on damp soil, and makes fruit like cucumbers, which can hide under dense foliage when grown on the ground, much easier to actually find and harvest. Most vining crops grow strong enough to support their own fruit once trained upward, though larger melons sometimes benefit from a mesh sling for extra support as they get heavy. This pairs directly with the container and small-space guidance already covered in this category: a trellised crop in a large container can produce real, meaningful yield in a footprint too small for the same crop grown sprawling.",
    citations: [
      {
        source: 'University of Wisconsin Extension: Trellising, Staking and Caging -- Vertical Gardening Techniques for Vine-Type Vegetables',
        url: 'https://hort.extension.wisc.edu/articles/trellising-staking-and-caging-vertical-gardening-techniques-vine-type-vegetables/',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, direct extension source confirms the yield-per-square-foot and disease-reduction benefits; the source does not give a specific numeric multiplier, so none is stated here.',
    relatedIds: ['garden-container-small-space', 'garden-highest-value-crops'],
  },
  {
    id: 'garden-herbs-indoor-windowsill',
    category: 'homeGardening',
    title: 'Herbs Are the Real Starting Point for Anyone With Only a Windowsill',
    teaser: 'Thyme, sage, oregano, basil, parsley, and chives are all named as excellent candidates for a bright windowsill, no yard, patio, or even balcony required.',
    summary:
      "The Chicago Botanic Garden's own guidance on growing herbs indoors names thyme, lemon thyme, sage, oregano, basil, parsley, and chives as excellent candidates for a windowsill herb garden, with chamomile, lavender, lemon balm, and mint as real, worthwhile additions once the basics are working. Most herbs need four to six hours of real direct sun, or roughly 14 hours of supplemental grow-light exposure, with a south- or southwest-facing window generally working best. Basil, parsley, and cilantro do best started from seed indoors, while sage, oregano, lemon balm, mint, and thyme can instead be started from cuttings or divisions of an outdoor plant, a real, practical option for bringing a favorite outdoor herb inside before the first fall frost rather than losing it for the winter. A genuinely useful, real distinction most people never think about: thyme, chives, oregano, and rosemary tolerate being on the dry side and actually prefer it, while basil is the real exception among common herbs, wanting warmer, more humid conditions than the rest of a typical windowsill herb collection. Regular pinching keeps plants compact and productive rather than leggy, and pots need real, working drainage, since herbs kept too wet indoors are prone to root rot.",
    citations: [
      {
        source: 'Chicago Botanic Garden: Growing Herbs on Your Windowsill',
        url: 'https://www.chicagobotanic.org/plantinfo/growing_herbs_your_windowsill',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, direct guide from a real horticultural institution, not a generic gardening blog -- the driest/wettest distinction between herb species is a genuinely practical detail most general advice skips.',
    relatedIds: ['garden-container-small-space', 'garden-highest-value-crops'],
  },
  {
    id: 'garden-microgreens-sprouts',
    category: 'homeGardening',
    title: 'Microgreens and Sprouts: Real Food in Days, Not Months',
    teaser: 'A real 2012 USDA-funded study found microgreens carry genuinely higher concentrations of vitamin C, carotenoids, and vitamin K than the same plant\'s mature leaves.',
    summary:
      "Microgreens and sprouts are the fastest, smallest-footprint real food this whole category covers, both grow from seed indoors in days, not weeks, with no yard, container garden, or real outdoor space required at all. The two are genuinely different, not two names for the same thing: sprouts are grown in water and eaten whole, root and all, typically ready in 3 to 7 days, while microgreens grow in a real growing medium under light and are harvested at the stem once true leaves appear, typically 7 to 14 days after sowing. That distinction matters nutritionally, not just practically: a real, USDA-funded 2012 study published in the Journal of Agricultural and Food Chemistry directly measured 25 commercially available microgreens and found genuinely higher nutrient concentrations than the same plant's mature leaves as recorded in the USDA National Nutrient Database, with real, specific standouts by nutrient: red cabbage microgreens for vitamin C, cilantro for carotenoids, garnet amaranth for vitamin K, and green daikon radish for vitamin E. Fast, easy options for a first attempt include radish, broccoli, mustard, arugula, and beet-green microgreens, most ready within 7 to 14 days. A real, honest safety caution belongs alongside the enthusiasm: raw sprouts specifically carry a genuinely elevated foodborne-illness risk, since the warm, humid conditions needed to sprout a seed are the same conditions bacteria need to multiply, and a single surviving bacterium in a batch of seed, per the FDA, can be enough to contaminate the whole crop. A real 2011 outbreak traced to contaminated fenugreek sprouts sickened 3,785 people and killed 45 across Europe, a genuine, documented reason to treat raw sprouts, unlike microgreens grown in soil or a medium, with real caution.",
    citations: [
      {
        source: 'PubMed: Assessment of vitamin and carotenoid concentrations of emerging food products -- edible microgreens (Xiao et al. 2012)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/22812633/',
      },
      {
        source: 'Wikipedia: Sprouting (real documented foodborne-illness outbreak history and FDA/Health Canada safety guidance)',
        url: 'https://en.wikipedia.org/wiki/Sprouting',
      },
    ],
    overallTier: 'strong',
    stageNote: 'The nutrient-density finding comes from a real, direct laboratory measurement against the USDA\'s own reference database, and the sprout-safety caution cites a real, large, documented outbreak rather than a general warning.',
    relatedIds: ['garden-container-small-space', 'garden-easiest-beginner-crops'],
  },
  {
    id: 'garden-mulching',
    category: 'homeGardening',
    title: 'A Layer of Mulch Can Cut Watering Needs by Around Half',
    teaser: 'Colorado State University Extension states directly that mulch reduces irrigation need by around 50%, alongside real weed suppression and soil-temperature benefits.',
    summary:
      "Mulch, any material spread over bare soil around plants, does real, measurable work beyond just looking tidy. Colorado State University Extension states directly that mulching minimizes evaporation from the soil surface, reducing irrigation need by around 50%, while also stabilizing soil moisture, reducing compaction, and suppressing weeds. Real, recommended organic options include grass clippings (applied thin, no more than about a quarter inch at a time, to avoid matting), certified weed-free straw, and compost or leaf mold at 1 to 2 inches deep directly around growing plants. A real, worth-knowing exception: wood or bark chips should stay in the walkways between garden beds, not the growing beds themselves, since they take genuinely years to break down and interfere with future soil preparation once they're worked in. Black plastic mulch is a real, different tool specifically for warm-season fruiting crops like tomatoes, peppers, and melons, warming the soil enough to produce a real two to three weeks earlier harvest, though it has to go down early enough that plant growth shades the plastic before summer heat arrives, or the trapped heat can damage the crop instead of helping it.",
    citations: [
      {
        source: 'Colorado State University Extension: Mulches for the Vegetable Garden',
        url: 'https://extension.colostate.edu/resource/mulches-for-the-vegetable-garden/',
      },
    ],
    overallTier: 'strong',
    stageNote: 'The 50% irrigation-reduction figure and the 2-to-3-week earlier-harvest figure for black plastic mulch are both stated directly by a real university extension source, not estimated.',
    relatedIds: ['garden-watering-efficiency', 'garden-no-dig-raised-beds'],
  },
  {
    id: 'garden-crop-rotation',
    category: 'homeGardening',
    title: 'Why the Same Vegetable Shouldn\'t Go in the Same Spot Every Year',
    teaser: 'Iowa State University Extension recommends waiting 3 to 4 years, 5 or more if possible, before planting the same plant family in the same spot again.',
    summary:
      "Growing the same crop, or a close relative, in the same spot year after year builds up two real, separate problems: soil-borne disease organisms that can persist in soil for several years once established, and lopsided nutrient depletion, since different plant families draw down different specific nutrients at different rates. Iowa State University Extension recommends not planting vegetables from the same plant family in the same location for 3 to 4 years, 5 or more if space allows, and names the five real, practical groupings worth tracking: nightshades (tomato, pepper, potato), gourds (cucumber, squash, melon), the pea and bean family, mustards (broccoli, cabbage, kale), and the onion/garlic family. One real, useful asymmetry worth planning around directly: gourds are real heavy nitrogen feeders, while beans and peas are nitrogen fixers that add it back to the soil rather than depleting it, meaning a bean or pea planting is a genuinely good real choice for the spot a heavy feeder just vacated. Even an imperfect rotation in a small garden with limited real space still helps, per the same extension guidance, keeping a simple written or photographed record of what grew where each year is the real, practical tool that makes rotation possible at all once a garden has more than a season or two of real history behind it.",
    citations: [
      {
        source: 'Iowa State University Extension: Crop Rotation in the Vegetable Garden',
        url: 'https://yardandgarden.extension.iastate.edu/how-to/crop-rotation-vegetable-garden',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, specific rotation window and plant-family grouping, directly sourced, not a general "mix it up" suggestion.',
    relatedIds: ['garden-no-dig-raised-beds', 'garden-cover-crops-home'],
  },
  {
    id: 'garden-cover-crops-home',
    category: 'homeGardening',
    title: 'Cover Crops Aren\'t Just a Commercial-Farm Practice',
    teaser: 'Earth Matters documents cover cropping as still rare even on commercial farms. A home gardener faces essentially none of the real barriers keeping that number low.',
    summary:
      "This app's own Earth Matters research already documents a real, honest finding: cover cropping, planting a non-food crop specifically to protect and feed the soil between real growing seasons, is one of the cheapest, best-understood regenerative practices there is, yet real, official USDA data still found it on under 5% of total US cropland as of 2022. A home gardener faces essentially none of the real economic and logistical barriers (specialized equipment, a crop-insurance system that doesn't reward it, a farm's own tight seasonal labor calendar) that help explain that low commercial adoption rate, making a home garden bed a genuinely easy place to actually do this. Penn State Extension's own real, specific guidance: legume cover crops like clover add nitrogen to the soil directly, fast-growing brassicas like tillage radish outcompete winter weeds, and winter rye can be sown as late as November and still germinate at soil temperatures as low as 35 degrees Fahrenheit, useful for a real, late-season planting window most vegetables have already missed. The real, practical mechanics: broadcast seed over smoothed soil, rake it in lightly, water gently, then turn the cover crop under 2 to 3 weeks before spring planting, terminating it before it flowers so it doesn't reseed itself into next year's vegetable bed.",
    citations: [
      {
        source: 'Penn State Extension: Tips for Planting Cover Crops in Home Gardens',
        url: 'https://extension.psu.edu/tips-for-planting-cover-crops-in-home-gardens',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, direct individual-level counterpart to a finding already documented at commercial scale in this app\'s own Earth Matters research, not a loosely related idea.',
    relatedIds: ['garden-no-dig-raised-beds', 'garden-crop-rotation', 'foodhistory-regen-cover-crop-reality-check'],
  },
  {
    id: 'garden-mental-health-benefits',
    category: 'homeGardening',
    title: 'The Real, but Honestly Still Developing, Evidence on Gardening and Mental Health',
    teaser: 'A real 2024 umbrella review found a genuine, positive effect of gardening on well-being -- while directly stating that most of the underlying studies were rated critically low quality.',
    summary:
      "A real 2024 umbrella review and meta-analysis, published in a peer-reviewed systematic-reviews journal, pooled the available evidence on gardening and well-being and found a genuine, statistically significant positive effect (an effect size of 0.55) across measures of well-being, depression, and anxiety. The honest complication, stated directly by the review's own authors rather than glossed over: of the underlying reviews synthesized, 71% were rated critically low quality using a standard quality-assessment tool, heterogeneity across the included studies was severe, and the authors explicitly conclude the evidence does not currently support strong recommendations, calling for real, methodologically robust randomized controlled trials to actually establish whether gardening causes the improvement or simply correlates with it, since people already inclined toward better well-being or fitness may simply be more likely to garden in the first place. Separately, and with less rigorous backing, Virginia Tech Extension cites research finding short gardening sessions, as little as 10 to 30 minutes, linked to feeling calmer, and points to being around plants as a real, plausible way to lower cortisol, the body's own stress hormone. Presented honestly rather than oversold: gardening plausibly helps mental well-being, and a real, current review found a genuine positive signal, but the underlying evidence base is not yet strong enough to call this a settled, well-established finding.",
    citations: [
      {
        source: 'PMC: The impact of gardening on well-being, mental health, and quality of life -- an umbrella review and meta-analysis',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10823662/',
      },
      {
        source: 'Virginia Tech Extension, Master Gardener Program: Gardening for Mental Health -- Evidence-Based Benefits for Well-Being',
        url: 'https://mastergardener.ext.vt.edu/2026/01/30/gardening-for-mental-health-evidence-based-benefits-for-well-being/',
      },
    ],
    overallTier: 'moderate',
    stageNote: 'A real, current meta-analysis found a genuine positive effect, but its own authors rate most of the underlying evidence critically low quality and explicitly withhold a strong recommendation -- reported here exactly as honestly as the review itself states it.',
    relatedIds: ['mentalhealth-overview', 'garden-community-gardens'],
  },
  {
    id: 'garden-community-gardens',
    category: 'homeGardening',
    title: 'No Private Space at All? A Real Randomized Trial Found Community Gardens Still Move the Needle',
    teaser: 'In a real randomized controlled trial, people given a community garden plot increased their vegetable intake by 0.63 servings a day by harvest time, a real, statistically significant result.',
    summary:
      "Every entry in this category so far has assumed at least some real private space, a yard, a balcony, a windowsill. A community garden is the real answer for anyone without even that, a shared plot of land, usually organized by a city, nonprofit, or neighborhood group, divided into individual growing spaces. The real, strongest evidence for whether this actually changes what people eat comes from a genuine randomized controlled trial: 243 Denver, Colorado residents were randomized to either a community-garden intervention (a real plot, plants, seeds, and a gardening class) or a waitlist control group, and by harvest time, gardeners had significantly increased their total vegetable intake by 0.63 servings a day and their intake of vegetables they'd actually grown themselves by 0.67 servings a day, both real, statistically significant results. A real, honest limitation worth keeping rather than hiding: a winter follow-up measurement found the gap between the two groups had closed, meaning the benefit tracked with the real, active growing season rather than persisting as a lasting habit change on its own. This is a real, direct, individual-level answer to the food-access gap this app's own Earth Matters research already documents, growing food doesn't require owning land, just access to a real plot somewhere.",
    citations: [
      {
        source: 'PubMed: Community gardening increases vegetable intake and seasonal eating from baseline to harvest -- results from a mixed methods randomized controlled trial',
        url: 'https://pubmed.ncbi.nlm.nih.gov/37215644/',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real randomized controlled trial, not an observational study -- genuinely strong evidence, with its own honest, stated limitation (the effect faded once the growing season ended) included rather than left out.',
    relatedIds: ['foodhistory-regen-food-desert-access-inequality', 'garden-mental-health-benefits'],
  },
  {
    id: 'garden-pollinator-friendly-earth-matters-link',
    category: 'homeGardening',
    title: 'A Real, Direct Answer to This App\'s Own Pollinator Research',
    teaser: 'A home garden is one of the few real levers an individual actually controls over the pollinator crisis this app\'s own Earth Matters research documents.',
    summary:
      "This app's own Earth Matters research documents a real, current pollinator crisis and a genuine dependence of much of the food supply on animal pollination. A home garden is one of the few places an individual actually has direct control over that picture, rather than depending on policy or industry practice to change. Colorado State University Extension's own guidance on pollinators in vegetable and herb gardens states plainly that adding pollinator-friendly flowering plants to a vegetable garden measurably increases both pollinator visits and the actual yield of bee-pollinated crops like squash, cucumbers, and berries. Practical steps with real, documented effect: planting a mix of native and cultivated flowering plants that bloom in succession from spring through fall (echinacea, rudbeckia, monarda, and butterfly-friendly species are commonly recommended alongside vegetables), avoiding pesticide use in the home garden entirely, and leaving some bare, undisturbed ground, since most native bee species nest in the ground rather than in hives and lose that nesting habitat under continuous mulch or turf. None of this requires abandoning a vegetable garden's own layout; interplanting flowering species directly among vegetable beds is the recommended approach, not a separate flower bed elsewhere in the yard.",
    citations: [
      {
        source: 'Colorado State University Extension (Arapahoe County): Pollinators in Vegetable and Herb Gardens',
        url: 'https://extension.colostate.edu/arapahoe/2026/06/15/pollinators-in-vegetable-and-herb-gardens/',
      },
    ],
    overallTier: 'strong',
    stageNote: 'A real, direct bridge between this app\'s own Earth Matters research and something an individual gardener can actually do, not a separate initiative.',
    relatedIds: [
      'foodhistory-regen-pollinator-decline-crisis',
      'foodhistory-regen-pollinator-dependent-crops',
      'foodhistory-regen-pollinator-habitat-regenerative-link',
      'garden-tying-together',
    ],
  },
  {
    id: 'garden-tying-together',
    category: 'homeGardening',
    title: 'Putting It Together: A Real, Practical First Garden',
    teaser: 'The whole case for a first garden fits in one sentence: pick crops that actually suit the climate and the available space, and the real savings, freshness, and pollinator benefits follow on their own.',
    summary:
      "Every entry in this category points toward the same practical sequence. Start with a real growing zone and its actual frost dates, not a generic planting calendar written for a different climate. Choose crops that genuinely suit that zone, cool-hardy greens and root vegetables in a short-season climate, a full spring-and-summer rotation in a moderate one, a winter-centered calendar in a warm one, and month-by-month timing rather than a single planting season in a true tropical climate. If there's no yard, containers on a balcony or patio can still produce a real harvest, especially of herbs, leafy greens, and compact tomato varieties, and a simple trellis stretches that same footprint further for anything that naturally climbs. Favor crops that return the most real grocery value for the space, herbs and repeat-harvest greens especially, and lean on the small handful of genuinely easy, forgiving crops (radishes, lettuce, bush beans, zucchini) for a first attempt rather than something more demanding, saving seed instead of buying it fresh each year once a favorite variety is found. A cheap soil test is worth doing before planting directly into ground with an unknown history, especially in an older or urban setting, and a no-dig bed built from compost and cardboard sidesteps the question of what's underneath entirely. Watering efficiently and managing pests through companion planting rather than a spray bottle both save real money and protect the same pollinators the rest of this category depends on, and preserving a genuine surplus through canning or freezing stretches a harvest well past the growing season itself. None of this requires expensive equipment or prior experience, and the payoff extends past the real grocery savings covered first in this category: fresher food with measurably more of its own nutrients intact, and, when even a few flowering plants are worked in alongside the vegetables, a genuine, individual-level answer to the pollinator crisis this app's own Earth Matters research documents at a much larger scale. Even genuinely zero yard or balcony space isn't a full stop: a windowsill herb collection, a tray of microgreens, or a real community garden plot each still produce real, measurable food, and a real randomized trial found the last of those genuinely changes what people actually eat, not just what they intend to.",
    citations: [],
    overallTier: 'strong',
    stageNote: 'A closing synthesis drawing on every citation already given individually above, not a new claim of its own.',
    relatedIds: ['garden-economics-subsidizing-food', 'garden-understanding-your-zone', 'garden-pollinator-friendly-earth-matters-link', 'foodhistory-regen-how-to-get-involved', 'garden-no-dig-raised-beds', 'garden-preserving-the-harvest', 'garden-community-gardens', 'garden-crop-rotation'],
  },
];
