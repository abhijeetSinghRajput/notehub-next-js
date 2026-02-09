This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
app/
├─ layout.tsx                    # ThemeProvider, Toaster, Tooltip, etc
├─ page.tsx                      # "/" (Home page)
├─ not-found.tsx
├─ globals.css
├─ favicon.ico
│
├─ (auth)/                       # URL does NOT include "(auth)"
│  ├─ signup/
│  │  └─ page.tsx                # /signup
│  ├─ login/
│  │  └─ page.tsx                # /login
│  ├─ forgot-password/
│  │  └─ page.tsx                # /forgot-password
│  └─ oauth/
│     └─ callback/
│        └─ page.tsx             # /oauth/callback
│
├─ privacy-policy/
│  └─ page.tsx                   # /privacy-policy
│
├─ note/                         # PROTECTED
│  └─ [id]/
│     ├─ page.tsx                # /note/:id
│     └─ editor/
│        └─ page.tsx             # /note/:id/editor
│
├─ settings/                     # PROTECTED
│  ├─ layout.tsx                 # auth guard + settings shell
│  ├─ appearance/
│  │  └─ page.tsx                # /settings/appearance
│  ├─ profile/
│  │  └─ page.tsx                # /settings/profile
│  ├─ photos/
│  │  └─ page.tsx                # /settings/photos
│  └─ security/
│     └─ page.tsx                # /settings/security
│
├─ [username]/                   # PUBLIC USER ROUTES
│  ├─ page.tsx                   # /:username
│  └─ [collectionSlug]/
│     ├─ page.tsx                # /:username/:collectionSlug
│     └─ [noteSlug]/
│        └─ page.tsx             # /:username/:collectionSlug/:noteSlug
│
├─ api/
│  └─ og/
│     └─ route.tsx               # dynamic OG images
│
└─ stores/                       # zustand (client only)
```