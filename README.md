# Aeternum AI
 
A conversational AI shopping assistant for Aeternum India — a personal stylist that helps customers discover products, receive sizing recommendations, customize garments, and complete purchases.

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend**: Express proxy layer (Gemini AI, Shopify Storefront API, Pinecone vector DB)
- **AI**: Google Gemini 2.5 Flash
- **Commerce**: Shopify (54+ products, pages, collections)
- **Database**: Pinecone (vector search), Firebase (auth), PostgreSQL

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Start the proxy backend (separate terminal)
cd company/AETERNUM_ALL/aeternum-virtual-try-on-proxy
PORT=3001 node dist/index.js
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Application States

The UI is driven by 7 states: `landing` → `discovery` → `recommendations` → `measurements` → `customization` → `cart` → `checkout`

## Architecture

```
src/
├── app/          # Next.js pages, layout, providers
├── components/   # UI components (chat, product, screens, layout)
├── hooks/        # Custom hooks (useChat, useAppState)
├── services/     # API client, chat service
├── constants/    # App states, shopping goals, occasions
├── types/        # TypeScript types (chat, product)
├── lib/          # Utilities, mock data
└── contexts/     # React contexts (app state)
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npx eslint .` | Lint check |

## Design

- **Colors**: Black, Navy, Coral, Beige, Mustard
- **Style**: Premium, minimalist, fashion-oriented
- **Font**: Geist (Vercel)

---

## Virtual Try-On Standalone Page — Build Plan

A separate `/virtual-try-on` page where users browse real storefront products, build outfits (Top + Bottom pair), input measurements, and see fit visualizations.

### User Flow

```
Step 1: Category Pick → Step 2: Browse Tops → Step 3: Browse Bottoms → Step 4: Outfit Review → Step 5: Measurements → Step 6: Try-On Preview → Add to Cart
```

### Storefront Categories (fetched at runtime from Shopify)

| Tops | Bottoms |
|------|---------|
| Oversized T-Shirts | Trouser |
| Shirts | |
| Polos | |

Collections: Shirts, Women's Collection, Polos, Linen Essentials, Printed Classics, Relaxed Oversized, Signature Formals, Tailored Trousers, Trending.

### Architecture

```
src/app/virtual-try-on/
  layout.tsx                — Sidebar with step tracker
  page.tsx                  — Client entry point

src/types/
  outfit.ts                 — OutfitPair (Top + Bottom), TryOnFlowStep

src/contexts/
  outfit-builder.tsx        — Manages selected Top, Bottom, sizes, colors, measurements

src/services/
  outfit-api.ts             — Fetch products by type from Shopify products.json

src/components/virtual-try-on/
  try-on-flow.tsx           — Multi-step state machine orchestrator
  step-category-select.tsx  — Pick Tops or Bottoms first
  step-product-browser.tsx  — Browse products by type, select one
  outfit-card.tsx           — Side-by-side Top + Bottom preview
  step-measurements.tsx     — Body measurement form
  step-try-on-preview.tsx   — Silhouette + fit scores + AI Preview toggle
  silhouette-view.tsx       — SVG mannequin with garment overlay zones
  fit-score-gauge.tsx       — Animated circular gauge (reused from chat screen)
  ai-preview-panel.tsx      — AI-generated try-on image (via Gemini proxy)
```

### Data Flow

1. Page loads → fetch `products.json?limit=250` from Shopify (public, no auth)
2. Group products by `product_type` into Tops and Bottoms
3. User picks a type → show filtered products
4. User selects one Top + one Bottom → outfit pair
5. User inputs measurements → fit calculation (existing service)
6. Preview: silhouette with per-garment fit scores + AI Preview button
7. "Add Both to Cart" → variant lookup → Shopify cart

### AI Preview

- "Generate AI Preview" button → calls Gemini via proxy endpoint
- Loading state: shimmer skeleton on silhouette
- Success: display AI-generated model image wearing the outfit
- Fallback: silhouette view remains if AI unavailable

### Implementation Order

| # | Step | Files |
|---|------|-------|
| 1 | Types | `src/types/outfit.ts` |
| 2 | Context | `src/contexts/outfit-builder.tsx` |
| 3 | API service | `src/services/outfit-api.ts` |
| 4 | Layout | `src/app/virtual-try-on/layout.tsx` |
| 5 | Page | `src/app/virtual-try-on/page.tsx` |
| 6 | Flow orchestrator | `try-on-flow.tsx` |
| 7 | Steps 1-3: Category + Browse | `step-category-select.tsx`, `step-product-browser.tsx` |
| 8 | Step 4: Outfit Review | `outfit-card.tsx` |
| 9 | Step 5: Measurements | `step-measurements.tsx` |
| 10 | Step 6: Try-On Preview | `step-try-on-preview.tsx`, `silhouette-view.tsx`, `fit-score-gauge.tsx`, `ai-preview-panel.tsx` |
| 11 | Add top-level nav link | Update `app-shell.tsx` |
| 12 | Polish | Typecheck + lint |
