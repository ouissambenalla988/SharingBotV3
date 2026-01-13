import { getSupabaseBrowserClient } from '@kit/supabase/browser-client';
import type { Document } from '../../types/database.types';

// Re-export Document type for use in other components
export type { Document };

function getClient() {
  return getSupabaseBrowserClient<any>();
}

// ========================
// Document Functions
// ========================

export async function uploadDocument(
  file: File,
  userId: string,
  isGlobal: boolean = false
): Promise<Document | null> {
  try {
    console.log('📤 uploadDocument called:', { fileName: file.name, userId, isGlobal });
    const supabase = getClient();
    
    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    console.log('📤 Uploading to storage:', { bucket: 'documents', filePath });
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      console.error('❌ Error uploading file to storage:', {
        message: uploadError.message,
        name: uploadError.name,
        stack: uploadError.stack,
      });
      return null;
    }

    console.log('✅ File uploaded to storage successfully');

    // Insert document record in database
    console.log('💾 Inserting document record in database');
    const { data, error } = await supabase
      .from('documents')
      .insert({
        user_id: isGlobal ? null : userId,
        filename: file.name,
        file_path: filePath,
        file_size: file.size,
        is_global: isGlobal,
        processed: false,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating document record:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      // Rollback: delete uploaded file
      await supabase.storage.from('documents').remove([filePath]);
      console.log('🔄 Rollback: deleted file from storage');
      return null;
    }

    console.log('✅ Document record created:', data);
    return data;
  } catch (error) {
    console.error('❌ Exception uploading document:', error);
    return null;
  }
}

export async function getUserDocuments(userId: string): Promise<Document[]> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching user documents:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception fetching user documents:', error);
    return [];
  }
}

export async function getGlobalDocuments(): Promise<Document[]> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('is_global', true)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching global documents:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception fetching global documents:', error);
    return [];
  }
}

export async function getAllAccessibleDocuments(userId: string): Promise<Document[]> {
  try {
    // Get both user documents and global documents
    const supabase = getClient();
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .or(`user_id.eq.${userId},is_global.eq.true`)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching accessible documents:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception fetching accessible documents:', error);
    return [];
  }
}

export async function deleteDocument(documentId: string): Promise<boolean> {
  try {
    // Get document to get file path
    const supabase = getClient();
    const { data: doc, error: fetchError } = await supabase
      .from('documents')
      .select('file_path')
      .eq('id', documentId)
      .single();

    if (fetchError || !doc) {
      console.error('Error fetching document for deletion:', fetchError);
      return false;
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([doc.file_path]);

    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
    }

    // Delete from database (embeddings will be deleted by CASCADE)
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (error) {
      console.error('Error deleting document record:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception deleting document:', error);
    return false;
  }
}

export async function markDocumentAsProcessed(documentId: string): Promise<boolean> {
  try {
    const supabase = getClient();
    const { error } = await supabase
      .from('documents')
      .update({ processed: true })
      .eq('id', documentId);

    if (error) {
      console.error('Error marking document as processed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception marking document as processed:', error);
    return false;
  }
}

export async function getDocumentUrl(filePath: string): Promise<string | null> {
  try {
    const supabase = getClient();
    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Exception getting document URL:', error);
    return null;
  }
}
