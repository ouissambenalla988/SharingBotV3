-- =====================================================
-- FIX ACCOUNTS TABLE AND FOREIGN KEYS
-- Exécutez ce script pour résoudre les problèmes de clés étrangères
-- =====================================================

-- 1. Créer le compte manquant dans la table accounts
-- Remplacez l'ID si nécessaire avec l'ID de votre utilisateur authentifié
INSERT INTO accounts (id, name, picture_url)
VALUES (
  'c5a8ed42-b39b-426c-90e1-404ff8f93d0d',
  'User Account',
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- 2. Optionnel: Changer la contrainte de clé étrangère pour pointer vers auth.users au lieu de accounts
-- (Décommentez si vous préférez cette approche)

-- DROP TABLE IF EXISTS conversations CASCADE;
-- DROP TABLE IF EXISTS messages CASCADE;
-- DROP TABLE IF EXISTS documents CASCADE;
-- DROP TABLE IF EXISTS document_embeddings CASCADE;

-- CREATE TABLE conversations (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--   title TEXT NOT NULL,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
-- );

-- CREATE TABLE messages (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
--   role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
--   content TEXT NOT NULL,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
-- );

-- CREATE TABLE documents (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--   filename TEXT NOT NULL,
--   file_path TEXT NOT NULL,
--   file_size INTEGER NOT NULL,
--   is_global BOOLEAN DEFAULT false,
--   processed BOOLEAN DEFAULT false,
--   uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
-- );

-- CREATE TABLE document_embeddings (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
--   chunk_text TEXT NOT NULL,
--   embedding vector(1536),
--   chunk_index INTEGER NOT NULL,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
-- );

-- Vérification
SELECT id, name FROM accounts WHERE id = 'c5a8ed42-b39b-426c-90e1-404ff8f93d0d';
