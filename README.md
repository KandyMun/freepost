# gdlt hub

A home for the stuff I build. One React + Vite app, deployed to GitHub Pages at
`kandymun.github.io/gdlt-hub/`.

## Page layout

- `/` → the hub home page (pick an app)
- `/freepost` → freepost: a webpage for messing around with friends and doing the
  most unhinged stuff imaginable, quality may be below standard

Routing uses `BrowserRouter` (clean paths, no `#`); `dist/404.html` is a copy of
`index.html` so GitHub Pages deep-links fall back to the app. Discord auth is shared
across the whole hub via a single callback at `/gdlt-hub/auth/discord`, landing back
on the home page after sign-in.

## Add an app to the hub

Edit the `apps` array in `src/components/HomePage.tsx`, then add its routes under
`src/App.tsx` (a new `<Route path="/thing/*" .../>` alongside freepost).

## Deploy

Push to `master` — `.github/workflows/deploy.yml` builds the app and publishes
`dist/` to GitHub Pages. Repo must be named `gdlt-hub`; Pages source = GitHub Actions.

## Local dev

```bash
npm install
npm run dev      # local preview
npm run build    # production build -> dist/
```
