# Emergency Response Dashboard Setup

## Overview
The dashboard is a Mapbox-powered interface for real-time emergency response monitoring and dispatch coordination.

## Mapbox Configuration

### 1. Get Your Mapbox Access Token
1. Visit [Mapbox Account](https://account.mapbox.com/access-tokens/)
2. Sign up for a free account if you don't have one
3. Create a new access token or use your default public token
4. Copy your access token

### 2. Environment Setup
Create a `.env.local` file in the frontend directory with:

```bash
# Mapbox Configuration
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_actual_token_here

# Dashboard Configuration (optional)
NEXT_PUBLIC_DEFAULT_LAT=40.705441
NEXT_PUBLIC_DEFAULT_LNG=-74.012499
NEXT_PUBLIC_DEFAULT_ZOOM=12
```

### 3. Features
- **Interactive Map**: Full-screen Mapbox GL JS map
- **Emergency Services**: Markers for police, fire, and medical services
- **Real-time Coordinates**: Live display of current map position
- **Navigation Controls**: Zoom, rotate, and geolocate controls
- **Incident Tracking**: Panel showing active emergency incidents
- **Click Interactions**: Popup details for emergency service locations

### 4. Navigation
- **Home Page**: Contains the navbar and marketing content
- **Dashboard**: Clean interface without navbar for focused work
- **Routing**: Conditional navbar appears only on home page (`/`)

### 5. Map Styling
- Uses Mapbox Streets v12 style
- Emergency services color-coded:
  - 🔵 Police: Blue markers
  - 🔴 Fire: Red markers  
  - 🟢 Medical: Green markers

### 6. Development
Run the development server:
```bash
npm run dev
```

Then visit:
- Home: `http://localhost:3000/`
- Dashboard: `http://localhost:3000/dashboard`

## API Usage
The dashboard uses the free tier of Mapbox which includes:
- 50,000 map loads per month
- All core mapping features
- No credit card required for basic usage 