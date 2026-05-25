// Mobile-Nav: nach Link-Klick schliessen + Body-Scroll sperren wenn offen
(function () {
  const toggle = document.getElementById('nav-toggle');
  if (!toggle) return;
  const nav = document.querySelector('.nav');
  const setNavHeight = () => {
    if (nav) document.documentElement.style.setProperty('--nav-h', nav.offsetHeight + 'px');
  };
  setNavHeight();
  window.addEventListener('resize', setNavHeight);
  window.addEventListener('orientationchange', setNavHeight);
  window.addEventListener('load', setNavHeight);
  // Nach Logo-Laden nochmal messen (falls Bildgröße erst dann korrekt ist)
  const brandImg = nav && nav.querySelector('.brand-mark');
  if (brandImg && !brandImg.complete) brandImg.addEventListener('load', setNavHeight);
  const mobileNav = window.matchMedia('(max-width: 1024px)');
  const sync = () => document.body.classList.toggle('nav-open', toggle.checked);
  toggle.addEventListener('change', sync);
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => {
      // Auf Mobile: Zielname-Links toggeln nur das Submenu, schliessen Drawer nicht
      if (mobileNav.matches && a.parentElement && a.parentElement.classList.contains('nav-item')) return;
      toggle.checked = false; sync();
    });
  });
  // Mobile Accordion: Zielname-Klick klappt Submenu auf/zu
  document.querySelectorAll('.nav-item > a').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (!mobileNav.matches) return;
      e.preventDefault();
      const item = link.closest('.nav-item');
      const wasOpen = item.classList.contains('is-open');
      document.querySelectorAll('.nav-item.is-open').forEach(function (el) { el.classList.remove('is-open'); });
      if (!wasOpen) item.classList.add('is-open');
    });
  });
  // Drawer schliessen → alle Submenus zuklappen
  toggle.addEventListener('change', function () {
    if (!toggle.checked) document.querySelectorAll('.nav-item.is-open').forEach(function (el) { el.classList.remove('is-open'); });
  });
  sync();
})();

// (Bento Hash-Handler entfernt)

// (SPA-Router entfernt)

