-- =====================================================
-- CONFIGURATION RAPIDE DU STORAGE
-- Exécutez ce script pour rendre le bucket public
-- =====================================================

-- 1. Mettre à jour le bucket pour le rendre public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'documents';

-- 2. Supprimer toutes les anciennes policies (si elles existent)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- 3. Créer les nouvelles policies
-- Policy : Tout le monde peut lire (PUBLIC)
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'documents' );

-- Policy : Les utilisateurs authentifiés peuvent uploader dans leur dossier
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy : Les utilisateurs peuvent mettre à jour leurs propres fichiers
CREATE POLICY "Users can manage own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy : Les utilisateurs peuvent supprimer leurs propres fichiers
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Vérification
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'documents';
