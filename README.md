# SAILU RUN

A mobile-friendly 3D endless runner built with Next.js and Three.js.

## Run locally
1. Install Node.js (LTS).
2. Open this folder in a terminal.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open http://localhost:3000.

## Deploy to Vercel
1. Upload this project to a new GitHub repository.
2. In Vercel choose **Add New → Project** and import that repository.
3. Framework Preset: **Next.js**.
4. Root Directory: `./`.
5. Leave Install Command, Build Command and Output Directory at their defaults.
6. Click **Deploy**.

## Controls
- Left/right arrow keys or A/D: change lanes.
- Up arrow, W or Space: jump.
- On mobile: swipe left/right to change lanes; swipe up or tap the game to jump.
- The on-screen arrow and jump buttons also work.

The 3D runner character is generated from Three.js geometry, so no character image or external model file is required.
\n\nThe runner uses the supplied portrait in `public/sailu-face.png`. Keep this file in the `public` folder when deploying.\n