// Quick-link Modal: Supermarkt & Ladestation als Popup öffnen
(function () {
  var modal     = document.getElementById('qlModal');
  var modalIcon = document.getElementById('qlModalIcon');
  var modalTitle= document.getElementById('qlModalTitle');
  var modalList = document.getElementById('qlModalList');
  if (!modal) return;

  function openModal(card) {
    var title = card.querySelector('.quick-link__title');
    var icon  = card.querySelector('.quick-link__icon');
    var items = card.querySelectorAll('.ql-dropdown li');

    modalTitle.textContent = title ? title.textContent.replace(/▾/,'').trim() : '';
    modalIcon.innerHTML    = icon ? icon.innerHTML : '';

    // Farbe der Karte übernehmen
    var color = getComputedStyle(card).color;
    modalIcon.style.color      = color;
    modalIcon.style.background = '';

    modalList.innerHTML = '';
    items.forEach(function (li) {
      var a = li.querySelector('a');
      if (!a) return;
      var clone = a.cloneNode(true);
      clone.removeAttribute('id'); // Geolocation-IDs bleiben im Original
      // Geolocation-Buttons: Original-Click-Handler übernehmen (via ID)
      if (a.id) {
        clone.id = a.id + '_modal';
        clone.addEventListener('click', function (e) {
          e.preventDefault();
          // Original-Button-Click weiterleiten
          var orig = document.getElementById(a.id);
          if (orig) orig.click();
          closeModal();
        });
      }
      var wrapper = document.createElement('li');
      wrapper.appendChild(clone);
      modalList.appendChild(wrapper);
    });

    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.ql-modal__close').focus();
  }

  function closeModal() {
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  // Karten-Klick öffnet Modal
  document.querySelectorAll('.quick-link--dropdown').forEach(function (el) {
    el.addEventListener('click', function (e) {
      if (e.target.closest('.ql-dropdown')) return;
      e.stopPropagation();
      openModal(el);
    });
  });

  // Schließen: Backdrop, Close-Button, Escape
  modal.querySelector('.ql-modal__backdrop').addEventListener('click', closeModal);
  modal.querySelector('.ql-modal__close').addEventListener('click', closeModal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  // "Nächster Supermarkt" – Geolocation → Google Maps
  var nearbyBtn = document.getElementById('qlNearbySupermarkt');
  if (nearbyBtn) {
    nearbyBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (!navigator.geolocation) {
        window.open('https://www.google.com/maps/search/Supermarkt/', '_blank');
        return;
      }
      nearbyBtn.textContent = '⏳ Standort wird ermittelt…';
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          nearbyBtn.textContent = '📍 Nächster Supermarkt';
          var lat = pos.coords.latitude.toFixed(6);
          var lng = pos.coords.longitude.toFixed(6);
          window.open(
            'https://www.google.com/maps/search/Supermarkt/@' + lat + ',' + lng + ',14z',
            '_blank'
          );
        },
        function () {
          nearbyBtn.textContent = '📍 Nächster Supermarkt';
          // Fallback ohne Koordinaten
          window.open('https://www.google.com/maps/search/Supermarkt/', '_blank');
        },
        { timeout: 8000, maximumAge: 60000 }
      );
    });
  }

  // "Ladestation in der Nähe" – Geolocation → Google Maps
  var nearbyEbike = document.getElementById('qlNearbyEbike');
  if (nearbyEbike) {
    nearbyEbike.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (!navigator.geolocation) {
        window.open('https://www.google.com/maps/search/E-Bike+Ladestation/', '_blank');
        return;
      }
      nearbyEbike.textContent = '⏳ Standort wird ermittelt…';
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          nearbyEbike.textContent = '📍 Ladestation in der Nähe';
          var lat = pos.coords.latitude.toFixed(6);
          var lng = pos.coords.longitude.toFixed(6);
          window.open(
            'https://www.google.com/maps/search/E-Bike+Ladestation/@' + lat + ',' + lng + ',14z',
            '_blank'
          );
        },
        function () {
          nearbyEbike.textContent = '📍 Ladestation in der Nähe';
          window.open('https://www.google.com/maps/search/E-Bike+Ladestation/', '_blank');
        },
        { timeout: 8000, maximumAge: 60000 }
      );
    });
  }
})();

