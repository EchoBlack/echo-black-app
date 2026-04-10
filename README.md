# Echo Black App

This package is prepared for phone-friendly deployment.

## Best path: Render

### 1) Put these files in a GitHub repo
You can create a repo named `echo-black-app` and upload everything in this folder.

### 2) Deploy on Render
- In Render, choose **New +** -> **Web Service**
- Connect your GitHub repo
- Render should detect the included `render.yaml`
- When prompted, add your secret:
  - `ANTHROPIC_API_KEY` = your Anthropic API key
- Deploy

### 3) Open on your phone
After deployment finishes, Render gives you a public URL. Open that URL on your iPhone and the app will work there.

## Included deployment files
- `render.yaml` - Render service config
- `.gitignore` - keeps secrets and clutter out of Git
- `server.js` - backend API proxy
- `public/index.html` - frontend app

## Local run
```bash
npm install
cp .env.example .env
# add your Anthropic key to .env
npm start
```
Then visit `http://localhost:3000`

## Important note
Do not put your Anthropic API key in the frontend or commit `.env` to GitHub.

## Nice next upgrades
- Add export/import for Vault and Archive
- Add PWA manifest + home screen install polish
- Add one-tap episode download
- Add topic presets and saved favorites
