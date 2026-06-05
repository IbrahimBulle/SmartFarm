# SmartFarm

SmartFarm is a React + Go farm dashboard for farm records, WeatherAI forecasts, usage tracking, and farm image analysis.

## Live Links

- Frontend: https://sunny-gecko-29a6bf.netlify.app/
- Backend API: https://smartfarmbackend-ypqi.onrender.com

## Features

- Register and log in with JWT auth.
- Create, view, update, and delete farms.
- Save each user's WeatherAI API key in the backend database.
- Fetch weather forecasts through the backend.
- Track WeatherAI usage/quota.
- Upload farm images for tree and health analysis.

## Project Structure

```text
SmartFarm/                 # React + Vite frontend
SmartFarmBackend/          # Go + Chi + SQLite backend
```

## Frontend Setup

```bash
git clone https://github.com/IbrahimBulle/SmartFarm
cd /SmartFarm
npm install
```

Create `.env`:

```env
VITE_BACKEND_URL=http://127.0.0.1:8080
```

For production/hosted backend:

```env
VITE_BACKEND_URL=https://smartfarmbackend-ypqi.onrender.com
```

Build:

```bash
npm run build
```

## Backend Setup

```bash
git clone https://github.com/IbrahimBulle/SmartFarmBackend
cd SmartFarmBackend
go mod download
```

Create `.env`:

```env
PORT=8080
DB_PATH=./farm.db
JWT_SECRET=replace-with-a-secure-secret
WEATHER_AI_BASE_URL=https://api.weather-ai.co/v1
```

Run locally:

```bash
go run ./internal/api
```

Health check:

```bash
curl http://127.0.0.1:8080/health
```

## How WeatherAI Works

Users enter their WeatherAI API key in the app. The frontend sends it once to the backend, and the backend stores it in SQLite. After that, the frontend only calls the SmartFarm backend.

WeatherAI endpoints used by the backend:

- `GET /v1/weather`
- `GET /v1/usage`
- `GET /v1/trees/quota`
- `POST /v1/trees/analyze`

## Main API Routes

Base URL:

```text
http://127.0.0.1:8080
```

or:

```text
https://smartfarmbackend-ypqi.onrender.com
```

Auth:

- `POST /register`
- `POST /login`
- `POST /logout`

Farms:

- `GET /farms`
- `POST /farms`
- `GET /farms/{id}`
- `PUT /farms/{id}`
- `DELETE /farms/{id}`

WeatherAI key:

- `GET /weather/key`
- `POST /weather/key`
- `DELETE /weather/key`

Weather:

- `GET /weather?lat=-0.7813&lon=35.3416&days=3&ai=true&units=metric&lang=en`
- `GET /weather/usage`
- `GET /weather/trees/quota`
- `POST /weather/trees/analyze`

Protected routes require:

```http
Authorization: Bearer YOUR_TOKEN
```

## Quick API Example

Login:

```bash
curl -X POST https://smartfarmbackend-ypqi.onrender.com/login \
  -H "Content-Type: application/json" \
  -d '{"email":"farmer@example.com","password":"Password123"}'
```

Save WeatherAI key:

```bash
curl -X POST https://smartfarmbackend-ypqi.onrender.com/weather/key \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"api_key":"YOUR_WEATHERAI_API_KEY"}'
```

Fetch weather:

```bash
curl "https://smartfarmbackend-ypqi.onrender.com/weather?lat=-0.7813&lon=35.3416&days=3&ai=true&units=metric&lang=en" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Deployment

Netlify frontend:

```env
VITE_BACKEND_URL=https://smartfarmbackend-ypqi.onrender.com
```

Render backend:

```env
JWT_SECRET=replace-with-a-secure-secret
DB_PATH=./farm.db
WEATHER_AI_BASE_URL=https://api.weather-ai.co/v1
```
