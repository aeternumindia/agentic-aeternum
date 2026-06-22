# Aeternum AI — Build Plan

## Status Legend
- [ ] Not started
- [x] Done
- [~] In progress

---

## Phase 1: Foundation

- [x] Project scaffolding (Next.js, TypeScript, Tailwind, shadcn)
- [x] Brand tokens in `globals.css`
- [x] `cn()` utility
- [x] AppShell layout (header / main / footer zones)
- [x] shadcn/ui primitives (Button, Card, Input, Textarea, ScrollArea, Avatar, Badge, Skeleton)
- [x] Define chat types (`src/types/chat.ts`)
- [x] Define product types (`src/types/product.ts`)
- [x] Define application constants (`src/constants/index.ts`)
- [x] Wire up React Query provider (`src/app/providers.tsx`)
- [x] Create app state machine (`src/contexts/app-state.tsx`)
- [x] Wire providers into root layout
- [x] Update layout metadata for Aeternum branding

## Phase 2: Chat System

- [x] `useChat` hook (`src/hooks/use-chat.ts`)
- [x] `ChatPage` component
- [x] `MessageList` component
- [x] `ChatHeader` component
- [x] `PromptCards` component
- [x] Wire up `ChatInput` with actual input/output
- [x] Wire up `ChatPanel` to render chat page + message list
- [x] Mock chat service (`src/services/chat.ts`)

## Phase 3: Product System

- [x] `ProductCard` component
- [x] `ProductCarousel` component
- [x] `ContextPanel` — display product recommendations in sidebar
- [x] Mock product data (`src/lib/mock-data.ts`) — 6 products across categories
- [x] Mock product recommendation logic (keyword-based matching)

## Phase 4: Application States

- [x] Discovery / landing state — shopping goal cards
- [x] Recommendations state — occasion → product results
- [x] Measurements state — measurement input form
- [x] Customization state — size & color picker
- [x] Cart state — review cart with items & total
- [x] Checkout state — confirmation screen with restart
- [x] State-driven ContextPanel (shows different content per state)
- [x] ChatPanel orchestrates state transitions + screens

## Phase 5: API & AI Integration

- [x] API service layer (`src/services/api.ts`) — axios client to localhost:3001
- [x] Shopify Storefront proxy integration — Pinecone seeded with 54 products, 24 pages, 10 collections
- [x] Gemini AI integration — chat endpoint uses RAG (Pinecone + Gemini) for product-aware responses
- [x] Chat service updated to call real API with mock fallback
- [x] Product results render inline in message list
- [x] Proxy server running on port 3001 (restart with: `cd company/AETERNUM_ALL/aeternum-virtual-try-on-proxy && PORT=3001 node dist/index.js`)

## Phase 6: Polish

- [x] Error handling — error state in useChat, error banner in ChatPanel, form validation on measurements
- [x] Responsive / mobile layout — responsive padding, sidebar hidden on mobile, product cards scale down
- [x] Animations — message-in (fade+slide), fade-in, bouncing loading dots
- [x] Update README for Aeternum branding
- [x] Lint & typecheck pass (builds clean)
