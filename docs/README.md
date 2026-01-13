# Documentation SharingBot V3 - ReadTheDocs

Ce dossier contient la documentation complète du projet SharingBot V3, construite avec MkDocs Material.

## 🚀 Démarrage rapide

### Prérequis

- Python 3.11 ou supérieur
- pip ou pipenv

### Installation locale

```bash
# Installer les dépendances
pip install -r requirements.txt

# Lancer le serveur de documentation
mkdocs serve
```

La documentation sera disponible sur [http://localhost:8000](http://localhost:8000)

## 📁 Structure

```
docs/
├── index.md                    # Page d'accueil
├── getting-started/            # Guides de démarrage
│   ├── installation.md
│   ├── configuration.md
│   └── first-run.md
├── architecture/               # Documentation architecture
│   ├── overview.md
│   ├── project-structure.md
│   ├── database.md
│   └── monorepo.md
├── features/                   # Guide des fonctionnalités
│   ├── chat-system.md
│   ├── speech-recognition.md
│   ├── text-to-speech.md
│   ├── ocr.md
│   ├── rag-documents.md
│   ├── conversation-history.md
│   └── user-management.md
├── api/                        # Documentation API
│   ├── overview.md
│   ├── chat-routes.md
│   ├── document-routes.md
│   └── authentication.md
├── guides/                     # Guides de développement
│   ├── add-feature.md
│   ├── create-component.md
│   ├── working-with-supabase.md
│   ├── testing.md
│   └── deployment.md
├── reference/                  # Références
│   ├── configuration.md
│   ├── environment-variables.md
│   ├── scripts.md
│   └── typescript-types.md
├── troubleshooting/           # Dépannage
│   ├── common-issues.md
│   └── faq.md
├── changelog.md               # Historique des versions
├── contributing.md            # Guide de contribution
└── stylesheets/
    └── extra.css             # CSS personnalisé
```

## 🛠️ Commandes disponibles

```bash
# Lancer le serveur de développement
mkdocs serve

# Builder la documentation
mkdocs build

# Déployer sur GitHub Pages
mkdocs gh-deploy

# Vérifier la configuration
mkdocs --version
```

## 📝 Écrire de la documentation

### Syntaxe de base

Les fichiers utilisent Markdown avec des extensions:

```markdown
# Titre de niveau 1

## Titre de niveau 2

**Texte en gras**
*Texte en italique*
`code inline`

[Lien](url)
![Image](url)
```

### Blocs de code

````markdown
```python
def hello():
    print("Hello World")
```

```typescript
function hello(): void {
  console.log("Hello World");
}
```
````

### Admonitions

```markdown
!!! note "Titre optionnel"
    Contenu de la note

!!! warning "Attention"
    Message d'avertissement

!!! tip "Astuce"
    Conseil utile

!!! danger "Danger"
    Message critique
```

### Onglets

```markdown
=== "Tab 1"
    Contenu du premier onglet

=== "Tab 2"
    Contenu du deuxième onglet
```

### Tables

```markdown
| Colonne 1 | Colonne 2 | Colonne 3 |
|-----------|-----------|-----------|
| Valeur 1  | Valeur 2  | Valeur 3  |
| Valeur 4  | Valeur 5  | Valeur 6  |
```

## 🎨 Configuration du thème

Le thème est configuré dans `mkdocs.yml`:

```yaml
theme:
  name: material
  palette:
    - scheme: default
      primary: indigo
      accent: indigo
```

### Personnalisation CSS

Les styles personnalisés sont dans `docs/stylesheets/extra.css`

## 📦 Déploiement

### ReadTheDocs

1. Connectez votre repository GitHub à ReadTheDocs
2. Le fichier `.readthedocs.yml` est déjà configuré
3. Chaque push sur `main` déclenchera un rebuild automatique

### GitHub Pages

```bash
# Build et deploy en une commande
mkdocs gh-deploy
```

### Autres plateformes

La documentation peut être hébergée sur n'importe quel serveur web statique:

```bash
# Build
mkdocs build

# Les fichiers sont dans site/
# Uploader le contenu de site/ sur votre serveur
```

## 🔍 Recherche

La recherche est activée par défaut avec le plugin `search`:

```yaml
plugins:
  - search:
      lang: fr
```

## 🌍 Internationalisation

Pour ajouter d'autres langues, dupliquer les fichiers `.md` et modifier `mkdocs.yml`:

```yaml
plugins:
  - i18n:
      default_language: fr
      languages:
        en: English
        fr: Français
```

## 📖 Ressources

- [MkDocs Documentation](https://www.mkdocs.org/)
- [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/)
- [Markdown Guide](https://www.markdownguide.org/)
- [ReadTheDocs Docs](https://docs.readthedocs.io/)

## 🤝 Contribuer à la documentation

1. Fork le projet
2. Créer une branche: `git checkout -b docs/ma-contribution`
3. Faire vos modifications dans `docs/`
4. Tester localement: `mkdocs serve`
5. Commit: `git commit -m "docs: amélioration de la documentation X"`
6. Push et créer une Pull Request

## 📝 Checklist pour nouvelle documentation

- [ ] Fichier créé dans le bon répertoire
- [ ] Ajouté au `nav` dans `mkdocs.yml`
- [ ] Syntaxe Markdown valide
- [ ] Liens internes fonctionnels
- [ ] Exemples de code testés
- [ ] Images optimisées (si applicable)
- [ ] Testé localement avec `mkdocs serve`

## ❓ Questions

Pour toute question sur la documentation:
- Ouvrir une [Issue](https://github.com/ouissambenalla988/SharingBotV3/issues)
- Consulter les [Discussions](https://github.com/ouissambenalla988/SharingBotV3/discussions)
