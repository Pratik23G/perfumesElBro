# MASTER.md - Perfumes El Bro design system

Source of truth for the visual layer. Mode: **partial**. Palette, type, radius, motion and the hero/collection photography change. Structure, copy, data, checkout and all JS behaviour stay.

## Theses (approved)

**Visual.** A warm-black shelf where the shop's own photos do the talking. The logo's real gold appears only on price, seals and the main action. A heavy grotesk headline with a few italic serif words carries an Apple-clean, mass-appeal confidence.

**First screen.** One full-bleed photo of a bottle beside its sealed box (Bleu de Chanel Parfum, from the shop's shelf), darkened toward the copy. "Originales sellados. Directo de una persona.", the price from $80, a gold primary action and a WhatsApp action. Phone: the photo fills the frame, copy sits at the bottom. Wide: copy left at reading width, photo takes the right 62%.

**Interaction.** Fast and quiet. 200-450 ms, one expo-out curve, no overshoot. Hover lifts a card 4 px and slowly zooms the photo (hover-capable devices only). Scroll only reveals rows once. **The one motion:** every product carries a gold "Sellado" seal; adding it to the cart peels the seal off the corner in 380 ms and the button reads "Añadido". Reduced motion: the seal disappears and the button changes state, no transition.

**Allowed patterns:** hairline borders, gold Sellado seal, italic serif accent words, pill buttons, dark scrim over photos for legibility, WhatsApp green button.
**Forbidden:** bounce or overshoot, scroll-jacking, autoplay carousels, gradient text, glows, smoke or particles, looping animation, count-up prices.

**Set aside:** dark-gold boutique serif hero; white studio catalogue; glass-counter luxury; fragrance-ad smoke. **Kept:** the private shelf; Apple-style restraint.

**Dials:** variance 4 ("balanced, one confident photo, symmetric grid"), motion 4 ("fast and dry, reveal once, one signature motion"), density 3 ("airy, 8px base"). Sent to `search.py`; its dataset proposed Inter, an indigo glassmorphism style and `back.out` stagger. All three dropped: thesis names other faces, forbids glass and glow, and forbids overshoot. Kept only the `expo.out` easing family and the 0.97 press scale.

**Display face, amended:** Bricolage Grotesque 800. Reason: its tight optical sizing keeps a heavy headline legible on a phone, and its slightly quirky letterforms stop it reading as the stock heavy grotesque.

## Color

| Token | Value | Job | Contrast vs `--bg` |
|---|---|---|---|
| `--bg` | `#0b0a08` | page ground (from the logo's black) | - |
| `--surface` | `#151310` | cards, drawers, modals | - |
| `--sunken` | `#100e0c` | image wells, quiet bands | - |
| `--ink` | `#f6f2ea` | text | 17.7 : 1 |
| `--ink-2` | `#cfc8ba` | secondary text | 12.0 : 1 |
| `--muted` | `#a79f90` | captions, meta | 7.5 : 1 |
| `--gold` | `#f0b429` | price, seal, primary action. Nothing else | 10.6 : 1 |
| `--wa` | `#25d366` | WhatsApp only | 10.0 : 1 |
| `--line` / `--line-strong` | ink at 12% / 26% | hairlines | - |

Gold doubles as action and as "sealed / price": the one mark serves both because both mean "this is the thing you can buy".

## Type

| Token | Stack | Use |
|---|---|---|
| `--display` | "Bricolage Grotesque", "Helvetica Neue", Arial, sans-serif | headlines, names, prices. Weights 700/800, tracking -0.035em at hero size |
| `--accent` | "Instrument Serif", Georgia, serif | italic accent word, one or two per screen |
| `--text` | "Instrument Sans", system-ui, sans-serif | body, UI |

`--serif` and `--sans` stay as aliases of `--display` and `--text` so existing rules keep working. Fonts load from Google Fonts with `display=swap`; not rendered in this session, loaded online only.

## Space, radius, depth

- Base 8 px. Scale: 8, 16, 24, 32, 56, 88.
- Radius: `--r-sm` 6 (seal), `--r-md` 14 (inputs, inner), `--r-lg` 22 (cards, frames, modals), `--r-pill` 999 (buttons, chips).
- Depth: none. Hairline borders only. No shadows, no glows.

## Components

Button: pill, 48 px (52 on touch). `btn-gold` filled gold with `--bg` text; `btn-ghost` hairline; `btn-wa` green. States: default, hover (lighter gold), focus (2 px gold ring, 3 px offset), active (scale .97), disabled (40% opacity).
Card: `--surface`, hairline, radius 22, photo on top with the Sellado seal, name and price below, gold Añadir pill.

## Motion tokens

`--ease: cubic-bezier(.22, 1, .36, 1)`. Press 200 ms. Card lift 420 ms. Photo zoom 700 ms. Seal peel 380 ms. Reveal 450 ms, 12 px, 60 ms stagger. Everything instant under `prefers-reduced-motion`.