// Vögel: Bilder laden + Filter/Suche
(function () {
  const grid = document.getElementById('birdsGrid');
  if (!grid) return;

  const cards    = Array.from(grid.querySelectorAll('.bird-card'));
  const search   = document.getElementById('birdSearch');
  const seasons  = document.getElementById('seasonPills');
  const habitats = document.getElementById('habitatPills');
  const count    = document.getElementById('birdCount');
  const empty    = document.getElementById('birdsEmpty');

  // --- Bilder laden ---
  // Strategie (mit Fallback-Kette, damit jede Karte ein Bild bekommt):
  //   1) de.wikipedia Action-API → prop=pageimages (CORS-fähig via origin=*)
  //   2) en.wikipedia Action-API mit wissenschaftlichem Namen
  //   3) Commons Special:FilePath mit explizitem Dateinamen (data-fallback)
  function setImage(card, url) {
    const img = card.querySelector('.bird-img');
    if (img) img.style.backgroundImage = `url("${url}")`;
  }
  function probe(url) {
    return new Promise(resolve => {
      if (!url) return resolve(false);
      const im = new Image();
      im.onload  = () => resolve(true);
      im.onerror = () => resolve(false);
      im.src = url;
    });
  }

  function fetchWikiThumb(lang, title) {
    const api = `https://${lang}.wikipedia.org/w/api.php`
      + `?action=query&format=json&origin=*&redirects=1`
      + `&prop=pageimages&piprop=thumbnail&pithumbsize=640`
      + `&titles=${encodeURIComponent(title)}`;
    return fetch(api)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const pages = data && data.query && data.query.pages;
        if (!pages) return null;
        for (const id in pages) {
          const src = pages[id] && pages[id].thumbnail && pages[id].thumbnail.source;
          if (src) return src;
        }
        return null;
      })
      .catch(() => null);
  }

  function commonsFallback(file) {
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=640`;
  }

  async function loadBirdImage(card) {
    const title = card.dataset.wiki;
    const sci   = card.dataset.sci;
    const file  = card.dataset.fallback;

    const candidates = [];
    if (title) candidates.push(() => fetchWikiThumb('de', title));
    if (sci)   candidates.push(() => fetchWikiThumb('en', sci));
    if (title) candidates.push(() => fetchWikiThumb('en', title));
    if (file)  candidates.push(() => Promise.resolve(commonsFallback(file)));

    for (const get of candidates) {
      const url = await get();
      if (url && await probe(url)) { setImage(card, url); return; }
    }
  }

  cards.forEach(loadBirdImage);

  // --- Filter ---
  const state = { q: '', seasons: new Set(), habitats: new Set() };

  function applyFilter() {
    let visible = 0;
    const q = state.q.trim().toLowerCase();
    cards.forEach(card => {
      const name = (card.dataset.name || '').toLowerCase();
      const sci  = (card.dataset.sci  || '').toLowerCase();
      const desc = (card.querySelector('.bird-desc')?.textContent || '').toLowerCase();
      const cardSeasons  = (card.dataset.seasons  || '').split(',');
      const cardHabitats = (card.dataset.habitats || '').split(',');

      const matchesQ = !q || name.includes(q) || sci.includes(q) || desc.includes(q);
      const matchesS = state.seasons.size  === 0 || cardSeasons.some(s  => state.seasons.has(s));
      const matchesH = state.habitats.size === 0 || cardHabitats.some(h => state.habitats.has(h));

      const show = matchesQ && matchesS && matchesH;
      card.classList.toggle('hidden', !show);
      if (show) visible++;
    });
    count.textContent = visible;
    empty.classList.toggle('show', visible === 0);
  }

  function bindPills(container, key, dataAttr) {
    if (!container) return;
    container.addEventListener('click', e => {
      const btn = e.target.closest('.pill');
      if (!btn) return;
      const value = btn.dataset[dataAttr];
      if (!value) return;
      btn.classList.toggle('active');
      if (btn.classList.contains('active')) state[key].add(value);
      else                                  state[key].delete(value);
      applyFilter();
    });
  }
  bindPills(seasons,  'seasons',  'season');
  bindPills(habitats, 'habitats', 'habitat');

  search?.addEventListener('input', e => {
    state.q = e.target.value || '';
    applyFilter();
  });

  // initial count
  count.textContent = cards.length;
})();

// Leaflet initializer — initialisiert alle Elemente mit Klasse .leaflet-map
(function () {
  if (typeof L === 'undefined') return;

  const parsePt = s => s.split(',').map(Number);

  document.querySelectorAll('.leaflet-map').forEach(el => {
    const start    = parsePt(el.dataset.start || '53.4097,6.2042');
    const end      = parsePt(el.dataset.end);
    const endLabel = el.dataset.endLabel || 'Ziel';
    const isFerry  = el.dataset.ferry === 'true';

    let route = [start, end];
    if (el.dataset.route) {
      const pts = el.dataset.route.split(';').map(parsePt);
      route = [start, ...pts, end];
    }

    const map = L.map(el, { scrollWheelZoom: false, zoomControl: true });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
    }).addTo(map);

    const makeIcon = (label, color) => L.divIcon({
      className: 'pin-marker',
      html: `<div style="position:relative;width:36px;height:48px;">
               <div style="position:absolute;top:0;left:0;width:36px;height:36px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 6px 14px rgba(12,30,62,.35);border:2px solid #fff;"></div>
               <div style="position:absolute;top:7px;left:0;width:36px;text-align:center;font-size:14px;color:#fff;font-weight:600;font-family:'Space Grotesk',sans-serif;">${label}</div>
             </div>`,
      iconSize: [36, 48],
      iconAnchor: [18, 48],
    });

    L.marker(start, { icon: makeIcon('A', '#0c1e3e') })
      .addTo(map)
      .bindPopup('<strong>Lauwersoog</strong><br>Startpunkt');

    L.marker(end, { icon: makeIcon('B', '#f97357') })
      .addTo(map)
      .bindPopup(`<strong>${endLabel}</strong>`);

    L.polyline(route, {
      color: isFerry ? '#0c1e3e' : '#f97357',
      weight: 4,
      opacity: 0.9,
      dashArray: isFerry ? '8, 10' : null,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    const bounds = L.latLngBounds(route).pad(0.25);
    map.fitBounds(bounds);
  });
})();

// ============================================================
// Wetter-Kurzinfo — Open-Meteo API (kein API-Key erforderlich)
// ============================================================
(function () {
  var wsEmoji = document.getElementById('wsEmoji');
  if (!wsEmoji) return; // nur auf der Startseite

  var wsTemp  = document.getElementById('wsTemp');
  var wsCond  = document.getElementById('wsCondition');
  var wsWind  = document.getElementById('wsWind');
  var wsSunrise = document.getElementById('wsSunrise');
  var wsSunset  = document.getElementById('wsSunset');
  var card    = document.getElementById('weatherWidget');

  var WMO_EMOJI = {
    0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
    45: '🌫️', 48: '🌫️',
    51: '🌦️', 53: '🌦️', 55: '🌧️',
    61: '🌧️', 63: '🌧️', 65: '🌧️',
    71: '🌨️', 73: '❄️', 75: '❄️',
    80: '🌦️', 81: '🌧️', 82: '⛈️',
    95: '⛈️', 96: '⛈️', 99: '⛈️'
  };
  var WMO_TEXT = {
    0: 'Klar', 1: 'Überwiegend klar', 2: 'Teils bewölkt', 3: 'Bewölkt',
    45: 'Nebel', 48: 'Nebel',
    51: 'Leichter Nieselregen', 53: 'Nieselregen', 55: 'Starker Nieselregen',
    61: 'Leichter Regen', 63: 'Regen', 65: 'Starker Regen',
    71: 'Leichter Schneefall', 73: 'Schneefall', 75: 'Starker Schneefall',
    80: 'Regenschauer', 81: 'Starke Schauer', 82: 'Heftige Schauer',
    95: 'Gewitter', 96: 'Gewitter mit Hagel', 99: 'Heftiges Gewitter'
  };
  function moodFromCode(c) {
    if (c >= 95) return 'storm';
    if (c >= 71 && c <= 77) return 'snow';
    if ((c >= 51 && c <= 67) || (c >= 80 && c <= 82)) return 'rain';
    if (c === 3 || c === 45 || c === 48) return 'cloudy';
    return 'clear';
  }
  function fmtHM(iso) {
    return new Date(iso).toLocaleTimeString('de-DE', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam'
    });
  }

  fetch('https://api.open-meteo.com/v1/forecast?latitude=53.41&longitude=6.21&current=temperature_2m,weather_code,wind_speed_10m&daily=sunrise,sunset&wind_speed_unit=kmh&timezone=Europe%2FAmsterdam')
    .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
    .then(function (data) {
      var c    = data.current;
      var code = c.weather_code;
      var temp = Math.round(c.temperature_2m);
      var wind = Math.round(c.wind_speed_10m);
      var emoji = WMO_EMOJI[code] || '🌡️';
      var text  = WMO_TEXT[code]  || '';
      wsEmoji.textContent = emoji;
      if (wsTemp) wsTemp.textContent = temp + '°';
      if (wsCond) wsCond.textContent = text || '–';
      if (wsWind) wsWind.textContent = '💨 ' + wind + ' km/h';
      if (data.daily && data.daily.sunrise) {
        if (wsSunrise) wsSunrise.textContent = fmtHM(data.daily.sunrise[0]);
        if (wsSunset)  wsSunset.textContent  = fmtHM(data.daily.sunset[0]);
      }
      if (card) card.setAttribute('data-mood', moodFromCode(code));
    })
    .catch(function () {
      wsEmoji.textContent = '—';
      if (wsCond) wsCond.textContent = 'Aktuell nicht verfügbar';
      if (wsWind) wsWind.textContent = '';
      if (wsSunrise) wsSunrise.textContent = '–';
      if (wsSunset)  wsSunset.textContent  = '–';
    });
})();

// ============================================================
// Gezeiten-Widget — Harmonische Gezeitenvorhersage für Lauwersoog (LWOO)
// Methode: Harmonische Analyse mit 7 Hauptkonstituenten (M2, S2, N2, K1, O1, M4, K2)
// Konstituenten-Phasen basieren auf RWS-Getijtafeln für Station LWOO (Wadden Sea).
// Genauigkeit: Zeiten ≈ ±30 Min, Höhen ≈ ±10 cm   (kein CORS-Aufruf nötig)
// ============================================================
(function () {
  var body   = document.getElementById('tidesBody');
  var dateEl = document.getElementById('tidesDate');
  if (!body) return;

  var TZ  = 'Europe/Amsterdam';
  var now = new Date();

  if (dateEl) {
    dateEl.textContent = now.toLocaleDateString('de-DE', {
      weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ
    });
  }

  // ---- Harmonische Konstituenten ----
  // Formel: η(t) = Σ H · cos(speed · t_h + φ₀)  [t_h = Stunden seit J2000]
  // φ₀ = V₀(J2000) − g
  //   V₀(J2000): Astronomisches Gleichgewichtsargument am 2000-01-01T12:00:00 UTC
  //              s₀=218.32°  h₀=280.47°  p₀=83.35°
  //   g: Greenwich-Epoch für Station LWOO (aus RWS Getijtafels, approx.)
  //
  //  Konstituente  speed(°/h)  H(m)   V₀(J2000)  g(LWOO)   φ₀
  //  M2            28.9841     0.730   124.3°     258°     −133.7°
  //  S2            30.0000     0.137     5.0°     298°     −293.0°
  //  N2            28.4397     0.155   −10.7°     240°     −250.7°
  //  K1            15.0411     0.076    10.5°     224°     −213.5°
  //  O1            13.9430     0.063   113.8°     194°      −80.2°
  //  M4            57.9682     0.052   248.6°      98°      +150.6°
  //  K2            30.0821     0.042   200.9°     293°      −92.1°
  var J2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
  var CONST = [
    //  speed °/h     H m     φ₀ °
    [28.984104,  0.730,  -133.7],  // M2
    [30.000000,  0.137,  -293.0],  // S2
    [28.439730,  0.155,  -250.7],  // N2
    [15.041069,  0.076,  -213.5],  // K1
    [13.943036,  0.063,   -80.2],  // O1
    [57.968208,  0.052,   150.6],  // M4
    [30.082137,  0.042,   -92.1],  // K2
  ];
  var MSL = 5; // mittlerer Meeresspiegel Lauwersoog ≈ +5 cm NAP

  function tideLevel(ms) {
    var t = (ms - J2000) / 3600000;
    var z = 0;
    for (var i = 0; i < CONST.length; i++) {
      z += CONST[i][1] * Math.cos((CONST[i][0] * t + CONST[i][2]) * Math.PI / 180);
    }
    return z * 100 + MSL; // → cm NAP
  }

  // Lokale Extrema (Fenstergröße W × 5 Min = 20 Min beidseitig)
  function findExtrema(t0, t1) {
    var STEP = 5 * 60000, W = 4, pts = [];
    for (var t = t0; t <= t1; t += STEP) pts.push([t, tideLevel(t)]);
    var ev = [];
    for (var i = W; i < pts.length - W; i++) {
      var v = pts[i][1], hi = true, lo = true;
      for (var j = i - W; j <= i + W; j++) {
        if (j === i) continue;
        if (pts[j][1] >= v) hi = false;
        if (pts[j][1] <= v) lo = false;
      }
      if (hi) ev.push({ type: 'HW', t: pts[i][0], v: v });
      if (lo) ev.push({ type: 'NW', t: pts[i][0], v: v });
    }
    return ev;
  }

  // Heutiger Tag (Amsterdam-Timezone), Suchfenster ±24 h
  var todayStr = now.toLocaleDateString('sv', { timeZone: TZ });
  var events   = findExtrema(
    now.getTime() - 20 * 3600000,
    now.getTime() + 28 * 3600000
  ).filter(function (e) {
    return new Date(e.t).toLocaleDateString('sv', { timeZone: TZ }) === todayStr;
  });

  function fmtTime(ms) {
    return new Date(ms).toLocaleTimeString('de-DE', {
      hour: '2-digit', minute: '2-digit', timeZone: TZ
    });
  }

  if (!events.length) {
    body.innerHTML = '<li class="tides-fallback">Vorhersage nicht verfügbar. '
      + '<a href="https://waterinfo.rws.nl/#!/details/publiek/waterhoogte-t-o-v-nap/LWOO/WNS945"'
      + ' target="_blank" rel="noopener">Rijkswaterstaat →</a></li>';
    return;
  }

  body.innerHTML = events.map(function (e) {
    var sign = (e.v >= 0 ? '+' : '') + Math.round(e.v);
    return '<li class="tide-entry tide-entry--' + e.type.toLowerCase() + '">'
      + '<span class="tide-arrow">'  + (e.type === 'HW' ? '↑' : '↓') + '</span>'
      + '<span class="tide-type">'   + (e.type === 'HW' ? 'Hochwasser' : 'Niedrigwasser') + '</span>'
      + '<span class="tide-time">'   + fmtTime(e.t) + '</span>'
      + '<span class="tide-height">' + sign + '&thinsp;cm NAP</span>'
      + '</li>';
  }).join('');

  // ---- SVG-Welle zeichnen (24h-Fenster zentriert auf jetzt) ----
  var chart = document.getElementById('tidesChart');
  var nextEl = document.getElementById('tidesNext');
  if (chart) {
    var W = 600, H = 140, PAD_T = 14, PAD_B = 22;
    var winStart = now.getTime() - 12 * 3600000;
    var winEnd   = now.getTime() + 12 * 3600000;
    var samples = [];
    for (var ms = winStart; ms <= winEnd; ms += 15 * 60000) {
      samples.push([ms, tideLevel(ms)]);
    }
    var vMin = Infinity, vMax = -Infinity;
    samples.forEach(function (s) { if (s[1] < vMin) vMin = s[1]; if (s[1] > vMax) vMax = s[1]; });
    var vPad = (vMax - vMin) * 0.15 || 10;
    vMin -= vPad; vMax += vPad;

    function x(ms) { return ((ms - winStart) / (winEnd - winStart)) * W; }
    function y(v)  { return PAD_T + (1 - (v - vMin) / (vMax - vMin)) * (H - PAD_T - PAD_B); }

    var d = samples.map(function (s, i) {
      return (i === 0 ? 'M' : 'L') + x(s[0]).toFixed(1) + ',' + y(s[1]).toFixed(1);
    }).join(' ');
    var fillPath = d + ' L' + W + ',' + (H - PAD_B) + ' L0,' + (H - PAD_B) + ' Z';

    var svg = '';
    // Mittellinie (0 cm NAP)
    var zeroY = y(0);
    if (zeroY > PAD_T && zeroY < H - PAD_B) {
      svg += '<line class="tide-axis" x1="0" y1="' + zeroY.toFixed(1) + '" x2="' + W + '" y2="' + zeroY.toFixed(1) + '"/>';
    }
    svg += '<path class="tide-curve-fill" d="' + fillPath + '"/>';
    svg += '<path class="tide-curve" d="' + d + '"/>';

    // Extrema-Punkte heute
    events.forEach(function (e) {
      if (e.t < winStart || e.t > winEnd) return;
      svg += '<circle class="tide-extrema-dot" cx="' + x(e.t).toFixed(1) + '" cy="' + y(e.v).toFixed(1) + '" r="4"/>';
    });

    // Stundenticks (alle 6h)
    for (var h = -12; h <= 12; h += 6) {
      var tickMs = now.getTime() + h * 3600000;
      var tx = x(tickMs);
      svg += '<text class="tide-tick" x="' + tx.toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle">'
           + fmtTime(tickMs) + '</text>';
    }

    // "Jetzt"-Linie + Punkt
    var nowX = x(now.getTime());
    var nowY = y(tideLevel(now.getTime()));
    svg += '<line class="tide-now" x1="' + nowX.toFixed(1) + '" y1="' + PAD_T + '" x2="' + nowX.toFixed(1) + '" y2="' + (H - PAD_B) + '"/>';
    svg += '<circle class="tide-now-dot" cx="' + nowX.toFixed(1) + '" cy="' + nowY.toFixed(1) + '" r="5"/>';

    chart.innerHTML = svg;

    // Nächstes Ereignis (auch über Mitternacht hinaus suchen)
    var future = findExtrema(now.getTime(), now.getTime() + 20 * 3600000)
      .filter(function (e) { return e.t > now.getTime(); })
      .sort(function (a, b) { return a.t - b.t; });
    if (future.length && nextEl) {
      var nxt = future[0];
      var diffMin = Math.round((nxt.t - now.getTime()) / 60000);
      var h2 = Math.floor(diffMin / 60), m2 = diffMin % 60;
      var inStr = h2 > 0 ? (h2 + ' h ' + (m2 < 10 ? '0' : '') + m2 + ' min') : (m2 + ' min');
      nextEl.innerHTML = (nxt.type === 'HW' ? '↑ Hochwasser' : '↓ Niedrigwasser')
        + ' in <strong>' + inStr + '</strong>';
    } else if (nextEl) {
      nextEl.textContent = '';
    }
  }
})();

// ============================================================
// Gezeiten-Details: auf Mobile standardmäßig zugeklappt
// ============================================================
(function () {
  var details = document.querySelector('.tides-details');
  if (details && window.innerWidth <= 760) {
    details.removeAttribute('open');
    var summary = details.querySelector('.tides-summary');
    if (summary) summary.textContent = 'Zeiten anzeigen';
    details.addEventListener('toggle', function () {
      var s = details.querySelector('.tides-summary');
      if (s) s.textContent = details.open ? 'Zeiten ausblenden' : 'Zeiten anzeigen';
    });
  }
})();

// ============================================================
// Service Worker registrieren (PWA / Offline-Modus)
// ============================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  });
}

// ============================================================
// Live Cam Modal – HLS-Stream Lauwersoog Haven
// ============================================================
(function () {
  var btn     = document.getElementById('qlLiveCam');
  var modal   = document.getElementById('camModal');
  if (!btn || !modal) return;

  var video   = document.getElementById('camVideo');
  var loading = document.getElementById('camLoading');
  var HLS_SRC = 'https://6162417352ffd.streamlock.net/live/lauwersoog-haven.stream/playlist.m3u8';
  var hls     = null;

  function setLoadingMsg(msg) {
    var span = loading.querySelector('span');
    if (span) span.textContent = msg;
  }

  function startStream() {
    loading.style.opacity = '1';
    loading.style.display = 'flex';
    if (typeof Hls !== 'undefined' && Hls.isSupported()) {
      hls = new Hls({ enableWorker: false, liveBackBufferLength: 10 });
      hls.loadSource(HLS_SRC);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, function () {
        loading.style.opacity = '0';
        setTimeout(function () { loading.style.display = 'none'; }, 300);
        video.play().catch(function () {});
      });
      hls.on(Hls.Events.ERROR, function (e, data) {
        if (data.fatal) {
          loading.style.display = 'flex';
          loading.style.opacity = '1';
          var sp = loading.querySelector('.cam-modal__spinner');
          if (sp) sp.style.display = 'none';
          setLoadingMsg('Stream derzeit nicht verfügbar.');
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari / iOS)
      video.src = HLS_SRC;
      video.addEventListener('loadedmetadata', function () {
        loading.style.opacity = '0';
        setTimeout(function () { loading.style.display = 'none'; }, 300);
        video.play().catch(function () {});
      }, { once: true });
    } else {
      setLoadingMsg('HLS-Stream wird in diesem Browser nicht unterstützt.');
    }
  }

  function stopStream() {
    video.pause();
    if (hls) { hls.destroy(); hls = null; }
    video.src = '';
    video.load();
    loading.style.display = 'flex';
    loading.style.opacity = '1';
    var sp = loading.querySelector('.cam-modal__spinner');
    if (sp) sp.style.display = '';
    setLoadingMsg('Stream wird geladen\u2026');
  }

  function openCam() {
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    startStream();
    modal.querySelector('.cam-modal__close').focus();
  }

  function closeCam() {
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
    stopStream();
  }

  btn.addEventListener('click', openCam);
  modal.querySelector('.cam-modal__backdrop').addEventListener('click', closeCam);
  modal.querySelector('.cam-modal__close').addEventListener('click', closeCam);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hasAttribute('hidden')) closeCam();
  });
})();
