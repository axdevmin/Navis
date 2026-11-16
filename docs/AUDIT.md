# Navis — audit design, fonctionnel et technique

_16 novembre 2026 — état de la branche `feature/design-navis`._

## Verdict

Navis fait bien l'essentiel : montrer une carte, gérer le brouillard, poser des tokens, suivre un combat. Les trois freins principaux ne sont pas là où on les attend :

1. **Technique : le déploiement et la sécurité sont le point faible.** Chaque push sur `master` part en production sans test, et un oubli de variable d'environnement donne les droits MJ à tout le monde.
2. **Fonctionnel : rien n'est annulable.** Aucun « annuler » dans toute l'application, alors que le brouillard et les tokens se modifient d'un geste, souvent devant les joueurs.
3. **Design : l'écran principal est cohérent, le reste ne l'est pas encore.** Les fenêtres secondaires gardent leur ancienne structure et le panneau du token repose sur un outil de débogage.

La meilleure amélioration d'usage à portée est une idée simple : **le MJ pilote la vue des joueurs** (cadrage, écran d'attente). Aujourd'hui la TV est passive et personne ne peut la recadrer.

Ce qui suit distingue ce que j'ai **vérifié dans le code** de ce qui est une **hypothèse** à confirmer.

---

## 1. Design

### Ce qui fonctionne

- L'écran MJ a une hiérarchie nette : session en haut, outils à gauche, tout le reste dans le dock.
- Un seul accent (laiton), réservé à l'action principale et à la sélection.
- La palette ⌘K donne un accès clavier à presque tout.

### Ce qui ne va pas

| Constat | Détail | Vérifié |
| --- | --- | --- |
| Le panneau du token est un outil de débogage | Il repose sur `leva`, une bibliothèque de réglages pour développeurs : champs minuscules, pas de regroupement, rendu différent du reste. C'est pourtant le panneau le plus utilisé en préparation. | oui |
| Le suivi de combat domine l'écran | 260 px de large, centré à droite, lignes hautes avec trois icônes chacune. Il masque la carte en permanence pendant un combat. | oui |
| Trois endroits pour les mêmes objets | « Tokens » (dock), « Bibliothèque › Personnages » et le panneau d'ajout du combat montrent tous les personnages, avec trois présentations. | oui |
| Les fenêtres Cartes et Bibliothèque sont d'une autre génération | Gros en-tête, bouton « Fermer » en texte, boutons pleine largeur : elles ont pris les couleurs mais pas le gabarit. | oui |
| Anglais résiduel | Fenêtre d'import (« Preparing import », « Done. », « Failed »), notes de jets de dés (« Dice Roll Notes », « Roll Initiative »), recadrage d'image (« Token Images from this Source »). | oui |
| Accessibilité faible | 8 `aria-label` pour toute l'application ; la plupart des boutons à icône seule n'ont qu'une infobulle. | oui |
| Écrans de connexion et d'attente non revus | Je n'ai pas pu les afficher (pas de mot de passe en local). | non vérifié |
| Identité encore discrète | Graphite et Inter sont propres mais communs. La seule signature de Navis est le « N » du logo. | avis |

### Recommandations design

1. **Remplacer `leva` par un vrai inspecteur de token** : nom et portrait en tête, taille en boutons, visibilité et verrouillage en bascules, le reste replié.
2. **Suivi de combat compact** : une ligne de 32 px par participant, actions au survol, et un mode « bandeau » horizontal en haut de l'écran quand on veut voir toute la carte.
3. **Une seule bibliothèque** avec onglets Cartes / Personnages / Images, ouverte par un seul bouton du dock.
4. **Donner une signature** : un motif de rose des vents en filigrane sur les écrans vides et d'attente, plutôt qu'un changement de couleurs.

---

## 2. Fonctionnel

### Préparer une partie

