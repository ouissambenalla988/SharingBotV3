// Types for Supabase database tables

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface Document {
  id: string;
  user_id: string | null;
  filename: string;
  file_path: string;
  file_size: number;
  is_global: boolean;
  processed: boolean;
  uploaded_at: string;
}

export interface DocumentEmbedding {
  id: string;
  document_id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, any> | null;
  created_at: string;
}

// API Response types
export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export interface DocumentWithEmbeddings extends Document {
  embeddings: DocumentEmbedding[];
}
