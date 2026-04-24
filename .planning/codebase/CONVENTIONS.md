# Coding Conventions

**Analysis Date:** 2026-04-24

## Naming Patterns

**Files:**
- Components: PascalCase (e.g., `MassScout.tsx`, `App.tsx`)
- Services: camelCase (e.g., `gemini.ts`, `geminiScout.ts`)
- Types/interfaces: PascalCase (e.g., `types.ts` containing `AnalysisStep`, `Opportunity`)
- Templates: PascalCase with Template suffix (e.g., `GenericPPLTemplate.ts`)
- Library files: camelCase (e.g., `firebase.ts`)

**Functions:**
- Exported async functions: camelCase with descriptive verb-first pattern (e.g., `generatePplPlan`, `estimateCpc`, `analyzeDemand`, `brainstormServices`)
- React component functions: PascalCase (e.g., `MassScout`, `App`)
- Utility/helper functions: camelCase (e.g., `handleAnalyzeIntelligence`, `toggleCity`, `updateStep`)
- Event handlers: camelCase with `handle` prefix (e.g., `handleStartAnalysis`, `handleAnalyzeIntelligence`, `handleImportCloudflare`)

**Variables:**
- State variables: camelCase (e.g., `isAnalyzing`, `selectedCities`, `finalReport`, `niche`, `city`)
- Constants: camelCase for object/array constants (e.g., `initialSteps`, `ITALIAN_CITIES`)
- Class instances and objects: camelCase (e.g., `serviceCpcMap`, `competitorAnalysisInstruction`)

**Types/Interfaces:**
- Enums: PascalCase with SCREAMING_SNAKE_CASE values (e.g., `StepStatus.PENDING`, `StepStatus.RUNNING`)
- Interface names: PascalCase (e.g., `AnalysisStep`, `ServiceCpc`, `ServiceTrend`, `Opportunity`, `FirestoreErrorInfo`)
- Type aliases: PascalCase (e.g., `ClassValue`)

## Code Style

**Formatting:**
- No explicit formatter configured (no Prettier, ESLint, or Biome config found)
- 2-space indentation observed throughout codebase
- Single quotes preferred in JavaScript/TypeScript strings (observed in imports: `'firebase/auth'`)
- Semicolons used consistently at end of statements
- Lines typically 100-120 characters wide

**Linting:**
- Only TypeScript compiler (`tsc --noEmit`) configured in `package.json` scripts as "lint"
- No ESLint or Prettier configuration detected
- TypeScript strict settings: `skipLibCheck: true`, `isolatedModules: true`, `allowJs: true`, `noEmit: true`
- JSX syntax: `react-jsx` mode enabled in tsconfig

## Import Organization

**Order:**
1. External libraries (React, motion, lucide-react, Google libraries)
2. Firebase imports
3. Internal services (gemini, geminiScout)
4. Internal types and interfaces
5. Utility functions (clsx, twMerge)
6. JSON data files and components

**Example from `App.tsx`:**
```typescript
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { /* Icons */ } from 'lucide-react';
import { auth, signInWithGoogle, signOut, db, handleFirestoreError } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { generatePplPlan, researchNiche, generateSiteContent, analyzeCloudflareSite } from './services/gemini';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ReactMarkdown from 'react-markdown';
import { MassScout } from './components/MassScout';
```

**Path Aliases:**
- `@/*` maps to project root (defined in `tsconfig.json`)
- Currently used rarely; most imports use relative paths

## Error Handling

**Patterns:**
- Try-catch blocks with error logging to console
- Console.error used for debugging (e.g., `console.error(e)` in `App.tsx:48`, `MassScout.tsx:98`)
- User-facing alerts via `alert()` for error messages (e.g., `alert('Errore durante l\'analisi. Verifica la API Key e riprova.')`)
- Custom error handler `handleFirestoreError` in `firebase.ts` for Firestore permission errors
- Error objects passed to handlers as `any` type (loose typing)
- Fallback values using optional chaining and nullish coalescing (e.g., `response.text || '{}'`)

**Example from `firebase.ts`:**
```typescript
export const handleFirestoreError = (error: any, operationType: FirestoreErrorInfo['operationType'], path: string | null = null) => {
  if (error.code === 'permission-denied') {
    const errorInfo: FirestoreErrorInfo = {
      error: error.message,
      operationType,
      path,
      authInfo: { /* ... */ }
    };
    throw new Error(JSON.stringify(errorInfo));
  }
  throw error;
};
```

## Logging

**Framework:** `console` (no logging library)

**Patterns:**
- Direct `console.error()` calls for exceptions (used in `App.tsx`, `MassScout.tsx`, `firebase.ts`)
- Alert dialogs for user feedback: `alert('message')` in form submissions and error states
- No structured logging; error messages are contextual strings
- Fallback logging in connection test: `console.error("Please check your Firebase configuration.");`

## Comments

**When to Comment:**
- Sparse commenting observed; most code is self-documenting through function and variable naming
- Comments appear mainly in configuration or workflow explanation
- Long prompt strings in API calls are inline without wrapping comments

**JSDoc/TSDoc:**
- Minimal JSDoc usage observed
- No TSDoc headers on functions
- Type annotations used instead of JSDoc for typing (example: `async function brainstormServices(): Promise<string[]>`)

## Function Design

**Size:**
- Functions are typically 10-50 lines for async service functions
- Component render functions range 100-400+ lines due to JSX complexity
- Handlers and callbacks kept concise (5-20 lines)

**Parameters:**
- Named parameters for clarity (e.g., `generatePplPlan(niche: string, location: string, gmbUrl?: string)`)
- Optional parameters with `?` symbol (e.g., `gmbUrl?: string`)
- Destructuring used in React hooks (e.g., `const { id, status, result } = step`)
- Rest parameters for className utilities (e.g., `function cn(...inputs: ClassValue[])`)

**Return Values:**
- Explicit return types on async functions (e.g., `Promise<string[]>`, `Promise<Opportunity[]>`)
- JSON parsing with fallback: `return JSON.parse(response.text || '{}')` pattern used consistently
- Component functions return JSX/React.ReactNode via implicit typing

## Module Design

**Exports:**
- Named exports for functions (e.g., `export const generatePplPlan = async (...)`)
- Named exports for components (e.g., `export function MassScout()`)
- Default export for main App component: `export default function App()`
- Barrel exports from services (e.g., `import * as geminiScout from '../services/geminiScout'`)

**Barrel Files:**
- Not extensively used
- Single-purpose files: `types.ts` exports all interfaces, `firebase.ts` exports all Firebase utilities, services are individual files

---

*Convention analysis: 2026-04-24*
