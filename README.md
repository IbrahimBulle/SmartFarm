# SmartFarm

SmartFarm is a React + Vite frontend for farm records, WeatherAI forecasts, usage quota, and image analysis.

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

- `POST /api/register`
- `POST /api/login`
- `GET /api/farms`
- `POST /api/farms`
- `PUT /api/farms/:id`
- `DELETE /api/farms/:id`

WeatherAI routes through `/weather-ai`:

- `GET /weather-ai/v1/weather`
- `POST /weather-ai/v1/trees/analyze`

Usage calls the real WeatherAI API directly:

- `GET https://api.weather-ai.co/v1/usage`

The app adds the WeatherAI bearer token from `WEATHER_AI_API`. It also adds the login JWT to protected backend farm routes.

## Scripts

- `npm run dev` - start development
- `npm run build` - build app
- `npm run lint` - run ESLint
- `npm run preview` - preview build

## Notes

- This repo is frontend only.
- Usage shows `Usage not working` if WeatherAI quota cannot load.
- SMS is not available on the free WeatherAI plan.
