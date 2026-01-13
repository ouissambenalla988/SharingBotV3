# 🎯 Système de Chat avec Historique et RAG

## ✅ Ce qui a été créé

### 📁 Structure des fichiers

```
apps/web/app/
├── types/
│   └── database.types.ts          # Types TypeScript pour Supabase
├── lib/
│   └── supabase/
│       ├── conversations.ts       # CRUD conversations et messages
│       └── documents.ts           # Gestion des documents PDF
├── home/
│   ├── _components/
│   │   ├── ConversationSidebar.tsx  # Sidebar avec historique
│   │   ├── ChatWithHistory.tsx      # Wrapper avec persistance
│   │   └── dashBoard-chat.tsx       # Chat existant (à modifier)
│   ├── hooks/
│   │   └── useConversationPersistence.ts  # Hook pour persistance
│   └── page.tsx                   # Page principale (modifiée)
└── INTEGRATION_GUIDE.md          # Guide d'intégration détaillé
```

---

## 🗄️ Base de données Supabase

### Tables créées

1. **conversations**
   - Stocke les conversations par utilisateur
   - Champs : `id`, `user_id`, `title`, `created_at`, `updated_at`

2. **messages**
   - Stocke les messages de chaque conversation
   - Champs : `id`, `conversation_id`, `role`, `content`, `created_at`

3. **documents**
   - Stocke les métadonnées des PDFs
   - Champs : `id`, `user_id`, `filename`, `file_path`, `file_size`, `is_global`, `processed`, `uploaded_at`

4. **document_embeddings**
   - Stocke les embeddings vectoriels des documents
   - Champs : `id`, `document_id`, `content`, `embedding`, `metadata`, `created_at`

### Storage Bucket

- **documents** : Stockage des fichiers PDF uploadés

---

## 🔧 Fonctionnalités implémentées

### ✅ Historique des conversations

- **Sidebar** avec liste des conversations
- Bouton "Nouvelle conversation"
- Sélection de conversation active
- Suppression avec confirmation
- Format des dates (Aujourd'hui, Hier, etc.)

### ✅ Persistance Supabase

- Sauvegarde automatique des messages (user + assistant)
- Chargement de l'historique au changement de conversation
- Hook `useConversationPersistence` pour gérer la persistance

### ✅ Gestion des documents

- Upload de PDF vers Supabase Storage
- Stockage des métadonnées dans la base
- Documents globaux (is_global = true) accessibles à tous
- Documents utilisateur (is_global = false) privés

### ⚠️ À compléter

- **Intégration dans dashBoard-chat.tsx** : Suivre le guide d'intégration
- **Génération des embeddings** : Worker pour traiter les PDFs
- **RAG avec documents Supabase** : Modifier l'API pour utiliser les documents stockés

---

## 📝 Comment utiliser

### 1. Pour l'utilisateur

1. Ouvrir l'application
2. Se connecter
3. Une conversation est créée automatiquement
4. Cliquer sur "Nouvelle conversation" pour créer d'autres conversations
5. Cliquer sur une conversation dans la sidebar pour la charger
6. Tous les messages sont sauvegardés automatiquement

### 2. Pour le développeur

#### Utiliser le composant

```typescript
import { ChatWithHistory } from './_components/ChatWithHistory';

export default function HomePage() {
  return <ChatWithHistory />;
}
```

#### Utiliser le hook de persistance

```typescript
import { useConversationPersistence } from '../hooks/useConversationPersistence';

const { storedMessages, saveMessage, loadMessages } = useConversationPersistence({
  conversationId: 'uuid-here',
  enabled: true,
});

// Sauvegarder un message
await saveMessage('user', 'Hello!');

// Recharger les messages
await loadMessages();
```

#### Gérer les documents

```typescript
import { uploadDocument, getAllAccessibleDocuments } from '../lib/supabase/documents';

// Upload un PDF
const doc = await uploadDocument(file, userId, false);

// Récupérer tous les documents accessibles
const docs = await getAllAccessibleDocuments(userId);
```

---

## 🚀 Prochaines étapes

### 1. Compléter l'intégration (Urgent)

Suivre le fichier `INTEGRATION_GUIDE.md` pour :
- Ajouter la persistance dans `dashBoard-chat.tsx`
- Intégrer l'upload PDF avec Supabase Storage
- Adapter l'appel RAG

### 2. Créer le worker d'embeddings

```typescript
// app/api/process-document/route.ts
export async function POST(request: Request) {
  const { documentId } = await request.json();
  
  // 1. Récupérer le document
  // 2. Extraire le texte du PDF
  // 3. Découper en chunks
  // 4. Générer les embeddings (OpenAI)
  // 5. Stocker dans document_embeddings
  // 6. Marquer comme processed
}
```

### 3. Modifier l'API RAG

L'API FastAPI doit :
- Accepter des `document_ids` au lieu de fichiers
- Récupérer les PDFs depuis Supabase Storage
- Utiliser la fonction SQL `match_documents()` pour la recherche sémantique
- Filtrer par `user_id` + documents globaux

### 4. Améliorer l'UX

- [ ] Édition inline du titre de conversation
- [ ] Recherche dans les conversations
- [ ] Export de conversations
- [ ] Partage de conversations
- [ ] Pagination pour les conversations
- [ ] Affichage des sources RAG dans les messages

---

## 🔒 Sécurité

### Row Level Security (RLS) activée

- Les utilisateurs ne peuvent voir que leurs propres conversations
- Les utilisateurs ne peuvent voir que leurs PDFs + PDFs globaux
- Les messages sont protégés par la relation avec conversations

### Bonnes pratiques

- Utiliser `auth.uid()` pour filtrer les données
- Ne jamais exposer le `service_role_key` côté client
- Valider toutes les entrées utilisateur
- Limiter la taille des fichiers uploadés

---

## 🐛 Dépannage

### Erreur : "conversationId is null"
- Vérifier que l'utilisateur est connecté
- Vérifier qu'une conversation est créée au montage

### Erreur : "RLS policy violation"
- Vérifier que les policies RLS sont bien créées
- Vérifier que `auth.uid()` retourne un ID valide

### Les messages ne se sauvegardent pas
- Vérifier les logs dans la console
- Vérifier que `conversationId` est défini
- Vérifier la fonction `saveMessage` dans le hook

---

## 📚 Ressources

- [Guide d'intégration](./INTEGRATION_GUIDE.md)
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Next.js](https://nextjs.org/docs)
- [Scripts SQL](./supabase/migrations/)

---

## ✅ Checklist de déploiement

- [ ] Créer les tables dans Supabase Production
- [ ] Activer RLS sur toutes les tables
- [ ] Créer le bucket `documents` dans Storage
- [ ] Configurer les variables d'environnement
- [ ] Tester le flux complet en staging
- [ ] Implémenter le worker d'embeddings
- [ ] Modifier l'API RAG pour Supabase
- [ ] Tester la charge (performance)
- [ ] Déployer en production

---

**Status actuel** : ✅ Infrastructure créée, ⚠️ Intégration à compléter

Pour continuer, suivez le guide dans `INTEGRATION_GUIDE.md` 🚀
