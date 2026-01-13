# Système de chat

Le système de chat de SharingBot V3 est le cœur de l'application, offrant une expérience conversationnelle riche et intelligente.

## Vue d'ensemble

Le système de chat intègre plusieurs fonctionnalités avancées:

- 💬 **Chat conversationnel** avec historique persistant
- 🤖 **Assistant IA** utilisant des modèles de langage
- 📄 **RAG (Retrieval-Augmented Generation)** pour répondre sur vos documents
- 🎙️ **Input multimodal**: texte, voix, et fichiers
- 💾 **Persistance automatique** dans Supabase
- 🔄 **Streaming des réponses** pour une UX fluide

## Architecture du chat

```
┌─────────────────────────────────────────┐
│         DashBoardChat Component          │
├─────────────────────────────────────────┤
│                                          │
│  ┌────────────┐      ┌──────────────┐  │
│  │  Message   │      │ Conversation │  │
│  │   List     │◄────►│  Sidebar     │  │
│  └────────────┘      └──────────────┘  │
│         │                    │          │
│         ▼                    ▼          │
│  ┌─────────────────────────────────┐  │
│  │      Input Component             │  │
│  │  ┌────┐  ┌────┐  ┌────┐        │  │
│  │  │Text│  │Voice│ │Files│        │  │
│  │  └────┘  └────┘  └────┘        │  │
│  └─────────────────────────────────┘  │
│         │                               │
│         ▼                               │
│  ┌─────────────────────────────────┐  │
│  │   Persistence Layer              │  │
│  │   (useConversationPersistence)   │  │
│  └─────────────────────────────────┘  │
│         │                               │
│         ▼                               │
│  ┌─────────────────────────────────┐  │
│  │      Supabase Backend            │  │
│  └─────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Composants principaux

### 1. DashBoardChat

Le composant principal qui orchestre tout le système de chat.

**Emplacement**: `apps/web/app/home/_components/dashBoard-chat.tsx`

```tsx
export function DashBoardChat() {
  const { data: userData } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  
  // Gestion de la persistance
  const {
    saveMessage,
    loadMessages,
  } = useConversationPersistence({
    conversationId: currentConversationId,
  });
  
  // Envoi d'un message
  const handleSend = async () => {
    // Logic...
  };
  
  return (
    <div className="flex h-screen">
      <ConversationSidebar />
      <ChatMessages messages={messages} />
      <ChatInput onSend={handleSend} />
    </div>
  );
}
```

**Responsabilités**:
- Gestion de l'état des messages
- Orchestration des sous-composants
- Communication avec l'API
- Persistance des données

### 2. ConversationSidebar

Affiche l'historique des conversations et permet la navigation.

**Emplacement**: `apps/web/app/home/_components/ConversationSidebar.tsx`

```tsx
export function ConversationSidebar({ userId, onConversationSelect }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  
  useEffect(() => {
    loadConversations();
  }, [userId]);
  
  const handleNewConversation = async () => {
    const newConv = await createConversation(userId, 'Nouvelle conversation');
    if (newConv) {
      onConversationSelect(newConv.id);
    }
  };
  
  return (
    <aside className="w-64 border-r">
      <Button onClick={handleNewConversation}>
        + Nouvelle conversation
      </Button>
      <ConversationList 
        conversations={conversations}
        onSelect={onConversationSelect}
      />
    </aside>
  );
}
```

**Fonctionnalités**:
- Liste des conversations groupées par date
- Bouton "Nouvelle conversation"
- Suppression de conversations
- Indication de la conversation active

### 3. ChatInput

Zone de saisie avec support multimodal.

```tsx
interface ChatInputProps {
  onSend: (message: string, files?: File[]) => void;
  onVoiceInput?: (transcript: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, onVoiceInput, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const { transcript, listening, startListening, stopListening } = useSpeechRecognition();
  
  const handleSubmit = () => {
    if (input.trim() || files.length > 0) {
      onSend(input, files);
      setInput("");
      setFiles([]);
    }
  };
  
  return (
    <div className="border-t p-4">
      <div className="flex gap-2">
        <FileUploadButton onFilesSelected={setFiles} />
        <VoiceButton 
          listening={listening}
          onStart={startListening}
          onStop={stopListening}
        />
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
          placeholder="Tapez votre message..."
        />
        <SendButton onClick={handleSubmit} disabled={disabled} />
      </div>
      {files.length > 0 && <FilePreview files={files} onRemove={setFiles} />}
    </div>
  );
}
```

## Flux de message

### 1. Envoi d'un message

```typescript
async function handleSend(messageText: string, files?: File[]) {
  // 1. Créer le message utilisateur
  const userMessage: Message = {
    id: Date.now(),
    role: 'user',
    content: messageText,
    files: files?.map(f => ({ name: f.name, url: '...' })),
  };
  
  // 2. Ajouter à l'UI
  setMessages(prev => [...prev, userMessage]);
  
  // 3. Sauvegarder dans Supabase
  if (currentConversationId) {
    await saveMessage(currentConversationId, 'user', messageText);
  }
  
  // 4. Appeler l'API
  setIsTyping(true);
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [...messages, userMessage],
      conversationId: currentConversationId,
    }),
  });
  
  // 5. Streamer la réponse
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let assistantText = '';
  
  const assistantMessage: Message = {
    id: Date.now() + 1,
    role: 'assistant',
    content: '',
  };
  
  setMessages(prev => [...prev, assistantMessage]);
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    assistantText += chunk;
    
    // Mettre à jour en temps réel
    setMessages(prev =>
      prev.map(m =>
        m.id === assistantMessage.id
          ? { ...m, content: assistantText }
          : m
      )
    );
  }
  
  setIsTyping(false);
  
  // 6. Sauvegarder la réponse
  if (currentConversationId) {
    await saveMessage(currentConversationId, 'assistant', assistantText);
  }
}
```

### 2. Chargement de l'historique

```typescript
useEffect(() => {
  async function loadConversationHistory() {
    if (!currentConversationId) return;
    
    // Charger les messages depuis Supabase
    const previousMessages = await getMessages(currentConversationId);
    
    // Convertir en format UI
    const uiMessages: Message[] = previousMessages.map((msg, idx) => ({
      id: idx,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));
    
    // Ajouter le message de bienvenue si vide
    if (uiMessages.length === 0) {
      uiMessages.unshift({
        id: 0,
        role: 'assistant',
        content: 'Hello! I am SharingBot AI assistant. How can I help you today?',
      });
    }
    
    setMessages(uiMessages);
  }
  
  loadConversationHistory();
}, [currentConversationId]);
```

## Persistance des données

### Hook useConversationPersistence

**Emplacement**: `apps/web/app/home/hooks/useConversationPersistence.ts`

```typescript
export function useConversationPersistence({ 
  conversationId, 
  enabled = true 
}: {
  conversationId: string | null;
  enabled?: boolean;
}) {
  const [storedMessages, setStoredMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Charger les messages au changement de conversation
  useEffect(() => {
    if (!conversationId || !enabled) return;
    
    async function load() {
      setIsLoading(true);
      const messages = await getMessages(conversationId);
      setStoredMessages(messages);
      setIsLoading(false);
    }
    
    load();
  }, [conversationId, enabled]);
  
  // Sauvegarder un message
  const saveMessage = useCallback(async (
    convId: string,
    role: 'user' | 'assistant',
    content: string
  ) => {
    await addMessage(convId, role, content);
  }, []);
  
  // Charger les messages
  const loadMessages = useCallback(async (convId: string) => {
    const messages = await getMessages(convId);
    setStoredMessages(messages);
    return messages;
  }, []);
  
  // Effacer les messages
  const clearMessages = useCallback(() => {
    setStoredMessages([]);
  }, []);
  
  return {
    storedMessages,
    isLoading,
    saveMessage,
    loadMessages,
    clearMessages,
  };
}
```

### Fonctions Supabase

**Emplacement**: `apps/web/app/lib/supabase/conversations.ts`

```typescript
// Créer une conversation
export async function createConversation(
  userId: string,
  title: string = 'Nouvelle conversation'
): Promise<Conversation | null> {
  const supabase = getClient();
  
  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: userId, title })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating conversation:', error);
    return null;
  }
  
  return data;
}

