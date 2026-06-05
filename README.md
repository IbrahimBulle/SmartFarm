# SmartFarm

SmartFarm is a React + Vite frontend for farm records, WeatherAI forecasts, usage quota, and image analysis.

the frontend is in netlify https://sunny-gecko-29a6bf.netlify.app/
and the backend is in render https://smartfarmbackend-ypqi.onrender.com

## Needed

- Node.js and npm
- Backend running at `http://127.0.0.1:8080`
- WeatherAI token in `/home/ibra/workspace/SmartFarmBackend/.env`

```env
WEATHER_AI_API=your_weather_ai_token
```

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

WeatherAI routes used by the frontend:

- `GET https://api.weather-ai.co/v1/weather` - fetch current weather and multi-day forecast
- `GET https://api.weather-ai.co/v1/usage` - fetch usage and quota data
- `POST https://api.weather-ai.co/v1/trees/analyze` - submit farm image analysis

The app reads the WeatherAI bearer token from `localStorage` using one of these keys:

- `smartfarm_token`

The backend is still used for farm CRUD and auth. The login JWT is sent to protected backend routes under `https://smartfarmbackend-ypqi.onrender.com`.

## Scripts

- `npm run dev` - start development
- `npm run build` - build app
- `npm run lint` - run ESLint
- `npm run preview` - preview build

## Notes

- This repo is frontend only.
- Usage shows `Usage not working` if WeatherAI quota cannot load.
- SMS is not available on the free WeatherAI plan.
