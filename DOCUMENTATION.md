# 📚 Documentation SharingBot V3

Documentation complète construite avec MkDocs Material et hébergée sur ReadTheDocs.

## 📖 Voir la documentation en ligne

**🌐 URL**: [https://sharingbotv3.readthedocs.io](https://sharingbotv3.readthedocs.io) *(une fois publié)*

## 🚀 Développement local

### Installation

```bash
# Installer Python 3.11+ si nécessaire
# Puis installer les dépendances

pip install -r requirements.txt
```

### Lancer le serveur local

```bash
# Depuis la racine du projet
mkdocs serve

# Ou depuis le dossier docs/
cd docs
mkdocs serve
```

La documentation sera disponible sur [http://localhost:8000](http://localhost:8000)

### Commandes utiles

```bash
# Build de la documentation
mkdocs build

# Vérifier les liens cassés
mkdocs build --strict

# Déployer sur GitHub Pages
mkdocs gh-deploy
```

## 📁 Structure

```
docs/
├── index.md                    # Page d'accueil
├── getting-started/            # Installation et configuration
├── architecture/               # Architecture du projet
├── features/                   # Documentation des fonctionnalités
├── api/                        # Référence API
├── guides/                     # Guides de développement
├── reference/                  # Références techniques
├── troubleshooting/           # Dépannage
├── changelog.md               # Historique des versions
└── contributing.md            # Guide de contribution
```

## ✏️ Contribuer à la documentation

1. Fork le projet
2. Créer une branche: `git checkout -b docs/ma-contribution`
3. Modifier les fichiers dans `docs/`
4. Tester localement: `mkdocs serve`
5. Commit et Push
6. Créer une Pull Request

### Syntaxe

La documentation utilise Markdown avec des extensions:

- **Admonitions**: `!!! note "Titre"`
- **Tabs**: `=== "Tab 1"`
- **Code blocks**: ` ```python `
- **Tables**: Markdown standard

Voir [docs/README.md](docs/README.md) pour le guide complet.

## 🌐 Déploiement

### ReadTheDocs (Automatique)

La documentation est automatiquement construite et déployée sur ReadTheDocs à chaque push sur `main`.

Configuration: `.readthedocs.yml`

### GitHub Pages (Manuel)

```bash
mkdocs gh-deploy
```

## 📝 Fichiers de configuration

- `mkdocs.yml` - Configuration principale
- `.readthedocs.yml` - Configuration ReadTheDocs
- `requirements.txt` - Dépendances Python
- `docs/stylesheets/extra.css` - Styles personnalisés

## 🔧 Technologies

- **MkDocs** - Générateur de documentation
- **Material for MkDocs** - Thème moderne
- **Python Markdown Extensions** - Extensions Markdown
- **ReadTheDocs** - Hébergement

## 📚 Ressources

- [MkDocs Documentation](https://www.mkdocs.org/)
- [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/)
- [Markdown Guide](https://www.markdownguide.org/)

## 📄 Licence

Cette documentation est sous licence MIT, comme le projet principal.
