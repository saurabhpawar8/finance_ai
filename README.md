# FinanceAI Frontend

## Setup (one time only)

1. Install Node.js from https://nodejs.org (LTS version)
2. Open a terminal in this folder
3. Run: `npm install`
4. Copy `.env.local.example` to `.env.local`

## Run locally

```
npm run dev
```

Open http://localhost:3000 in your browser.

> Make sure your backend is running on http://localhost:8000

## Deploy to Vercel

1. Push this folder to GitHub
2. Go to vercel.com → Import project → Select your repo
3. Add environment variable: `NEXT_PUBLIC_API_URL` = your deployed backend URL
4. Click Deploy