| Friction | Conséquence |
| --- | --- |
| Pas de notion de « séance » : les cartes sont une liste plate | En jeu, changer de lieu oblige à ouvrir la bibliothèque et à chercher. |
| La grille se règle en quatre champs numériques | Fastidieux ; deux clics sur deux coins d'une case suffiraient. |
| Les notes ont trois entrées (dock, palette, lien depuis un token) et s'ouvrent en fenêtres flottantes | On perd vite où est quoi. |
| Aucun état vide guidé | Sur une instance neuve, on arrive directement dans la bibliothèque de cartes vide. (non vérifié à l'écran) |

### Mener la partie

| Friction | Conséquence |
| --- | --- |
| **Aucun « annuler »** (0 occurrence dans le code) | Un coup de pinceau de trop révèle une salle aux joueurs, sans retour possible. En mode Direct, c'est immédiat. |
| Pas de règle de mesure | Impossible de mesurer une distance ou une zone d'effet, alors que la grille existe. |
| Le combat ne parle pas à la carte | Le tour en cours n'est pas mis en évidence sur le token correspondant ; les points de vie ne sont nulle part. |
| « Arrêter » coupe toute carte | Il n'existe pas d'écran d'attente choisi (image, titre de scène) pour les transitions. |
| Le mode manuel ne couvre que le brouillard | Choix assumé ; à documenter dans l'interface pour éviter la surprise. |

### Côté joueurs

| Friction | Conséquence |
| --- | --- |
| **Le MJ ne contrôle pas le cadrage des joueurs** (aucun champ de vue dans le schéma) | Sur une TV sans souris, la carte reste au cadrage par défaut. C'est le manque le plus gênant du mode « plateau ». |
| Pas de plein écran (0 occurrence) | Il faut passer par le navigateur de la TV. |
| Bouton « Mode MJ » dans la barre des joueurs | Il n'a rien à faire là : il envoie les joueurs vers l'écran de connexion du MJ. |
| Plateau partagé et multijoueur sont mélangés | Déjà noté dans votre feuille de route ; le chat, notamment, n'a pas de sens sur une TV. |
| Inviter un joueur = dicter une adresse | Pas de lien ni de QR code à montrer. |

---

## 3. Technique

### Sécurité et déploiement — à traiter en premier

| Problème | Risque | Vérifié |
| --- | --- | --- |
| **Sans `DM_PASSWORD`, tout visiteur est MJ** (`server/server.ts`, `getRole`) | Une variable oubliée au déploiement ouvre l'instance à tous. Le serveur devrait refuser de démarrer en production sans mot de passe MJ. | oui |
| **Chaque push sur `master` déploie en production**, sans test, lint ni vérification de types | Le bug de build de ce matin serait parti en production tel quel. | oui |
| Une seule image Docker `latest` | Aucun retour arrière possible si un déploiement casse. | oui |
| Aucune limite de tentatives sur le mot de passe, comparaison directe | Un mot de passe court peut être deviné par essais. | oui |
| Mot de passe accepté dans l'URL (`?password=`, `?authorization=`) et stocké en clair dans le navigateur | Il se retrouve dans l'historique et les journaux. | oui |
| Envois de fichiers sans limite de taille ; corps JSON jusqu'à 50 Mo | Un envoi énorme peut remplir le disque du serveur. | oui |
| Chiffrement HTTPS | Le conteneur écoute en clair sur le port 3000 ; je ne sais pas si un proxy HTTPS est devant. | **à vérifier** |
| Aucune sauvegarde des données | Les cartes vivent dans un seul dossier du serveur. Déjà dans votre feuille de route. | oui |

### Performance

| Constat | Détail |
| --- | --- |
| Rendu à la demande | Fait. Fluidité réelle à contrôler sur votre machine et sur la TV. |
| 2,8 Mo de JavaScript | Le joueur télécharge l'éditeur de notes dont seul le MJ a besoin. |
| Fonds d'écran de connexion : 40 Mo de PNG | 1,5 à 2,5 Mo chacun pour une image de fond. En WebP ou JPEG, dix fois moins. |
| Brouillard envoyé en entier à chaque geste | En mode Direct, chaque trait renvoie l'image complète. Délai non mesuré sur une grande carte. |
| Aperçu d'une carte = image originale | La bibliothèque charge la carte en pleine résolution pour un simple aperçu. (constaté à l'écran, pas mesuré) |

### Maintenabilité

