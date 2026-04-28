# Cultural Transcreation App

AI-powered image transcreation using GPT-4V (analysis) + DALL-E 3 (generation).

## Project Structure
```
transcreation-app/
├── client/          ← React frontend (Vite)
│   └── src/App.jsx
└── server/          ← Express backend
    └── index.js
```

---

## Local Development

### 1. Backend
```bash
cd server
npm install
OPENAI_API_KEY=sk-your-key npm run dev
# Runs on http://localhost:3001
```

### 2. Frontend
```bash
cd client
npm install
npm run dev
# Runs on http://localhost:5173
```
The Vite dev server proxies `/api` → `localhost:3001` automatically.

---

## Deployment (Free Hosting)

### Backend → Railway (free tier)
1. Go to https://railway.app and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Push your `server/` folder to a GitHub repo
4. Set environment variable: `OPENAI_API_KEY = sk-your-key`
5. Railway auto-detects Node.js and deploys
6. Copy your Railway URL (e.g. `https://your-app.railway.app`)

### Frontend → Vercel (free tier)
1. Go to https://vercel.com and sign up
2. Click "New Project" → import your GitHub repo (client folder)
3. Set environment variable:
   `VITE_API_URL = https://your-app.railway.app`
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy!

---

## How It Works

1. **Upload image** → sent to Express server
2. **GPT-4V** analyzes the image, identifies cultural elements, generates a DALL-E prompt
3. **DALL-E 3** generates the transcreated image
4. Frontend displays side-by-side comparison + cultural mapping table

## Cost Estimate
- GPT-4V: ~$0.01–0.03 per image analysis
- DALL-E 3 HD: ~$0.08 per generated image
- Total: ~$0.10–0.12 per transcreation
