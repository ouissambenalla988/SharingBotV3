# Bienvenue sur la documentation de SharingBot V3

![SharingBot Logo](https://raw.githubusercontent.com/ouissambenalla988/SharingBotV3/main/apps/web/public/img/sharingan.png)

## 🎯 Introduction

**SharingBot V3** est un assistant IA conversationnel intelligent basé sur Next.js 15 et Supabase. Il combine chat en temps réel, reconnaissance vocale, synthèse vocale, OCR et système RAG pour interroger vos documents.

### ✨ Fonctionnalités principales

- 🤖 **Chat IA conversationnel** - Conversations intelligentes avec historique persistant
- 🎙️ **Reconnaissance vocale (ASR)** - Dictez vos messages vocalement
- 🔊 **Synthèse vocale (TTS)** - Écoutez les réponses du bot
- 📄 **Système RAG** - Uploadez des PDFs et interrogez leur contenu
- 🖼️ **OCR intégré** - Extrayez du texte depuis des images
- 💾 **Historique persistant** - Vos conversations sont automatiquement sauvegardées
- 📁 **Gestion de conversations** - Créez, naviguez et supprimez vos conversations
- 🔍 **Recherche vectorielle** - Recherche sémantique dans vos documents
- 🌍 **Multilingue** - Détection automatique de la langue

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

| Technologie | Usage dans SharingBot |
|------------|----------------------|
| [Next.js 15](https://nextjs.org/) | Framework principal, routing et API routes |
| [Supabase](https://supabase.com/) | Auth, base de données PostgreSQL, storage |
| [React Speech Recognition](https://www.npmjs.com/package/react-speech-recognition) | Reconnaissance vocale (ASR) |
| [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) | Synthèse vocale (TTS) |
| [Google Cloud Vision](https://cloud.google.com/vision) | OCR pour extraction de texte |
| [Hugging Face Inference](https://huggingface.co/inference-api) | Modèle de langage pour le chat |
| [pgvector](https://github.com/pgvector/pgvector) | Recherche vectorielle dans PostgreSQL |
| [TypeScript](https://www.typescriptlang.org/) | Typage strict pour tout le code |
| [Tailwind CSS](https://tailwindcss.com/) | Styling de l'interface |
| [Shadcn UI](https://ui.shadcn.com/) | Composants UI du chat |

## 🏗️ Architecture de SharingBot

L'application est organisée autour du système de chat avec ses fonctionnalités:

```
SharingBotV3/
├── apps/web/app/
│   ├── home/                     # Application SharingBot
│   │   ├── _components/
│   │   │   ├── dashBoard-chat.tsx        # Composant principal du chat
│   │   │   ├── ConversationSidebar.tsx   # Historique des conversations
│   │   │   └── ChatWithHistory.tsx       # Wrapper avec persistance
│   │   ├── hooks/
│   │   │   └── useConversationPersistence.ts  # Hook de persistance
│   │   └── page.tsx
│   ├── lib/
│   │   ├── asr-service.ts       # Service de reconnaissance vocale
│   │   ├── tts-service.ts       # Service de synthèse vocale
│   │   ├── ocr-service.ts       # Service OCR
│   │   ├── language-detector.ts # Détection de langue
│   │   └── supabase/
│   │       ├── conversations.ts # CRUD conversations/messages
│   │       └── documents.ts     # Gestion documents et RAG
│   ├── types/
│   │   └── database.types.ts    # Types TypeScript Supabase
│   └── api/                     # Routes API (chat, embeddings)
└── supabase/
    ├── migrations/              # Schéma de base de données
    └── setup-storage-and-tables.sql  # Configuration complète
```

## 🎓 Guides

- [Installation et configuration](getting-started/installation.md)
- [Premier lancement](getting-started/first-run.md)
- [Utiliser le chat](features/chat-system.md)
- [Configurer le système RAG](features/rag-documents.md)
- [Activer la reconnaissance vocale](features/speech-recognition.md)
- [Résolution de problèmes](troubleshooting/common-issues.md)
💡 Cas d'usage

SharingBot est idéal pour:

- 📚 **Assistant de documentation** - Interrogez vos manuels et guides
- 📊 **Analyse de rapports** - Posez des questions sur vos PDFs
- 📝 **Assistant d'étude** - Questionnez vos notes et cours
- 💼 **Assistant professionnel** - Recherchez dans vos documents métier
- 🔍 **Recherche sémantique** - Trouvez des informations précises

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez notre [guide de contribution](contributing.md).

## 📄 Licence

Ce projet est sous licence MIT. Vous pouvez l'utiliser librement pour vos projets personnels ou commerciaux.

## 🔗 Liens utiles

- [Repository GitHub](https://github.com/ouissambenalla988/SharingBotV3)
- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Supabase](https://supabase.com/docs)
- [Hugging Face Inference API](https://huggingface.co/inference-api)

## 💬 Support

- 🐛 Issues: [GitHub Issues](https://github.com/ouissambenalla988/SharingBotV3/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/ouissambenalla988/SharingBotV3/discussion
- 🐛 Issues: [GitHub Issues](https://github.com/ouissambenalla988/SharingBotV3/issues)

---

**Prêt à commencer ?** Consultez le [guide d'installation](getting-started/installation.md) pour démarrer ! 🚀
