# LifeWithLLM

A private personal AI assistant that runs on **your own local LLM** (LM Studio,
Ollama, llama.cpp, vLLM, or any OpenAI-compatible endpoint) and helps you
research the web, compare prices, find coupons, and draft social posts in your
own writing style.

## What it does

- **Chat** — private assistant conversations against a local model.
- **Research agent** — searches the web (Exa), reads sources, and returns a
  cited markdown report synthesized by your local model.
- **Price comparison** — compares a product across retailers.
- **Coupon finder** — finds promo codes for a store.
- **Post in your style** — learns your writing voice from samples and drafts
  posts for X, LinkedIn, Facebook Pages, Instagram, and Reddit.
- **Background jobs** — every run is tracked, and scheduled posts are processed
  by a Convex cron. Platform publishing is enabled once OAuth credentials are configured.

## Architecture

- **Frontend** — React 19 + Vite + Tailwind, shadcn-style UI, Framer Motion.
- **Backend** — Convex (schema, queries, mutations, Node actions, crons).
- **Auth** — Convex Auth (email + password).
- **LLM calls happen in the browser** so they can reach `localhost` on your
  machine. Secret-requiring web calls (Exa) run server-side in a Convex action.

## Stack & scripts

| Command                 | What it does                              |
| ----------------------- | ----------------------------------------- |
| `bun install`           | Install dependencies                      |
| `bun run dev`           | Start the Vite dev server (port 5173)     |
| `bun run dev:convex`    | Start `convex dev` (backend)              |
| `bun run build`         | `tsc -b && vite build` (static `dist/`)   |
| `bun run typecheck`     | `tsc -b --noEmit`                         |
| `bun run generate:keys` | Generate the Convex Auth JWT keypair      |
| `bun run desktop:build` | Build installable macOS, Windows, or Linux artifacts |
| `bun run desktop:dir` | Create an unpacked desktop build for smoke testing |

## Setup

1. **Convex backend** — `bun run dev:convex` (or let the Freebuff preview run
   it). It writes `VITE_CONVEX_URL` to `.env.local` automatically.
2. **Auth keys** — run `bun run generate:keys` and add both `JWT_PRIVATE_KEY`
   and `JWKS` to your Convex deployment env vars (Keys / API keys UI). Sign-in
   won't work until these are set.
3. **Web research** — add `EXA_API_KEY` (from <https://dashboard.exa.ai>) to
   enable Research, Price comparison, and Coupon finder.
4. **Local LLM** — open the app, go to **Settings**, pick your provider
   (LM Studio defaults to `http://localhost:1234`), and select a model. The
   browser reaches your local server directly.

> Note: because LLM calls are client-side, a local server on your machine is
> reachable without a tunnel when you run the app locally or in a preview that
> can reach `localhost`. To call your LLM from a cloud-hosted deployment, expose
> it through a tunnel and set that URL in Settings.

## Production checklist

Before inviting real users:

1. **Convex deployment** — set `CONVEX_SITE_URL`, `JWT_PRIVATE_KEY`, and `JWKS`
   in the Convex deployment environment.
2. **Web build environment** — set `VITE_CONVEX_URL` to the production Convex
   URL. The app fails fast with a clear error if it is missing.
3. **Research key** — set `EXA_API_KEY` in Convex to enable web research, price
   comparison, and coupons.
4. **Static hosting** — run `bun run build` and serve the generated `dist/`
   directory. Do not use `vite preview` as the production server.
5. **Desktop signing** — run `bun run desktop:build` on each target OS. macOS
   builds should be signed/notarized and Windows installers should be signed
   before public distribution.

### Desktop executables

The optional Electron shell keeps Node integration disabled, enables context
isolation and sandboxing, opens external links in the system browser, and loads
the same Vite build as the web app. The desktop build uses hash routing so
navigation works from a packaged local `index.html`.

Build artifacts are written to `release/`:

```bash
bun run desktop:build
```

Build on the operating system you intend to distribute for. Cross-building
macOS, Windows, and Linux installers is not guaranteed by Electron Builder and
may require platform-specific signing infrastructure.

## Social publishing roadmap

Drafting, style learning, scheduling, and the review workflow are implemented.
The current `Publish now` and scheduled cron flow record the reviewed post state;
actual network publishing requires each platform's OAuth/API access and should
be enabled only after the corresponding credentials and scopes are configured:

- **X** — X API (paid tier) OAuth 2.0.
- **LinkedIn** — LinkedIn API app with `w_member_social` scope.
- **Facebook Pages / Instagram** — Meta Graph API (Business app, Page token).
- **Reddit** — Reddit OAuth (free) with `submit` scope.

The `connectedAccounts` table and post pipeline are in place so each provider
can be wired in without schema changes.
