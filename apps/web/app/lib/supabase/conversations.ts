import { getSupabaseBrowserClient } from '@kit/supabase/browser-client';
import type { Conversation, Message } from '../../types/database.types';

function getClient() {
  return getSupabaseBrowserClient<any>();
}

// ========================
// Conversation Functions
// ========================

export async function createConversation(
  userId: string,
  title: string = 'Nouvelle conversation'
): Promise<Conversation | null> {
  try {
    console.log('Creating conversation for userId:', userId);
    const supabase = getClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Current authenticated user:', user?.id);
    
    if (authError || !user) {
      console.error('User not authenticated:', authError);
      return null;
    }
    
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        title,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return null;
    }

    console.log('Conversation created successfully:', data);
    return data;
  } catch (error) {
    console.error('Exception creating conversation:', error);
    return null;
  }
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  try {
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

    return data || [];
  } catch (error) {
    console.error('Exception fetching conversations:', error);
    return [];
  }
}

export async function getConversation(conversationId: string): Promise<Conversation | null> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) {
      console.error('Error fetching conversation:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception fetching conversation:', error);
    return null;
  }
}

export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<boolean> {
  try {
    const supabase = getClient();
    const { error } = await supabase
      .from('conversations')
      .update({ title })
      .eq('id', conversationId);

    if (error) {
      console.error('Error updating conversation title:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception updating conversation title:', error);
    return false;
  }
}

export async function deleteConversation(conversationId: string): Promise<boolean> {
  try {
    // Messages will be deleted automatically due to CASCADE
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
  } catch (error) {
    console.error('Exception deleting conversation:', error);
    return false;
  }
}

// ========================
// Message Functions
// ========================

export async function getMessages(conversationId: string): Promise<Message[]> {
  try {
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

    return data || [];
  } catch (error) {
    console.error('Exception fetching messages:', error);
    return [];
  }
}

export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string
): Promise<Message | null> {
  try {
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

    // Update conversation's updated_at timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data;
  } catch (error) {
    console.error('Exception adding message:', error);
    return null;
  }
}

export async function deleteMessages(conversationId: string): Promise<boolean> {
  try {
    const supabase = getClient();
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId);

    if (error) {
      console.error('Error deleting messages:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception deleting messages:', error);
    return false;
  }
}
