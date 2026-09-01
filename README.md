# WeatherRadar 🌦

WeatherRadar est une application météo responsive, entièrement en français, qui regroupe prévisions, radar de précipitations, qualité de l’air, pollens, vigilance, données marines et indicateurs détaillés dans une PWA installable.

Le projet fonctionne sans framework, sans bundler et sans serveur applicatif : l’interface, les styles et la logique métier sont réunis dans `index.html`. Les autres fichiers assurent l’installation PWA, le cache hors ligne, les icônes et l’information de confidentialité.

> WeatherRadar est une application indépendante. Elle n’est ni éditée, ni approuvée, ni garantie par Météo-France. Pour toute décision liée à la sécurité, consultez toujours les sources officielles.

## Table des matières

- [Aperçu](#aperçu)
- [Fonctionnalités](#fonctionnalités)
- [Fichiers du projet](#fichiers-du-projet)
- [Architecture technique](#architecture-technique)
- [Sources de données et dépendances](#sources-de-données-et-dépendances)
- [Structure du code](#structure-du-code)
- [Gestion de l’état et cycle de chargement](#gestion-de-létat-et-cycle-de-chargement)
- [Recherche de villes](#recherche-de-villes)
- [Prévisions météo](#prévisions-météo)
- [Radar météo RainViewer](#radar-météo-rainviewer)
- [Graphiques](#graphiques)
- [Qualité de l’air](#qualité-de-lair)
- [Pollens](#pollens)
- [Données marines](#données-marines)
- [Pression atmosphérique](#pression-atmosphérique)
- [Lune et coefficient de marée](#lune-et-coefficient-de-marée)
- [Vigilance et fortes chaleurs](#vigilance-et-fortes-chaleurs)
- [Statistiques du jour](#statistiques-du-jour)
- [Effets météo visuels](#effets-météo-visuels)
- [Responsive design](#responsive-design)
- [Accessibilité](#accessibilité)
- [Persistance, sécurité et confidentialité](#persistance-sécurité-et-confidentialité)
- [PWA et stratégies de cache](#pwa-et-stratégies-de-cache)
- [Lancer le projet](#lancer-le-projet)
- [Déploiement en production](#déploiement-en-production)
- [Personnalisation](#personnalisation)
- [Maintenance et diagnostic](#maintenance-et-diagnostic)
- [Limites connues](#limites-connues)
- [Crédits](#crédits)

## Aperçu

WeatherRadar est une SPA statique orientée France, mais la recherche et les prévisions fonctionnent dans le monde entier lorsque les fournisseurs couvrent la position choisie.

Principes du projet :

- zéro étape de compilation ;
- aucun compte utilisateur ;
- aucune clé API intégrée dans le navigateur ;
- aucun outil d’analytics ou cookie publicitaire ;
- chargement direct depuis un hébergement statique ;
- interface sombre, responsive et installable ;
- dégradation indépendante des modules : l’indisponibilité du radar, des pollens ou des données marines ne doit pas effacer les prévisions déjà obtenues.

Une connexion est nécessaire pour actualiser les données. Après une première visite réussie, le service worker peut conserver l’interface statique, mais il ne transforme pas les données météo en prévisions hors ligne.

## Fonctionnalités

### Météo

- Conditions actuelles : température, ressenti, humidité, vent et état du ciel.
- Prévisions matin/après-midi pour aujourd’hui et demain.
- Prévisions synthétiques sur 7 jours et heure par heure sur 48 heures.
- Lever/coucher du soleil, rosée, visibilité, rafales et ensoleillement.
- Réessais automatiques de la requête principale en cas de coupure transitoire.

### Radar et graphiques

- Radar RainViewer animé sur fond OpenStreetMap.
- Jusqu’à 8 trames historiques et 6 trames nowcast.
- Sélection manuelle ou lecture automatique des images radar.
- Graphique combiné température/précipitations/probabilité sur 24 heures.
- Graphique sur 15 jours : température, précipitations, vent et humidité.
- Graphiques secondaires pour la pression et le pollen dominant.

### Environnement et risques

- Indice européen de qualité de l’air et quatre polluants.
- Six familles de pollens CAMS.
- Température de l’eau et houle lorsque le modèle marin couvre la position.
- Pression au niveau de la mer, tendance sur 3 heures et baromètre.
- Phase lunaire, illumination et prochains événements lunaires.
- Coefficient de marée indicatif pour certaines positions côtières françaises.
- Vigilance départementale et estimation locale des épisodes de forte chaleur.

### Interface

- Recherche internationale avec autocomplétion.
- Navigation clavier de la recherche, du radar et des graphiques.
- Header sticky avec suivi automatique de la section visible.
- Ambiance animée adaptée au code météo et au vent.
- Réduction des animations selon `prefers-reduced-motion`.
- Mise en page mobile portrait, très petit écran et mobile paysage.
- Installation PWA en portrait ou en paysage.

## Fichiers du projet

```text
index.html         Interface, CSS, état et logique applicative
sw.js              Service worker et stratégies de cache
manifest.json      Métadonnées de la PWA
privacy.html       Information de confidentialité
icon-192.png       Icône PWA 192 × 192
icon-512.png       Icône PWA 512 × 512, également maskable
WeatherRadar.apk   Artefact Android distribué séparément du code web
README.md          Documentation actuelle
old_readme.md      Documentation historique de référence
```

`WeatherRadar.apk` n’est pas généré par un script présent dans ce dépôt. Après une modification du site, il faut vérifier séparément si cet artefact doit être reconstruit.

## Architecture technique

```text
Navigateur
├─ index.html
│  ├─ HTML sémantique et cartes
│  ├─ CSS responsive et effets météo
│  └─ JavaScript applicatif
│     ├─ état global S
│     ├─ recherche et validation des lieux
│     ├─ clients des APIs
│     ├─ renderers des cartes
│     ├─ Leaflet + radar RainViewer
│     ├─ Chart.js
│     └─ effets Canvas/CSS
├─ manifest.json
├─ sw.js
└─ privacy.html

Services distants
├─ Open-Meteo Forecast / Air Quality / Geocoding / Marine
├─ RainViewer
├─ OpenStreetMap
├─ Géoplateforme
└─ OpenDataSoft / vigilance Météo-France
```

### Structure de l’interface

```text
body
├─ #atmo-canvas
├─ #weather-overlay
└─ .app-shell
   ├─ header : logo, navigation, heure, météo et ville
   ├─ main
   │  ├─ recherche
   │  ├─ vigilance officielle et alerte chaleur
   │  ├─ radar, aujourd’hui, demain, semaine et graphique 24 h
   │  ├─ prévisions horaires 48 h
   │  ├─ graphique 15 jours + qualité de l’air
   │  ├─ pollens et données marines conditionnelles
   │  ├─ pression + lune
   │  └─ 12 cartes statistiques
   └─ footer et confidentialité
```

### Choix techniques

- JavaScript natif en mode strict, `fetch` et `AbortController`.
- Leaflet 1.9.4 pour la carte et Chart.js 4.4.0 pour les graphiques.
- Canvas 2D pour le fond atmosphérique.
- CSS Grid, Flexbox et `display: contents` pour le mobile.
- `ResizeObserver` pour la carte et le décalage du header.
- `IntersectionObserver` pour la navigation active.
- `localStorage` pour la persistance locale.
- Service worker pour le shell de la PWA.

## Sources de données et dépendances

### APIs externes

| Service | Endpoint | Utilisation | Clé |
|---|---|---|---|
| Open-Meteo Forecast | `api.open-meteo.com/v1/forecast` | Prévisions sur 16 jours | Non |
| Open-Meteo Air Quality / CAMS | `air-quality-api.open-meteo.com/v1/air-quality` | AQI, polluants et pollens | Non |
| Open-Meteo Geocoding | `geocoding-api.open-meteo.com/v1/search` | Recherche internationale | Non |
| Open-Meteo Marine | `marine-api.open-meteo.com/v1/marine` | Température de surface et houle | Non |
| RainViewer | `api.rainviewer.com/public/weather-maps.json` | Métadonnées radar | Non |
| RainViewer Tiles | Hôte fourni par l’API | Images radar | Non |
| OpenStreetMap | `tile.openstreetmap.org` | Fond de carte | Non |
| Géoplateforme | `data.geopf.fr/geocodage/reverse/` | Résolution du département | Non |
| OpenDataSoft | `public.opendatasoft.com` | Vigilance Météo-France redistribuée | Non |

Les services restent soumis à leurs conditions, quotas, disponibilités et zones de couverture. « Sans clé » ne signifie pas « sans limite » ni « autorisé pour tout volume ou usage commercial ».

L’application n’utilise pas l’API publique Nominatim pour l’autocomplétion : elle s’appuie sur la base locale puis Open-Meteo Geocoding.

### Dépendances navigateur

| Bibliothèque | Version | Source | Rôle |
|---|---:|---|---|
| Leaflet | 1.9.4 | unpkg | Carte, marqueur et tuiles |
| Chart.js | 4.4.0 | jsDelivr | Graphiques |
| Inter | variable | Google Fonts | Typographie |

Ces dépendances sont critiques au premier chargement. Pour une production à forte exigence de disponibilité, leur auto-hébergement est préférable.

### Paramètres Open-Meteo Forecast

Variables horaires :

```text
temperature_2m, weathercode, precipitation, precipitation_probability
windspeed_10m, relativehumidity_2m, apparent_temperature, uv_index
cloudcover, pressure_msl, surface_pressure, dewpoint_2m
windgusts_10m, visibility
```

Variables journalières :

```text
weathercode, temperature_2m_max, temperature_2m_min
apparent_temperature_max, apparent_temperature_min
precipitation_sum, windspeed_10m_max, sunrise, sunset
precipitation_hours, uv_index_max, daylight_duration, sunshine_duration
```

Options : `current_weather=true`, `forecast_days=16`, `timezone=auto`.

Air et pollens :

```text
pm2_5, pm10, nitrogen_dioxide, ozone, european_aqi
alder_pollen, birch_pollen, grass_pollen
mugwort_pollen, olive_pollen, ragweed_pollen
forecast_days=1, timezone=auto
```

Marine :

```text
hourly: sea_surface_temperature, wave_height, wave_period, wave_direction
daily: sea_surface_temperature_max, sea_surface_temperature_min, wave_height_max
forecast_days=2, timezone=auto
```

## Structure du code

### État global `S`

| Propriété | Rôle |
|---|---|
| `city`, `region`, `countryCode` | Libellés du lieu actif |
| `lat`, `lon`, `timezone` | Coordonnées et fuseau |
| `departmentCode` | Département utilisé pour la vigilance |
| `forecast`, `aqi` | Dernières réponses météo et air |
| `chart`, `chartType` | Instance et onglet du graphique 15 jours |
| `radarFrames`, `radarIdx` | Trames radar et index courant |
| `radarLayer`, `radarLayers` | Couche courante et cache mémoire Leaflet |
| `radarHost`, `radarPending`, `radarTransition` | Chargement et transition radar |
| `animInterval` | Lecture automatique du radar |
| `cityMarker` | Marqueur de la ville |
| `weatherEffect` | Effet météo actif |
| `showTide` | Autorise l’estimation de marée après détection côtière |

### Fonctions principales

| Fonction | Rôle |
|---|---|
| `loadAll()` | Orchestre météo, alertes, air et données marines |
| `fetchWeatherResilient()` | Réessaie la prévision principale jusqu’à quatre fois |
| `fetchAQI()` / `fetchMarine()` | Chargent air, pollens, eau et houle |
| `resolveDepartmentCode()` / `fetchVigilance()` | Chargent la vigilance |
| `renderToday()` / `renderTomorrow()` / `renderWeek()` | Cartes de prévision |
| `renderHourly()` | Prévisions sur 48 heures |
| `buildInlineChart()` / `buildChart()` | Graphiques 24 h et 15 jours |
| `renderAQI()` / `renderPollen()` | Air et pollens |
| `renderWaterCard()` | Données marines conditionnelles |
| `renderPressureCard()` / `renderMoonCard()` | Pression, lune et marée |
| `renderVigilance()` / `renderHeatwave()` | Bannières de risque |
| `renderStats()` | Douze cartes statistiques |
| `loadRadar()` / `showRadarFrame()` | Timeline et couche radar |
| `applyWeatherEffect()` | Overlay météo |
| `normalizeLocation()` / `escapeHTML()` | Validation et échappement |

## Gestion de l’état et cycle de chargement

L’état est centralisé dans `S`. Les renderers écrivent directement dans le DOM ; il n’existe ni virtual DOM ni store externe.

```text
Initialisation
├─ restaurer wr_city si sa structure est valide
├─ initialiser Leaflet et le marqueur
├─ calculer la lune localement
├─ loadAll()
└─ loadRadar()

Sélection d’une ville
├─ normalizeLocation()
├─ mettre à jour S et wr_city
├─ map.flyTo() + updateMarker()
├─ loadAll()
└─ loadRadar()
```

`loadAll()` lance la résolution du département en parallèle de la prévision. Après réception de la météo principale, il met à jour aujourd’hui, demain, la semaine, l’horaire, les graphiques, les statistiques, la pression et l’alerte chaleur. L’air/pollen et les données marines sont ensuite chargés indépendamment.

La prévision principale dispose de quatre tentatives avec des délais de 1, 2 puis 4 secondes. Si le navigateur est hors ligne, l’attente peut se terminer dès l’événement `online`.

Les modules secondaires ont leurs propres replis : une erreur Air Quality ne supprime pas la météo, une erreur Marine masque la carte d’eau et une erreur Vigilance masque sa bannière.

## Recherche de villes

### Sources et classement

La recherche combine :

1. un filtre instantané dans `CITIES[]`, qui contient 25 villes françaises ;
2. Open-Meteo Geocoding pour les résultats internationaux.

Les résultats locaux apparaissent immédiatement, puis sont fusionnés avec les résultats distants et dédupliqués à partir du nom, du pays et des coordonnées arrondies.

### Comportement

- Recherche à partir de deux caractères.
- Temporisation de 230 ms.
- Huit suggestions au maximum dans le flux normal.
- Jusqu’à douze résultats lors d’une soumission explicite.
- Annulation de la requête précédente avec `AbortController`.
- Flèches haut/bas pour parcourir les suggestions.
- Entrée pour sélectionner ou soumettre, Échap pour fermer.
- États ARIA `combobox`, `listbox` et `option`.
- Ellipse propre du placeholder sur petit écran.

### Validation

`normalizeLocation()` contrôle :

- un nom non vide, limité à 120 caractères ;
- une latitude entre −90 et 90 ;
- une longitude entre −180 et 180 ;
- un code pays ISO à deux lettres lorsqu’il est présent ;
- un fuseau ramené à `auto` si son format n’est pas reconnu.

Si Open-Meteo Geocoding est indisponible, seules les correspondances locales restent accessibles. Nominatim ne doit pas être réintroduit directement pour une autocomplétion côté navigateur.

## Prévisions météo

### Aujourd’hui

La carte principale affiche ville, région, température courante, description WMO, minimum/maximum, ressenti, lever/coucher du soleil et deux créneaux matin/après-midi.

Le code WMO, `is_day`, le vent et la couverture nuageuse déterminent l’ambiance visuelle.

### Demain et semaine

La carte demain utilise deux heures représentatives pour le matin et l’après-midi, avec température, humidité, vent et indication min/max.

Chaque ligne des sept jours contient jour, icône WMO, description, température minimale et maximale. Aujourd’hui est mis en évidence.

### Prévisions horaires

Chaque case des 48 heures comprend heure, icône, température et précipitations. L’heure courante est mise en évidence et centrée après rendu. Le centrage devient instantané lorsque la réduction des animations est activée.

## Radar météo RainViewer

### Chargement des trames

1. `loadRadar()` appelle `weather-maps.json`.
2. Les huit dernières trames `radar.past` sont conservées.
3. Jusqu’à six trames `radar.nowcast` sont ajoutées.
4. La timeline distingue historique, présent et prévision.
5. La dernière trame historique est affichée par défaut.

Sans nowcast, l’interface indique que seul l’historique radar est disponible.

### Tuiles et résolution

```js
const RAINVIEWER_TILE_IMAGE_SIZE = window.devicePixelRatio >= 2 ? 512 : 256;
```

- Schéma de couleurs RainViewer : `2`.
- Opacité maximale : `0.96`.
- Radar : `maxNativeZoom: 7`, `maxZoom: 12`.
- Fond OpenStreetMap : zoom maximal 18.
- Tuiles radar chargées avec `crossOrigin: true`.

### Mémoire, transitions et lecture

Au repos, seule la couche radar courante reste sur la carte. Au lancement de l’animation, toutes les trames sont préparées ; elles sont libérées à l’arrêt.

Le fondu entre deux couches dure 280 ms et utilise `requestAnimationFrame`. Une trame qui ne signale pas son chargement dispose d’un repli après 1,1 seconde.

Le bouton « Animer » avance toutes les 450 ms, boucle, met à jour la progression et devient « Stop ». Les métadonnées sont actualisées toutes les dix minutes.

### Correction de taille Leaflet

`invalidateSize()` est appelé après deux `requestAnimationFrame`, après 300 et 800 ms, puis à chaque taille détectée par `ResizeObserver`. Un listener `resize` sert de repli.

## Graphiques

### Graphique combiné 24 heures

| Série | Type | Axe |
|---|---|---|
| Température | Ligne orange remplie | Gauche, °C |
| Précipitations | Barres bleues | Droite, mm |
| Probabilité de pluie | Ligne pointillée | Axe 0–100 % masqué |

L’infobulle regroupe les trois séries d’un même index horaire.

### Graphique 15 jours

| Onglet | Type | Calcul |
|---|---|---|
| Températures | Deux lignes | Min et max journaliers |
| Précipitations | Barres | Cumul journalier en mm |
| Vent | Ligne | Maximum journalier en km/h |
| Humidité | Ligne | Moyenne des valeurs horaires du jour |

L’instance précédente est détruite avant reconstruction. Les onglets suivent le modèle ARIA `tablist`/`tab`/`tabpanel` et prennent en charge Gauche, Droite, Début et Fin.

### Graphiques secondaires

- Pression : environ 12 heures avant et 12 heures après l’heure courante.
- Pollens : 24 prochaines heures du pollen dominant.

## Qualité de l’air

### Indice européen

| Valeur | Niveau | Couleur |
|---:|---|---|
| 0–20 | Bon | Vert |
| 21–40 | Moyen | Vert clair |
| 41–60 | Modéré | Jaune |
| 61–80 | Mauvais | Orange |
| 81–100 | Très mauvais | Rouge |
| plus de 100 | Extrêmement mauvais | Violet |

Le pointeur utilise une échelle visuelle 0–150, plafonnée à 95 % de la largeur.

### Polluants

| Polluant | Bon | Moyen | Dégradé | Maximum visuel |
|---|---:|---:|---:|---:|
| PM2.5 | 15 | 25 | 50 | 75 µg/m³ |
| PM10 | 45 | 75 | 150 | 200 µg/m³ |
| NO₂ | 25 | 50 | 100 | 200 µg/m³ |
| O₃ | 100 | 130 | 160 | 240 µg/m³ |

Les barres ont un rôle `progressbar`, une valeur ARIA et une animation vers leur cible. En l’absence de données, la carte affiche explicitement « Indisponible ».

## Pollens

Les pollens proviennent de CAMS via Open-Meteo et peuvent être absents hors de la zone européenne couverte.

| Famille | Seuils faible/modéré/élevé en grains/m³ |
|---|---|
| Bouleau | 10 / 70 / 150 |
| Aulne | 10 / 70 / 150 |
| Olivier | 10 / 70 / 150 |
| Graminées | 3 / 20 / 50 |
| Armoise | 3 / 20 / 50 |
| Ambroisie | 3 / 20 / 50 |

Chaque famille affiche concentration, niveau, prochain seuil et jauge segmentée. Si la valeur courante est nulle, le pic disponible du jour sert de repli.

Le pollen dominant est choisi par niveau puis par concentration. Il alimente le résumé et le graphique 24 h. Les conseils sont indicatifs et ne constituent pas un avis médical.

## Données marines

La carte marine est affichée uniquement si l’API renvoie au moins une température de surface exploitable.

### Confort de baignade

| Température | Niveau |
|---:|---|
| moins de 12 °C | Glaciale |
| 12 à moins de 18 °C | Froide |
| 18 à moins de 21 °C | Fraîche |
| 21 à moins de 24 °C | Agréable |
| 24 à moins de 27 °C | Chaude |
| 27 °C et plus | Très chaude |

La carte présente hauteur/période/direction de houle, min/max de l’eau, différence eau-air et houle maximale prévue demain. Une variation de houle inférieure à 0,15 m est considérée stable.

## Pression atmosphérique

La pression utilise `pressure_msl`, avec repli sur `surface_pressure`. La tendance est la différence avec la valeur trois heures plus tôt : au moins +1 hPa signifie hausse, au plus −1 hPa baisse, sinon stabilité.

| Pression | Libellé |
|---:|---|
| 960 à moins de 985 hPa | Tempête |
| 985 à moins de 1000 hPa | Pluie |
| 1000 à moins de 1015 hPa | Variable |
| 1015 à moins de 1035 hPa | Beau temps |
| 1035 à 1060 hPa | Très sec |

Le cadran est limité à 960–1060 hPa. Une variation d’au moins 3 hPa sur trois heures ajoute un commentaire de hausse ou chute rapide. Ces libellés restent une interprétation générale : la pression seule ne prédit pas précisément le temps local.

## Lune et coefficient de marée

### Phase lunaire

Le calcul local utilise la nouvelle lune de référence du 6 janvier 2000 à 18:14 UTC et un mois synodique moyen de `29.530588853` jours. L’âge est converti en huit phases et l’illumination est approximée trigonométriquement.

La carte affiche phase, illumination, jour du cycle, prochaine pleine lune et prochaine nouvelle lune. La précision annoncée par le code est de l’ordre d’une heure pour ce modèle moyen.

### Coefficient indicatif

Le coefficient est calculé avec un modèle harmonique simplifié fondé sur M2, S2 et N2 à Brest, limité à 20–120 puis calibré par un facteur `0.911`. Il est affiché par dizaine avec suffixe `+` ou `−` pour ne pas simuler une précision officielle.

| Estimation | Niveau |
|---:|---|
| 100 et plus | Grande marée |
| 70 à 99 | Marée moyenne+ |
| 45 à 69 | Marée moyenne |
| moins de 45 | Marée faible |

Cette estimation n’apparaît qu’après détection d’une position côtière française métropolitaine par le filtre de l’application. Elle n’utilise pas le modèle officiel complet, ne fournit ni horaires ni hauteurs et ne doit jamais servir à la navigation.

## Vigilance et fortes chaleurs

### Vigilance départementale

Pour une position française métropolitaine :

1. Géoplateforme résout le département ;
2. le code est mémorisé dans `wr_dept_cache` ;
3. OpenDataSoft fournit la vigilance ;
4. les niveaux du jour et du lendemain sont comparés ;
5. la bannière apparaît à partir du jaune.

Les phénomènes reconnus incluent vent, pluie-inondation, orages, crues, neige-verglas, avalanches, canicule, grand froid et vagues-submersion.

Le panneau détaille niveau, période, phénomènes, tendance et conseils génériques, avec un lien vers la carte officielle. Il est actualisé toutes les quinze minutes tant qu’un département est actif.

### Estimation des fortes chaleurs

- Horizon : jusqu’à 10 jours.
- Jour chaud : maximum d’au moins 32 °C.
- Nuit tropicale : minimum d’au moins 20 °C.
- Affichage seulement si le premier déclencheur arrive au plus tard à J+2.
- « Canicule » : au moins 3 jours consécutifs ≥ 32 °C et pic ≥ 35 °C.
- « Canicule probable » : au moins 3 jours consécutifs et pic ≥ 33 °C.
- « Forte chaleur » : pic ≥ 32 °C.
- Sinon, signalement possible de nuits chaudes.

La fenêtre horaire à risque cherche un bloc contigu à au moins 33 °C ressentis, puis 30 °C en repli. La bannière attend la résolution de la vigilance afin d’éviter un déplacement de page ; un délai de sécurité de trois secondes libère l’affichage.

Ces seuils sont heuristiques et ne remplacent pas les seuils départementaux officiels.

## Statistiques du jour

`renderStats()` génère douze cartes :

| Carte | Source ou calcul |
|---|---|
| Indice UV | Valeur horaire actuelle, sinon maximum journalier |
| Prochaine pluie | Première heure sur 48 h avec probabilité ≥ 40 % ou cumul > 0,1 mm |
| Amplitude du jour | Minimum, maximum et différence |
| Précipitations | Somme journalière et heures de pluie |
| Vent maximum | Maximum journalier et direction courante |
| Ressenti actuel | `apparent_temperature` à l’heure courante |
| Moyenne semaine prochaine | Moyenne des maxima J+7 à J+14 |
| Ensoleillement | Durée et part de la durée du jour |
| Humidité relative | Humidité, niveau et point de rosée |
| Visibilité | Distance en kilomètres et appréciation |
| Rafales maximales | Maximum horaire du jour |
| Durée du jour | `daylight_duration` convertie en heures/minutes |

### Seuils UV

| Indice | Niveau |
|---:|---|
| moins de 3 | Faible |
| 3 à 5 | Modéré |
| 6 à 7 | Élevé |
| 8 à 10 | Très élevé |
| 11 et plus | Extrême |

Humidité : très sèche sous 30 %, confortable sous 50 %, modérée sous 70 %, élevée sous 85 %, très élevée au-delà.

Visibilité : brouillard dense sous 1 km, brume sous 4 km, bonne sous 10 km, excellente à partir de 10 km.

## Effets météo visuels

### Correspondance WMO

| Codes | Description | Effet |
|---|---|---|
| 0 | Ciel dégagé | `sun` |
| 1 | Principalement dégagé | `sun` |
| 2 | Partiellement nuageux | `partly-cloudy` |
| 3 | Couvert | `cloud` |
| 45, 48 | Brouillard | `fog` |
| 51–64, 66–67, 80–81 | Bruine, pluie ou averses | `rain` |
| 65 | Pluie forte | `heavyrain` |
| 71–77, 85–86 | Neige ou grésil | `snow` |
| 82, 95–99 | Violentes averses ou orage | `storm` |

La nuit, les effets `sun` et `partly-cloudy` sont remplacés par `clear-night`.

### Rendu

| Effet | Éléments |
|---|---|
| Soleil | Rayons coniques, halo et brume lumineuse |
| Partiellement nuageux | Soleil et deux couches nuageuses atténuées |
| Nuit claire | Halo lunaire et étoiles |
| Nuages | Deux couches de gradients en dérive |
| Brouillard | Nuages et nappe de brume basse |
| Pluie | Gouttes CSS à densité responsive |
| Neige | Flocons animés |
| Orage | Pluie dense et éclairs |
| Vent | Rafales SVG au-delà de 35 km/h |

La couverture nuageuse ajuste vitesse et opacité. La densité des particules dépend du viewport pour réduire le DOM sur mobile. Sous 600 px, les halos soleil/lune passent à environ 50 % de leur taille desktop.

Le canvas atmosphérique dessine 55 particules à 30 images par seconde. Il s’arrête quand l’onglet est masqué et conserve leurs positions relatives lors du redimensionnement.

### Réduction des animations

Avec `prefers-reduced-motion: reduce` :

- pluie, neige, éclairs et rafales ne sont pas créés ou animés ;
- nuages, brouillard, halos et étoiles restent visibles mais figés ;
- le canvas devient statique ;
- les scrolls automatiques deviennent instantanés ;
- les transitions de jauges et animations décoratives sont neutralisées.

## Responsive design

### Breakpoints

| Condition | Comportement |
|---|---|
| plus de 1100 px | Grille principale à deux colonnes |
| 1100 px et moins | Colonne unique, graphiques empilés, radar de 420 px |
| 600 px et moins | Flux réordonné, navigation compacte, radar en `68vw` |
| 380 px et moins | Statistiques sur une colonne et composants resserrés |
| hauteur ≤ 500 px en paysage | Radar limité et paddings verticaux réduits |

### Ordre mobile sous 600 px

1. recherche ;
2. vigilance officielle ;
3. alerte chaleur ;
4. aujourd’hui ;
5. demain ;
6. prévision horaire ;
7. graphique 24 h ;
8. prévisions 7 jours ;
9. radar ;
10. graphique 15 jours, air, pollens et eau ;
11. pression et lune ;
12. statistiques.

Les conteneurs principaux passent en `display: contents` pour permettre ce réordonnancement.

### Protection contre les débordements

- `min-width: 0` sur les enfants flex/grid sensibles.
- `minmax(0, 1fr)` sur les colonnes compressibles.
- `overflow-x: hidden` sur le contenu.
- carte Leaflet dans un conteneur à hauteur contrôlée.
- ellipses sur placeholder, ville et descriptions longues.
- effets `:hover` réservés aux pointeurs précis.

Le décalage des ancres est dynamique : `ResizeObserver` mesure le header sticky et met à jour `--scroll-offset`.

## Accessibilité

- Langue française déclarée sur le document.
- Focus visible sur les contrôles.
- Recherche exposée comme combobox avec liste et options.
- Onglets Chart.js avec rôles et états ARIA.
- Timeline radar avec libellés et `aria-pressed`.
- Bannières d’alerte utilisant de vrais boutons.
- Panneaux fermés marqués `aria-hidden` et `inert`.
- `aria-current` sur la section active.
- Navigation clavier pour recherche, graphiques et alertes.
- Respect de la préférence de réduction du mouvement.

Les graphiques Canvas restent principalement visuels. Une restitution tabulaire des séries serait une amélioration utile pour une conformité renforcée.

## Persistance, sécurité et confidentialité

### Stockage local

| Clé | Contenu | Limite |
|---|---|---|
| `wr_city` | Nom, région, pays, coordonnées et fuseau | Une ville |
| `wr_dept_cache` | Coordonnées arrondies vers département | 40 entrées |

La clé département utilise des coordonnées arrondies à 0,01°, environ un kilomètre. L’entrée la plus ancienne est supprimée au-delà de 40 clés.

Une valeur `wr_city` invalide ou corrompue est supprimée et Paris reste la valeur par défaut.

### Mesures défensives

- Validation des coordonnées et du fuseau.
- Échappement des valeurs externes injectées dans les alertes.
- Annulation des anciennes recherches réseau.
- Timeout de huit secondes pour département et vigilance.
- Vigilance et radar exclus du cache applicatif pour éviter une donnée obsolète.
- Liens externes ouverts avec `rel="noopener"`.

### Confidentialité

L’application ne demande aucun compte, ne collecte pas automatiquement le GPS et n’intègre ni analytics ni publicité. Le navigateur envoie directement la recherche ou les coordonnées nécessaires aux fournisseurs, qui reçoivent également les métadonnées habituelles d’une requête web.

La page [`privacy.html`](privacy.html) détaille les services contactés et les données locales.

## PWA et stratégies de cache

### Manifeste

`manifest.json` déclare le français, le mode `standalone`, l’orientation `any`, le thème `#07090f`, les catégories météo/utilitaires et les icônes 192/512 px. L’icône 512 est également `maskable`.

### Service worker

Cache courant : `weatherradar-v22`.

| Ressource | Stratégie |
|---|---|
| Navigation HTML | Réseau d’abord, cache puis `/` en secours |
| APIs météo, vigilance et RainViewer | Réseau uniquement |
| Tuiles OpenStreetMap | Cache HTTP normal du navigateur |
| Google Fonts | Cache d’abord après obtention réussie |
| Leaflet et Chart.js | Cache d’abord après obtention réussie |
| Assets locaux | Cache d’abord, réseau puis page de secours |

Assets précachés : `/`, `/index.html`, `/privacy.html`, `/manifest.json`, `/icon-192.png`, `/icon-512.png`.

À l’activation, les anciens caches sont supprimés puis le worker prend le contrôle avec `clients.claim()`.

### Portée du mode hors ligne

Après une visite réussie, le shell local peut s’ouvrir hors ligne. Les données fraîches et les tuiles ne sont pas garanties ; les modules réseau utilisent leurs replis. Incrémenter `CACHE_NAME` après toute modification des assets statiques.

## Lancer le projet

### Serveur local recommandé

```bash
npx serve .
```

ou :

```bash
python -m http.server 8080
```

Le mode `file://` ne reproduit pas correctement le service worker, l’installation PWA, certains comportements CORS et les chemins absolus `/sw.js` et `/`.

### Prérequis navigateur

Le navigateur doit prendre en charge `fetch`, Promises, fonctions fléchées, optional chaining, nullish coalescing, Canvas, CSS Grid/Flexbox et `localStorage`.

`ResizeObserver`, `IntersectionObserver`, Service Worker et `inert` sont utilisés pour les fonctions correspondantes.

## Déploiement en production

Le projet peut être publié sur GitHub Pages, Netlify, Vercel, Cloudflare Pages ou tout serveur statique.

### Contraintes

- HTTPS requis pour le service worker hors `localhost`.
- Tous les fichiers PWA doivent être servis aux chemins attendus.
- `start_url: "/"` et `register('/sw.js')` supposent un déploiement à la racine. Adapter pour un sous-répertoire.
- Types MIME corrects pour HTML, JavaScript, JSON et PNG.
- Attributions fournisseurs conservées.

### Domaines à autoriser

```text
api.open-meteo.com
air-quality-api.open-meteo.com
geocoding-api.open-meteo.com
marine-api.open-meteo.com
api.rainviewer.com
tilecache.rainviewer.com
tile.openstreetmap.org
data.geopf.fr
public.opendatasoft.com
fonts.googleapis.com
fonts.gstatic.com
unpkg.com
cdn.jsdelivr.net
```

Une Content Security Policy stricte doit aussi tenir compte du CSS et du JavaScript inline présents dans `index.html`.

### Checklist avant publication

- [ ] Vérifier `index.html`, Leaflet et Chart.js sans erreur console.
- [ ] Tester une ville locale et une ville internationale.
- [ ] Tester les changements rapides de recherche.
- [ ] Tester radar, timeline, animation et changement de ville.
- [ ] Tester les quatre onglets du graphique au clavier et à la souris.
- [ ] Tester une position côtière et une position intérieure.
- [ ] Tester les états sans données air, pollen, marine et vigilance.
- [ ] Vérifier installation PWA et secours hors ligne en HTTPS.
- [ ] Tester à 390 px, 380 px, sur desktop et en paysage bas.
- [ ] Tester `prefers-reduced-motion: reduce`.
- [ ] Vérifier `privacy.html` et les liens externes.
- [ ] Contrôler conditions et quotas des fournisseurs.
- [ ] Incrémenter le cache si les assets ont changé.
- [ ] Vérifier si `WeatherRadar.apk` doit être reconstruit.

### Durcissement recommandé

- Auto-héberger Leaflet, Chart.js et éventuellement Inter.
- Ajouter SRI si les dépendances restent sur CDN.
- Ajouter une CSP après extraction éventuelle du CSS/JS inline.
- Configurer `Referrer-Policy`, `X-Content-Type-Options` et `Permissions-Policy` côté hébergeur.
- Automatiser un test du shell HTML et des endpoints principaux.

## Personnalisation

### Ville par défaut

```js
const S = {
  city: 'Lyon',
  lat: 45.7640,
  lon: 4.8357,
  region: 'Auvergne-Rhône-Alpes, FR',
  countryCode: 'FR',
  departmentCode: '69',
  timezone: 'Europe/Paris',
  // autres propriétés inchangées
};
```

### Ajouter une ville locale

```js
const CITIES = [
  // villes existantes
  { name: 'Annecy', region: 'Auvergne-Rhône-Alpes', lat: 45.8992, lon: 6.1294 },
];
```

Une ville locale est automatiquement enrichie avec `country: 'France'`, `countryCode: 'FR'` et `timezone: 'Europe/Paris'`.

### Tokens de design

```css
:root {
  --bg: #07090f;
  --bg2: #0c0f1a;
  --surface: rgba(255,255,255,0.035);
  --surface2: rgba(255,255,255,0.07);
  --border: rgba(255,255,255,0.07);
  --border2: rgba(255,255,255,0.13);
  --txt: #e8eaf2;
  --txt2: #8990ae;
  --accent: #4fc3f7;
  --accent2: #0288d1;
  --warm: #ffb74d;
  --cold: #81d4fa;
  --radius: 16px;
  --radius-sm: 10px;
  --hh: 64px;
  --fh: 52px;
}
```

### Fréquences et effets

```js
setInterval(loadRadar, 600000); // radar : 10 minutes
```

La vigilance est planifiée dans `scheduleVigilanceRefresh()` avec un intervalle de 900 000 ms, soit 15 minutes.

Constantes courantes :

```js
const RADAR_MAX_OPACITY = 0.96;
const RAINVIEWER_COLOR_SCHEME = 2;
const WIND_THRESHOLD = 35;
```

`WIND_THRESHOLD` est local à `applyWeatherEffect()` dans l’implémentation actuelle.

### Ajouter un effet WMO

1. Ajouter ou modifier l’entrée de `wmoInfo()`.
2. Ajouter le rendu dans `applyWeatherEffect()`.
3. Ajouter styles et keyframes.
4. Prévoir une variante statique pour `prefers-reduced-motion`.
5. Vérifier le coût DOM sur mobile.

### Ajouter une carte

1. Créer le conteneur HTML et son squelette si nécessaire.
2. Ajouter les styles desktop, tablette et mobile.
3. Créer un renderer tolérant les valeurs nulles.
4. L’appeler depuis `loadAll()` ou le module réseau concerné.
5. Prévoir un état indisponible.
6. Vérifier ordre mobile, clavier et ARIA.
7. Documenter source, unités, seuils et limites dans ce README.

## Maintenance et diagnostic

### Contrôles statiques

```bash
node --check sw.js
git diff --check
```

`manifest.json` doit rester un JSON strict, sans commentaire ni virgule finale.

### Après une modification du service worker

1. incrémenter `CACHE_NAME` ;
2. recharger la page ;
3. vérifier l’onglet Application du navigateur ;
4. confirmer l’activation du nouveau worker ;
5. tester une navigation hors ligne ;
6. supprimer manuellement les données du site si un ancien worker perturbe le test.

### Symptômes fréquents

| Symptôme | Vérifications |
|---|---|
| `L is not defined` | Leaflet/unpkg, réseau, bloqueur ou CSP |
| `Chart is not defined` | Chart.js/jsDelivr ou CSP |
| Carte grise ou mal dimensionnée | Tuiles OSM, `invalidateSize()`, hauteur du conteneur |
| Radar vide | API RainViewer, hôte de tuiles, CORS ou nowcast absent |
| Recherche internationale vide | Open-Meteo Geocoding et connectivité |
| Pollens indisponibles | Position hors CAMS ou valeurs nulles |
| Carte eau masquée | Aucune température de surface exploitable |
| Vigilance absente | Hors métropole, département non résolu ou niveau vert |
| Ancienne version persistante | Cache du service worker et `CACHE_NAME` |

## Limites connues

- Une panne d’Open-Meteo Geocoding retire la recherche internationale ; la liste locale reste disponible.
- Leaflet et Chart.js sont critiques au premier chargement depuis les CDN.
- Toutes les prévisions ne sont pas automatiquement actualisées à intervalle fixe ; radar et vigilance ont leurs propres temporisateurs.
- Les fournisseurs peuvent modifier disponibilité, quotas ou schémas.
- La couverture des pollens est principalement européenne.
- Le modèle marin peut ne rien fournir même près du littoral.
- L’estimation de marée est non officielle et sans horaires.
- La bannière chaleur utilise des seuils génériques.
- Les graphiques Canvas n’ont pas d’équivalent tabulaire complet.
- Les tuiles OpenStreetMap ne sont pas mises en cache durablement par le service worker.
- Un déploiement en sous-répertoire exige d’adapter les chemins PWA absolus.
- L’APK n’est pas construit par le dépôt statique.

## Crédits

- Prévisions, géocodage et données marines : [Open-Meteo](https://open-meteo.com/)
- Qualité de l’air et pollens : CAMS via [Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api)
- Radar : [RainViewer](https://www.rainviewer.com/)
- Fond de carte : [OpenStreetMap](https://www.openstreetmap.org/copyright) — © contributeurs OpenStreetMap
- Géocodage inverse : [Géoplateforme](https://geoservices.ign.fr/documentation/services/services-geoplateforme/geocodage)
- Vigilance : données Météo-France redistribuées par [OpenDataSoft](https://public.opendatasoft.com/)
- Carte : [Leaflet](https://leafletjs.com/) 1.9.4 — BSD 2-Clause
- Graphiques : [Chart.js](https://www.chartjs.org/) 4.4.0 — MIT
- Police : [Inter](https://rsms.me/inter/) — SIL Open Font License

Les conditions et licences applicables sont celles publiées par chaque fournisseur. Les attributions visibles dans l’application ne doivent pas être supprimées.