// Récupérer toutes les conversations
export async function getConversations(
  userId: string
): Promise<Conversation[]> {
  const supabase = getClient();
  
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
  
  return data;
}

// Ajouter un message
export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string
): Promise<Message | null> {
  const supabase = getClient();
  
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error adding message:', error);
    return null;
  }
  
  // Mettre à jour le timestamp de la conversation
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);
  
  return data;
}

// Récupérer les messages
export async function getMessages(
  conversationId: string
): Promise<Message[]> {
  const supabase = getClient();
  
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
  
  return data;
}

// Supprimer une conversation
export async function deleteConversation(
  conversationId: string
): Promise<boolean> {
  const supabase = getClient();
  
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId);
  
  if (error) {
    console.error('Error deleting conversation:', error);
    return false;
  }
  
  return true;
}
```

## Gestion des fichiers

Les fichiers uploadés sont traités différemment selon leur type:

### PDFs - Système RAG

```typescript
async function handlePDFUpload(file: File, userId: string) {
  // 1. Upload vers Supabase Storage
  const filePath = `${userId}/${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(filePath, file);
  
  if (error) throw error;
  
  // 2. Sauvegarder les métadonnées
  const document = await createDocument(userId, {
    filename: file.name,
    file_path: filePath,
    file_size: file.size,
    is_global: false,
  });
  
  // 3. Traiter en arrière-plan (embeddings)
  await processDocumentForRAG(document.id);
  
  return document;
}
```

### Images - OCR

```typescript
async function handleImageUpload(file: File) {
  // 1. Lire l'image
  const reader = new FileReader();
  const imageData = await new Promise<string>((resolve) => {
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
  
  // 2. Extraire le texte avec OCR
  const ocrService = new OCRService();
  const extractedText = await ocrService.processImage(imageData);
  
  // 3. Retourner le texte
  return extractedText;
}
```

## Optimisations

### 1. Debouncing du scroll

```typescript
const scrollToBottom = useCallback(
  debounce(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, 100),
  []
);
```

### 2. Virtualisation de la liste (pour de longues conversations)

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function MessageList({ messages }: { messages: Message[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  });
  
  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const message = messages[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <MessageBubble message={message} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 3. Optimistic Updates

```typescript
const sendMessage = useMutation({
  mutationFn: async (message: string) => {
    return await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },
  onMutate: async (newMessage) => {
    // Optimistically update UI
    const tempId = Date.now();
    setMessages(prev => [...prev, {
      id: tempId,
      role: 'user',
      content: newMessage,
    }]);
    
    return { tempId };
  },
  onSuccess: (data, variables, context) => {
    // Replace temporary message with real one
    setMessages(prev =>
      prev.map(m =>
        m.id === context.tempId
          ? { ...m, id: data.id }
          : m
      )
    );
  },
});
```

## Tests

### Test du composant Chat

```typescript
describe('DashBoardChat', () => {
  it('should send a message', async () => {
    const { getByPlaceholderText, getByRole } = render(<DashBoardChat />);
    
    const input = getByPlaceholderText('Tapez votre message...');
    const sendButton = getByRole('button', { name: /send/i });
    
    await userEvent.type(input, 'Hello bot');
    await userEvent.click(sendButton);
    
    expect(screen.getByText('Hello bot')).toBeInTheDocument();
  });
  
  it('should load conversation history', async () => {
    const mockMessages = [
      { role: 'user', content: 'Previous message' },
    ];
    
    jest.spyOn(conversations, 'getMessages').mockResolvedValue(mockMessages);
    
    render(<DashBoardChat conversationId="123" />);
    
    await waitFor(() => {
      expect(screen.getByText('Previous message')).toBeInTheDocument();
    });
  });
});
```

## Prochaines étapes

- 🎙️ [Reconnaissance vocale (ASR)](speech-recognition.md)
- 📄 [RAG et documents](rag-documents.md)
- 💾 [Historique des conversations](conversation-history.md)
