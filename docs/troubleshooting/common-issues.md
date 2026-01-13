# Problèmes courants

Cette page liste les problèmes les plus fréquents et leurs solutions.

## Installation et démarrage

### Docker n'est pas démarré

**Symptôme**: Erreur lors de `pnpm run supabase:web:start`

```
Error: Cannot connect to the Docker daemon
```

**Solution**:

=== "Windows"
    1. Ouvrir Docker Desktop
    2. Attendre que l'icône Docker passe au vert
    3. Réessayer la commande

=== "Linux"
    ```bash
    # Démarrer Docker
    sudo systemctl start docker
    
    # Vérifier le statut
    sudo systemctl status docker
    ```

=== "macOS"
    1. Lancer Docker Desktop depuis Applications
    2. Attendre que Docker soit prêt
    3. Réessayer

### Port déjà utilisé

**Symptôme**: Erreur de port déjà en cours d'utilisation

```
Error: Port 3000 is already in use
```

**Solution**:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>

# Ou changer le port
PORT=3001 pnpm run dev
```

### Erreur PNPM

**Symptôme**: Commandes PNPM ne fonctionnent pas

```
pnpm: command not found
```

**Solution**:

```bash
# Installer PNPM globalement
npm install -g pnpm

# Vérifier l'installation
pnpm --version
```

## Supabase

### Clés Supabase manquantes

**Symptôme**: Erreur d'authentification Supabase

```
Error: supabaseUrl is required
```

**Solution**:

1. Démarrer Supabase:
   ```bash
   pnpm run supabase:web:start
   ```

2. Copier les clés affichées dans le terminal

3. Mettre à jour `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   ```

4. Redémarrer l'application

### Tables manquantes

**Symptôme**: Erreur lors de l'accès aux données

```
Error: relation "conversations" does not exist
```

**Solution**:

```bash
# Réinitialiser la base de données
pnpm run supabase:web:reset
```

### Erreur RLS (Row Level Security)

**Symptôme**: Données non accessibles malgré l'authentification

```
Error: new row violates row-level security policy
```

**Solution**:

1. Vérifier que vous êtes bien connecté
2. Vérifier les policies dans Supabase Studio
3. Exécuter le script de configuration:
   ```sql
   -- Dans SQL Editor
   -- Contenu du fichier setup-storage-and-tables.sql
   ```

### Storage bucket inaccessible

**Symptôme**: Upload de fichiers échoue

```
Error: Bucket not found
```

**Solution**:

1. Aller dans Supabase Studio → Storage
2. Vérifier que le bucket `documents` existe
3. Si absent, créer le bucket ou exécuter:
   ```bash
   pnpm run supabase:web:reset
   ```

## Chat et fonctionnalités

### Le chat ne répond pas

**Symptôme**: Messages envoyés mais pas de réponse

**Solutions possibles**:

1. **Vérifier la console**:
   - Ouvrir DevTools (F12)
   - Regarder l'onglet Console pour les erreurs

2. **Vérifier l'API**:
   - La route `/api/chat` existe-t-elle ?
   - Check les logs du serveur

3. **Vérifier Supabase**:
   - Base de données démarrée ?
   - Tables créées ?

### Reconnaissance vocale ne fonctionne pas

**Symptôme**: Le microphone ne capte rien

**Causes possibles**:

1. **Navigateur non supporté**:
   - ✅ Chrome/Edge: Supporté
   - ✅ Safari: Supporté
   - ❌ Firefox: Non supporté

2. **Permissions refusées**:
   - Autoriser l'accès au microphone
   - Vérifier dans les paramètres du navigateur

3. **HTTPS requis**:
   - En production, HTTPS est requis
   - En dev, localhost fonctionne

**Solution**:

```typescript
// Vérifier le support
if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
  console.error('Speech recognition not supported');
}
```

### OCR ne fonctionne pas

**Symptôme**: Extraction de texte échoue

**Solution**:

1. Vérifier que l'image est valide (PNG, JPG)
2. Vérifier la clé API Google Vision si configurée
3. Regarder les logs dans la console

### Upload de fichiers échoue

**Symptôme**: Fichier ne s'upload pas

**Causes possibles**:

1. **Fichier trop gros**:
   - Limite: 50MB par défaut
   - Vérifier la taille du fichier

2. **Type de fichier non supporté**:
   - PDFs: ✅
   - Images (PNG, JPG): ✅
   - Autres: ❌

3. **Bucket non configuré**:
   - Vérifier Supabase Storage

**Solution**:

```bash
# Réinitialiser le storage
pnpm run supabase:web:reset
```

## Performances

### Application lente

**Symptôme**: Chargements lents, UI qui lag

**Solutions**:

1. **Vérifier le mode**:
   ```bash
   # Mode dev (normal d'être plus lent)
   pnpm run dev
   
   # Mode production (optimisé)
   pnpm run build && pnpm run start
   ```

2. **Vider le cache**:
   ```bash
   # Nettoyer Turbo cache
   rm -rf .turbo
   
   # Nettoyer Next.js cache
   rm -rf apps/web/.next
   
   # Rebuild
   pnpm run build
   ```

3. **Vérifier la mémoire**:
   - Fermer les applications non nécessaires
   - Augmenter la limite Node.js si besoin

### Build échoue

**Symptôme**: Erreur lors du build

```
Error: Build failed
```

**Solution**:

```bash
# Nettoyer complètement
pnpm run clean
pnpm run clean:workspaces

