# Reveal - Seasons

[![reveal.js plugin](https://img.shields.io/badge/reveal.js-plugin-2C4A6E.svg)](https://revealjs.com) [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A seasonal layer for **any** [reveal.js](https://revealjs.com) presentation, with three themes built on the same plan. It is only an overlay: your slides are never changed, the colours adapt to light and dark backgrounds, and any slide can opt out. Standalone (ships its own CSS). Successor of [reveal.js-halloween](https://github.com/florianloyns/reveal.js-halloween).

**[Live demo](https://florianloyns.github.io/reveal.js-seasons/demo.html)**

| | Corner (top left) | On a thread | Flying past | Bottom edge | Title slide |
| --- | --- | --- | --- | --- | --- |
| **Halloween** | a simple corner cobweb | spider | bats, lightning | fog | *Halloween-Special* |
| **Weihnachten** | the same twig, bare and snowy | a Christmas bauble (red, gold or green) | sparkles, only with `Shift` + `W` | snow drift, falling snow | *Weihnachts-Special* |
| **Ostern** | blossom twig | painted egg | butterflies | grass | *Oster-Special* |

The thread drops down, bobs, climbs part of the way, drops again and disappears. Headings glow softly on dark slides. The title-slide label copies the font, size and letter-spacing of the slide's kicker line (`.s-label`, `.kicker`, `.eyebrow` or `.overline`), so it looks like part of your layout.

## Installation

**Requires** reveal.js 4.2 or newer. Tested with reveal.js 5.x and 6.x.

Copy the `seasons` folder into your reveal.js `plugin/` folder, or install from npm.

```console
npm install reveal.js-seasons
```

## Setup

```html
<script src="dist/reveal.js"></script>
<script src="plugin/seasons/seasons.js"></script>
<script>
  Reveal.initialize({ plugins: [ RevealSeasons ] });
</script>
```

As a module: `import RevealSeasons from './plugin/seasons/seasons.esm.js';`

## Usage

- **`W`** turns it on or off (a short note confirms it); **`Shift` + `W`** brings a surprise right now. `Alt`/`⌥ Option` + `H` and `G` work too.
- **Theme by date** (`theme: 'auto'`): Halloween 1 Oct – 1 Nov · Weihnachten from the first Sunday of Advent to 6 Jan · Ostern from two weeks before Easter Sunday to one week after (Easter is calculated for every year). Between seasons the next one is used.
- **Per URL**: `?season=halloween`, `?season=weihnachten`, `?season=ostern`, `?season=off`, `?season=mild|wild`, or `?season` to force it on. Old `?halloween` links still work.
- **Per slide**: `<section data-season="off">` fades everything out on that slide, for example for dying, death and grief. `mild`, `normal` or `wild` set the intensity for one slide. `data-halloween` is understood as well.

The pace is calm on purpose, so a 90-minute lesson stays watchable: something hangs down every 5–6 minutes, flyers pass every 4–7 minutes, lightning (Halloween only) every 15 minutes, all with some randomness. Fog and snow are continuous and kept faint. Everything pauses in the overview (`Esc`), while the screen is paused (`B`) and while the tab is hidden; nothing runs in speaker-view previews or the PDF export. The on/off state is kept for the browser tab. With *reduce motion* only the still parts remain.

## Configuration

```js
Reveal.initialize({
  seasons: {
    theme: 'auto',             // 'auto' | 'halloween' | 'weihnachten' | 'ostern'
    activate: 'always',        // 'always' | 'season' (only inside a season) | 'url' (off until W or ?season)
    intensity: 'normal',       // 'mild' | 'normal' | 'wild'
    minutes: { hanger: 5, flyer: 7, flash: 15 },  // average gaps; defaults depend on the theme
    key: 'w',                  // toggle key; Shift + key = surprise
    special: true,             // title-slide label: true = theme text, a string = your text, false = none
    glowHeadings: true,
    sound: false,              // thunder with the lightning
    respectReducedMotion: true
  },
  plugins: [ RevealSeasons ]
});
```

## API

```js
const s = Reveal.getPlugin('seasons');
s.toggle(); s.enable(); s.disable();
s.surprise();
s.setTheme('ostern');
s.theme();      // 'halloween' | 'weihnachten' | 'ostern'
s.isOn();
```

## Changelog

**1.1.0** — the cobweb is smaller; Weihnachten uses the Easter twig, bare and snowy, with a bauble coming down on a ribbon; the title-slide label floats below the title block, so toggling never shifts the slide; snow drift and grass sit lower.

**1.0.0** — initial release: Halloween, Weihnachten and Ostern on one plan, theme by date, title-slide label matched to the kicker line.

## Imprint

Responsible: Florian Loyns — [imprint & privacy notice](https://florianloyns.com/Impressum/) (German)

## License

MIT — see [LICENSE](LICENSE). Thanks to Hakim El Hattab (reveal.js).
