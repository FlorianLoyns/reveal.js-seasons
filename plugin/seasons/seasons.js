/*****************************************************************
 * Seasons – Saison-Overlay für jede reveal.js-Präsentation (v1.1.0)
 * Ein Plugin, drei Themen nach demselben Bauplan:
 *
 *                oben              hängt am Faden   fliegt durchs Bild   unterer Rand
 *   Halloween    Spinnennetz       Spinne           Fledermäuse, Blitz   Nebel
 *   Weihnachten  Winterzweig       Christbaumkugel  Funkeln (Shift+W)    Schneewehe + Schneefall
 *   Ostern       Blütenzweig       Osterei          Schmetterlinge       Grashalme
 *
 * Dazu je eine Stimmungs-Vignette, glimmende Überschriften auf dunklen Folien
 * und ein Schriftzug („Halloween-Special“ …) unter dem Deckblatt-Titel.
 * Der Folieninhalt wird nicht verändert; Drop-in, bringt sein CSS selbst mit.
 *
 * Registrieren:  plugins: [ ..., RevealSeasons ]
 * Optional:
 *   Reveal.initialize({ seasons: {
 *     theme:'auto',          // 'auto' (nach Datum) | 'halloween' | 'weihnachten' | 'ostern'
 *     activate:'always',     // 'always' | 'season' (nur in der Saison) | 'url' (erst mit Taste/URL)
 *     intensity:'normal',    // 'mild' | 'normal' | 'wild'
 *     minutes:{ hanger:5, flyer:7, flash:15 },  // mittlere Abstände in Minuten
 *     key:'w',               // Taste an/aus · Shift+Taste = Überraschung sofort
 *     special:true,          // Schriftzug auf dem Deckblatt (Text: true = Thema, oder eigener Text, false = keiner)
 *     glowHeadings:true, sound:false, respectReducedMotion:true
 *   }})
 * Saisons bei 'auto':  Halloween 1.10.–1.11. · Weihnachten 1. Advent–6.1. · Ostern Ostersonntag−14 bis +7
 *                      außerhalb: das nächste kommende Thema
 * Pro Folie:  <section data-season="off">  (auch data-halloween="off")  ·  mild | normal | wild
 * URL:        ?season · ?season=ostern · ?season=off · ?season=wild · (?halloween wie bisher)
 * Tasten:     W = an/aus · Shift+W = Überraschung · zusätzlich Alt/⌥+H, Alt/⌥+G
 * API:        Reveal.getPlugin('seasons').toggle() / .enable() / .disable() / .surprise() / .setTheme('ostern') / .theme()
 *****************************************************************/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.RevealSeasons = factory());
}(this, (function () {
  'use strict';

  var DEFAULTS = {
    theme: 'auto',
    activate: 'always',
    intensity: 'normal',
    minutes: null,
    key: 'w',
    special: true,
    glowHeadings: true,
    sound: false,
    respectReducedMotion: true
  };

  var LEVEL = {
    mild:   { freq: 0.5, amb: 0.65, dark: 0.7 },
    normal: { freq: 1,   amb: 1,    dark: 1 },
    wild:   { freq: 2.2, amb: 1.4,  dark: 1.25 }
  };

  /* ---------- Zufall mit Startwert (Zweige sehen jedes Mal gleich aus) ---------- */
  function seeded(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* ---------- Grafiken ---------- */
  var BAT_PATH = 'M60 16 L63 9 L64.5 15 C68 14 72 12 78 8 C88 3 104 2 118 10 C112 11 108 14 106 19 C101 16 95 16 91 21 C87 18 81 18 77 24 C72 22 67 26 64 32 C62 36 61 40 60 44 C59 40 58 36 56 32 C53 26 48 22 43 24 C39 18 33 18 29 21 C25 16 19 16 14 19 C12 14 8 11 2 10 C16 2 32 3 42 8 C48 12 52 14 55.5 15 L57 9 Z';
  var BAT = '<svg viewBox="0 0 120 50" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="' + BAT_PATH + '"/></svg>';

  var SPIDER = (function () {
    var legs = ['M27 26 C22 16 14 10 6 15', 'M27 28 C20 22 10 20 3 26', 'M27 31 C20 32 11 36 5 44', 'M28 33 C24 40 18 46 12 55'];
    var mirror = function (d) { return d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, function (m, x, y) { return (60 - x) + ' ' + y; }); };
    return '<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">'
      + legs.concat(legs.map(mirror)).map(function (d) { return '<path d="' + d + '"/>'; }).join('')
      + '</g><ellipse cx="30" cy="38.5" rx="6.2" ry="8.6" fill="currentColor"/><ellipse cx="30" cy="27" rx="4" ry="4.4" fill="currentColor"/>'
      + '<path d="M30 33 C28.4 35.6 28.4 39 30 42 C31.6 39 31.6 35.6 30 33 Z" fill="#fff" opacity=".16"/></svg>';
  })();

  var STAR_PATH = 'M12 1.5 L14.9 8.6 L22.5 9.2 L16.7 14.1 L18.5 21.6 L12 17.6 L5.5 21.6 L7.3 14.1 L1.5 9.2 L9.1 8.6 Z';
  var STAR = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="' + STAR_PATH + '" fill="currentColor"/></svg>';
  var SPARKLE = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" fill="currentColor"/></svg>';

  var EGG_PATH = 'M13 0 C21 0 26 13 26 22 C26 30 20 34 13 34 C6 34 0 30 0 22 C0 13 5 0 13 0 Z';
  var EGG = '<svg viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg"><path d="' + EGG_PATH + '" fill="#F6D365"/>'
    + '<path d="M1.2 17 L5 14 L9 17 L13 14 L17 17 L21 14 L24.8 17" fill="none" stroke="#E58FA6" stroke-width="2" stroke-linejoin="round"/>'
    + '<path d="M0.6 23 L25.4 23" stroke="#7FB2D9" stroke-width="2.2"/><circle cx="8" cy="28" r="1.3" fill="#E58FA6"/><circle cx="13" cy="29" r="1.3" fill="#E58FA6"/>'
    + '<circle cx="18" cy="28" r="1.3" fill="#E58FA6"/><circle cx="13" cy="7" r="1.6" fill="#7FB2D9"/></svg>';
  var EGG_ICON = '<svg viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg"><path d="' + EGG_PATH + '" fill="#F6D365"/>'
    + '<path d="M1.2 17 L5 14 L9 17 L13 14 L17 17 L21 14 L24.8 17" fill="none" stroke="#E58FA6" stroke-width="2.4" stroke-linejoin="round"/></svg>';

  function butterflySVG(a, b) {
    return '<svg viewBox="0 0 40 30" xmlns="http://www.w3.org/2000/svg"><g class="sz-wings">'
      + '<path d="M20 15 C14 2 2 2 3 10 C4 16 12 17 20 15 Z M20 15 C26 2 38 2 37 10 C36 16 28 17 20 15 Z" fill="' + a + '"/>'
      + '<path d="M20 15 C13 18 6 26 11 28 C15 30 19 22 20 15 Z M20 15 C27 18 34 26 29 28 C25 30 21 22 20 15 Z" fill="' + b + '"/></g>'
      + '<path d="M20 8 L20 23" stroke="#4A3A2A" stroke-width="1.6" stroke-linecap="round"/></svg>';
  }

  /* Spinnennetz: das schlichte Netz der ersten Fassung – sechs gleichmäßige Speichen, fünf durchhängende Bögen */
  var WEB = (function () {
    var spokes = 6, rings = [0.22, 0.4, 0.58, 0.78, 1], d = '', i, a, a2, r, k;
    for (i = 0; i <= spokes; i++) {
      a = Math.PI / 2 * i / spokes;
      d += 'M0 0L' + (100 * Math.cos(a)).toFixed(1) + ' ' + (100 * Math.sin(a)).toFixed(1);
    }
    for (k = 0; k < rings.length; k++) {
      r = rings[k] * 100;
      for (i = 0; i < spokes; i++) {
        a = Math.PI / 2 * i / spokes; a2 = Math.PI / 2 * (i + 1) / spokes;
        var am = (a + a2) / 2, rc = r * 0.84;
        d += 'M' + (r * Math.cos(a)).toFixed(1) + ' ' + (r * Math.sin(a)).toFixed(1)
          + 'Q' + (rc * Math.cos(am)).toFixed(1) + ' ' + (rc * Math.sin(am)).toFixed(1)
          + ' ' + (r * Math.cos(a2)).toFixed(1) + ' ' + (r * Math.sin(a2)).toFixed(1);
      }
    }
    return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="' + d
      + '" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>';
  })();

  /* Blütenzweig */
  var BLOSSOM = (function () {
    function flower(cx, cy, r, fill) {
      var s = '', i;
      for (i = 0; i < 5; i++) {
        var a = -Math.PI / 2 + i * 2 * Math.PI / 5;
        s += '<circle cx="' + (cx + Math.cos(a) * r * 1.4).toFixed(1) + '" cy="' + (cy + Math.sin(a) * r * 1.4).toFixed(1) + '" r="' + r + '" fill="' + fill + '"/>';
      }
      return s + '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.52).toFixed(1) + '" fill="#E9A23B"/>';
    }
    return '<svg viewBox="0 0 230 110" xmlns="http://www.w3.org/2000/svg"><g fill="none" style="stroke:var(--sz-branch)" stroke-linecap="round">'
      + '<path d="M-4 20 C40 22 90 40 150 34 C175 32 195 26 222 16" stroke-width="3"/><path d="M70 30 C80 50 92 62 112 72" stroke-width="2"/>'
      + '<path d="M168 31 C176 40 182 48 194 52" stroke-width="1.6"/></g>'
      + flower(40, 22, 5, '#F4C6D0') + flower(150, 34, 5, '#F4C6D0') + flower(112, 72, 4.4, '#F4C6D0') + flower(208, 19, 4, '#FFFFFF')
      + '<g fill="#8DBF5A"><ellipse cx="88" cy="35" rx="3.2" ry="5" transform="rotate(30 88 35)"/>'
      + '<ellipse cx="194" cy="52" rx="3" ry="4.6" transform="rotate(-40 194 52)"/><ellipse cx="18" cy="16" rx="2.8" ry="4.4" transform="rotate(70 18 16)"/></g></svg>';
  })();

  /* Winterzweig: derselbe Zweig wie zu Ostern, kahl und mit Schneehäubchen */
  var TWIG = ['M-4 20 C40 22 90 40 150 34 C175 32 195 26 222 16', 'M70 30 C80 50 92 62 112 72', 'M168 31 C176 40 182 48 194 52'];
  var WINTER = '<svg viewBox="0 0 230 110" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke-linecap="round">'
    + '<g style="stroke:var(--sz-branch)"><path d="' + TWIG[0] + '" stroke-width="3"/><path d="' + TWIG[1] + '" stroke-width="2"/><path d="' + TWIG[2] + '" stroke-width="1.6"/></g>'
    + '<g class="sz-snow" transform="translate(0 -2.3)"><path d="' + TWIG[0] + '" stroke-width="3.4" stroke-dasharray="26 8 34 12 18 9 30 14"/>'
    + '<path d="' + TWIG[1] + '" stroke-width="2.4" stroke-dasharray="14 7 20 9"/><path d="' + TWIG[2] + '" stroke-width="2" stroke-dasharray="10 6 12"/></g></g>'
    + '<g class="sz-snowf"><ellipse cx="40" cy="18.6" rx="6" ry="2.6"/><ellipse cx="150" cy="31" rx="6.5" ry="2.7"/><ellipse cx="206" cy="19.5" rx="5" ry="2.3"/>'
    + '<ellipse cx="111" cy="69" rx="4.6" ry="2.2"/><ellipse cx="86" cy="45.5" rx="3.4" ry="1.8"/></g></svg>';

  /* Christbaumkugel zum Herabhängen (wie das Osterei), abwechselnd rot, gold, grün */
  function bauble(col, shade) {
    return '<svg viewBox="0 0 26 32" xmlns="http://www.w3.org/2000/svg"><rect x="9.5" y="0" width="7" height="5" rx="1.2" fill="#C9A75A"/>'
      + '<circle cx="13" cy="19" r="12" fill="' + col + '"/><path d="M1.6 21.5 A12 12 0 0 0 24.4 21.5 A12 5 0 0 1 1.6 21.5 Z" fill="' + shade + '" opacity=".35"/>'
      + '<ellipse cx="8.6" cy="14.2" rx="3.4" ry="2" fill="#fff" opacity=".5" transform="rotate(-35 8.6 14.2)"/></svg>';
  }
  var BAUBLE = [bauble('#B32630', '#5c0f15'), bauble('#C9962B', '#6b4a0c'), bauble('#2F6B45', '#123321')];

  var DRIFT = '<svg viewBox="0 630 1280 90" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">'
    + '<path d="M0 720 L0 672 C120 646 240 690 380 668 C520 646 640 686 800 664 C960 642 1080 682 1280 656 L1280 720 Z" style="fill:var(--sz-drift)"/>'
    + '<path d="M0 672 C120 646 240 690 380 668 C520 646 640 686 800 664 C960 642 1080 682 1280 656" fill="none" style="stroke:var(--sz-drift-edge)" stroke-width="1.5"/></svg>';

  var GRASS = (function () {
    var R = seeded(7), d = '', x, flowers = '';
    for (x = -4; x < 1290; x += 7 + R() * 5) {
      var h = 16 + R() * 30, lean = (R() - 0.5) * 14;
      d += 'M' + x.toFixed(0) + ' 724Q' + (x + lean * 0.3).toFixed(0) + ' ' + (724 - h * 0.6).toFixed(0) + ' ' + (x + lean).toFixed(0) + ' ' + (724 - h).toFixed(0);
    }
    [212, 618, 1002].forEach(function (fx, i) {
      var fy = [700, 704, 698][i];
      flowers += '<circle cx="' + fx + '" cy="' + fy + '" r="3.4" fill="#fff" stroke="#E7D9A8" stroke-width=".6"/><circle cx="' + fx + '" cy="' + fy + '" r="1.3" fill="#E9A23B"/>';
    });
    return '<svg viewBox="0 674 1280 50" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><path d="' + d
      + '" fill="none" style="stroke:var(--sz-grass)" stroke-width="2.6" stroke-linecap="round"/>' + flowers + '</svg>';
  })();

  /* ---------- Themen ---------- */
  var THEMES = {
    halloween: {
      name: 'Halloween', label: 'Halloween-Special', icon: BAT, iconRatio: 2.4,
      color: ['#C2520A', '#FF9A3D'], glow: '255,122,26', flicker: true,
      vig: 'radial-gradient(ellipse at 50% 46%,rgba(0,0,0,0) 52%,rgba(12,0,24,.55) 100%),linear-gradient(to top,rgba(255,110,0,.13),rgba(255,110,0,0) 24%)',
      ambient: 'fog', ground: null,
      corner: { svg: WEB, w: 13, h: 13 },
      hanger: { svg: SPIDER, w: 42, overlap: 19, x: [2.4, 4.4] },
      flyer: 'bats', flash: 'lightning',
      minutes: { hanger: 5, flyer: 7, flash: 15 }
    },
    weihnachten: {
      name: 'Weihnachten', label: 'Weihnachts-Special', icon: STAR, iconRatio: 1, iconColor: '#C9962B',
      color: ['#A8232B', '#F0C35A'], glow: '255,214,140',
      vig: 'radial-gradient(ellipse at 50% 46%,rgba(0,0,0,0) 55%,rgba(20,40,70,.32) 100%),linear-gradient(to top,rgba(255,200,120,.10),rgba(255,200,120,0) 30%)',
      ambient: 'snow', ground: 'drift',
      corner: { svg: WINTER, w: 32, h: 15.3 },
      hanger: { svg: BAUBLE, w: 24, overlap: 2, x: [17.7, 18.3], top: 4.9, depth: [0.15, 0.25] },
      flyer: null, flash: null,          // Funkeln nur auf Knopfdruck (Shift+W)
      minutes: { hanger: 6 }
    },
    ostern: {
      name: 'Ostern', label: 'Oster-Special', icon: EGG_ICON, iconRatio: 0.76,
      color: ['#3B7536', '#9FD06A'], glow: '240,224,140',
      vig: 'radial-gradient(circle at 92% 6%,rgba(255,224,140,.38),rgba(255,224,140,0) 34%),radial-gradient(ellipse at 50% 46%,rgba(0,0,0,0) 58%,rgba(90,130,60,.22) 100%)',
      ambient: null, ground: 'grass',
      corner: { svg: BLOSSOM, w: 32, h: 15.3 },
      hanger: { svg: EGG, w: 28, overlap: 2, x: [17.7, 18.3], top: 4.9, depth: [0.15, 0.25], ribbon: true },
      flyer: 'butterflies', flash: null,
      minutes: { hanger: 6, flyer: 5 }
    }
  };

  /* ---------- Kalender ---------- */
  function day(y, m, d) { return new Date(y, m, d).getTime(); }
  function easter(y) {   // gregorianische Osterformel (Gauß / Meeus)
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
      g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
      l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
      mon = Math.floor((h + l - 7 * m + 114) / 31), dd = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, mon - 1, dd);
  }
  function firstAdvent(y) {
    var xmasEve = new Date(y, 11, 24), fourth = 24 - xmasEve.getDay();   // 4. Advent = Sonntag am oder vor dem 24.12.
    return day(y, 11, fourth - 21);
  }
  function windows(y) {
    var e = easter(y).getTime(), D = 86400000;
    return [
      { theme: 'weihnachten', from: firstAdvent(y - 1), to: day(y, 0, 6) },
      { theme: 'ostern', from: e - 14 * D, to: e + 7 * D },
      { theme: 'halloween', from: day(y, 9, 1), to: day(y, 10, 1) },
      { theme: 'weihnachten', from: firstAdvent(y), to: day(y + 1, 0, 6) }
    ];
  }
  function seasonNow(now) {
    var t = day(now.getFullYear(), now.getMonth(), now.getDate()), w = windows(now.getFullYear()).concat(windows(now.getFullYear() + 1)), i, next = null;
    for (i = 0; i < w.length; i++) {
      if (t >= w[i].from && t <= w[i].to) return { theme: w[i].theme, inSeason: true };
      if (w[i].from > t && (!next || w[i].from < next.from)) next = w[i];
    }
    return { theme: next ? next.theme : 'halloween', inSeason: false };
  }

  /* ---------- CSS ---------- */
  var CSS = ''
    + '.reveal .sz-root{position:absolute;inset:0;z-index:40;pointer-events:none;overflow:hidden;display:none;'
    +   '--sz-web:rgba(64,54,80,.5);--sz-ink:#1D1626;--sz-branch:#4A3A2A;--sz-drift:#EEF3F9;--sz-drift-edge:#D5DFEB;--sz-grass:#79AE52;--sz-thread:rgba(64,54,80,.5)}'
    + '.reveal.has-dark-background .sz-root{--sz-web:rgba(232,226,246,.42);--sz-ink:#CDC4DC;--sz-branch:#8A6E54;--sz-drift:rgba(228,236,246,.72);--sz-drift-edge:rgba(255,255,255,0);--sz-grass:#6FAE4E;--sz-thread:rgba(232,226,246,.42)}'
    + '.reveal .sz-root.t-weihnachten{--sz-thread:#C9A75A}.reveal .sz-root.t-ostern{--sz-thread:#8FB8DE}'
    + '.reveal.has-dark-background .sz-root.t-weihnachten{--sz-thread:#D9BC7A}.reveal.has-dark-background .sz-root.t-ostern{--sz-thread:#A9CDEB}'
    + '.reveal .sz-n1{stroke:#1F5A39}.reveal .sz-n2{stroke:#2C7048}.reveal .sz-n3{stroke:#3F8E5A}'
    + '.reveal.has-dark-background .sz-n1{stroke:#3E8F5C}.reveal.has-dark-background .sz-n2{stroke:#4FA06A}.reveal.has-dark-background .sz-n3{stroke:#6DB585}'
    + '.reveal.sz-on .sz-root{display:block;opacity:1;transition:opacity .6s ease}'
    + '.reveal.sz-on.sz-slide-off .sz-root{opacity:0}'
    + '.reveal .sz-root canvas{position:absolute;inset:0;width:100%;height:100%}'
    + '.reveal .sz-vig{position:absolute;inset:0;opacity:var(--sz-dark,1)}'
    + '.reveal .sz-vig.flicker{animation:szFlick 5.3s infinite}'
    + '@keyframes szFlick{0%,100%{opacity:calc(.95*var(--sz-dark,1))}7%{opacity:calc(.72*var(--sz-dark,1))}11%{opacity:var(--sz-dark,1)}29%{opacity:calc(.82*var(--sz-dark,1))}32%{opacity:calc(.62*var(--sz-dark,1))}35%{opacity:calc(.95*var(--sz-dark,1))}61%{opacity:calc(.78*var(--sz-dark,1))}63%{opacity:var(--sz-dark,1)}81%{opacity:calc(.7*var(--sz-dark,1))}}'
    + '.reveal .sz-blink{position:absolute;inset:0;background:#05000c;opacity:0}'
    + '.reveal .sz-blink.go{animation:szBlink .8s linear}'
    + '@keyframes szBlink{0%{opacity:0}12%{opacity:.5}22%{opacity:0}38%{opacity:.34}50%{opacity:0}100%{opacity:0}}'
    + '.reveal .sz-storm{position:absolute;inset:0;opacity:0}'
    + '.reveal .sz-storm.go{animation:szStorm 1.3s linear}'
    + '@keyframes szStorm{0%{opacity:0;background:#05000c}8%{opacity:.5;background:#05000c}14%{opacity:0;background:#05000c}16%{opacity:.92;background:#f3f1ff}22%{opacity:.1;background:#f3f1ff}28%{opacity:.7;background:#f3f1ff}34%{opacity:0;background:#f3f1ff}46%{opacity:.35;background:#05000c}60%{opacity:0;background:#05000c}100%{opacity:0}}'
    + '.reveal .sz-corner{position:absolute;left:0;top:0;color:var(--sz-web)}'
    + '.reveal .sz-corner path{vector-effect:non-scaling-stroke}'
    + '.reveal .sz-snow{stroke:#C7D4E3}.reveal .sz-snowf{fill:#C7D4E3}.reveal.has-dark-background .sz-snow{stroke:#F2F6FB}.reveal.has-dark-background .sz-snowf{fill:#F2F6FB}'
    + '.reveal .sz-corner svg,.reveal .sz-ground svg{display:block;width:100%;height:100%}'
    + '.reveal .sz-ground{position:absolute;left:0;right:0;bottom:0}'
    + '.reveal .sz-ground.drift{height:10%;bottom:-4.5%}.reveal .sz-ground.grass{height:7%;bottom:-2.6%}'   /* tiefer gesetzt: nur der obere Teil ragt ins Bild */
    + '.reveal .sz-bat{position:absolute;left:0;top:0;color:#1a1222;opacity:.92;will-change:transform}'
    + '.reveal.has-dark-background .sz-bat{color:#07020d;filter:drop-shadow(0 0 2px rgba(205,195,255,.45))}'
    + '.reveal .sz-bat svg{display:block;width:100%;height:auto;animation:szFlap .3s ease-in-out infinite;transform-origin:50% 30%}'
    + '@keyframes szFlap{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.5) scaleX(.94)}}'
    + '.reveal .sz-fly{position:absolute;left:0;top:0;will-change:transform}'
    + '.reveal .sz-fly svg{display:block;width:100%;height:auto}'
    + '.reveal .sz-fly .sz-wings{transform-box:fill-box;transform-origin:50% 50%;animation:szWing .38s ease-in-out infinite}'
    + '@keyframes szWing{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.3)}}'
    + '.reveal .sz-clip{position:absolute;left:0;right:0;bottom:0;overflow:hidden}'
    + '.reveal .sz-hang{position:absolute;top:0;color:var(--sz-ink);will-change:transform}'
    + '.reveal .sz-hang .sz-swing{display:flex;flex-direction:column;align-items:center;transform-origin:50% 0;animation:szSwing 2.2s ease-in-out infinite}'
    + '@keyframes szSwing{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}'
    + '.reveal .sz-thread{width:1px;background:var(--sz-thread);opacity:.9}'
    + '.reveal .sz-hang.ribbon .sz-thread{width:1.5px}'
    + '.reveal .sz-hang svg{height:auto;display:block}'
    + '.reveal .t-weihnachten .sz-hang{color:#C9962B}.reveal.has-dark-background .t-weihnachten .sz-hang{color:#F0C35A}'
    + '.reveal .sz-hang.glow svg{filter:drop-shadow(0 0 6px rgba(255,205,110,.7))}'
    + '.reveal .sz-spark{position:absolute;width:20px;color:#D2A443;opacity:0}'
    + '.reveal.has-dark-background .sz-spark{color:#F6D27A;filter:drop-shadow(0 0 5px rgba(255,220,140,.8))}'
    + '.reveal .sz-spark svg{display:block;width:100%;height:auto}'
    + '.reveal .sz-toast{position:absolute;left:50%;bottom:7%;z-index:56;transform:translate(-50%,8px);padding:.5em 1.1em;border-radius:999px;'
    +   'background:rgba(20,22,34,.8);color:#f4f2fb;font:600 15px/1.2 Inter,system-ui,-apple-system,sans-serif;letter-spacing:.02em;'
    +   'box-shadow:0 0 18px rgba(var(--sz-glow,255,122,26),.35);opacity:0;pointer-events:none;transition:opacity .25s ease,transform .25s ease}'
    + '.reveal .sz-toast.show{opacity:1;transform:translate(-50%,0)}'
    + '.reveal .sz-special{position:absolute;display:flex;align-items:center;gap:.55em;white-space:nowrap;line-height:1;opacity:0;visibility:hidden;'
    +   'animation:szIn 1.2s ease .4s forwards,szSpecialGlow 5.5s ease-in-out 1.6s infinite}'
    + '.reveal .sz-special.placed{visibility:visible}.reveal.sz-slide-off .sz-special{visibility:hidden}'
    + '.reveal .sz-special-icon{display:block;flex:none;height:.82em}.reveal .sz-special-icon svg{display:block;height:100%;width:auto}'
    + '@keyframes szIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}'
    + '@keyframes szSpecialGlow{0%,100%{text-shadow:0 0 .5em rgba(var(--sz-glow),.10)}50%{text-shadow:0 0 .7em rgba(var(--sz-glow),.35)}}'
    + '.reveal.sz-glow.has-dark-background:not(.sz-slide-off) .slides h1,.reveal.sz-glow.has-dark-background:not(.sz-slide-off) .slides h2{animation:szGlow 4.6s ease-in-out infinite}'
    + '@keyframes szGlow{0%,100%{text-shadow:0 0 .2em rgba(var(--sz-glow),.25)}45%{text-shadow:0 0 .45em rgba(var(--sz-glow),.6)}52%{text-shadow:0 0 .12em rgba(var(--sz-glow),.15)}58%{text-shadow:0 0 .5em rgba(var(--sz-glow),.65)}}'
    + '@media print{.reveal .sz-root,.reveal .sz-toast,.reveal .sz-special{display:none!important}}';

  /* ---------- Hilfsfunktionen ---------- */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html) n.innerHTML = html;
    return n;
  }
  function retrigger(node) { node.classList.remove('go'); void node.offsetWidth; node.classList.add('go'); }
  function urlParam() {
    var m = /[?&]season(?:=([^&#]*))?/.exec(location.search);
    if (m) return (m[1] || '1').toLowerCase();
    m = /[?&]halloween(?:=([^&#]*))?/.exec(location.search);   // alte Adressen weiter gültig
    if (m) { var v = (m[1] || '1').toLowerCase(); return /^(off|0|false|no)$/.test(v) ? v : 'halloween:' + v; }
    return null;
  }
  function blobSprite(r, g, b) {
    var c = document.createElement('canvas'); c.width = c.height = 256;
    var x = c.getContext('2d'), gr = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',1)');
    gr.addColorStop(0.5, 'rgba(' + r + ',' + g + ',' + b + ',.45)');
    gr.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
    x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
    return c;
  }

  /* ---------- Plugin ---------- */
  var Plugin = {
    id: 'seasons',

    init: function (deck) {
      var o = {}, k, cfg = deck.getConfig().seasons || {};
      for (k in DEFAULTS) o[k] = DEFAULTS[k];
      for (k in cfg) o[k] = cfg[k];

      if (/print-pdf/.test(location.search)) return;                        // PDF-Export bleibt sauber
      if (/[?&](receiver|pult=vorschau)/i.test(location.search)) return;   // Vorschaufenster: nichts mitlaufen lassen

      var revealEl = deck.getRevealElement();
      var reduced = o.respectReducedMotion && window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      var season = seasonNow(new Date());
      var st = { on: false, slideOff: false, hold: false, level: LEVEL[o.intensity] || LEVEL.normal, timers: {}, theme: null };
      var AC = null;

      /* Zustand pro Browser-Tab merken */
      var KEY = 'reveal-seasons';
      function remembered() { try { var v = sessionStorage.getItem(KEY); return v === null ? null : v === '1'; } catch (e) { return null; } }
      function remember(on) { try { sessionStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {} }

      /* Thema und Start-Zustand */
      var themeName = THEMES[o.theme] ? o.theme : season.theme;
      var u = urlParam(), startOn;
      if (u && u.indexOf('halloween:') === 0) { themeName = 'halloween'; u = u.slice(10); if (u === '1') u = 'on'; }
      if (u && THEMES[u]) { themeName = u; u = 'on'; }
      if (u && LEVEL[u]) { o.intensity = u; u = 'on'; }
      if (u && /^(off|0|false|no)$/.test(u)) startOn = false;
      else if (u) startOn = true;
      else if (remembered() !== null) startOn = remembered();
      else if (o.activate === 'url') startOn = false;
      else if (o.activate === 'season') startOn = season.inSeason;
      else startOn = true;

      /* CSS + feste Ebenen */
      var style = el('style'); style.id = 'sz-style'; style.textContent = CSS;
      document.head.appendChild(style);

      var root = el('div', 'sz-root');
      var cv = el('canvas');
      var vig = el('div', 'sz-vig');
      var deco = el('div', 'sz-deco');
      var actors = el('div', 'sz-actors');
      var blink = el('div', 'sz-blink');
      var storm = el('div', 'sz-storm');
      [cv, vig, deco, actors, blink, storm].forEach(function (n) { root.appendChild(n); });
      revealEl.appendChild(root);
      var toast = el('div', 'sz-toast'), toastT = 0;
      revealEl.appendChild(toast);

      function W() { return root.clientWidth; }
      function H() { return root.clientHeight; }
      function vmin() { return Math.min(W(), H()) / 100; }
      function T() { return THEMES[st.theme]; }
      function minutes(slot) {
        var own = o.minutes && o.minutes[slot];
        return own != null ? own : T().minutes[slot];
      }

      /* ---- Umgebung: Nebel oder Schneefall auf einer Leinwand ---- */
      var ctx = cv.getContext && cv.getContext('2d');
      var blobDark = blobSprite(200, 186, 232), blobLight = blobSprite(92, 76, 124);
      var banks = [], flakes = [], i;
      for (i = 0; i < 8; i++) banks.push({ x: rnd(-0.1, 1.1), y: rnd(0.8, 1.02), s: rnd(0.38, 0.62), vx: rnd(0.008, 0.02) * (Math.random() < 0.5 ? -1 : 1), a: rnd(0.55, 1), p: rnd(0, 6.3) });
      for (i = 0; i < 60; i++) flakes.push({ x: Math.random(), y: Math.random(), r: rnd(0.7, 2), v: rnd(0.012, 0.03), sw: rnd(0.002, 0.006), p: rnd(0, 6.3), a: rnd(0.35, 0.9) });
      var raf = 0, lastT = 0;

      function sizeCanvas() {
        if (!ctx) return;
        cv.width = Math.max(2, Math.round(root.clientWidth / 2));
        cv.height = Math.max(2, Math.round(root.clientHeight / 2));
      }
      function draw(dt, t) {
        var Wc = cv.width, Hc = cv.height, dark = revealEl.classList.contains('has-dark-background'), amb = T().ambient;
        ctx.clearRect(0, 0, Wc, Hc);
        if (amb === 'fog') {
          var blob = dark ? blobDark : blobLight, base = 0.2 * st.level.amb;
          banks.forEach(function (b) {
            b.x += b.vx * dt;
            if (b.x > 1.3) b.x = -0.3; else if (b.x < -0.3) b.x = 1.3;
            var s = b.s * Wc;
            ctx.globalAlpha = Math.min(1, base * b.a * (0.75 + 0.25 * Math.sin(t * 0.35 + b.p)));
            ctx.drawImage(blob, b.x * Wc - s / 2, b.y * Hc - s * 0.28, s, s * 0.56);
          });
        } else if (amb === 'snow') {
          var n = Math.round(Math.min(60, 38 * st.level.amb)), scale = Hc / 360;
          ctx.fillStyle = dark ? '#ffffff' : '#9FB2CA';
          for (var j = 0; j < n; j++) {
            var f = flakes[j];
            f.y += f.v * dt; if (f.y > 1.02) { f.y = -0.02; f.x = Math.random(); }
            var x = (f.x + Math.sin(t * 0.6 + f.p) * f.sw) * Wc;
            ctx.globalAlpha = f.a * (dark ? 0.85 : 0.6);
            ctx.beginPath(); ctx.arc(x, f.y * Hc, f.r * scale, 0, 6.283); ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
      }
      function loop(ts) {
        raf = requestAnimationFrame(loop);
        if (ts - lastT < 33) return;
        var dt = Math.min(0.1, (ts - lastT) / 1000); lastT = ts;
        draw(dt, ts / 1000);
      }
      function ambStop() {
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        if (ctx) ctx.clearRect(0, 0, cv.width, cv.height);
      }
      function ambStart() {
        if (!ctx || !T().ambient) { ambStop(); return; }
        sizeCanvas();
        if (reduced) { draw(0, 0); return; }
        if (!raf) { lastT = 0; raf = requestAnimationFrame(loop); }
      }

      /* ---- Feste Deko des Themas ---- */
      function buildDeco() {
        var th = T();
        deco.innerHTML = '';
        vig.style.background = th.vig;
        vig.classList.toggle('flicker', !!th.flicker);
        root.className = 'sz-root t-' + st.theme;
        root.style.setProperty('--sz-glow', th.glow);
        revealEl.style.setProperty('--sz-glow', th.glow);
        if (th.corner) {
          var c = el('div', 'sz-corner', th.corner.svg);
          c.style.width = th.corner.w + 'vmin'; c.style.height = th.corner.h + 'vmin';
          deco.appendChild(c);
        }
        if (th.ground) deco.appendChild(el('div', 'sz-ground ' + th.ground, { drift: DRIFT, grass: GRASS }[th.ground]));
        actors.innerHTML = '';
      }

      /* ---- Was am Faden hängt: Spinne, Stern, Osterei ---- */
      function hanger() {
        if (!T().hanger || actors.querySelectorAll('.sz-hang').length >= 2) return;
        var hs = T().hanger, h = H(), v = vmin(), L = hs.noThread ? 0 : Math.round(h * 1.3);
        var hw = hs.wv ? hs.wv * v : hs.w, S = hs.hv ? hs.hv * v : hs.w + 8;
        var cx = rnd(hs.x[0], hs.x[1]) * v;
        // Faden beginnt am Zweig bzw. an der Kette statt am oberen Rand
        var top = (hs.top || 0) * v;
        var left = cx - hw / 2;
        // Der Faden beginnt erst am Zweig: alles darüber schneidet ein Rahmen ab
        var clip = el('div', 'sz-clip'); clip.style.top = top + 'px';
        var n = el('div', 'sz-hang' + (hs.glow ? ' glow' : '') + (hs.ribbon ? ' ribbon' : ''));
        n.style.left = left + 'px'; n.style.top = (-L - S) + 'px';
        var motif = Array.isArray(hs.svg) ? pick(hs.svg) : hs.svg;
        n.innerHTML = '<div class="sz-swing">' + (L ? '<div class="sz-thread" style="height:' + L + 'px"></div>' : '') + motif + '</div>';
        var svg = n.querySelector('svg:last-child'); svg.style.width = hw + 'px'; if (hs.hv) svg.style.height = S + 'px';
        svg.style.marginTop = (-(hs.overlap || 0)) + 'px';
        clip.appendChild(n); actors.appendChild(clip);
        // mit Faden: Oberkante des Motivs auf Höhe y · Luftschlange: ihre Unterkante auf Höhe y, oben bleibt sie am Rand
        function at(y) { return 'translateY(' + Math.round(hs.noThread ? Math.min(y, S) - top : y - top + S) + 'px)'; }
        // Spinne am Rand darf tief hinab; Stern und Ei hängen weiter innen und bleiben über dem Titel
        var dr = hs.depth || [0.28, 0.6], span = (dr[1] - dr[0]) * h;
        var y1 = rnd(dr[0], dr[1]) * h, y2 = Math.min(dr[1] * h + span * 0.2, Math.max(dr[0] * h, y1 + rnd(-0.4, 0.5) * span));
        var up = Math.max(top + h * 0.05, y1 * rnd(0.45, 0.65));
        var a = n.animate([
          { transform: 'translateY(0)', offset: 0, easing: 'cubic-bezier(.25,.6,.35,1)' },
          { transform: at(y1), offset: 0.2, easing: 'ease-in-out' },
          { transform: at(y1 - 6), offset: 0.26, easing: 'ease-in-out' },
          { transform: at(y1), offset: 0.32, easing: 'ease-in-out' },
          { transform: at(up), offset: 0.44, easing: 'ease-in-out' },
          { transform: at(up), offset: 0.5, easing: 'cubic-bezier(.3,.5,.4,1)' },
          { transform: at(y2), offset: 0.62, easing: 'ease-in-out' },
          { transform: at(y2 - 5), offset: 0.7, easing: 'ease-in-out' },
          { transform: at(y2), offset: 0.78, easing: 'ease-in' },
          { transform: 'translateY(0)', offset: 1 }
        ], { duration: rnd(10500, 13500), fill: 'both' });
        a.onfinish = function () { clip.remove(); };
      }

      /* ---- Was fliegt: Fledermäuse, Schmetterlinge, Funkeln ---- */
      function glide(n, size, y0, amp, dur, delay, tilt, flip) {
        var w = W(), h = H(), ltr = Math.random() < 0.5, ph = rnd(0, 6.3), rise = rnd(0, 0.06), steps = 12, frames = [], j;
        for (j = 0; j <= steps; j++) {
          var f = j / steps, x = ltr ? -size * 2 + f * (w + size * 4) : w + size * 2 - f * (w + size * 4);
          var y = y0 * h + Math.sin(f * Math.PI * 2.6 + ph) * amp * h - f * rise * h;
          frames.push({ transform: 'translate3d(' + x.toFixed(0) + 'px,' + y.toFixed(0) + 'px,0) rotate(' + (Math.cos(f * Math.PI * 2.6 + ph) * tilt).toFixed(0) + 'deg)' + (flip ? ' scaleX(' + (ltr ? 1 : -1) + ')' : '') });
        }
        var a = n.animate(frames, { duration: dur, delay: delay || 0, easing: 'linear', fill: 'both' });
        a.onfinish = function () { n.remove(); };
      }
      function bats() {
        if (actors.querySelectorAll('.sz-bat').length >= 3) return;
        var c = pick([1, 1, 2, 2, 3]), j;
        for (j = 0; j < c; j++) {
          var size = rnd(30, 50), n = el('div', 'sz-bat', BAT); n.style.width = size + 'px';
          actors.appendChild(n);
          glide(n, size, rnd(0.07, 0.2), rnd(0.025, 0.05), rnd(5200, 8200), j * rnd(250, 700), 10, true);
        }
      }
      function butterflies() {
        if (actors.querySelectorAll('.sz-fly').length >= 2) return;
        var c = pick([1, 1, 2]), j, cols = [['#F2A541', '#F6C27A'], ['#7FB2D9', '#A9CDEB'], ['#E58FA6', '#F4C6D0']];
        for (j = 0; j < c; j++) {
          var size = rnd(30, 44), cc = pick(cols), n = el('div', 'sz-fly', butterflySVG(cc[0], cc[1])); n.style.width = size + 'px';
          actors.appendChild(n);
          glide(n, size, rnd(0.08, 0.26), rnd(0.04, 0.08), rnd(11000, 15000), j * rnd(600, 1400), 14, false);
        }
      }
      function sparkles(count) {
        var w = W(), h = H(), c = count || pick([3, 4, 5]), j;
        for (j = 0; j < c; j++) {
          var n = el('div', 'sz-spark', SPARKLE), s = rnd(12, 22);
          n.style.width = s + 'px';
          n.style.left = (rnd(0.55, 0.97) * w) + 'px'; n.style.top = (rnd(0.04, 0.34) * h) + 'px';
          actors.appendChild(n);
          (function (node) {
            var a = node.animate([
              { opacity: 0, transform: 'scale(.2) rotate(0deg)' },
              { opacity: 1, transform: 'scale(1) rotate(45deg)', offset: 0.45 },
              { opacity: 0, transform: 'scale(.2) rotate(90deg)' }
            ], { duration: rnd(1400, 2200), delay: j * rnd(250, 600), easing: 'ease-in-out', fill: 'both' });
            a.onfinish = function () { node.remove(); };
          })(n);
        }
      }
      function flyer() {
        var f = T().flyer;
        if (f === 'bats') bats(); else if (f === 'butterflies') butterflies(); else if (f === 'sparkles') sparkles();
      }

      /* ---- Blitz (Halloween) ---- */
      function thunder() {
        if (!o.sound) return;
        try {
          AC = AC || new (window.AudioContext || window.webkitAudioContext)();
          if (AC.state === 'suspended') AC.resume();
          var len = Math.floor(AC.sampleRate * 2.8), buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0), s;
          for (s = 0; s < len; s++) d[s] = (Math.random() * 2 - 1) * Math.pow(1 - s / len, 2.2);
          var src = AC.createBufferSource(), fl = AC.createBiquadFilter(), g = AC.createGain();
          src.buffer = buf; fl.type = 'lowpass'; fl.frequency.value = 240; g.gain.value = 0.9;
          src.connect(fl); fl.connect(g); g.connect(AC.destination);
          setTimeout(function () { try { src.start(); } catch (e) {} }, 350);
        } catch (e) {}
      }
      function flash() { if (T().flash === 'lightning') { retrigger(storm); thunder(); } }

      /* ---- Taktgeber ---- */
      function active() { return st.on && !st.slideOff && !st.hold && !document.hidden && !reduced; }
      function schedule(name, fn, first) {
        clearTimeout(st.timers[name]);
        var m = minutes(name);
        if (!st.on || !m) return;
        var d = m * 60000 / st.level.freq * rnd(0.6, 1.4) * (first ? 0.3 : 1);
        st.timers[name] = setTimeout(function () { if (active()) fn(); schedule(name, fn); }, d);
      }
      function startTimers() {
        if (reduced) return;
        if (T().hanger) schedule('hanger', hanger, true);
        if (T().flyer) schedule('flyer', flyer, true);
        if (T().flash) schedule('flash', flash, true);
      }
      function stopTimers() { for (var n in st.timers) clearTimeout(st.timers[n]); st.timers = {}; }

      /* ---- Folien ---- */
      function slideMode() {
        var n = deck.getCurrentSlide();
        while (n && n !== revealEl) {
          if (n.hasAttribute) {
            if (n.hasAttribute('data-season')) return (n.getAttribute('data-season') || '').toLowerCase();
            if (n.hasAttribute('data-halloween')) return (n.getAttribute('data-halloween') || '').toLowerCase();
          }
          n = n.parentElement;
        }
        return null;
      }
      function applySlide() {
        var m = slideMode();
        st.slideOff = /^(off|0|false|no)$/.test(m || '');
        st.level = LEVEL[m] || LEVEL[o.intensity] || LEVEL.normal;
        var light = !revealEl.classList.contains('has-dark-background');
        root.style.setProperty('--sz-dark', st.level.dark * (light ? 0.6 : 1));
        revealEl.classList.toggle('sz-slide-off', st.slideOff || st.hold);
        if (st.on && !st.slideOff && !st.hold) ambStart(); else ambStop();
        if (st.slideOff) setTimeout(function () { if (st.slideOff) actors.innerHTML = ''; }, 700);
      }
      function onSlide() {
        applySlide();
        if (active() && st.theme === 'halloween' && Math.random() < 0.08) retrigger(blink);
      }

      /* ---- Schriftzug auf dem Deckblatt: übernimmt die Schrift der Kicker-Zeile ---- */
      var specialEl = null;
      function special(on) {
        if (specialEl) { specialEl.remove(); specialEl = null; }
        if (!on || !o.special) return;
        var first = (deck.getSlides && deck.getSlides()[0]) || revealEl.querySelector('.slides > section');
        if (!first) return;
        var host = first.querySelector('.cardslide') || first, th = T();
        // Anker: das letzte sichtbare Element des Titelblocks (z. B. die Autorenzeile)
        var kids = [].filter.call(host.children, function (c) { return !/^(ASIDE|SCRIPT|STYLE)$/.test(c.tagName) && !c.classList.contains('notes'); });
        var anchor = kids[kids.length - 1] || null;
        var kicker = first.querySelector('.s-label, .kicker, .eyebrow, .overline');
        specialEl = el('div', 'sz-special', '<span class="sz-special-icon"></span><span class="sz-special-text"></span>');
        specialEl.querySelector('.sz-special-icon').innerHTML = th.icon;
        if (th.iconColor) specialEl.querySelector('.sz-special-icon').style.color = th.iconColor;
        specialEl.querySelector('.sz-special-text').textContent = typeof o.special === 'string' ? o.special : th.label;
        specialEl.setAttribute('aria-hidden', 'true');
        var dark = first.classList.contains('has-dark-background');
        specialEl.style.color = th.color[dark ? 1 : 0];
        if (kicker) {
          var cs = getComputedStyle(kicker);
          ['fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'textTransform'].forEach(function (p) { specialEl.style[p] = cs[p]; });
        } else {
          specialEl.style.fontSize = '22px'; specialEl.style.fontWeight = '700'; specialEl.style.letterSpacing = '.3em'; specialEl.style.textTransform = 'uppercase';
        }
        // schwebt unter dem Titelblock, statt ihn zu verlängern: so verschiebt sich beim Umschalten nichts
        specialEl._anchor = anchor;
        first.appendChild(specialEl);
        placeSpecial();
      }
      function offsetIn(node, anc) {
        var x = 0, y = 0, n = node;
        while (n && n !== anc) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
        return n === anc ? { x: x, y: y } : null;
      }
      function placeSpecial() {
        if (!specialEl || !specialEl.isConnected) return;
        var sec = specialEl.parentNode, a = specialEl._anchor, gap = (parseFloat(specialEl.style.fontSize) || 22) * 1.55;
        var p = a && a.offsetParent ? offsetIn(a, sec) : null;
        if (p) { specialEl.style.left = p.x + 'px'; specialEl.style.top = (p.y + a.offsetHeight + gap) + 'px'; specialEl.style.bottom = ''; }
        else if (sec.offsetParent || sec.offsetWidth) { specialEl.style.left = '6%'; specialEl.style.top = ''; specialEl.style.bottom = '12%'; }
        else return;   // Deckblatt gerade nicht gerendert: später nachholen
        specialEl.classList.add('placed');
      }

      /* ---- Schalter ---- */
      function say(text) {
        toast.textContent = text; toast.classList.add('show');
        clearTimeout(toastT); toastT = setTimeout(function () { toast.classList.remove('show'); }, 1400);
      }
      function setOn(on, by) {
        st.on = !!on;
        if (by) { remember(st.on); say(T().name + (st.on ? ' an' : ' aus')); }
        revealEl.classList.toggle('sz-on', st.on);
        revealEl.classList.toggle('sz-glow', st.on && o.glowHeadings !== false);
        special(st.on);
        stopTimers();
        if (st.on) { applySlide(); startTimers(); } else { ambStop(); actors.innerHTML = ''; }
      }
      function setTheme(name) {
        if (!THEMES[name]) return;
        st.theme = name;
        ambStop(); buildDeco();
        if (st.on) { special(true); stopTimers(); applySlide(); startTimers(); }
      }
      function surprise() {
        if (!st.on) setOn(true, 'key');
        if (st.slideOff) return;
        if (reduced) { retrigger(blink); return; }
        if (st.theme === 'halloween') { retrigger(blink); flash(); bats(); hanger(); }
        else if (st.theme === 'weihnachten') { sparkles(8); hanger(); }
        else { butterflies(); hanger(); }
      }

      /* ---- Tasten ---- */
      var KEYCODE = 'Key' + String(o.key || 'w').toUpperCase();
      function typing(t) { return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)); }
      document.addEventListener('keydown', function (e) {
        if (e.ctrlKey || e.metaKey || e.repeat || typing(e.target)) return;
        if (!e.altKey && e.code === KEYCODE) {
          e.preventDefault(); e.stopPropagation();
          if (e.shiftKey) surprise(); else setOn(!st.on, 'key');
        } else if (e.altKey && !e.shiftKey) {
          if (e.code === 'KeyH') { e.preventDefault(); setOn(!st.on, 'key'); }
          else if (e.code === 'KeyG') { e.preventDefault(); surprise(); }
        }
      }, true);
      if (deck.registerKeyboardShortcut) {
        var K = String(o.key || 'w').toUpperCase();
        deck.registerKeyboardShortcut(K, 'Saison-Effekte an/aus');
        deck.registerKeyboardShortcut('⇧ ' + K, 'Saison-Effekte: Überraschung');
      }

      /* ---- Ereignisse ---- */
      deck.on('slidechanged', onSlide);
      function hold(v) { return function () { st.hold = v; if (st.on) applySlide(); }; }
      deck.on('overviewshown', hold(true)); deck.on('overviewhidden', hold(false));
      deck.on('paused', hold(true)); deck.on('resumed', hold(false));
      deck.on('resize', function () { if (st.on) { sizeCanvas(); placeSpecial(); } });
      deck.on('slidechanged', placeSpecial);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeSpecial);
      window.addEventListener('resize', function () { if (st.on) sizeCanvas(); });
      document.addEventListener('visibilitychange', function () {
        if (!st.on) return;
        if (document.hidden) ambStop(); else if (!st.slideOff) ambStart();
      });

      /* ---- Start ---- */
      st.theme = themeName;
      buildDeco();
      setOn(startOn);
      deck.on('ready', function () { if (st.on) { special(true); applySlide(); } });

      /* ---- API ---- */
      Plugin.enable = function () { setOn(true, 'api'); };
      Plugin.disable = function () { setOn(false, 'api'); };
      Plugin.toggle = function () { setOn(!st.on, 'api'); };
      Plugin.surprise = surprise;
      Plugin.setTheme = setTheme;
      Plugin.theme = function () { return st.theme; };
      Plugin.isOn = function () { return st.on; };
      Plugin.seasonFor = function (date) { return seasonNow(date); };
    }
  };

  return Plugin;
})));
