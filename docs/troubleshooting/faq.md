# FAQ (Foire Aux Questions)

## Questions générales

### Qu'est-ce que SharingBot V3 ?

SharingBot V3 est une application SaaS moderne construite avec Next.js 15 et Supabase, offrant un assistant IA conversationnel avec reconnaissance vocale, synthèse vocale, OCR et système de RAG pour interroger vos documents.

### Est-ce gratuit ?

Oui, SharingBot V3 Lite est open source sous licence MIT. Vous pouvez l'utiliser gratuitement pour vos projets personnels ou commerciaux.

### Quelle est la différence avec la version complète ?

La version Lite est une version simplifiée qui inclut les fonctionnalités de base. La [version complète](https://makerkit.dev) ajoute:
- Système de facturation et abonnements
- Gestion d'équipes
- Panel d'administration
- Support prioritaire
- Et bien plus...

## Installation

### Quels sont les prérequis système ?

- Node.js 18.x ou supérieur
- PNPM 10.x ou supérieur
- Docker (pour Supabase local)
- 4GB de RAM minimum
- 10GB d'espace disque

### Puis-je utiliser npm ou yarn au lieu de pnpm ?

Non recommandé. Le projet utilise les workspaces PNPM et certaines fonctionnalités spécifiques à PNPM. Utilisez PNPM pour éviter les problèmes.

### Docker est-il obligatoire ?

Pour le développement local, oui. Docker est nécessaire pour exécuter Supabase localement. En production, vous utiliserez Supabase Cloud.

### L'installation échoue, que faire ?

1. Vérifiez que Docker est démarré
2. Assurez-vous d'avoir les bonnes versions de Node et PNPM
3. Supprimez `node_modules` et réinstallez : `rm -rf node_modules && pnpm install`
4. Consultez la page [Problèmes courants](troubleshooting/common-issues.md)

## Développement

### Comment ajouter une nouvelle page ?

1. Créez un fichier dans `apps/web/app/`
2. Créez un fichier `page.tsx`
3. Exportez votre composant

```tsx
// apps/web/app/ma-page/page.tsx
export default function MaPage() {
  return <div>Ma nouvelle page</div>;
}
```

### Comment ajouter une route API ?

1. Créez un fichier dans `apps/web/app/api/`
2. Exportez les méthodes HTTP

```tsx
// apps/web/app/api/hello/route.ts
export async function GET(request: Request) {
  return Response.json({ message: 'Hello' });
}
```

### Comment utiliser Supabase dans un composant client ?

```typescript
'use client';
import { getSupabaseBrowserClient } from '@kit/supabase/browser-client';

export function MyComponent() {
  const supabase = getSupabaseBrowserClient();
  
  // Utiliser supabase...
}
```

### Comment utiliser Supabase dans un Server Component ?

```typescript
import { getSupabaseServerClient } from '@kit/supabase/server-client';

export default async function ServerPage() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.from('table').select();
  
  return <div>{/* ... */}</div>;
}
```

## Fonctionnalités

### La reconnaissance vocale ne fonctionne pas

- Utilisez Chrome, Edge ou Safari (Firefox non supporté)
- Autorisez l'accès au microphone
- En production, HTTPS est requis

### Comment ajouter d'autres langues ?

1. Ajoutez les fichiers de traduction dans `apps/web/public/locales/`
2. Mettez à jour la config i18n dans `packages/i18n/src/configuration.ts`

### Puis-je changer le modèle d'IA ?

Oui, modifiez la configuration de l'API dans votre route de chat. Vous pouvez utiliser OpenAI, Anthropic, ou tout autre fournisseur compatible.

### Comment fonctionne le système RAG ?

1. Les PDFs sont uploadés vers Supabase Storage
2. Le texte est extrait et découpé en chunks
3. Des embeddings sont générés pour chaque chunk
4. Les embeddings sont stockés dans PostgreSQL avec pgvector
5. Lors d'une question, une recherche de similarité vectorielle trouve les chunks pertinents
6. Les chunks sont ajoutés au contexte de l'IA pour générer la réponse

### L'OCR est-il gratuit ?

Le service OCR de base utilise Tesseract.js qui est gratuit. Pour une meilleure précision, vous pouvez configurer Google Cloud Vision API (payant).

## Base de données

### Comment voir les données de ma base ?

Utilisez Supabase Studio : [http://localhost:54323](http://localhost:54323)

### Comment créer une nouvelle table ?

1. Créez une migration :
   ```bash
   pnpm --filter web supabase migration new ma_table
   ```

2. Éditez le fichier SQL créé

3. Appliquez la migration :
   ```bash
   pnpm run supabase:web:reset
   ```

### Comment ajouter Row Level Security ?

```sql
-- Activer RLS
ALTER TABLE ma_table ENABLE ROW LEVEL SECURITY;

-- Créer une policy
CREATE POLICY "Users can view their own data"
  ON ma_table FOR SELECT
  USING (auth.uid() = user_id);
```

### Puis-je utiliser une autre base de données ?

Le projet est conçu pour Supabase/PostgreSQL. Changer de DB nécessiterait une refonte importante.

## Authentification

### Comment fonctionne l'authentification ?

L'authentification utilise Supabase Auth avec JWT tokens stockés dans des cookies httpOnly sécurisés.

### Puis-je ajouter OAuth (Google, GitHub) ?

Oui, configurez les providers dans Supabase Dashboard puis activez-les dans votre code.

### Comment personnaliser les emails ?

1. En local : Les emails sont dans Inbucket
2. En production : Configurez un fournisseur d'emails dans Supabase (SendGrid, Resend, etc.)

### Comment gérer les rôles et permissions ?

Utilisez Row Level Security dans PostgreSQL. Ajoutez un champ `role` dans la table `users` et créez des policies basées sur ce rôle.

## Déploiement

### Où puis-je déployer l'application ?

- Vercel (recommandé pour Next.js)
- Cloudflare Pages
- AWS Amplify
- Netlify
- Tout hébergeur Node.js

### Comment déployer sur Vercel ?

1. Connectez votre repo GitHub à Vercel
2. Configurez les variables d'environnement
3. Vercel déploiera automatiquement à chaque push

### Quelles variables d'environnement sont nécessaires ?

```env
NEXT_PUBLIC_SITE_URL=https://votre-domaine.com
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

### Comment configurer Supabase en production ?

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Pushez vos migrations : `pnpm --filter web supabase db push`
3. Configurez le callback URL : `https://votre-domaine.com/auth/callback`
4. Copiez les clés dans vos variables d'environnement

## Performance

### L'application est lente

- En dev, c'est normal (HMR, no optimizations)
- En prod : `pnpm run build && pnpm run start`
- Vérifiez votre connexion Supabase
- Activez le caching

### Comment optimiser les images ?

Utilisez le composant `Image` de Next.js :

```tsx
import Image from 'next/image';

<Image 
  src="/photo.jpg"
  alt="Description"
  width={500}
  height={300}
  priority // Pour les images above-the-fold
/>
```

### Comment réduire la taille du bundle ?

1. Utilisez le dynamic import pour le code splitting
2. Analysez le bundle : `ANALYZE=true pnpm run build`
3. Lazy load les composants lourds
4. Utilisez des Server Components quand possible

## Sécurité

### Le projet est-il sécurisé ?

Le projet suit les meilleures pratiques:
- Row Level Security sur toutes les tables
- CSRF protection
- Cookies httpOnly
- TypeScript strict
- Variables d'environnement pour les secrets

### Comment protéger une route ?

```tsx
import { requireAuth } from '@kit/supabase/require-auth';

export default async function ProtectedPage() {
  await requireAuth();
  
  return <div>Contenu protégé</div>;
}
```

### Comment limiter les uploads ?

Configurez dans Supabase Storage :
- Taille max : 50MB par défaut
- Types MIME autorisés
- Quotas par utilisateur

## Support et communauté

### Où obtenir de l'aide ?

1. 📖 [Documentation](https://sharingbotv3.readthedocs.io)
2. 🐛 [GitHub Issues](https://github.com/ouissambenalla988/SharingBotV3/issues)
3. 💬 [Discussions](https://github.com/ouissambenalla988/SharingBotV3/discussions)

### Comment signaler un bug ?

Ouvrez une [issue sur GitHub](https://github.com/ouissambenalla988/SharingBotV3/issues/new) avec:
- Description du bug
- Étapes pour reproduire
- Comportement attendu vs actuel
- Votre environnement (OS, versions)

### Puis-je contribuer ?

Oui ! Consultez notre [guide de contribution](contributing.md).

### Y a-t-il une communauté Discord/Slack ?

Utilisez les [GitHub Discussions](https://github.com/ouissambenalla988/SharingBotV3/discussions) pour discuter avec la communauté.

## Licence

### Puis-je utiliser ce projet commercialement ?

Oui, le projet est sous licence MIT. Vous pouvez l'utiliser, le modifier et le distribuer librement, même dans des projets commerciaux.

### Dois-je créditer les auteurs ?

C'est apprécié mais pas obligatoire selon la licence MIT.

### Puis-je vendre une application basée sur ce code ?

Oui, vous pouvez créer et vendre des applications basées sur ce code.

---

**Vous ne trouvez pas votre réponse ?**

- 📖 Consultez la [documentation complète](https://sharingbotv3.readthedocs.io)
- 💬 Posez votre question dans les [Discussions](https://github.com/ouissambenalla988/SharingBotV3/discussions)
- 🐛 Ouvrez une [Issue](https://github.com/ouissambenalla988/SharingBotV3/issues)
