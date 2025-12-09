# Quizzer Frontend

React + TypeScript + TailwindCSS frontend for the Quizzer application.

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **TailwindCSS** - Styling
- **React Router** - Routing
- **Axios** - HTTP client
- **TanStack Query** - Data fetching & caching
- **Lucide React** - Icons

## Features

- Google OAuth Authentication
- AI-powered quiz generation
- Smart flashcard creation
- Learning streak tracking
- Leaderboard system
- Daily/Weekly/Monthly challenges
- Personalized recommendations

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Update .env with your backend URL
VITE_API_BASE_URL=http://localhost:3000
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

The app will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/        # Reusable components
│   ├── Layout.tsx
│   ├── Navigation.tsx
│   ├── ProtectedRoute.tsx
│   ├── QuizGenerator.tsx
│   ├── QuizList.tsx
│   ├── FlashcardGenerator.tsx
│   └── FlashcardSetList.tsx
├── contexts/         # React contexts
│   └── AuthContext.tsx
├── pages/            # Page components
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── QuizPage.tsx
│   ├── FlashcardsPage.tsx
│   ├── LeaderboardPage.tsx
│   └── ChallengesPage.tsx
├── services/         # API services
│   ├── api.ts
│   ├── auth.service.ts
│   ├── quiz.service.ts
│   ├── flashcard.service.ts
│   └── index.ts
├── types/            # TypeScript types
│   └── index.ts
├── config/           # Configuration
│   └── api.ts
├── App.tsx           # Main app component
└── main.tsx          # Entry point
```

## Environment Variables

- `VITE_API_BASE_URL` - Backend API URL (default: http://localhost:3000)

## API Integration

The frontend communicates with the NestJS backend through RESTful APIs. All API calls are handled through service files in the `services/` directory.

Authentication tokens are stored in localStorage and automatically attached to requests via Axios interceptors.

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

# quizzer-frontend
