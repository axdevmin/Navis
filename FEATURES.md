# Navis — Roadmap

> Dernière mise à jour : 2026-07-24

---

## ✅ Fait

- **Combat au tour par tour** — le MJ prépare le combat (liste pré-remplie depuis les tokens de la carte + drag & drop depuis la bibliothèque + ajout manuel), tirage d'initiative 1-20 avec retirage des ex-aequo, tracker rétractable transparent partagé MJ/joueurs (surbrillance du tour en cours, compteur de round, navigation tour suivant/précédent au clavier ← →, scroll si beaucoup de participants, drag & drop ou ajout au clic pour réordonner/ajouter en cours de combat), sync DM→joueurs via GraphQL live. Chat masqué par défaut (togglable).
- **Bibliothèque de personnages** — personnages persistés en base (nom, camp, couleur, portrait via le système de token image existant), créés/supprimés depuis la modale "Bibliothèque" (ex-Médias, désormais à onglets Personnages/Images), réutilisables par drag & drop sur la carte ou dans le combat (actif ou en préparation), ou en un clic "Ajouter sur la carte" / "Depuis la bibliothèque". Un token déjà placé peut aussi être enregistré comme personnage ("💾 Enregistrer comme personnage" dans ses propriétés). Bouton "Bibliothèque" (ex-Médias) et "Cartes" (ex-Bibliothèque) renommés en conséquence. Renommage inline des participants de combat au clic.
- **Fix : clic droit sur un token → "Afficher les propriétés"** — le clic droit ouvrait le menu contextuel sans sélectionner le token, rendant l'action invisible ; corrigé (sélection automatique au clic droit, comme au clic gauche).
- **Fix : icônes de tokens noires sur la carte** — les 24 SVG de la bibliothèque de tokens n'avaient pas d'attributs `width`/`height` (seulement `viewBox`), ce qui faisait échouer leur rendu en texture Three.js (rendu noir). Ajout de `width="512" height="512"` sur chaque SVG.
- **Météo** — pluie, orage, neige, soleil. Intensité + angle vent. Sync DM→joueurs via GraphQL live.
- **Brouillard de guerre organique** — shader GLSL avec FBM + domain warping. Vue DM et joueurs séparées.
- **UI transparente unifiée** — glassmorphism (backdrop-filter blur) sur tous les toolbars DM et joueur, boutons chat. Prop `transparent` dans `Toolbar`. Badge version masqué côté joueur.
- **Toolbar joueur rétractable** — chevron indicateur, clic sur logo, drag & drop.
- **Simplification UI joueur** — suppression Notes et Recherche (DM uniquement). Recherche masquée côté joueur via `useViewerRole()`.
- **Sécurité** — express, socket.io, vite 8, Node 20 LTS. Vulnérabilités : 47 → 13 (−72%).

---

## 📋 Todo

### Haute priorité

- [ ] **Effets de zone** — feu, explosion, foudre, eau (Three.js, persistants DB, mutations `mapEffectAdd/Remove`)
- [ ] **Sceau magique au sol** — rune / cercle magique persistant sur la carte, dessiné par le DM, couleur + intensité configurable, rendu Three.js (ShaderMaterial ou sprite animé)
- [ ] **Zones météo exclues** — le DM délimite des polygones/rectangles sur la carte où la météo ne s'applique pas (intérieur, sous un toit) ; les particules pluie/neige sont clippées hors de ces zones
- [ ] **Éclairage dynamique** — sources lumineuses DM, halo animé, radius + couleur, impact tokens
- [ ] **Portes & Murs** — entités sur carte, état ouvert/fermé, bloquant la vision
- [ ] **Docker Compose** — `docker-compose.yml` + `.env.example`, déploiement one-liner
- [ ] **CI pipeline** — GitHub Actions : lint + tests + build Docker sur chaque PR

### Moyenne priorité

- [ ] **Tokens enrichis** — portrait, classe, barre de vie configurable par le DM
- [ ] **État mort** — token grisé + icône, reste visible, filtrable
- [ ] **Dialogue bubbles** — bulle texte au-dessus d'un token, durée configurable
- [ ] **Ping amélioré** — curseur animé avec nom du joueur (ping basique dans `dm-map.tsx`)

### Basse priorité

- [ ] **Sons d'ambiance** — bibliothèque de sons intégrés (taverne, forêt, grotte…), sélection par scène, lecture en boucle avec volume réglable, possibilité d'ajouter des fichiers audio personnalisés (upload DM)
- [ ] **Indicateurs sonores** — icône source sonore sur la carte (ambiance, musique de zone)
- [ ] **Hosting docs** — guide déploiement VPS / Fly.io / Railway
- [ ] **GitHub Kanban** — issues + project board

---

## 🔒 Dettes techniques

| Problème                          | Impact     | Notes                                           |
| --------------------------------- | ---------- | ----------------------------------------------- |
| `immutable@3` (relay-compiler@10) | Build only | Bloqué — nécessite migration relay complète     |
| `relay-compiler@10` → v13+        | Build only | Migration majeure (TypeScript natif, types)     |
| React 17 → 18                     | Perf       | Breaking: react-three-fiber v5→v8, Chakra v1→v3 |
| Three.js 0.126 → 0.184            | Perf + API | 58 versions, nombreuses API dépréciées          |
| `react-showdown` MODERATE         | Dev only   | Aucun fix upstream                              |

**Vulnérabilités restantes : 13** — HIGH×2 (immutable@3, dev uniquement) · MODERATE×2 (showdown ReDoS) · LOW×9 (jest@27, morgan)

---

## 🏗 Architecture

- **Relay + GraphQL** live queries via `invalidateResourcesRT()`
- **react-three-fiber v5** — Canvas isolé, `ContextBridge`
- **Three.js 0.126** — `DynamicDrawUsage` + particle systems
- **GLSL** — fog avec `noise2D` + fbm + domain warping
- **SQLite3 6** + 4 migrations versionnées (`server/migrations/`)
- **patch-package** — patches engine.io, react-spring/three, relay-compiler, use-sound

```bash
npm install
npm run setup                 # write-schema + relay-compiler
npm run start:server:dev      # port 3000
npm run start:frontend:dev    # port 4000
npm run build
```
