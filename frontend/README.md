# 🏨 Hotel-Booking — Frontend

React (Vite) frontend for the Hotel-Booking MERN platform. Handles browsing hotels, filtering, room booking, authentication and the hotel-owner dashboard.

## Tech Stack

- React 19 + Vite 6
- React Router 7
- Axios (`src/api/api.js`) with `withCredentials: true`
- React Icons

## Getting Started

```bash
npm install
cp .env.example .env   # set VITE_API_BASE_URL to your backend
npm run dev            # http://localhost:5173
```

## Project Structure

```
src/
├── api/            # Axios instance
├── assets/         # Demo data + static images
├── components/     # Header, Hero, SearchBox, Filters, Cards, Pop-ups, Footer...
├── context/        # UserContext, HotelsDataContext, HotelDetailsContext
├── pages/          # All route pages
├── ProtectedRoutes/# Owner-only route guard
├── App.jsx         # Route definitions
└── main.jsx        # App entry
```

## Scripts

| Command            | Description             |
| ------------------ | ----------------------- |
| `npm run dev`      | Vite dev server         |
| `npm run build`    | Production build        |
| `npm run lint`     | ESLint check            |
| `npm run preview`  | Preview production build|

See the root [`README.md`](../README.md) for the full project documentation.