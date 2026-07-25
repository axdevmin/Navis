# Navis TV

Application Android TV qui affiche le plateau joueurs de Navis sur un
téléviseur ou un projecteur. C'est un WebView plein écran qui charge
`<serveur>/?map_only` : la page est servie par Navis exactement comme dans un
navigateur, donc l'app suit automatiquement les évolutions du front web.

## Construire l'APK

```bash
npm run build:android
```

L'APK est déposé dans `bin/navis-tv-<version>-release.apk`. La version est lue
depuis `package.json`, comme celle de l'app web.

Variante de développement (paquet distinct `com.navis.tv.debug`, installable en
parallèle, WebView inspectable via `chrome://inspect`) :

```bash
npm run build:android:debug
```

Prérequis : le SDK Android et un **JDK 17 à 21** (Gradle refuse les JDK plus
récents). Le script détecte les deux automatiquement ; si le JDK par défaut de
la machine est trop récent :

```bash
NAVIS_ANDROID_JAVA_HOME=/chemin/vers/jdk-21 npm run build:android
```

## Serveur visé

Par défaut l'app pointe sur `https://navis.availl.fr`. L'adresse reste
modifiable sur l'appareil (touche MENU), et peut être changée à la compilation :

```bash
NAVIS_TV_SERVER_URL=http://192.168.1.20:3000 npm run build:android
```

Le mot de passe joueur est saisi une fois sur la TV. Pour une borne totalement
autonome, il peut être embarqué à la compilation — il n'est alors jamais écrit
dans le dépôt :

```bash
NAVIS_TV_PASSWORD='le-mot-de-passe' npm run build:android
```

## Installer sur la TV

Activer le mode développeur et le débogage ADB sur le boîtier, puis :

```bash
adb connect <ip-de-la-tv>:5555
adb install -r bin/navis-tv-2.0.16-release.apk
```

Sans PC : passer l'APK par une app type *Send Files to TV* ou *Downloader*, puis
autoriser les sources inconnues.

L'app apparaît dans le launcher Android TV sous le nom **Navis TV**. Au premier
lancement, l'écran de réglages s'affiche pour saisir le mot de passe ; ensuite
le plateau se charge directement.

## Sur la TV

| Touche | Effet |
| --- | --- |
| MENU | ouvre les réglages (adresse, mot de passe, démarrage auto) |
| OK | force une reconnexion immédiate quand le serveur est injoignable |
| RETOUR | deux appuis pour quitter, afin d'éviter une sortie accidentelle |

L'écran reste allumé tant que l'app est au premier plan, et le plateau
réapparaît seul à l'allumage de l'appareil si l'option est cochée.

## Signature

Sans `keystore.properties`, l'APK de release est signé avec la clé de debug :
il s'installe et fonctionne normalement en sideload, mais n'est pas
distribuable. Pour une vraie clé, copier `keystore.properties.sample` en
`keystore.properties` (ignoré par git) et suivre les instructions qu'il
contient. En CI, renseigner les secrets `ANDROID_KEYSTORE_BASE64`,
`ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` et `ANDROID_KEY_PASSWORD`.

Attention : passer de la clé de debug à une vraie clé impose de désinstaller
l'app de la TV avant de réinstaller.
