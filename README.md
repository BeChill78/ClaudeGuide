# Nomade — Guide de voyage IA
## PWA mobile — Installation & utilisation

---

## Structure des fichiers

```
nomade-pwa/
├── index.html        ← Application principale
├── manifest.json     ← Config PWA (icône, nom, couleurs)
├── sw.js             ← Service Worker (cache offline)
├── css/
│   └── app.css       ← Tous les styles
├── js/
│   └── app.js        ← Toute la logique (GPS, IA, TTS, carte)
└── icons/
    ├── icon-192.png  ← À créer (voir ci-dessous)
    └── icon-512.png  ← À créer (voir ci-dessous)
```

---

## Étape 1 — Obtenir ta clé API Anthropic

1. Va sur https://console.anthropic.com
2. Crée un compte (gratuit)
3. Va dans "API Keys" → "Create Key"
4. Copie la clé (commence par `sk-ant-`)
5. Ajoute du crédit : 5–10€ suffisent pour des mois d'utilisation

**Coût estimé :**
- 1 visite générée (5-8 lieux) : ~0,03€
- 1 journée complète avec chat : ~0,10€

---

## Étape 2 — Héberger l'appli

### Option A — GitHub Pages (gratuit, recommandé)
1. Crée un compte GitHub : https://github.com
2. Nouveau repo → upload les fichiers
3. Settings → Pages → Branch: main
4. URL : `https://[ton-pseudo].github.io/nomade-pwa/`

### Option B — Netlify (drag & drop, 30 secondes)
1. Va sur https://netlify.com
2. Drag & drop le dossier `nomade-pwa/`
3. URL générée automatiquement

### Option C — Tester en local
```bash
# Python (si installé)
cd nomade-pwa
python -m http.server 8080
# Ouvre http://localhost:8080

# Node.js
npx serve .
```
Note : le GPS ne fonctionne qu'en HTTPS ou localhost.

---

## Étape 3 — Créer les icônes

Crée une image 512x512px avec le symbole ◈ sur fond #0a0a0a (noir) et couleur #c9a96e (or).

Outils gratuits :
- https://favicon.io/favicon-generator/
- Canva → export PNG 512x512 et 192x192

Place-les dans le dossier `icons/`.

---

## Étape 4 — Installer sur Android

1. Ouvre l'URL de ton appli dans **Chrome**
2. Menu ⋮ (3 points en haut à droite)
3. "Ajouter à l'écran d'accueil"
4. L'icône Nomade apparaît sur ton écran → lance comme une vraie app

---

## Étape 5 — Premier lancement

1. Tape sur l'icône ⚙️ (réglages)
2. Colle ta clé API Anthropic
3. Sauvegarde
4. Retour → tape une destination → génère

---

## Fonctionnalités

| Fonction | Tech | Notes |
|---|---|---|
| Carte interactive | Leaflet + OpenStreetMap | Dark mode, GPS temps réel |
| GPS position | Web Geolocation API | Marqueur bleu sur la carte |
| Génération POI | Claude Sonnet | Anti pièges à touristes, sources fiables |
| Guide audio FR | Web Speech API | Voix Thomas/Marie selon l'OS |
| Chat avec guide | Claude Sonnet | Contextuel au lieu sélectionné |
| Historique | localStorage | 20 dernières visites |
| Offline | Service Worker | Cache les fichiers statiques |

---

## Résolution des problèmes courants

**"Clé API invalide"**
→ Vérifie qu'elle commence par `sk-ant-` et qu'il y a du crédit sur ton compte

**Pas de voix française**
→ Android : Paramètres → Accessibilité → Synthèse vocale → Ajouter la langue française
→ Samsung : Paramètres → Gestion générale → Langue → ajouter Français

**GPS ne fonctionne pas**
→ L'appli doit être en HTTPS (GitHub Pages / Netlify). En HTTP local ça ne marche pas.

**Carte blanche**
→ Attends quelques secondes, les tuiles OpenStreetMap se chargent avec la connexion

---

## Limites connues

- Les tuiles de carte nécessitent une connexion (pas 100% offline)
- La voix navigateur est correcte mais moins naturelle qu'ElevenLabs
- Nominatim (géocodage) a une limite de 1 req/seconde — délai normal entre les POI
