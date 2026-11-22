# Skylight Weather

A responsive weather dashboard built with Next.js and TypeScript. It includes city search, current conditions, a 12-hour outlook, a 7-day forecast, local sunrise/sunset times, and a Celsius/Fahrenheit switch.

Weather and location search are provided by [Open-Meteo](https://open-meteo.com/). The app uses its public forecast and geocoding endpoints, so no API key or environment variables are needed for this starter project. Add attribution when redistributing or publishing the app.

## Run locally

Requirements: Node.js 18.18 or newer and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

1. Create a GitHub repository and upload the contents of this project folder.
2. In Vercel, choose **Add New → Project**, then import that repository.
3. Keep the detected framework as **Next.js** and the build command as `next build`.
4. Click **Deploy**. No environment variables are required.

You can also run `npx vercel` from this folder and follow the prompts.

## Customize

- Change the initial city and coordinates in `src/app/page.tsx` (`DEFAULT_PLACE`).
- Adjust colors, spacing, and responsive layout in `src/app/globals.css`.
- Update the site title and description in `src/app/layout.tsx`.

## Project structure

```text
src/app/
  globals.css   Responsive dashboard styles
  layout.tsx    App metadata and root layout
  page.tsx      Weather search, API calls, and dashboard
```
