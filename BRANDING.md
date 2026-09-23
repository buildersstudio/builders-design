# How we make brands at Builders

This is the brief every model reads before it creates a brand variant for a venture in Builders Design. It describes how I want brands to be made in the studio, and it should be followed closely unless the person asking says otherwise in their own session.

## The stance

A venture brand at Builders has to balance two things that usually pull in opposite directions: a minimalism strict enough that nothing on the page is decorative, and a personality strong enough that the brand could not be mistaken for anyone else in its category. Most early-stage brands fail on one side or the other, either by being so reduced that they look like every other SaaS template, or by being so loud that the product disappears behind the styling, and the work of a variant is to find the narrow place where both hold at once.

The reference point is award-level work of the current moment (the kind of sites that win on Awwwards, Godly or Site Inspire in 2026), studied for its craft in typography, spacing and restraint rather than copied for its surface effects. Trends are useful as evidence of what feels fresh, and dangerous as a substitute for an idea, so a variant should feel current without being datable to a single season.

## Before designing anything

- **Read the venture.** Start from `venture.md`, and write nothing that is not grounded in it or in the venture's live site. The copy on a variant is real copy for this company, never lorem ipsum, and never an invented metric, customer, logo wall or testimonial.
- **Read the category.** Open the competitor grid (`competitors.json` and the screenshots next to it) and name, for yourself, what the category looks like: its default colours, its default type, its default hero. The variant should then differ from that default on purpose, because a brand that looks like its category is a brand that has to outspend it.
- **Find the one idea.** Each variant starts from a single plain sentence about how the brand presents the product (for example, "the drawing is the hero, on white, measured to the millimetre" or "a dark, cinematic stage for the product film"), and every choice that follows has to be explainable by that sentence. A palette swap on the same layout is not a new variant.

## The bar

Every variant should be able to sit next to the landing pages of the best-funded companies of the moment (Linear, Vercel, Stripe, Figma, Anthropic, and the leading Y Combinator companies of its own category) without looking like the junior member of the group. The test I apply is simple: a senior buyer in the venture's market, an engineer or a finance director rather than a designer, should read the page as the work of a serious, well-funded company that understands their job, and a Y Combinator partner should see nothing on it that needs explaining away. Taste is shown through restraint, precision and the quality of a few decisions, never through a clever idea that the visitor has to decode.

That rules out the things that make generated brands recognisable. **Serif display type, and serif italics used as an accent inside sans headlines, are banned unless the founder explicitly asks for them**, because that combination has become the clearest signature of AI-made design. So are literary or poetic concepts (proofreading marks, inkblots, mirrored layouts, metaphors the product does not actually contain), and so is any concept that has to be explained before the page makes sense.

## A round of variants

A round is three variants unless asked otherwise. The three should be genuinely different directions, differing in their ground (light or dark), their typographic system and the way the product is shown, while all three remain serious and credible for the category; none of them should be the gimmick that makes the other two look sensible.

Each concept starts from the product and its buyer rather than from a metaphor: what the product does, what its output looks like, and what the buyer trusts. For a technical product, the product itself is usually the best visual, so leave room for large, beautiful product film and real interface or output, and build the page around it rather than decorating around it.

Each variant is delivered as a single landing page, because a brand is only judged fairly when it is seen doing its job. The page carries the logo, the palette and the type in use, a hero with the real one-liner, two or three sections drawn from the product and customer description, and at least one large product moment (the venture's real product film when one exists, otherwise a precise rendering of its real output).

## The elements

- **Logo.** A wordmark first, drawn or carefully set, that survives in one colour at small sizes. A separate mark is added only when it earns its place, and it has to work as an app icon on its own.
- **Colour.** One dominant colour, one accent and a small set of neutrals is usually enough. Avoid the category clichés (fintech blue, AI purple gradients, recruiting teal) unless the variant is deliberately reclaiming one, and check that text contrast holds.
- **Type.** One sans family where possible, two at most, chosen for precision at display sizes and quiet legibility at text sizes (Inter Tight, Geist, Manrope, Instrument Sans, Figtree, Hanken Grotesk and similar grotesks are the usual territory). No serif and no monospace, including for labels, numbers or accents: small labels are set in the sans in uppercase with open letterspacing, and numbers use tabular figures. Fonts must load from Google Fonts or another CORS-open source.
- **Layout.** A clear grid, generous whitespace, large confident type and very few elements per screen. Hierarchy should come from scale and space before it comes from colour or weight.
- **Motion.** Subtle and purposeful, revealing content rather than decorating it, and absent entirely if the page is stronger without it.

## What to avoid

Anything that reads as generated rather than designed: gradient orbs, glassmorphism as a default, sparkle icons, emoji, rows of identical feature cards with stock icons, fake dashboards full of placeholder numbers, and copy built from words like revolutionise, seamless, supercharge or unlock. If an element could appear unchanged on the site of an unrelated company, it probably does not belong on this one.

## From variant to brand book

When the founder picks a variant, it becomes the definitive brand: its tokens go into `brand/brand.json`, its logo into `brand/logo.svg` (and `mark.svg` if there is one), and from then on presentations, landing pages and social assets for that venture are made from the brand book rather than from the variant. The variant stays in place as the record of where the brand came from.