| Constat | Détail |
| --- | --- |
| Socle ancien et verrouillé | React 17, react-three-fiber 5, three 0.126, Relay 10, Chakra 1. Chaque mise à jour en entraîne plusieurs autres. |
| Quatre fichiers de plus de 1 000 lignes | `map-view.tsx` (2 600), `dm-map.tsx` (2 260), `select-map-modal.tsx` (1 100), `combat-tracker.tsx` (1 040). |
| Trois systèmes d'interface en parallèle | Chakra, composants maison et `leva`. C'est la cause des incohérences visuelles et d'une partie du poids. |
| Presque aucun test d'interface | 103 tests, tous sur le serveur et trois utilitaires. Rien ne protège l'écran MJ. |
| 35 contournements de types (`as any`, `@ts-ignore`) | Concentrés dans la carte et les outils. |
| Le port 3000 sert un build qui peut être périmé | Corrigé en partie ce matin ; un `npm run dev` qui n'ouvre que le port 4000 éviterait le piège. |
| `src/version.ts` désynchronisé de `package.json` | Le numéro affiché peut être faux. |

---

## 4. Simplifications possibles

| Simplifier | Comment |
| --- | --- |
| Trois accès aux personnages | Une bibliothèque unique à onglets ; le bouton « Tokens » du dock disparaît. |
| Panneau du token | Un inspecteur maison ; `leva` sort du projet (les panneaux du pinceau s'y prêtent aussi). |
| Réglage de la grille | Deux clics sur la carte au lieu de quatre champs. |
| Vue joueur | Retirer « Mode MJ » ; en mode plateau, masquer aussi le chat et la barre. |
| Notes | Un seul panneau latéral ancré, au lieu de fenêtres flottantes. |
| Éditeur de notes | Monaco (74 Mo de dépendance, un éditeur de code) remplacé par un éditeur de texte léger. |
| Lancement en dev | Une seule adresse annoncée au démarrage. |

---

## 5. Nouvelles fonctionnalités

Classées par rapport entre l'utilité en partie et l'effort.

### Fort impact, effort modéré

1. **Annuler / rétablir** (⌘Z) pour le brouillard et les tokens. Pour le brouillard, il suffit de garder les dernières images en mémoire.
2. **Le MJ cadre la vue des joueurs** : « Montrer ceci aux joueurs » envoie le cadrage courant ; option pour verrouiller le zoom de la TV.
3. **Écran d'attente** : une image et un titre choisis à la place de la carte pendant une transition, au lieu d'un simple « Arrêter ».
4. **Séance** : une liste ordonnée de cartes pour la partie du soir, avec « carte suivante » au clavier et dans la palette.
5. **Règle de mesure** : distance en cases entre deux points, et gabarits de zone (cercle, cône, ligne).
6. **Plein écran et lien d'invitation** : bouton plein écran côté joueur, QR code côté MJ.

### Fort impact, effort plus élevé

7. **Combat relié à la carte** : halo sur le token dont c'est le tour, points de vie et états dans le suivi, recentrage automatique de la vue joueur.
8. **Révéler par pièce** : tracer un polygone une fois, puis révéler la salle d'un clic. C'est une première marche vers « portes et murs » de votre feuille de route.
9. **Sauvegarde et restauration** en une archive (déjà prévu chez vous).
10. **Journal de séance** : jets de dés, tours de combat et cartes montrées, exportable après la partie.

### Confort

11. Préréglages d'ambiance (« nuit d'orage », « aube brumeuse ») combinant météo et intensité.
12. Aide des raccourcis (touche `?`).
13. Sons d'ambiance (déjà prévu chez vous).

---

## 6. Ordre proposé

| Étape | Contenu | Pourquoi d'abord |
| --- | --- | --- |
| 1 | Refus de démarrer sans mot de passe MJ en production ; tests et types obligatoires avant déploiement ; images Docker versionnées | Évite l'incident, coûte peu |
| 2 | Annuler / rétablir | Le plus grand gain de sérénité en partie |
| 3 | Le MJ cadre la vue des joueurs, écran d'attente, plein écran | Rend le mode TV vraiment utilisable |
| 4 | Inspecteur de token maison, bibliothèque unique | Supprime les incohérences les plus visibles |
| 5 | Séance et règle de mesure | Fluidifie le déroulé d'une partie |
| 6 | Combat relié à la carte | Plus gros, à faire sur une base propre |

Le serveur (résolveurs GraphQL, stockage des cartes) n'a été lu que sur l'authentification, les envois de fichiers et le brouillard. Un audit de sécurité complet resterait à faire avant d'exposer l'instance au-delà d'un cercle de joueurs de confiance.
