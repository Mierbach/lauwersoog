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

// Quick-link Dropdown: Tap-Toggle für Touch-Geräte (iOS hover funktioniert nicht)
(function () {
  document.querySelectorAll('.quick-link--dropdown').forEach(function (el) {
    el.addEventListener('click', function (e) {
      // Klick auf einen Dropdown-Link → navigieren, nicht toggeln
      if (e.target.closest('.ql-dropdown')) return;
      e.stopPropagation();
      var wasOpen = el.classList.contains('is-open');
      // Alle anderen schließen
      document.querySelectorAll('.quick-link--dropdown.is-open').forEach(function (o) { o.classList.remove('is-open'); });
      el.classList.toggle('is-open', !wasOpen);
    });
  });
  // Außerhalb klicken → schließen
  document.addEventListener('click', function () {
    document.querySelectorAll('.quick-link--dropdown.is-open').forEach(function (o) { o.classList.remove('is-open'); });
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
  var title  = document.getElementById('qlWetterTitle');
  var kicker = document.getElementById('qlWetterKicker');
  if (!title) return;

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

  fetch('https://api.open-meteo.com/v1/forecast?latitude=53.41&longitude=6.21&current=temperature_2m,weather_code,wind_speed_10m&wind_speed_unit=kmh&timezone=Europe%2FAmsterdam')
    .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
    .then(function (data) {
      var c    = data.current;
      var code = c.weather_code;
      var temp = Math.round(c.temperature_2m);
      var wind = Math.round(c.wind_speed_10m);
      var emoji = WMO_EMOJI[code] || '🌡️';
      var text  = WMO_TEXT[code]  || '';
      kicker.textContent = text || 'Wetter · Lauwersoog';
      title.textContent  = emoji + ' ' + temp + '° · Wind ' + wind + ' km/h';
    })
    .catch(function () {
      title.textContent = '–';
    });
})();

// ============================================================
// Gezeiten-Widget — Rijkswaterstaat waterinfo.rws.nl
// Station LWOO (Lauwersoog), Parameter WATHTE (Wasserstand NAP)
// ============================================================
(function () {
  var body   = document.getElementById('tidesBody');
  var dateEl = document.getElementById('tidesDate');
  if (!body) return;

  var TZ = 'Europe/Amsterdam';
  var now = new Date();

  // Datum anzeigen
  if (dateEl) {
    dateEl.textContent = now.toLocaleDateString('de-DE', {
      weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ
    });
  }

  // YYYY-MM-DD in Amsterdam-Zeit
  function localDateStr(d) {
    return d.toLocaleDateString('sv', { timeZone: TZ }); // 'sv' = ISO-Format YYYY-MM-DD
  }

  // Lokale Maxima/Minima mit Fensterbreite W finden
  function findTideEvents(series) {
    var W = 4;
    var events = [];
    for (var i = W; i < series.length - W; i++) {
      var curr = series[i].v;
      var win  = series.slice(i - W, i + W + 1).map(function (p) { return p.v; });
      var max  = Math.max.apply(null, win);
      var min  = Math.min.apply(null, win);
      if (curr === max && series[i - 1].v < curr && series[i + 1].v < curr) {
        events.push({ type: 'HW', t: series[i].t, v: curr });
      } else if (curr === min && series[i - 1].v > curr && series[i + 1].v > curr) {
        events.push({ type: 'NW', t: series[i].t, v: curr });
      }
    }
    return events;
  }

  function fmtTime(t) {
    return new Date(t).toLocaleTimeString('de-DE', {
      hour: '2-digit', minute: '2-digit', timeZone: TZ
    });
  }

  function renderTides(events) {
    if (!events.length) {
      body.innerHTML = '<span class="tides-loading">Keine Gezeitendaten für heute gefunden.</span>';
      return;
    }
    body.innerHTML = events.map(function (e) {
      var sign = e.v >= 0 ? '+' + Math.round(e.v) : Math.round(e.v);
      return '<div class="tide-entry tide-entry--' + e.type.toLowerCase() + '">'
        + '<span class="tide-arrow">' + (e.type === 'HW' ? '↑' : '↓') + '</span>'
        + '<span class="tide-type">' + (e.type === 'HW' ? 'Hochwasser' : 'Niedrigwasser') + '</span>'
        + '<span class="tide-time">' + fmtTime(e.t) + '</span>'
        + '<span class="tide-height">' + sign + '&thinsp;cm</span>'
        + '</div>';
    }).join('');
  }

  function showFallback() {
    body.innerHTML = '<p class="tides-fallback">Tideninfo derzeit nicht verfügbar. '
      + '<a href="https://waterinfo.rws.nl/#!/details/publiek/waterhoogte-t-o-v-nap/LWOO/WNS945" '
      + 'target="_blank" rel="noopener">Rijkswaterstaat →</a></p>';
  }

  // Start der lokalen Tageszeit = Mitternacht Amsterdam
  var todayStr = localDateStr(now);
  var startDate = todayStr + 'T00:00:00+02:00'; // Amsterdam MESZ (Sommer)
  var endDate   = todayStr + 'T23:59:59+02:00';

  var url = 'https://waterinfo.rws.nl/api/chart/get'
    + '?locationCodes=LWOO'
    + '&parameterIds=WATHTE_NAP'
    + '&tz=Europe%2FAmsterdam'
    + '&startDate=' + encodeURIComponent(startDate)
    + '&endDate='   + encodeURIComponent(endDate);

  fetch(url)
    .then(function (r) { return r.ok ? r.json() : Promise.reject('HTTP ' + r.status); })
    .then(function (data) {
      // Mögliche Antwortformate abdecken
      var raw = [];
      if (Array.isArray(data)) {
        raw = data;
      } else if (data && Array.isArray(data.Data)) {
        raw = data.Data;
      } else if (data && Array.isArray(data.data)) {
        raw = data.data;
      }

      var todaySeries = raw
        .filter(function (p) {
          var tStr = localDateStr(new Date(p.Tijdstip || p.t || p.timestamp));
          return tStr === todayStr;
        })
        .map(function (p) {
          return {
            t: new Date(p.Tijdstip || p.t || p.timestamp),
            v: parseFloat(p.Waarde !== undefined ? p.Waarde : (p.v !== undefined ? p.v : p.value))
          };
        })
        .filter(function (p) { return !isNaN(p.v); })
        .sort(function (a, b) { return a.t - b.t; });

      if (!todaySeries.length) throw new Error('keine Daten');

      var events = findTideEvents(todaySeries);
      renderTides(events);
    })
    .catch(showFallback);
})();

// ============================================================
// Service Worker registrieren (PWA / Offline-Modus)
// ============================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  });
}
