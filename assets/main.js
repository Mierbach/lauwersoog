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
  const sync = () => document.body.classList.toggle('nav-open', toggle.checked);
  toggle.addEventListener('change', sync);
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => { toggle.checked = false; sync(); });
  });
  sync();
})();

// (Bento Hash-Handler entfernt)

// (SPA-Router entfernt)

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
