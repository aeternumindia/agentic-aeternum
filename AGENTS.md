<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
# AGENTS.md

## Project

Aeternum AI is a customer-facing AI shopping assistant for Aeternum India.

The goal is to help customers discover products, receive sizing recommendations, customize garments, and complete purchases through a conversational interface.

This project is not a generic chatbot. It is a personal stylist for fashion commerce.

---

## Product Vision

The AI should behave as a luxury personal stylist.

The AI should:

* Help customers discover products
* Recommend products based on occasion and preferences
* Recommend sizes based on measurements
* Assist with garment customization
* Build carts
* Help customers reach checkout

The AI should not:

* Act as a general-purpose assistant
* Answer unrelated questions
* Provide medical, legal, or financial advice
* Behave like customer support unless specifically handling order tracking

---

## Tech Stack

Frontend:

* Next.js 15
* TypeScript
* Tailwind CSS v4
* shadcn/ui

Backend:

* Node.js
* Existing Proxy Layer

Commerce:

* Shopify Storefront API
* Shopify Admin API

AI:

* Gemini

Database:

* PostgreSQL

---

## Design System

Brand Colors:

Black: #000000
Navy Blue: #0C1926
Coral Red: #8C3A3F
White: #FFFFFF
Beige: #EAE3D6
Mustard: #8B5E3A

The application should feel premium, minimalist, and fashion-oriented.

Avoid SaaS-style dashboards.

---

## Application States

landing

discovery

recommendations

measurements

customization

cart

checkout

The UI should be driven by application state.

---

## Frontend Architecture

Components should be small and composable.

Preferred structure:

src/
app/
components/
hooks/
services/
lib/
types/

Avoid large files.

Prefer reusable components.

---

## Code Standards

* Use TypeScript everywhere.
* Use functional React components.
* Use named exports.
* Avoid default exports except Next.js page files.
* Prefer server components unless client state is required.
* Keep components under 200 lines when possible.
* Use Tailwind utility classes.
* Avoid inline styles.

---

## Styling Rules

* Use design tokens from globals.css.
* Do not hardcode colors.
* Use semantic color variables:
  bg-background
  text-foreground
  bg-card
  text-muted-foreground

---

## AI Features

Future AI capabilities:

* Product Search
* Product Recommendation
* Size Recommendation
* Cart Creation
* Order Tracking

The frontend should be designed to support these capabilities but should not implement them until the UI flow is complete.

---

## Current MVP Goal

A customer should be able to:

1. Select a shopping goal
2. Describe an occasion
3. Receive product recommendations
4. Receive sizing guidance
5. Customize garments
6. Add products to cart
7. Proceed to checkout

The first implementation should use mocked data before integrating Gemini or Shopify.

---

## UCP Integration (Universal Commerce Protocol)

Aeternum's store has UCP fully enabled at `https://e8j3xx-qz.myshopify.com/api/ucp/mcp`.

Capabilities: catalog.search, catalog.lookup, cart, checkout, fulfillment, discount, order, identity_linking

Payment handlers: Google Pay, Shop Pay, card payments

### Architecture (separate from Pinecone flow)

```
User → Chat
    ├── /api/customer-service/chat  (Pinecone + Gemini function calling — unchanged)
    └── /api/ucp/chat               (UCP + Gemini — new, independent)
```

### New Backend Files (zero changes to existing)

- `src/services/ucpService.ts` — Pure HTTP JSON-RPC client to Shopify UCP MCP servers
  - `searchCatalog(query, filters)` → `search_catalog` MCP tool
  - `getProduct(id, selected)` → `get_product` MCP tool (full variant detail)
  - `lookupCatalog(ids)` → batch resolution
  - `createCart(lineItems)` → `create_cart` (needs Token-tier auth)
  - `getCart(cartId)` → `get_cart`
  - `createCheckout(cartId)` → `create_checkout` (returns `continue_url` for payment handoff)
  - `discoverMerchant()` → fetches `/.well-known/ucp`
  - Helper: `extractStructuredContent()` — parses MCP `content[].text` JSON
  - Helper: `convertUcpProduct()` — maps UCP product shape to `ProductData`
  - Prices converted from minor units (paise) to rupees

- `src/services/ucpGeminiService.ts` — Gemini + UCP function calling
  - System prompt for UCP-powered product discovery
  - Function declarations: `search_ucp_catalog`, `add_to_ucp_cart`, `create_ucp_checkout`
  - Same iterative function calling loop pattern as `geminiChatService.ts`
  - Returns `{ response, products, cartId, checkoutUrl }`

- `src/routes/ucp.ts` — Standalone UCP routes
  - `POST /api/ucp/chat` — Full UCP-powered shopping chat
  - `POST /api/ucp/search` — Direct catalog search
  - `POST /api/ucp/search-direct` — Quick search (no Gemini)
  - `GET /api/ucp/status` — UCP connection health check

### New Frontend Files

- `src/services/ucpApi.ts` — API client for `/api/ucp/*`
- `src/hooks/use-ucp-chat.ts` — Hook mirroring `use-chat.ts` but calls UCP endpoint

### Current Limitations (requires Token-tier auth)
- `create_cart` / `create_checkout` — anonymous tier doesn't allow cart creation; need UCP_CLIENT_ID + UCP_CLIENT_SECRET
- `get_product` with variant selection — works for read, but confirmed pricing requires auth

### Prices
- All UCP amounts in minor units (paise for INR): `195920` → `₹1,959.20`
- Product-level `price_range.min/max` and variant-level `price.amount`

### Key UCP Response Structure
```
Product: { id, title, handle, url, description.html, price_range, media[], variants[] }
Variant: { id, sku, title, price.amount, availability.available, options[], media[] }
Cart:    { id, line_items[], totals, continue_url }
```

### UCP Config (optional, not needed for read-only search)
```env
UCP_CLIENT_ID=...
UCP_CLIENT_SECRET=...
UCP_AGENT_PROFILE=https://shopify.dev/ucp/agent-profiles/2026-04-08/valid-with-capabilities.json
UCP_ENABLED=true
```
