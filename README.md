# SmartFarm

SmartFarm is a React + Vite frontend for farm records, WeatherAI forecasts, usage quota, and image analysis.

the frontend is in netlify https://sunny-gecko-29a6bf.netlify.app/
and the backend is in render https://smartfarmbackend-ypqi.onrender.com

## Setup

- **Node.js** and npm
- **SmartFarm Backend** running at `http://127.0.0.1:8080` (or remote at `https://smartfarmbackend-ypqi.onrender.com`)
- **WeatherAI API key** saved per SmartFarm account through the backend:
  - The browser sends the key once to `POST /weather/key`
  - The backend stores it in SQLite and uses it for WeatherAI proxy requests
  - Get your free key at https://dashboard.weather-ai.co

### Free Tier Limits

- **1,000 requests/month**
- **200 AI requests/month** (for summaries)
- **7-day forecast** (add `?ai=false` to save AI quota)
- **5 image analyses/month** (tree counting & health)

## Run

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

## API

Backend routes through `/api`:

- `POST /register`
- `POST /login`
- `GET /farms`
- `POST /farms`
- `PUT /farms/:id`
- `DELETE /farms/:id`

WeatherAI proxy routes used by the frontend:

- `GET /weather/key` - check whether the signed-in user has a stored key
- `POST /weather/key` - save and validate the signed-in user's WeatherAI key
- `GET /weather` - fetch current weather and multi-day forecast
- `GET /weather/usage` - fetch usage and quota data
- `POST /weather/trees/analyze` - submit farm image analysis

## Architecture

**Frontend (React + Vite)**
- `src/components/` - Reusable UI components (AuthPage, FarmList, WeatherSection, ImageAnalysis)
- `src/services/` - API integrations (farmApi.js, weatherApi.js)
- `src/utils/` - Data formatters and utilities

**APIs**
- Backend (farm CRUD & auth) → `http://127.0.0.1:8080` or remote
- WeatherAI (weather, analysis) → SmartFarm backend proxy → `https://api.weather-ai.co/v1`

## Scripts

- `npm run dev` - start Vite dev server (http://localhost:5173)
- `npm run build` - build production bundle → `dist/`
- `npm run lint` - run ESLint checks
- `npm run preview` - serve built app locally

## Environment Variables (Optional)

```env
VITE_BACKEND_URL=https://smartfarmbackend-ypqi.onrender.com
```

Set this before building to override the default local backend.

## Notes

- Frontend only; requires running backend for farm CRUD
- WeatherAI API key must be saved to the signed-in SmartFarm account before using weather/image features
- Usage meter shows free tier quota (1000 req/mo, 200 AI req/mo, 5 analyses/mo)
- Supports responsive design for mobile and desktop
- Progress bar fills smoothly as usage increases
