# Installation

Ce guide vous accompagne dans l'installation complète de SharingBot V3 sur votre machine de développement.

## Prérequis

Avant de commencer, assurez-vous d'avoir installé les outils suivants:

### Outils requis

| Outil | Version minimale | Description |
|-------|-----------------|-------------|
| **Node.js** | 18.x ou supérieur | Runtime JavaScript |
| **PNPM** | 10.x ou supérieur | Gestionnaire de packages |
| **Docker** | 20.x ou supérieur | Pour exécuter Supabase localement |
| **Git** | 2.x ou supérieur | Contrôle de version |

### Vérification des versions

```bash
# Vérifier Node.js
node --version
# Devrait afficher: v18.x.x ou supérieur

# Vérifier PNPM
pnpm --version
# Devrait afficher: 10.x.x ou supérieur

# Vérifier Docker
docker --version
# Devrait afficher: Docker version 20.x.x ou supérieur

# Vérifier Git
git --version
# Devrait afficher: git version 2.x.x ou supérieur
```

### Installation des prérequis

=== "Windows"

    ```powershell
    # Installer Node.js via winget
    winget install OpenJS.NodeJS.LTS

    # Installer PNPM
    npm install -g pnpm

    # Installer Docker Desktop
    winget install Docker.DockerDesktop

    # Redémarrer votre terminal après l'installation
    ```

=== "macOS"

    ```bash
    # Installer Homebrew si nécessaire
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Installer Node.js
    brew install node@18

    # Installer PNPM
    npm install -g pnpm

    # Installer Docker
    brew install --cask docker
    ```

=== "Linux (Ubuntu/Debian)"

    ```bash
    # Installer Node.js
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs

    # Installer PNPM
    npm install -g pnpm

    # Installer Docker
    sudo apt-get update
    sudo apt-get install docker.io docker-compose
    sudo systemctl start docker
    sudo systemctl enable docker
    ```

## Installation du projet

### 1. Cloner le repository

```bash
# Cloner via HTTPS
git clone https://github.com/ouissambenalla988/SharingBotV3.git

# Ou via SSH
git clone git@github.com:ouissambenalla988/SharingBotV3.git

# Naviguer dans le répertoire
cd SharingBotV3
```

### 2. Installer les dépendances

```bash
# Installer toutes les dépendances du monorepo
pnpm install
```

Cette commande va:
- Installer les dépendances de tous les packages
- Configurer les workspaces Turborepo
- Générer les types TypeScript
- Exécuter les scripts de post-installation

!!! info "Durée d'installation"
    L'installation peut prendre 2-5 minutes selon votre connexion internet et votre machine.

### 3. Configuration de l'environnement

Créez un fichier `.env.local` dans le répertoire `apps/web/`:

```bash
cd apps/web
cp .env.example .env.local
```

Éditez le fichier `.env.local` avec vos valeurs:

```env
# Application
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_PRODUCT_NAME=SharingBot
NEXT_PUBLIC_SITE_TITLE=SharingBot - Assistant IA Intelligent

# Supabase (les clés locales sont fournies après le démarrage)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Thème
NEXT_PUBLIC_DEFAULT_THEME_MODE=light
NEXT_PUBLIC_THEME_COLOR=#ffffff
NEXT_PUBLIC_THEME_COLOR_DARK=#0a0a0a
```

!!! warning "Clés Supabase"
    Les clés Supabase seront générées lors du premier démarrage de Supabase. Vous les mettrez à jour après l'étape suivante.

### 4. Démarrer Supabase

```bash
# Depuis la racine du projet
pnpm run supabase:web:start
```

Cette commande va:
- Démarrer les containers Docker pour Supabase
- Créer la base de données locale
- Appliquer les migrations
- Générer les types TypeScript

Vous verrez une sortie similaire à:

```
Started supabase local development setup.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: your-jwt-secret
        anon key: your-anon-key
service_role key: your-service-role-key
```

!!! success "Clés Supabase"
    Copiez les clés `anon key` et `service_role key` et mettez à jour votre fichier `.env.local`.

### 5. Configuration de la base de données

Accédez au Supabase Studio: [http://localhost:54323](http://localhost:54323)

Exécutez le script SQL de configuration:

```sql
-- Le fichier est disponible dans apps/web/supabase/setup-storage-and-tables.sql
-- Copiez et exécutez-le dans le SQL Editor
```

Ou utilisez la CLI:

```bash
pnpm --filter web supabase db reset
```

### 6. Lancer l'application

```bash
# Depuis la racine du projet
pnpm run dev
```

L'application sera disponible sur:
- 🌐 Application web: [http://localhost:3000](http://localhost:3000)
- 🎨 Supabase Studio: [http://localhost:54323](http://localhost:54323)

## Vérification de l'installation

### Tests de base

1. **Accéder à l'application**: Ouvrez [http://localhost:3000](http://localhost:3000)
2. **Créer un compte**: Cliquez sur "Sign Up" et créez un compte
3. **Vérifier l'email**: Vérifiez Inbucket sur [http://localhost:54324](http://localhost:54324)
4. **Se connecter**: Connectez-vous avec vos identifiants
5. **Tester le chat**: Envoyez un message au chatbot

### Commandes de vérification

```bash
# Vérifier le linting
pnpm run lint

# Vérifier le formatage
pnpm run format

# Vérifier les types TypeScript
pnpm run typecheck

# Lancer les tests
pnpm run test
```

## Commandes utiles

```bash
# Démarrer l'application en développement
pnpm run dev

# Build de production
pnpm run build

# Démarrer en production
pnpm run start

# Arrêter Supabase
pnpm run supabase:web:stop

# Réinitialiser la base de données
pnpm run supabase:web:reset

# Générer les types TypeScript depuis Supabase
pnpm run supabase:web:typegen
```

## Problèmes courants

### Docker n'est pas démarré

```bash
# Windows: Démarrer Docker Desktop
# Linux:
sudo systemctl start docker

# Vérifier que Docker fonctionne
docker ps
```

### Port déjà utilisé

```bash
# Trouver le processus utilisant le port 3000
# Windows:
netstat -ano | findstr :3000

# macOS/Linux:
lsof -i :3000

# Tuer le processus ou changer le port
PORT=3001 pnpm run dev
```

### Erreur de permissions PNPM

```bash
# Windows (en tant qu'administrateur):
npm install -g pnpm --force

# macOS/Linux:
sudo npm install -g pnpm
```

## Prochaines étapes

Maintenant que votre environnement est configuré:

1. 📖 Consultez le [guide de configuration](configuration.md)
2. 🚀 Lisez le guide du [premier lancement](first-run.md)
3. 🏗️ Explorez l'[architecture du projet](../architecture/overview.md)
4. ✨ Découvrez les [fonctionnalités](../features/chat-system.md)

!!! tip "Besoin d'aide?"
    Si vous rencontrez des problèmes, consultez notre [section dépannage](../troubleshooting/common-issues.md) ou ouvrez une [issue sur GitHub](https://github.com/ouissambenalla988/SharingBotV3/issues).