# Réinstaller
rm -rf node_modules
pnpm install

# Rebuilder
pnpm run build
```

## TypeScript

### Erreurs de type

**Symptôme**: TypeScript signale des erreurs

**Solutions**:

1. **Régénérer les types Supabase**:
   ```bash
   pnpm run supabase:web:typegen
   ```

2. **Vérifier tsconfig.json**:
   - Les paths sont corrects ?
   - `strict: true` est configuré ?

3. **Redémarrer TypeScript server**:
   - Dans VS Code: `Cmd/Ctrl + Shift + P` → "Restart TS Server"

### Imports non résolus

**Symptôme**: Import ne trouve pas le module

```
Cannot find module '@kit/ui'
```

**Solution**:

```bash
# Réinstaller les dépendances
pnpm install

# Vérifier les workspaces
pnpm list @kit/ui
```

## Base de données

### Migration échoue

**Symptôme**: Erreur lors de la migration

```
Error applying migration
```

**Solution**:

```bash
# Reset complet
pnpm run supabase:web:stop
pnpm run supabase:web:start

# Vérifier le statut
pnpm run supabase:web:status
```

### Données de test manquantes

**Symptôme**: Base vide après installation

**Solution**:

```bash
# Appliquer les seed data
pnpm run supabase:web:reset
```

## Production

### Erreur de déploiement

**Symptôme**: Le déploiement échoue

**Checklist**:

1. ✅ Variables d'environnement configurées ?
2. ✅ Build local réussit ?
3. ✅ Migrations Supabase appliquées ?
4. ✅ Callback URL configurée ?

**Solution**:

```bash
# Tester le build localement
pnpm run build

# Vérifier les env vars
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Erreur CORS

**Symptôme**: Erreur CORS en production

```
Access to fetch has been blocked by CORS policy
```

**Solution**:

1. Vérifier le domaine dans Supabase:
   - Project Settings → API
   - Ajouter votre domaine à "Site URL"

2. Vérifier les allowed origins

## Obtenir de l'aide

Si votre problème n'est pas listé ici:

1. 📖 Consultez la [FAQ](faq.md)
2. 🔍 Cherchez dans les [Issues GitHub](https://github.com/ouissambenalla988/SharingBotV3/issues)
3. 💬 Ouvrez une [Discussion](https://github.com/ouissambenalla988/SharingBotV3/discussions)
4. 🐛 Créez une [nouvelle Issue](https://github.com/ouissambenalla988/SharingBotV3/issues/new)

**Informations à fournir**:
- Version de Node.js (`node --version`)
- Version de PNPM (`pnpm --version`)
- Système d'exploitation
- Message d'erreur complet
- Étapes pour reproduire le problème
