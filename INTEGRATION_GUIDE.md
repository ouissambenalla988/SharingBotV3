# 📝 Guide d'intégration - Persistance Supabase

## ✅ Fichiers créés

1. **Types** : `app/types/database.types.ts`
2. **Utilitaires Supabase** :
   - `app/lib/supabase/conversations.ts`
   - `app/lib/supabase/documents.ts`
3. **Composants** :
   - `app/home/_components/ConversationSidebar.tsx`
   - `app/home/_components/ChatWithHistory.tsx`
4. **Hook** : `app/home/hooks/useConversationPersistence.ts`

---

## 🔧 Modifications à faire dans `dashBoard-chat.tsx`

### 1. Ajouter les imports

```typescript
import { useConversationPersistence } from '../hooks/useConversationPersistence';
import { uploadDocument, getAllAccessibleDocuments } from '../lib/supabase/documents';
import type { Document } from '../types/database.types';
```

### 2. Ajouter les props au composant

```typescript
interface DashBoardChatProps {
  conversationId?: string | null;
  userId?: string | null;
}

export function DashBoardChat({ conversationId, userId }: DashBoardChatProps) {
```

### 3. Ajouter le hook de persistance après les states existants

```typescript
// Persistence hook
const {
  storedMessages,
  isLoading: isLoadingHistory,
  saveMessage,
  loadMessages,
  clearMessages,
} = useConversationPersistence({
  conversationId: conversationId ?? null,
  enabled: !!conversationId,
});

// Documents state
const [userDocuments, setUserDocuments] = useState<Document[]>([]);
```

### 4. Charger l'historique au montage

```typescript
// Load conversation history
useEffect(() => {
  if (conversationId && storedMessages.length > 0) {
    // Convert DB messages to UI messages
    const uiMessages = storedMessages.map(msg => ({
      id: Date.now() + Math.random(), // temp ID
      role: msg.role,
      content: msg.content,
    }));
    setMessages([...messages.slice(0, 1), ...uiMessages]); // Keep welcome message
  }
}, [conversationId, storedMessages]);

// Load user's documents
useEffect(() => {
  if (userId) {
    loadUserDocuments();
  }
}, [userId]);

const loadUserDocuments = async () => {
  if (!userId) return;
  const docs = await getAllAccessibleDocuments(userId);
  setUserDocuments(docs);
};
```

### 5. Sauvegarder les messages dans handleSend

Dans la fonction `handleSend`, après avoir ajouté le message utilisateur :

```typescript
// 4️⃣ Ajouter le message utilisateur dans l'UI
const userMessage: Message = {
  id: Date.now(),
  role: 'user',
  content: messageText,
  files: currentFiles,
};

setMessages((prev) => [...prev, userMessage]);
lastUserRef.current = userMessage;

// 💾 NOUVEAU : Sauvegarder dans Supabase
if (conversationId) {
  await saveMessage('user', messageText);
}
```

Et après avoir reçu la réponse du bot :

```typescript
// 9️⃣ Afficher la réponse dans le chat
setMessages((prev) => {
  console.log('📝 Ajout message bot au state. Messages avant:', prev.length);
  return [...prev, botMessage];
});

// 💾 NOUVEAU : Sauvegarder dans Supabase
if (conversationId) {
  await saveMessage('assistant', botMessage.content);
}
```

### 6. Intégrer l'upload de PDF avec Supabase Storage

Remplacer la fonction `handleFileUpload` :

```typescript
const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const { files } = e.target;
  if (!files || files.length === 0) return;

  const newFiles: AttachedFile[] = [];

  for (const file of Array.from(files)) {
    // Upload PDF to Supabase if user is authenticated
    if (userId && file.type === 'application/pdf') {
      const doc = await uploadDocument(file, userId, false);
      if (doc) {
        console.log('✅ PDF uploadé vers Supabase:', doc.filename);
        newFiles.push({
          name: file.name,
          type: file.type.split('/')[0] || 'unknown',
          url: URL.createObjectURL(file),
          file,
        });
      }
    } else {
      // Non-PDF files or guest users - keep in memory only
      newFiles.push({
        name: file.name,
        type: file.type ? file.type.split('/')[0] : 'unknown',
        url: URL.createObjectURL(file),
        file,
      });
    }
  }

  setAttachedFiles((prev) => [...prev, ...newFiles]);

  // Reload documents list
  if (userId) {
    await loadUserDocuments();
  }

  if (e.target) {
    e.target.value = '';
  }
};
```

### 7. Modifier l'appel RAG pour utiliser les documents Supabase

Dans `handleSend`, avant l'appel API :

```typescript
// 3️⃣ RAG FastAPI a besoin d'au moins un PDF
const pdfFiles = currentFiles.filter((f) => {
  const isPdfType = f.file?.type === 'application/pdf';
  const isPdfName = f.name.toLowerCase().endsWith('.pdf');
  return isPdfType || isPdfName;
});

// 💾 NOUVEAU : Si pas de PDF uploadé, utiliser ceux de la base de données
let pdfsToUse = pdfFiles;
if (pdfFiles.length === 0 && userDocuments.length > 0) {
  console.log('📦 Utilisation des PDFs de la base de données:', userDocuments.length);
  // TODO: Récupérer les fichiers depuis Supabase Storage
  // Pour l'instant, on informe l'utilisateur
  setError('Utilisation des documents de votre bibliothèque');
  // L'API devra être modifiée pour accepter des document IDs au lieu de files
} else if (pdfFiles.length === 0) {
  setError('Veuillez joindre au moins un fichier PDF pour utiliser le RAG.');
  return;
}
```

---

## 🚀 Utilisation dans la page

Remplacer l'utilisation de `DashBoardChat` par `ChatWithHistory` :

### Avant :
```typescript
// app/home/page.tsx
<DashBoardChat />
```

### Après :
```typescript
// app/home/page.tsx
import { ChatWithHistory } from './_components/ChatWithHistory';

<ChatWithHistory />
```

---

## 📋 Checklist

- [ ] Ajouter les imports dans `dashBoard-chat.tsx`
- [ ] Ajouter les props `conversationId` et `userId`
- [ ] Intégrer le hook `useConversationPersistence`
- [ ] Charger l'historique au montage
- [ ] Sauvegarder les messages dans `handleSend`
- [ ] Modifier `handleFileUpload` pour uploader vers Supabase
- [ ] Adapter l'appel RAG pour les documents Supabase
- [ ] Remplacer `<DashBoardChat />` par `<ChatWithHistory />`
- [ ] Tester le flux complet

---

## 🎯 Prochaines étapes

1. **API Backend** : Modifier l'API FastAPI pour accepter :
   - Des `document_ids` au lieu de fichiers
   - Récupérer les PDFs depuis Supabase Storage
   - Utiliser les embeddings existants

2. **Embeddings** : Créer un worker pour :
   - Traiter les PDFs uploadés
   - Générer les embeddings
   - Les stocker dans `document_embeddings`

3. **RAG Amélioré** : Utiliser la fonction `match_documents()` SQL
   - Recherche sémantique sur les embeddings
   - Filtrer par user_id + documents globaux
   - Retourner les chunks les plus pertinents
