# WeatherRadar 🌦

Application météo complète en **fichier HTML unique** (zero build, zero serveur), entièrement en français, orientée France. Données en temps réel via des APIs publiques gratuites, sans clé d'API requise.

---

## Table des matières

- [Aperçu](#aperçu)
- [Fonctionnalités](#fonctionnalités)
- [Architecture technique](#architecture-technique)
- [APIs & dépendances](#apis--dépendances)
- [Structure du code](#structure-du-code)
- [Sections de l'interface](#sections-de-linterface)
- [Gestion de l'état](#gestion-de-létat)
- [Système de recherche de villes](#système-de-recherche-de-villes)
- [Radar météo (RainViewer)](#radar-météo-rainviewer)
- [Effets météo visuels](#effets-météo-visuels)
- [Qualité de l'air](#qualité-de-lair)
- [Statistiques du jour](#statistiques-du-jour)
- [Graphiques](#graphiques)
- [Responsive design](#responsive-design)
- [Persistance locale](#persistance-locale)
- [Codes WMO](#codes-wmo)
- [Déploiement](#déploiement)
- [Personnalisation](#personnalisation)

---

## Aperçu

WeatherRadar est une SPA (Single Page Application) météo sans framework ni processus de build. Tout le HTML, le CSS et le JavaScript tiennent dans un seul fichier `index.html`. L'application s'ouvre directement dans n'importe quel navigateur moderne — localement ou hébergée sur n'importe quel serveur statique.

```
index.html          ← l'application entière (~2800 lignes)
README.md           ← ce fichier
```

---

## Fonctionnalités

### Météo

- **Conditions actuelles** : température, ressenti, humidité, vent, code météo
- **Prévisions matin / après-midi** pour aujourd'hui et demain
- **Prévisions 7 jours** avec températures min/max et icône météo
- **Prévision heure par heure sur 48h** avec défilement horizontal, icônes alignées, précipitations, défilement auto sur l'heure courante
- **Lever et coucher du soleil** dans la card Aujourd'hui

### Radar

- **Radar précipitations en direct** via RainViewer (tuiles Leaflet animées)
- Historique des **8 dernières trames** (80 min) + nowcast si disponible
- **Animation automatique** avec bouton ▶ Animer
- Légende colorée des intensités (0.1 → 50+ mm/h)
- Marqueur de position de la ville sélectionnée

### Graphiques

- **Graphique inline 24h** : températures (ligne orange), précipitations (barres bleues), probabilité de pluie (ligne pointillée)
- **Graphique 15 jours** avec 4 onglets :
  - 🌡 Températures min/max
  - 🌧 Précipitations journalières
  - 💨 Vent maximum
  - 💧 Humidité relative

### Qualité de l'air

- Score **AQI européen** avec niveau textuel et jauge de couleur
- Barres de **4 polluants** (PM2.5, PM10, NO₂, O₃) colorées dynamiquement selon les **seuils OMS**
- Couleur de barre : 🟢 Bon → 🟡 Moyen → 🟠 Dégradé → 🔴 Mauvais

### Statistiques du jour (8 cards)

| Card | Contenu |
|------|---------|
| 🔆 Indice UV | Valeur colorée selon les seuils, max du jour |
| 🌂 Prochaine pluie | Heure précise, délai relatif, % probabilité, mm |
| 🌡 Amplitude | Min / Max du jour, écart °C |
| 🌧 Précipitations | Total mm, heures de pluie |
| 💨 Vent maximum | km/h, direction cardinale |
| 🌡 Ressenti actuel | Température ressentie calculée |
| 📅 Moy. semaine proch. | T° max moyenne J+7→J+14 |
| 🌦 Jours de pluie | Nombre de jours pluvieux sur 7 jours |

### Recherche

- Barre de recherche avec **autocomplétion** (Open-Meteo Geocoding + Nominatim)
- Fallback sur une base locale de **20 grandes villes françaises**
- Navigation clavier (↑ ↓ Entrée Échap)
- Annulation automatique des requêtes en cours (AbortController)
- **Mémorisation** de la dernière ville en localStorage

### Navigation

- Menu sticky dans le header avec 4 ancres : Radar, Horaire, Graphiques, Statistiques
- Lien actif détecté automatiquement via **IntersectionObserver**
- Sur mobile (< 600px) : icônes seules, labels masqués

### Effets visuels

- Canvas d'ambiance atmosphérique animé en arrière-plan
- Overlay dynamique selon la météo : ☀️ soleil / 🌧 pluie / ❄️ neige / ⛈ orage / ☁️ nuages / 🌫 brouillard

---

## Architecture technique

```
┌─────────────────────────────────────────────────┐
│                   index.html                    │
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │  <head>                                  │   │
│  │    Google Fonts (Inter)                  │   │
│  │    Leaflet 1.9.4 CSS + JS                │   │
│  │    Chart.js 4.4.0                        │   │
│  │    <style> (~700 lignes CSS)             │   │
│  └──────────────────────────────────────────┘   │
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │  <body>                                  │   │
│  │    #atmo-canvas (fond animé)             │   │
│  │    #weather-overlay (effets météo)       │   │
│  │    .app-shell                            │   │
│  │      header (nav + horloge)              │   │
│  │      main                                │   │
│  │        .search-section                   │   │
│  │        .main-grid                        │   │
│  │          .left-col (radar + chart 24h)   │   │
│  │          .right-col (today/demain/7j)    │   │
│  │          .radar-inline-chart (chart 24h) │   │
│  │        .hourly-card (48h)                │   │
│  │        .charts-section (15j + AQI)       │   │
│  │        .stats-section (8 cards)          │   │
│  │      footer                              │   │
│  └──────────────────────────────────────────┘   │
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │  <script> (~1700 lignes JS)              │   │
│  │    État global S{}                       │   │
│  │    Base de villes CITIES[]               │   │
│  │    WMO codes → wmoInfo()                 │   │
│  │    Horloge tick()                        │   │
│  │    Recherche + géocodage                 │   │
│  │    Leaflet map + RainViewer radar        │   │
│  │    fetchWeather() → Open-Meteo           │   │
│  │    fetchAQI() → Open-Meteo Air Quality   │   │
│  │    Renderers (Today/Tomorrow/Week/...)   │   │
│  │    Chart.js buildChart() / inline        │   │
│  │    Effets visuels applyWeatherEffect()   │   │
│  │    ResizeObserver (map invalidateSize)   │   │
│  │    Navigation IntersectionObserver       │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## APIs & dépendances

### APIs externes (toutes gratuites, sans clé)

| Service | URL | Usage |
|---------|-----|-------|
| **Open-Meteo Forecast** | `https://api.open-meteo.com/v1/forecast` | Météo horaire + journalière 16 jours |
| **Open-Meteo Air Quality** | `https://air-quality-api.open-meteo.com/v1/air-quality` | PM2.5, PM10, NO₂, O₃, AQI européen |
| **Open-Meteo Geocoding** | `https://geocoding-api.open-meteo.com/v1/search` | Recherche de villes (suggestions) |
| **Nominatim (OSM)** | `https://nominatim.openstreetmap.org/search` | Fallback géocodage |
| **RainViewer** | `https://api.rainviewer.com/public/weather-maps.json` | Métadonnées radar (frames + host) |
| **RainViewer tiles** | `https://tilecache.rainviewer.com/...` | Tuiles radar précipitations |
| **OpenStreetMap tiles** | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` | Fond de carte Leaflet |

### Bibliothèques CDN

| Lib | Version | CDN | Usage |
|-----|---------|-----|-------|
| **Leaflet.js** | 1.9.4 | unpkg | Carte interactive + tuiles radar |
| **Chart.js** | 4.4.0 | jsDelivr | Graphiques (ligne, barre, combiné) |
| **Inter** | variable | Google Fonts | Police principale (lisibilité écran) |

### Paramètres Open-Meteo utilisés

**Horaire** (`hourly=`) :
`temperature_2m`, `weathercode`, `precipitation`, `precipitation_probability`, `windspeed_10m`, `relativehumidity_2m`, `apparent_temperature`, `uv_index`

**Journalier** (`daily=`) :
`weathercode`, `temperature_2m_max`, `temperature_2m_min`, `precipitation_sum`, `windspeed_10m_max`, `sunrise`, `sunset`, `precipitation_hours`, `uv_index_max`

**Options** : `current_weather=true`, `forecast_days=16`, `timezone=auto`

---

## Structure du code

### Constantes et état global (lignes ~1128–1149)

```js
const S = {
  city, lat, lon, region, timezone,  // ville sélectionnée
  forecast,                          // données Open-Meteo (cache)
  aqi,                               // données qualité de l'air
  chart,                             // instance Chart.js principale
  chartType,                         // onglet actif ('temp'|'precip'|'wind'|'humidity')
  radarFrames, radarIdx,             // frames RainViewer
  radarLayer, radarLayers,           // couches Leaflet (cache Map())
  radarHost, radarFadeFrame,         // config RainViewer
  animInterval,                      // setInterval animation radar
  cityMarker,                        // marqueur Leaflet
  weatherEffect,                     // effet visuel courant
};
```

### Fonctions principales

| Fonction | Rôle |
|----------|------|
| `loadAll()` | Orchestrateur : appelle fetchWeather + fetchAQI, distribue aux renderers |
| `fetchWeather()` | Requête Open-Meteo forecast, retourne la réponse JSON |
| `fetchAQI()` | Requête Open-Meteo air quality, retourne la réponse JSON |
| `loadRadar()` | Charge les métadonnées RainViewer, reconstruit la timeline |
| `renderToday(d)` | Remplit la card Aujourd'hui (conditions, lever/coucher soleil) |
| `renderTomorrow(d)` | Remplit la card Demain (matin/après-midi) |
| `renderWeek(d)` | Génère les 7 lignes de prévisions hebdomadaires |
| `renderHourly(d)` | Génère les 48 slots horaires avec alignement icônes |
| `buildChart(d)` | Construit/reconstruit le graphique Chart.js 15 jours |
| `buildInlineChart(d)` | Construit le mini-graphique 24h (temp + précip + prob) |
| `renderAQI(data)` | Remplit la card qualité de l'air avec couleurs dynamiques |
| `renderStats(d)` | Calcule et affiche les 8 cartes statistiques |
| `applyWeatherEffect(effect)` | Déclenche l'effet visuel (pluie/neige/orage/soleil/nuages) |
| `wmoInfo(code)` | Mappe un code WMO → { icon, desc, effect } |
| `currentHourKey(d)` | Retourne la clé ISO de l'heure courante (ex. `2024-06-10T14:00`) |
| `updateMarker()` | Repositionne le marqueur Leaflet sur la ville active |
| `tick()` | Met à jour l'horloge dans le header (toutes les 30 s) |
| `windDir(deg)` | Convertit un angle en direction cardinale (N/NE/E/…) |
| `tempClass(t)` | Retourne la classe CSS de couleur selon la température |
| `pollutantColor(val, thresholds)` | Retourne la couleur de barre AQI selon les seuils OMS |
| `uvLabel(v)` | Retourne le label et la couleur selon l'indice UV |

---

## Sections de l'interface

### Layout desktop (> 1100px)

```
┌─────────────────────────────────────────────────────────────┐
│  header : logo + nav (Radar / Horaire / Graphiques / Stats) │
│           + horloge + badge météo + ville                   │
├──────────────────────────────┬──────────────────────────────┤
│  .left-col                   │  .right-col                  │
│  ┌──────────────────────────┐│  ┌──────────────────────────┐│
│  │  .radar-card             ││  │  .today-card (Aujourd'hui││
│  │    timeline (8 trames)   ││  │    nom ville, T°, icône  ││
│  │    #map (Leaflet)        ││  │    lever/coucher soleil  ││
│  │    légende + statut      ││  │    matin / après-midi    ││
│  └──────────────────────────┘│  └──────────────────────────┘│
│  ┌──────────────────────────┐│  ┌──────────────────────────┐│
│  │  .radar-inline-chart     ││  │  .tomorrow-card (Demain) ││
│  │    ligne T° + barres mm  ││  │    matin / après-midi    ││
│  │    + prob. pluie 24h     ││  └──────────────────────────┘│
│  └──────────────────────────┘│  ┌──────────────────────────┐│
│                              │  │  .week-card (7 jours)    ││
│                              │  │    liste jour / icône /  ││
│                              │  │    description / min max ││
│                              │  └──────────────────────────┘│
├──────────────────────────────┴──────────────────────────────┤
│  .hourly-card — Prévision heure par heure 48h               │
│    scroll horizontal · 48 slots · icônes alignées           │
├────────────────────────────────────┬────────────────────────┤
│  .chart-card — Graphiques 15 jours │  .aqi-card — Qualité   │
│    onglets : T° / Précip / Vent /  │  de l'air (AQI + 4     │
│    Humidité                        │  polluants)            │
├────────────────────────────────────┴────────────────────────┤
│  .stats-section — 8 cartes statistiques (grille 4 cols)     │
└─────────────────────────────────────────────────────────────┘
```

### Layout mobile (≤ 600px)

Sur mobile, la grille principale devient une colonne flex avec reordering CSS :

1. `.left-col` (radar) — `order: 1`
2. `.right-col` (Aujourd'hui → Demain → 7 jours) — `order: 2`
3. `.radar-inline-chart` (graphique 24h) — `order: 3`
4. `.hourly-card` (48h)
5. `.charts-section`
6. `.stats-section` (2 colonnes)

Le menu de navigation se déplace sous le logo et devient scrollable horizontalement. Les labels texte disparaissent, seules les icônes restent.

---

## Gestion de l'état

L'état global est centralisé dans l'objet `S`. Aucun framework de gestion d'état (Redux, MobX…) n'est utilisé. Les mises à jour déclenchent directement les fonctions de rendu correspondantes.

**Flux de données :**

```
sélection ville (search / localStorage)
        │
        ▼
  updateCity(city)
        │
        ├──► map.flyTo() + updateMarker()
        ├──► loadAll()
        │       ├── fetchWeather() ──► renderToday()
        │       │                 ──► renderTomorrow()
        │       │                 ──► renderWeek()
        │       │                 ──► renderHourly()
        │       │                 ──► buildChart()
        │       │                 ──► buildInlineChart()
        │       │                 ──► renderStats()
        │       │                 ──► applyWeatherEffect()
        │       └── fetchAQI()    ──► renderAQI()
        └──► loadRadar() ──► buildTimeline()
                        ──► preloadRadarLayers()
                        ──► showRadarFrame()
```

---

## Système de recherche de villes

La recherche combine trois sources dans l'ordre de priorité :

1. **Filtre local** sur `CITIES[]` (20 villes françaises préconfigurées) — résultat instantané, 0 requête réseau
2. **Open-Meteo Geocoding API** — recherche internationale, résultats triés par population
3. **Nominatim (OpenStreetMap)** — fallback si Open-Meteo ne retourne rien

Les requêtes sont **debouncées** (300 ms) et **annulées** via `AbortController` à chaque nouvelle frappe. La navigation clavier (↑ ↓ Entrée Échap) est entièrement supportée.

À la sélection d'une ville, l'état S est mis à jour, la ville est sauvegardée en `localStorage` (`wr_city`), et toutes les données sont rechargées.

---

## Radar météo (RainViewer)

### Fonctionnement

1. `loadRadar()` interroge `https://api.rainviewer.com/public/weather-maps.json`
2. Les 8 dernières trames historiques (`radar.past`) + jusqu'à 6 trames nowcast (`radar.nowcast`) sont extraites
3. `buildTimeline()` génère les boutons de la timeline avec classes `now` (trame courante) et `forecast` (nowcast)
4. `preloadRadarLayers()` crée les couches Leaflet en avance pour éviter les clignotements
5. `showRadarFrame(idx)` applique un **fondu croisé** animé via `requestAnimationFrame` entre la couche précédente et la nouvelle

### Cache des couches

Les couches Leaflet sont stockées dans `S.radarLayers` (Map keyed par timestamp), réutilisées d'une animation à l'autre. Ce cache est vidé (`clearRadarLayerCache()`) à chaque rechargement des métadonnées (toutes les 10 minutes via `setInterval`).

### Animation

Le bouton ▶ Animer démarre un `setInterval` de 600 ms qui avance frame par frame, revient au début à la fin de la séquence. L'animation s'arrête proprement avant tout rechargement.

### Résolution des tuiles

```js
const RAINVIEWER_TILE_IMAGE_SIZE = window.devicePixelRatio >= 2 ? 512 : 256;
```

Les écrans Retina (dpr ≥ 2) reçoivent des tuiles 512px pour une meilleure netteté.

### Correction de taille (invalidateSize)

La carte Leaflet est initialisée avant que le layout CSS grid/flex soit résolu. Trois mécanismes garantissent le bon dimensionnement :

```js
// 1. Double rAF — attend le premier paint complet
requestAnimationFrame(() => requestAnimationFrame(fix));

// 2. Timeouts — couvre les layouts tardifs
setTimeout(fix, 300);
setTimeout(fix, 800);

// 3. ResizeObserver — réagit à tout changement de taille du conteneur
new ResizeObserver(entries => {
  for (const e of entries) {
    if (e.contentRect.width > 0 && e.contentRect.height > 0) fix();
  }
}).observe(container);
```

---

## Effets météo visuels

L'overlay `#weather-overlay` affiche des effets CSS/JS dynamiques selon le code météo courant. L'état est appliqué via `applyWeatherEffect(effect)` à la fin de `renderToday()`.

| Effect | Déclenché par | Rendu |
|--------|--------------|-------|
| `sun` | Codes 0, 1, 2 | Rayons CSS + halo animé |
| `cloud` | Code 3 (couvert) | Couches de nuages qui dérivent |
| `fog` | Codes 45, 48 | Couches de brume semi-transparentes |
| `rain` | Codes 51–67, 80–82 | Gouttes de pluie animées (CSS keyframes) |
| `heavyrain` | Code 65 | Pluie dense (plus de gouttes) |
| `snow` | Codes 71–77, 85–86 | Flocons animés |
| `storm` | Codes 82, 95–99 | Pluie + éclairs (flash aléatoire) |

Le canvas `#atmo-canvas` génère un fond de particules atmosphériques en JavaScript, indépendant de l'état météo.

---

## Qualité de l'air

### Score AQI européen

Le score AQI est affiché avec une jauge dégradée (vert → violet) et un pointeur positionné selon la valeur (0–100+). Les niveaux sont :

| AQI | Niveau |
|-----|--------|
| 0–20 | Bon |
| 21–40 | Satisfaisant |
| 41–60 | Modéré |
| 61–80 | Mauvais |
| 81–100 | Très mauvais |
| > 100 | Extrêmement mauvais |

### Couleur des barres de polluants

Chaque polluant a ses propres seuils OMS. La couleur est calculée dynamiquement :

```js
function pollutantColor(val, thresholds) {
  const [t1, t2, t3] = thresholds;
  if (val <= t1) return '#4caf50';  // Bon
  if (val <= t2) return '#fdd835';  // Moyen
  if (val <= t3) return '#ff9800';  // Dégradé
  return '#f44336';                 // Mauvais
}
```

| Polluant | t1 (bon) | t2 (moyen) | t3 (dégradé) | Unité |
|----------|----------|------------|--------------|-------|
| PM2.5 | 15 | 25 | 50 | µg/m³ |
| PM10 | 45 | 75 | 150 | µg/m³ |
| NO₂ | 25 | 50 | 100 | µg/m³ |
| O₃ | 100 | 130 | 160 | µg/m³ |

---

## Statistiques du jour

### Indice UV

L'indice UV est lu en priorité depuis `hourly.uv_index` à l'heure courante (valeur instantanée), avec fallback sur `daily.uv_index_max` (pic journalier). La couleur et le label suivent les seuils internationaux :

| Valeur | Niveau | Couleur |
|--------|--------|---------|
| < 3 | Faible | 🟢 vert |
| 3–5 | Modéré | 🟡 jaune |
| 6–7 | Élevé | 🟠 orange |
| 8–10 | Très élevé | 🔴 rouge |
| ≥ 11 | Extrême | 🟣 violet |

### Prochaine heure de pluie

Parcourt les 48 prochaines heures horaires. Une heure est considérée "pluvieuse" si :

- `precipitation_probability ≥ 40 %` **OU**
- `precipitation > 0.1 mm`

Le résultat affiche l'heure exacte, un label relatif (`Maintenant`, `Dans ~2h`, `Jeu 14:00`…), le pourcentage de probabilité et les mm prévus. Si rien n'est prévu dans les 48h : "Aucune dans 48h".

---

## Graphiques

### Graphique 15 jours (Chart.js)

Construit par `buildChart(d)` selon l'onglet actif (`S.chartType`). Configuration dans `CHART_CONFIGS` :

```js
const CHART_CONFIGS = {
  temp:    { type: 'line', datasets: [T°max, T°min] },
  precip:  { type: 'bar',  datasets: [mm/jour] },
  wind:    { type: 'line', datasets: [km/h max] },
  humidity:{ type: 'line', datasets: [% humidité] },
};
```

Chaque clic sur un onglet détruit l'instance Chart.js précédente et en crée une nouvelle.

### Graphique inline 24h

Triple axe Y :

- **Gauche** : température en °C (ligne orange, fill)
- **Droite** : précipitations en mm (barres bleues)
- **Caché** : probabilité 0–100% (ligne pointillée, axes masqués pour ne pas surcharger)

`maintainAspectRatio: false` — la hauteur est fixée par le conteneur CSS.

---

## Responsive design

| Breakpoint | Layout |
|-----------|--------|
| > 1100px | Grille 2 colonnes (radar + météo) |
| ≤ 1100px | Colonne unique, radar hauteur 420px fixe |
| ≤ 600px | Mobile : flex column, reordering CSS, graphique affiché, nav icônes seules |
| ≤ 380px | Très petit : colonnes encore réduites, 1 col pour les stats |

Techniques utilisées pour éviter les débordements sur mobile :

- `* { min-width: 0 }` ciblé sur les éléments flex/grid
- `overflow-x: hidden` sur `main`
- `#map` en `position: absolute; inset: 0` pour s'affranchir de la résolution flex
- `minmax(0, 1fr)` sur les colonnes grid

---

## Persistance locale

Une seule clé `localStorage` est utilisée :

```js
// Sauvegarde
localStorage.setItem('wr_city', JSON.stringify({
  name, region, lat, lon, timezone
}));

// Restauration au chargement
const saved = JSON.parse(localStorage.getItem('wr_city'));
```

Au chargement, si une ville est sauvegardée, elle est restaurée silencieusement (setView sans animation) avant le premier appel API.

---

## Codes WMO

La fonction `wmoInfo(code)` mappe les codes météo WMO (World Meteorological Organization) retournés par Open-Meteo vers un objet `{ icon, desc, effect }` :

| Codes | Description | Effet |
|-------|-------------|-------|
| 0 | Ciel dégagé ☀️ | sun |
| 1–2 | Principalement/partiellement dégagé 🌤⛅ | sun |
| 3 | Couvert ☁️ | cloud |
| 45, 48 | Brouillard 🌫 | fog |
| 51–55 | Bruine 🌦🌧 | rain |
| 56–57 | Bruine verglaçante 🌨 | rain |
| 61–65 | Pluie légère → forte 🌧 | rain / heavyrain |
| 66–67 | Pluie verglaçante 🌨 | rain |
| 71–77 | Neige ❄️🌨 | snow |
| 80–82 | Averses 🌦🌧⛈ | rain / storm |
| 85–86 | Averses de neige 🌨 | snow |
| 95–99 | Orage ⛈ | storm |

---

## Déploiement

### Ouverture locale

```bash
# Option 1 — directement dans le navigateur (file://)
open index.html

# Option 2 — serveur local (évite les restrictions CORS sur file://)
npx serve .
# ou
python3 -m http.server 8080
```

### Hébergement statique

Le fichier `index.html` peut être déposé directement sur :

- **GitHub Pages** : déposer dans la branche `gh-pages` ou dans `/docs`
- **Netlify** : drag & drop du fichier dans l'interface
- **Vercel** : `vercel deploy`
- **Tout hébergeur Apache/Nginx** : upload via FTP

Aucune configuration serveur n'est requise. Aucun `.htaccess` ni `_redirects` nécessaire.

### Contraintes réseau

L'application nécessite l'accès aux domaines suivants :

```
api.open-meteo.com
air-quality-api.open-meteo.com
geocoding-api.open-meteo.com
api.rainviewer.com
tilecache.rainviewer.com
tile.openstreetmap.org
fonts.googleapis.com
fonts.gstatic.com
unpkg.com
cdn.jsdelivr.net
nominatim.openstreetmap.org
```

---

## Personnalisation

### Changer la ville par défaut

```js
const S = {
  city: 'Lyon',       // ← nom affiché
  lat:  45.7640,      // ← latitude
  lon:  4.8357,       // ← longitude
  region: 'Auvergne-Rhône-Alpes, FR',
  timezone: 'Europe/Paris',
  // ...
};
```

### Ajouter des villes à la base locale

```js
const CITIES = [
  // ...villes existantes...
  { name: 'Annecy', region: 'Auvergne-Rhône-Alpes', lat: 45.8992, lon: 6.1294 },
];
```

### Modifier les tokens de design

Toutes les couleurs, rayons et typographies sont dans les variables CSS `:root` :

```css
:root {
  --bg:      #07090f;   /* fond principal */
  --bg2:     #0c0f1a;   /* fond secondaire */
  --surface: #111521;   /* surface des cards */
  --accent:  #4fc3f7;   /* bleu clair (accent principal) */
  --accent2: #1565c0;   /* bleu foncé */
  --warm:    #ffb74d;   /* températures chaudes */
  --cold:    #81d4fa;   /* températures froides */
  --txt:     #e8eaf2;   /* texte principal */
  --txt2:    #8990ae;   /* texte secondaire */
  --fd:      'Inter', sans-serif;  /* police display */
  --fb:      'Inter', sans-serif;  /* police body */
  --radius:  16px;      /* border-radius cards */
  --hh:      56px;      /* hauteur header */
}
```

### Modifier la fréquence de rafraîchissement du radar

```js
setInterval(loadRadar, 600000); // toutes les 10 min → valeur en ms
```

---

## Crédits

- Données météo : [Open-Meteo](https://open-meteo.com) — licence CC BY 4.0
- Radar précipitations : [RainViewer](https://www.rainviewer.com) — API publique
- Fond de carte : [OpenStreetMap](https://www.openstreetmap.org/copyright) — © contributeurs OSM
- Géocodage fallback : [Nominatim](https://nominatim.org)
- Carte interactive : [Leaflet.js](https://leafletjs.com) 1.9.4 — BSD 2-Clause
- Graphiques : [Chart.js](https://www.chartjs.org) 4.4.0 — MIT
- Police : [Inter](https://rsms.me/inter/) — SIL Open Font License
