# CabInfo - Frontend

Application frontend pour la plateforme d'évaluation éducative CabInfo.

## Stack Technique

- **React 18** - UI Framework
- **TypeScript** - Typage statique
- **Vite** - Build tool
- **Redux Toolkit + RTK Query** - State management et API calls
- **React Router v7** - Routing
- **Tailwind CSS** - Styling
- **React Hook Form + Zod** - Formulaires et validation
- **Lucide React** - Icônes
- **Sonner** - Notifications

## Structure du projet

```
src/
├── app/                    # Configuration Redux et API
│   ├── api/               # RTK Query API slices
│   └── store.ts           # Store configuration
├── components/            # Composants réutilisables
│   ├── ui/               # Composants UI de base (Button, Input, Card...)
│   └── layout/           # Layouts (Header, Sidebar)
├── features/             # Slices Redux par domaine
│   ├── auth/            # Authentification
│   ├── ui/              # État UI global
│   └── quiz/            # Session de quiz (timer, réponses)
├── hooks/                # Custom hooks
├── lib/                  # Utils et validators
├── pages/                # Pages de l'application
│   ├── auth/
│   ├── dashboard/
│   ├── quiz/
│   └── admin/
├── routes/               # Configuration des routes
├── types/                # Types TypeScript
└── main.tsx             # Entry point
```

## Installation

```bash
cd client
npm install
```

## Développement

```bash
# Démarrer le serveur de développement
npm run dev

# L'application sera accessible sur http://localhost:5173
```

## Build

```bash
npm run build
```

## Fonctionnalités

### Authentification
- Login avec JWT
- Guards de routes par rôle
- Persistance du token

### Dashboard
- Statistiques personnelles
- Activité récente
- Accès rapide aux quiz

### Quiz (Étudiant)
- Liste des quiz disponibles par branche
- Passage de quiz avec timer
- Navigation entre questions
- Soumission et résultats

### Quiz (Enseignant)
- Création de quiz
- Ajout de questions avec choix multiples
- Gestion des branches cibles
- Visualisation des résultats

### Admin
- Gestion des utilisateurs (CRUD)
- Gestion des branches (CRUD)
- Pagination et recherche

## Architecture RTK Query

Les appels API sont gérés via RTK Query avec :
- **BaseApi** : Configuration centrale avec JWT dans les headers
- **Endpoints** : Auth, Users, Quiz, Branch, Results
- **Tags** : Invalidation automatique du cache
- **Optimistic Updates** : Pour une UI réactive

## Rôles utilisateurs

- **Student** : Passer les quiz, voir ses résultats
- **Teacher** : Créer/modifier des quiz, voir les résultats
- **Parent** : Voir les résultats de ses enfants
- **Administrateur** : Gestion complète des utilisateurs et branches
