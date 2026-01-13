# Bienvenue sur la documentation de SharingBot V3

![SharingBot Logo](https://raw.githubusercontent.com/ouissambenalla988/SharingBotV3/main/apps/web/public/images/makerkit.webp)

## 🎯 Introduction

**SharingBot V3** est une application SaaS moderne construite avec Next.js 15 et Supabase, offrant un assistant IA intelligent avec reconnaissance vocale, traitement de documents et système de RAG (Retrieval-Augmented Generation).

### ✨ Fonctionnalités principales

- 🤖 **Assistant IA conversationnel** avec persistance des conversations
- 🎙️ **Reconnaissance vocale (ASR)** - Parlez à votre assistant
- 🔊 **Synthèse vocale (TTS)** - L'assistant vous répond à voix haute
- 📄 **RAG et gestion de documents** - Uploadez des PDFs et posez des questions
- 🖼️ **OCR (Reconnaissance optique de caractères)** - Extrayez du texte des images
- 💾 **Historique complet** - Toutes vos conversations sont sauvegardées
- 🌍 **Multilingue (i18n)** - Support de plusieurs langues
- 🎨 **Interface moderne** - UI responsive avec Tailwind CSS et Shadcn UI
- 🔐 **Authentification sécurisée** - Gestion complète des utilisateurs avec Supabase

## 🚀 Démarrage rapide

Pour commencer rapidement avec SharingBot V3:

```bash
# 1. Cloner le repository
git clone https://github.com/ouissambenalla988/SharingBotV3.git
cd SharingBotV3

# 2. Installer les dépendances
pnpm install

# 3. Démarrer Supabase (Docker requis)
pnpm run supabase:web:start

# 4. Lancer l'application
pnpm run dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000)

## 📚 Documentation

Explorez la documentation complète:

- **[Guide de démarrage](getting-started/installation.md)** - Installation et configuration
- **[Architecture](architecture/overview.md)** - Comprendre la structure du projet
- **[Fonctionnalités](features/chat-system.md)** - Guide détaillé des fonctionnalités
- **[API Reference](api/overview.md)** - Documentation des APIs
- **[Guides de développement](guides/add-feature.md)** - Tutoriels pour développeurs

## 🛠️ Stack technologique

| Technologie | Description |
|------------|-------------|
| [Next.js 15](https://nextjs.org/) | Framework React pour le SSR et SSG |
| [Supabase](https://supabase.com/) | Backend as a Service (Auth, DB, Storage) |
| [TypeScript](https://www.typescriptlang.org/) | Typage statique pour JavaScript |
| [Tailwind CSS v4](https://tailwindcss.com/) | Framework CSS utilitaire |
| [Shadcn UI](https://ui.shadcn.com/) | Composants UI réutilisables |
| [Turborepo](https://turbo.build/) | Outil de monorepo haute performance |
| [React Query](https://tanstack.com/query/latest) | Gestion d'état et cache pour React |
| [Zod](https://zod.dev/) | Validation de schémas TypeScript-first |
| [Playwright](https://playwright.dev/) | Tests end-to-end |

## 🏗️ Architecture

SharingBot V3 utilise une architecture monorepo avec Turborepo:

```
SharingBotV3/
├── apps/
│   ├── web/              # Application Next.js principale
│   └── e2e/              # Tests end-to-end
├── packages/
│   ├── features/         # Packages de fonctionnalités
│   │   ├── auth/        # Authentification
│   │   └── accounts/    # Gestion des comptes
│   ├── ui/              # Composants UI partagés
│   ├── supabase/        # Client Supabase
│   └── i18n/            # Internationalisation
└── tooling/
    ├── eslint/          # Configuration ESLint
    ├── prettier/        # Configuration Prettier
    └── typescript/      # Configuration TypeScript
```

## 🎓 Tutoriels

- [Installation complète](getting-started/installation.md)
- [Configurer Supabase](getting-started/configuration.md)
- [Créer votre premier composant](guides/create-component.md)
- [Ajouter une nouvelle fonctionnalité](guides/add-feature.md)
- [Déployer en production](guides/deployment.md)

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez notre [guide de contribution](contributing.md) pour plus d'informations.

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](https://github.com/ouissambenalla988/SharingBotV3/blob/main/LICENSE) pour plus de détails.

## 🔗 Liens utiles

- [Repository GitHub](https://github.com/ouissambenalla988/SharingBotV3)
- [MakerKit](https://makerkit.dev) - Version complète du starter kit
- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Supabase](https://supabase.com/docs)

## 💬 Support

- 📧 Email: support@makerkit.dev
- 💬 Discord: [Rejoindre la communauté](https://discord.gg/makerkit)
- 🐛 Issues: [GitHub Issues](https://github.com/ouissambenalla988/SharingBotV3/issues)

---

**Prêt à commencer ?** Consultez le [guide d'installation](getting-started/installation.md) pour démarrer ! 🚀
