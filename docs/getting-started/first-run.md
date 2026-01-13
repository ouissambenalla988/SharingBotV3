# Premier lancement

Ce guide vous accompagne lors de votre première utilisation de SharingBot V3 après l'installation.

## Démarrage de l'application

### 1. Démarrer Supabase

Avant de lancer l'application, assurez-vous que Supabase est démarré:

```bash
pnpm run supabase:web:start
```

!!! tip "Docker Desktop"
    Sur Windows, vérifiez que Docker Desktop est bien démarré avant d'exécuter cette commande.

### 2. Lancer l'application

Dans un nouveau terminal:

```bash
pnpm run dev
```

Vous devriez voir une sortie similaire à:

```
turbo 2.5.8
• Packages in scope: web, @kit/ui, @kit/supabase, ...
• Running dev in 8 packages
• Remote caching disabled

web:dev: ▲ Next.js 15.1.4
web:dev: - Local:        http://localhost:3000
web:dev: - Network:      http://192.168.1.x:3000
web:dev: ✓ Starting...
web:dev: ✓ Ready in 2.5s
```

### 3. Accéder à l'application

Ouvrez votre navigateur et accédez à [http://localhost:3000](http://localhost:3000)

## Création de votre premier compte

### 1. Page d'accueil

Vous arriverez sur la page marketing de SharingBot. Cliquez sur **"Sign Up"** ou **"Get Started"**.

### 2. Inscription

Remplissez le formulaire d'inscription:

- **Email**: Votre adresse email
- **Mot de passe**: Minimum 8 caractères
- **Confirmation**: Retapez votre mot de passe

```
┌─────────────────────────────────┐
│   Sign Up                        │
├─────────────────────────────────┤
│ Email:    [________________]    │
│ Password: [________________]    │
│ Confirm:  [________________]    │
│                                  │
│     [Create Account]             │
└─────────────────────────────────┘
```

### 3. Vérification de l'email (local)

En développement local, les emails sont capturés par Inbucket:

1. Ouvrez [http://localhost:54324](http://localhost:54324)
2. Trouvez l'email de confirmation
3. Cliquez sur le lien de vérification

!!! info "Production"
    En production, Supabase enverra de vrais emails via votre fournisseur d'email configuré.

### 4. Connexion

Après vérification, connectez-vous avec vos identifiants.

## Première utilisation du chat

### 1. Interface du chat

Une fois connecté, vous accédez à l'interface principale du chat:

```
┌────────────────────────────────────────────────────────┐
│  [☰] SharingBot                    [Profile] [Settings] │
├──────────┬─────────────────────────────────────────────┤
│          │                                              │
│ Sidebar  │           Zone de messages                  │
│          │                                              │
│ [+ New]  │  Bot: Hello! I am SharingBot AI assistant.  │
│          │       How can I help you today?             │
│ History  │                                              │
│ ◆ Chat 1 │                                              │
│          │                                              │
│          │                                              │
├──────────┴─────────────────────────────────────────────┤
│ [📎] [🎤] [Type a message...]            [Send ↑]     │
└────────────────────────────────────────────────────────┘
```

### 2. Envoyer votre premier message

Tapez un message dans la zone de texte et appuyez sur **Entrée** ou cliquez sur le bouton d'envoi:

```
User: Bonjour, comment ça va ?
```

Le bot répondra instantanément:

```
Assistant: Bonjour ! Je vais très bien, merci. Comment puis-je vous aider aujourd'hui ?
```

### 3. Tester la reconnaissance vocale

1. Cliquez sur l'icône **microphone** 🎤
2. Autorisez l'accès au microphone si demandé
3. Parlez votre message
4. Le texte apparaîtra automatiquement
5. Cliquez sur "Envoyer"

!!! warning "Navigateurs supportés"
    La reconnaissance vocale nécessite Chrome, Edge ou Safari. Firefox n'est pas supporté.

### 4. Uploader un document

Pour tester le système RAG:

1. Cliquez sur l'icône **trombone** 📎
2. Sélectionnez un fichier PDF
3. Attendez que l'upload soit terminé
4. Posez une question sur le contenu du document

Exemple:
```
User: [document.pdf uploaded] Résume ce document
Assistant: D'accord, voici un résumé du document...
```

### 5. Tester l'OCR

Pour extraire du texte d'une image:

1. Uploadez une image (PNG, JPG)
2. Cliquez sur le bouton **"Run OCR"**
3. Le texte extrait sera affiché
4. Vous pouvez ensuite poser des questions sur ce texte

## Gestion des conversations

### Créer une nouvelle conversation

Cliquez sur le bouton **"+ Nouvelle conversation"** dans la sidebar.

Une nouvelle conversation vide sera créée avec un message de bienvenue.

### Naviguer entre les conversations

Cliquez sur une conversation dans la sidebar pour la charger.

Les conversations sont organisées par date:
- **Aujourd'hui**
- **Hier**
- **Cette semaine**
- **Ce mois-ci**
- **Plus ancien**

### Supprimer une conversation

1. Survolez une conversation dans la sidebar
2. Cliquez sur l'icône **poubelle** 🗑️
3. Confirmez la suppression

!!! danger "Suppression permanente"
    La suppression d'une conversation est **irréversible**. Tous les messages seront perdus.

## Explorer les fonctionnalités

### Synthèse vocale (TTS)

Cliquez sur l'icône **haut-parleur** 🔊 à côté d'un message de l'assistant pour l'entendre à voix haute.

### Mode sombre

Changez le thème en cliquant sur l'icône de thème dans l'en-tête:
- ☀️ Mode clair
- 🌙 Mode sombre
- 💻 Suivre le système

### Paramètres du profil

1. Cliquez sur votre **avatar** en haut à droite
2. Sélectionnez **"Settings"**
3. Modifiez vos informations:
   - Nom d'affichage
   - Photo de profil
   - Préférences

## Accès aux outils de développement

### Supabase Studio

Gérez votre base de données: [http://localhost:54323](http://localhost:54323)

Fonctionnalités:
- **Table Editor**: Visualiser et éditer les données
- **SQL Editor**: Exécuter des requêtes SQL
- **Authentication**: Gérer les utilisateurs
- **Storage**: Gérer les fichiers
- **Database**: Voir le schéma

### Inbucket (Emails locaux)

Consultez les emails: [http://localhost:54324](http://localhost:54324)

### API Documentation

Les endpoints de l'API sont documentés dans la section [API](../api/overview.md).

## Données de test

### Charger des données de démonstration

Si vous voulez des données de test:

```bash
# Réinitialiser la DB avec les seed data
pnpm run supabase:web:reset
```

Cela créera:
- Des utilisateurs de test
- Des conversations d'exemple
- Des documents de démonstration

### Documents globaux

Quelques PDFs sont disponibles globalement pour tous les utilisateurs. Ils sont marqués avec `is_global = true` dans la base de données.

## Performances et optimisation

### Mode développement

En mode développement (`pnpm run dev`):
- ✅ Hot Module Replacement (HMR)
- ✅ Fast Refresh de React
- ✅ Source maps
- ✅ Logs détaillés

### Mode production local

Pour tester les performances de production:

```bash
# Build de production
pnpm run build

# Lancer en mode production
pnpm run start
```

L'application sera optimisée:
- ⚡ Bundles minimisés
- 📦 Code splitting
- 🗜️ Compression
- 🚀 Optimisation des images

## Résolution de problèmes courants

### Le chat ne répond pas

1. Vérifiez la console du navigateur (F12)
2. Vérifiez que l'API route est correcte
3. Assurez-vous que Supabase est démarré

### L'upload de fichiers échoue

1. Vérifiez que le bucket `documents` existe dans Supabase Storage
2. Vérifiez les permissions RLS
3. Vérifiez la taille du fichier (limite: 50MB)

### La reconnaissance vocale ne fonctionne pas

1. Utilisez Chrome, Edge ou Safari
2. Autorisez l'accès au microphone
3. Vérifiez que vous êtes en HTTPS ou localhost

### Les conversations ne sont pas sauvegardées

1. Vérifiez que vous êtes connecté
2. Vérifiez la console pour les erreurs Supabase
3. Vérifiez que les tables existent dans la DB

## Prochaines étapes

Maintenant que vous maîtrisez les bases:

- 🏗️ [Découvrez l'architecture](../architecture/overview.md)
- ✨ [Explorez toutes les fonctionnalités](../features/chat-system.md)
- 💻 [Apprenez à développer](../guides/add-feature.md)
- 🚀 [Préparez le déploiement](../guides/deployment.md)

!!! success "Félicitations !"
    Vous avez terminé le guide de premier lancement. Amusez-vous bien avec SharingBot V3 ! 🎉
