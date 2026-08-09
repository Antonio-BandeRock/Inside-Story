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
      "Every entry in this category points toward the same practical sequence. Start with a real growing zone and its actual frost dates, not a generic planting calendar written for a different climate. Choose crops that genuinely suit that zone, cool-hardy greens and root vegetables in a short-season climate, a full spring-and-summer rotation in a moderate one, a winter-centered calendar in a warm one, and month-by-month timing rather than a single planting season in a true tropical climate. If there's no yard, containers on a balcony or patio can still produce a real harvest, especially of herbs, leafy greens, and compact tomato varieties. Favor crops that return the most real grocery value for the space, herbs and repeat-harvest greens especially, and lean on the small handful of genuinely easy, forgiving crops (radishes, lettuce, bush beans, zucchini) for a first attempt rather than something more demanding. A cheap soil test is worth doing before planting directly into ground with an unknown history, especially in an older or urban setting. None of this requires expensive equipment or prior experience, and the payoff extends past the real grocery savings covered first in this category: fresher food with measurably more of its own nutrients intact, and, when even a few flowering plants are worked in alongside the vegetables, a genuine, individual-level answer to the pollinator crisis this app's own Earth Matters research documents at a much larger scale.",
    citations: [],
    overallTier: 'strong',
    stageNote: 'A closing synthesis drawing on every citation already given individually above, not a new claim of its own.',
    relatedIds: ['garden-economics-subsidizing-food', 'garden-understanding-your-zone', 'garden-pollinator-friendly-earth-matters-link', 'foodhistory-regen-how-to-get-involved'],
  },
];
