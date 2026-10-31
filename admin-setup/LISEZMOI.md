# Espace adhérent·es Roulettes : mise en service

Le site reste public. L'espace `espace.html` ajoute la connexion Google, les fiches riders, les paiements et l'admin. Les données sont dans Firebase (gratuit à l'échelle du club).

## 1. Firebase (10 min)

1. https://console.firebase.google.com → **Ajouter un projet** « roulettes » (Google Analytics inutile).
2. **Authentication** → Commencer → **Google** → Activer.
3. Authentication → Paramètres → **Domaines autorisés** → ajouter `roulettes.club`.
4. **Firestore Database** → Créer → mode **production** → région **europe-west** (Europe).
5. Firestore → **Règles** → remplacer tout par le contenu de `firestore.rules` → Publier.
6. Firestore → **Données** → Démarrer une collection `admins` → ID du document = ton adresse Gmail **en minuscules** → aucun champ → Enregistrer. (Les autres admins s'ajoutent ensuite depuis l'espace, onglet Réglages.)
7. ⚙️ Paramètres du projet → **Vos applications** → icône Web `</>` → nom « site » → copier le bloc `firebaseConfig` et le coller dans `firebase-config.js` :

```js
window.RL_FB={config:{apiKey:"…",authDomain:"…",projectId:"…",storageBucket:"…",messagingSenderId:"…",appId:"…"}};
```

Ces valeurs ne sont pas secrètes : la sécurité vient des règles de l'étape 5.

## 2. Relances depuis contact@roulettes.club

1. OVH → Emails → créer la boîte `contact@roulettes.club`.
2. Gmail → Paramètres → Comptes et importation → **Envoyer des e-mails en tant que** → `contact@roulettes.club`, serveur `ssl0.ovh.net`, port 465, SSL, identifiants de la boîte OVH → valider le code reçu.
3. https://script.google.com → Nouveau projet → coller `relances-apps-script.gs`.
4. Paramètres du projet → Propriétés du script → `KEY` = une longue phrase secrète.
5. Déployer → Nouveau déploiement → **Application Web** → exécuter en tant que **moi**, accès **tout le monde** → autoriser → copier l'URL `…/exec`.
6. Site → Mon espace → **Réglages** → coller l'URL et la même clé secrète.

## 3. Premiers pas dans l'admin

- **Réglages** : saison, tarifs (390 / 450 / 490 €, adhésion 20 €), prix du t-shirt et de la planche, texte « comment payer », solde de départ du compte.
- **Adhérent·es** : créer les familles (ou importer un CSV) avec les adresses Gmail des parents. C'est cette adresse qui ouvre l'accès à l'espace.
- **Prof** : créer la prof avec son tarif par cours, générer les cours de la période.
- **Banque** : exporter le relevé en CSV depuis le site de la banque et l'importer. Les virements des familles et la facture de la prof se rapprochent en un clic.
