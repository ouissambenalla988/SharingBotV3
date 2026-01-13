# Configuration

Ce guide détaille toutes les options de configuration disponibles pour personnaliser SharingBot V3.

## Variables d'environnement

### Configuration de l'application

Créez un fichier `.env.local` dans `apps/web/`:

```env
# ==========================================
# CONFIGURATION DE L'APPLICATION
# ==========================================

# URL de base de l'application
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Nom du produit affiché dans l'interface
NEXT_PUBLIC_PRODUCT_NAME=SharingBot

# Titre du site (SEO)
NEXT_PUBLIC_SITE_TITLE=SharingBot - Assistant IA Intelligent

# Description du site (SEO)
NEXT_PUBLIC_SITE_DESCRIPTION=Un assistant IA intelligent avec reconnaissance vocale et RAG

# ==========================================
# CONFIGURATION SUPABASE
# ==========================================

# URL de l'API Supabase
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321

# Clé publique anonyme
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Clé de service (BACKEND SEULEMENT - Ne jamais exposer au frontend)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ==========================================
# CONFIGURATION DU THÈME
# ==========================================

# Mode de thème par défaut: 'light' | 'dark' | 'system'
NEXT_PUBLIC_DEFAULT_THEME_MODE=light

# Couleur principale en mode clair
NEXT_PUBLIC_THEME_COLOR=#ffffff

# Couleur principale en mode sombre
NEXT_PUBLIC_THEME_COLOR_DARK=#0a0a0a

# ==========================================
# CONFIGURATION DES FONCTIONNALITÉS
# ==========================================

# Activer la reconnaissance vocale
NEXT_PUBLIC_ENABLE_SPEECH_RECOGNITION=true

# Activer la synthèse vocale
NEXT_PUBLIC_ENABLE_TTS=true

# Activer l'OCR
NEXT_PUBLIC_ENABLE_OCR=true

# ==========================================
# CONFIGURATION DES APIs EXTERNES
# ==========================================

# Google Cloud Vision API (pour OCR avancé)
GOOGLE_CLOUD_VISION_API_KEY=your-api-key

# Hugging Face API (pour le modèle de langage)
HUGGINGFACE_API_KEY=your-api-key

# ==========================================
# CONFIGURATION DE SÉCURITÉ
# ==========================================

# Secret CSRF
CSRF_SECRET=your-csrf-secret

# Turnstile (Cloudflare CAPTCHA) - Optionnel
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-site-key
TURNSTILE_SECRET_KEY=your-secret-key

# ==========================================
# CONFIGURATION DE LOGGING
# ==========================================

# Niveau de log: 'debug' | 'info' | 'warn' | 'error'
LOGGER=info

# ==========================================
# CONFIGURATION DE PRODUCTION
# ==========================================

# Node environment
NODE_ENV=development

# Analyser le bundle (optionnel)
ANALYZE=false
```

## Configuration de Supabase

### 1. Configuration locale

Le fichier `apps/web/supabase/config.toml` contient la configuration de Supabase local:

```toml
[api]
port = 54321
schemas = ["public", "storage", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322
shadow_port = 54320
major_version = 15

[studio]
enabled = true
port = 54323
api_url = "http://localhost"

[inbucket]
enabled = true
port = 54324
smtp_port = 54325
pop3_port = 54326

[storage]
enabled = true
file_size_limit = "50MiB"

[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000"]
jwt_expiry = 3600
enable_signup = true

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false
```

### 2. Configuration de production

Pour déployer en production, créez un projet Supabase et configurez:

```env
# Production Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
```

!!! danger "Sécurité"
    Ne commitez JAMAIS vos clés de production dans Git. Utilisez des variables d'environnement ou des services de gestion de secrets.

## Configuration de la base de données

### Schéma de la base de données

Le schéma est défini dans `apps/web/supabase/migrations/`:

```sql
-- Tables principales
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Nouvelle conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  is_global BOOLEAN NOT NULL DEFAULT false,
  processed BOOLEAN NOT NULL DEFAULT false,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Migrations

Pour créer une nouvelle migration:

```bash
pnpm --filter web supabase migration new nom_de_la_migration
```

Pour appliquer les migrations:

```bash
# Local
pnpm run supabase:web:reset

# Production
pnpm --filter web supabase db push
```

## Configuration de l'interface

### Thème et couleurs

Personnalisez le thème dans `apps/web/styles/theme.css`:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    /* ... autres variables */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... autres variables */
  }
}
```

### Composants Shadcn UI

Configuration dans `apps/web/components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "~/components",
    "utils": "~/lib/utils"
  }
}
```

## Configuration i18n

### Langues disponibles

Configurez les langues dans `packages/i18n/src/configuration.ts`:

```typescript
export const i18nConfig = {
  defaultLocale: 'fr',
  locales: ['fr', 'en', 'es', 'de'],
  fallbackLocale: 'en',
  localeDetection: true,
};
```

### Traductions

Ajoutez vos traductions dans `apps/web/public/locales/`:

```
public/locales/
├── fr/
│   ├── common.json
│   ├── auth.json
│   └── chat.json
├── en/
│   ├── common.json
│   ├── auth.json
│   └── chat.json
```

Exemple de fichier de traduction:

```json
{
  "chat": {
    "placeholder": "Tapez votre message...",
    "send": "Envoyer",
    "newConversation": "Nouvelle conversation",
    "deleteConfirm": "Êtes-vous sûr de vouloir supprimer cette conversation ?"
  }
}
```

## Configuration Turborepo

### Configuration globale

Le fichier `turbo.json` à la racine configure Turborepo:

```json
{
  "$schema": "https://turborepo.org/schema.json",
  "globalDependencies": ["**/.env"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "persistent": true,
      "cache": false
    },
    "lint": {
      "dependsOn": ["^topo"]
    }
  }
}
```

### Workspaces

Configuration dans `pnpm-workspace.yaml`:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'tooling/*'
```

## Configuration TypeScript

### Configuration de base

Le `tsconfig.json` racine:

```json
{
  "compilerOptions": {
    "target": "es2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Path aliases

Configuration dans `apps/web/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "paths": {
      "~/*": ["./*"],
      "@/*": ["./*"]
    }
  }
}
```

## Configuration ESLint

Configuration dans `apps/web/eslint.config.mjs`:

```javascript
import baseConfig from '@kit/eslint-config/apps';

export default [
  ...baseConfig,
  {
    rules: {
      // Vos règles personnalisées
    }
  }
];
```

## Configuration Prettier

Configuration dans `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "arrowParens": "always"
}
```

## Prochaines étapes

- 📖 [Premier lancement](first-run.md)
- 🏗️ [Architecture du projet](../architecture/overview.md)
- 🔧 [Référence complète des variables](../reference/environment-variables.md)

!!! tip "Configuration avancée"
    Pour des configurations plus avancées, consultez la documentation de chaque outil:
    - [Next.js Configuration](https://nextjs.org/docs/app/api-reference/next-config-js)
    - [Supabase CLI](https://supabase.com/docs/guides/cli)
    - [Turborepo](https://turbo.build/repo/docs)
