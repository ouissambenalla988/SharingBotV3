# Guide de contribution

Merci de votre intérêt pour contribuer à SharingBot V3 ! 🎉

## Code de conduite

En participant à ce projet, vous acceptez de respecter notre code de conduite:

- **Soyez respectueux** : Traitez les autres avec respect et courtoisie
- **Soyez constructif** : Fournissez des critiques constructives
- **Soyez patient** : Comprenez que les mainteneurs sont souvent bénévoles
- **Soyez inclusif** : Accueillez les nouveaux contributeurs

## Comment contribuer

### Signaler un bug 🐛

Si vous trouvez un bug, veuillez:

1. **Vérifier** qu'il n'a pas déjà été signalé dans les [Issues](https://github.com/ouissambenalla988/SharingBotV3/issues)
2. **Créer une issue** avec:
   - Un titre clair et descriptif
   - Les étapes pour reproduire le bug
   - Le comportement attendu vs actuel
   - Des captures d'écran si applicable
   - Votre environnement (OS, navigateur, versions)

### Proposer une fonctionnalité ✨

Pour proposer une nouvelle fonctionnalité:

1. **Ouvrir une issue** de type "Feature Request"
2. **Décrire** la fonctionnalité en détail
3. **Expliquer** pourquoi elle serait utile
4. **Proposer** une implémentation si possible

### Soumettre un Pull Request 🔀

#### Avant de commencer

1. **Fork** le repository
2. **Créer une branche** depuis `main`:
   ```bash
   git checkout -b feature/ma-fonctionnalite
   # ou
   git checkout -b fix/mon-correctif
   ```

#### Convention de nommage des branches

- `feature/` : Nouvelles fonctionnalités
- `fix/` : Corrections de bugs
- `docs/` : Documentation
- `refactor/` : Refactoring
- `test/` : Tests
- `chore/` : Tâches de maintenance

#### Développement

1. **Installer les dépendances**:
   ```bash
   pnpm install
   ```

2. **Lancer l'environnement de dev**:
   ```bash
   pnpm run supabase:web:start
   pnpm run dev
   ```

3. **Faire vos modifications**

4. **Suivre les standards**:
   - Code TypeScript strict
   - ESLint sans erreurs
   - Prettier pour le formatage
   - Tests pour les nouvelles fonctionnalités

5. **Vérifier la qualité**:
   ```bash
   # Linting
   pnpm run lint
   
   # Formatage
   pnpm run format
   
   # Type checking
   pnpm run typecheck
   
   # Tests
   pnpm run test
   ```

#### Commits

Utilisez des messages de commit conventionnels:

```
type(scope): description

[corps optionnel]

[footer optionnel]
```

**Types**:
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation
- `style`: Formatage
- `refactor`: Refactoring
- `test`: Tests
- `chore`: Maintenance

**Exemples**:
```bash
feat(chat): add voice input support
fix(auth): resolve token expiration issue
docs(readme): update installation instructions
```

#### Soumettre le PR

1. **Push** votre branche:
   ```bash
   git push origin feature/ma-fonctionnalite
   ```

2. **Créer un Pull Request** sur GitHub

3. **Remplir le template** de PR:
   - Description des changements
   - Type de changement (bug, feature, etc.)
   - Tests effectués
   - Checklist

4. **Attendre la review** et répondre aux commentaires

## Standards de code

### TypeScript

```typescript
// ✅ Bon
interface UserData {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<UserData> {
  // ...
}

// ❌ Mauvais
function getUser(id: any): any {
  // ...
}
```

### React

```tsx
// ✅ Bon - Composant typé
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Button({ onClick, children, variant = 'primary' }: ButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  );
}

// ❌ Mauvais - Props non typées
export function Button({ onClick, children, variant }) {
  // ...
}
```

### Hooks

```typescript
// ✅ Bon - Hook bien structuré
export function useConversation(id: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    loadMessages();
  }, [id]);
  
  const loadMessages = async () => {
    setIsLoading(true);
    const data = await getMessages(id);
    setMessages(data);
    setIsLoading(false);
  };
  
  return { messages, isLoading, loadMessages };
}
```

### Styling

Utilisez Tailwind CSS:

```tsx
// ✅ Bon
<div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900">
  <h1 className="text-2xl font-bold">Title</h1>
</div>

// ❌ Éviter les styles inline
<div style={{ display: 'flex', padding: '16px' }}>
  <h1 style={{ fontSize: '24px' }}>Title</h1>
</div>
```

## Tests

### Tests unitaires

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('should call onClick when clicked', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await userEvent.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Tests E2E

```typescript
import { test, expect } from '@playwright/test';

test('user can send a message', async ({ page }) => {
  await page.goto('/home');
  
  await page.fill('[placeholder="Type a message..."]', 'Hello');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('text=Hello')).toBeVisible();
});
```

## Documentation

### JSDoc pour les fonctions publiques

```typescript
/**
 * Creates a new conversation for a user
 * 
 * @param userId - The ID of the user
 * @param title - Optional title for the conversation
 * @returns The created conversation or null if failed
 * 
 * @example
 * ```ts
 * const conv = await createConversation('user-123', 'My Chat');
 * ```
 */
export async function createConversation(
  userId: string,
  title?: string
): Promise<Conversation | null> {
  // ...
}
```

### README pour les packages

Chaque package doit avoir un README.md avec:
- Description
- Installation
- Usage
- API
- Exemples

## Processus de review

1. **Review automatique**: Les checks CI/CD doivent passer
2. **Review par un maintainer**: Un maintainer doit approuver
3. **Merge**: Le maintainer merge le PR

### Critères d'acceptation

- ✅ Code de qualité (linting, types)
- ✅ Tests passants
- ✅ Documentation à jour
- ✅ Pas de régression
- ✅ Respecte l'architecture existante

## Ressources

- 📖 [Documentation complète](https://sharingbotv3.readthedocs.io)
- 🐛 [Issue Tracker](https://github.com/ouissambenalla988/SharingBotV3/issues)
- 💬 [Discussions](https://github.com/ouissambenalla988/SharingBotV3/discussions)

## Questions ?

N'hésitez pas à:
- Ouvrir une [Discussion](https://github.com/ouissambenalla988/SharingBotV3/discussions)
- Poser des questions dans une Issue
- Contacter les mainteneurs

Merci pour vos contributions ! 🙏
