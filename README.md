<div align="center">
  <img src="public/images/icons/android-chrome-512x512.png" alt="Navis" width="120" />
  <h1>Navis</h1>
  <p><em>Application de table virtuelle (VTT) pour jeux de rôle</em></p>
</div>

<p align="center">
  <a href="#-features">Fonctionnalités</a> •
  <a href="#-tech-stack">Stack technique</a> •
  <a href="#-quick-start">Quick start</a> •
  <a href="#-configuration">Configuration</a> •
  <a href="#-deployment">Déploiement</a> •
  <a href="#-docker">Docker</a>
</p>

Navis est un **fork** de [dungeon-revealer](https://github.com/dungeon-revealer/dungeon-revealer), adapté et enrichi pour les besoins d'une campagne Donjons & Dragons. Il permet au Maître du Jeu (MJ) de partager une carte de jeu avec les joueurs et de révéler progressivement des zones via un système de brouillard de guerre — le tout en temps réel, sur desktop, tablette et mobile.

---

## ✨ Fonctionnalités

### 🆕 Spécifiques à Navis

| Fonctionnalité | Description |
|---|---|
| **Brouillard de guerre animé** | Shader GLSL personnalisé avec FBM + *domain warping* pour un effet organique et dynamique |
| **Système météo** | Pluie, tempête, neige, soleil — intensité et angle du vent réglables, synchronisés en direct via **GraphQL live queries** |
| **Maps YouTube** | URL YouTube comme fond de carte (lecture en boucle, sans son, sans contrôles) |
| **Maps animées** | GIF, MP4, WebM, OGG — détection automatique du type de média |
| **UI transparente (glassmorphism)** | *Backdrop-filter* blur unifié sur toutes les barres d'outils |
| **Toolbar joueur rétractable** | Pliage/dépliage, drag & drop |
| **Interface en français** | Traduction complète de l'interface |
| **Sécurité renforcée** | Express, Socket.io, Vite 8, Node 20 LTS — dépendances durcies |
| **CI/CD** | Build & déploiement automatique via GitHub Actions + Docker Hub + VPS |

### 🧩 De base (dungeon-revealer)

- **Fog of war** — révélation/masquage par pinceau ou zone, snap to grid
- **Tokens** — formes colorées, label, verrouillage, visibilité, lien vers note
- **Grille** — configurable (taille, couleur, transparence, alignement)
- **Chat** — temps réel avec lancers de dés intégrés (`[1d20]`, `[3d6]`, …)
- **Macros de dés** — simples, template, avancées (Liquid)
- **Notes de carte** — un bloc de texte par carte, enregistré automatiquement
- **Authentification** — mot de passe optionnel MJ et/ou joueurs
- **Multi-plateforme** — desktop, tablette, mobile ; local ou internet

### 📋 Roadmap

| Priorité | Fonctionnalités |
|---|---|
| Haute | Effets de zone (feu, explosion, foudre, eau), sceaux magiques, zones météo exclues, éclairage dynamique, portes & murs, Docker Compose |
| Moyenne | Tokens enrichis (portrait, classe, barre de vie), état mort, bulles de dialogue, ping amélioré |
| Basse | Sons d'ambiance, indicateurs sonores |

Détails complets : [`FEATURES.md`](FEATURES.md)

---

## 🛠 Stack technique

| Couche | Technologie |
|---|---|
| **Runtime** | Node.js 20 |
| **Backend** | Express.js + Socket.io |
| **API** | GraphQL (v15, gqtx, `@n1ru4l/socket-io-graphql-server`) |
| **Live queries** | `@n1ru4l/graphql-live-query`, `@n1ru4l/in-memory-live-query-store` |
| **Frontend** | React 17 + Relay 10 |
| **Build** | Vite 8 |
| **UI** | Chakra UI v1 + Emotion |
| **3D** | Three.js 0.126 + react-three-fiber v5 |
| **BDD** | SQLite3 v6 |
| **Templating** | LiquidJS (macros de dés) |
| **Audio** | Howler.js |
| **Docker** | Multi-stage (Node 20-bullseye) |

---

## 🚀 Quick start

```bash
git clone https://github.com/axdevmin/Navis.git
cd Navis
nvm use               # Node 20 (ou assurez-vous d'utiliser Node 20+)
npm install
npm run setup         # génère le schéma GraphQL + types Relay
```

### Développement (deux terminaux)

```bash
# Terminal 1 — Backend (port 3000, auto-reload)
npm run start:server:dev

# Terminal 2 — Frontend (port 4000, proxy → 3000)
npm run start:frontend:dev
```

Puis :
- Joueurs : `http://localhost:4000`
- MJ : `http://localhost:4000/mj`

### Production

```bash
npm run build
npm start
```

Serveur sur `http://0.0.0.0:3000`.

---

## ⚙️ Configuration

Variables d'environnement :

| Variable | Défaut | Description |
|---|---|---|
| `PORT` | `3000` | Port d'écoute |
| `HOST` | `0.0.0.0` | Adresse de bind |
| `DM_PASSWORD` | — | Mot de passe interface MJ (désactivé si vide) |
| `PC_PASSWORD` | — | Mot de passe interface joueurs (désactivé si vide) |
| `PUBLIC_URL` | `""` | URL de base pour reverse proxy |
| `DATA_DIRECTORY` | *défaut OS* | Chemin des données persistantes (maps, DB, tokens) |

---

## 🐳 Docker

```bash
docker build -t navis .
docker run -d \
  --name navis \
  --restart always \
  -p 3000:3000 \
  -v /chemin/vers/data:/usr/src/app/data \
  -e DM_PASSWORD='mon-mot-de-passe' \
  -e PC_PASSWORD='mon-mot-de-passe' \
  navis
```

---

## ☁️ Déploiement (VPS)

Architecture CI/CD :

```
push master → GitHub Actions (build Docker) → Docker Hub → VPS (pull + restart)
```

Guide détaillé : [Hosting](https://github.com/axdevmin/Navis/wiki/Hebergement)

---

## 📦 Commandes principales

| Commande | Description |
|---|---|
| `npm run setup` | Génère le schéma GraphQL + compile Relay |
| `npm run build` | Build frontend + backend |
| `npm start` | Lance le serveur de production |
| `npm test` | Tests Jest |
| `npm run eslint` | Lint |
| `npm run compile` | Compilation standalone (caxa, macOS/Linux) |

---

## 📚 Wiki

Documentation complète : [github.com/axdevmin/Navis.wiki](https://github.com/axdevmin/Navis.wiki)

---

Basé sur [dungeon-revealer](https://github.com/dungeon-revealer/dungeon-revealer) — open source, auto-hébergé.
