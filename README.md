# 🏨 Hotel Booking (MERN Stack)

A full-stack hotel booking platform built with the **MERN** stack (MongoDB, Express, React, Node.js). Users can browse hotels, filter by destination/category/rating/price, search availability by date, book rooms, and manage their bookings. Hotel owners can register their hotel, manage rooms and handle incoming bookings.

---

## ✨ Features

### 👤 User (Customer)
- Register / Login with JWT-based authentication (stored in httpOnly cookie)
- Search hotels by destination, check-in/check-out dates and number of guests
- Filter hotels by **location, category, star rating and price range**
- Sort hotels by price / rating
- View hotel details, photos, facilities and available rooms
- Book a room with a multi-step booking pop-up (guest details → stay → payment)
- View and cancel own bookings (`My Bookings`)

### 🏨 Owner (Hotel Manager)
- Register own hotel with images & policies
- Update hotel details & images
- Add / update / delete rooms
- Manage bookings for own hotel (confirm, complete, cancel)

### 📱 General
- Fully responsive UI (mobile & desktop)
- Pagination on the hotels listing page
- Popular destinations quick search
- Customer reviews & featured hotels on the landing page

---

## 🗂️ Tech Stack

| Layer      | Technology                                    |
| ---------- | --------------------------------------------- |
| Frontend   | React 19, Vite 6, React Router 7, Axios, React Icons |
| Backend    | Node.js, Express 5, JWT, bcrypt, Multer       |
| Database   | MongoDB (Mongoose 9 / ODM)                    |
| Auth       | JWT stored in httpOnly cookie                 |
| Images     | Local uploads served statically               |

---

## 📁 Project Structure

```
Hotel-Booking-Mern/
├── backend/                  # Express REST API
│   ├── config/               # DB connection, Multer upload config
│   ├── controllers/          # auth, hotel, room, booking logic
│   ├── middlewares/          # JWT auth, owner role checks
│   ├── models/               # User, Hotel, Room, Booking schemas
│   ├── routes/               # Express route definitions
│   ├── uploads/              # Uploaded images (local storage)
│   ├── .env.example          # Backend environment variables sample
│   └── server.js             # App entry point
│
├── frontend/                 # React + Vite SPA
│   ├── src/
│   │   ├── api/              # Axios instance (base URL, credentials)
│   │   ├── assets/           # Demo data & static images
│   │   ├── components/       # Header, Hero, Filters, Cards, Pop-ups...
│   │   ├── context/          # User, Hotels data, Hotel details contexts
│   │   ├── pages/            # Home, Hotels, HotelDetails, Auth, Owner pages
│   │   └── ProtectedRoutes/  # Owner route guards
│   └── .env.example          # Frontend environment variables sample
│
└── README.md                 # You are here
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **MongoDB** (local or MongoDB Atlas)

### 1. Clone & install

```bash
git clone https://github.com/<your-user>/Hotel-Booking-Mern.git
cd Hotel-Booking-Mern
```

#### Backend

```bash
cd backend
npm install
cp .env.example .env        # then fill in your values
npm run dev                 # starts server on http://localhost:4400
```

#### Frontend

```bash
cd frontend
npm install
cp .env.example .env        # VITE_API_BASE_URL points to the backend
npm run dev                 # starts Vite dev server
```

Open `http://localhost:5173` in your browser.

### 2. Environment variables

**`backend/.env`**

```env
PORT=4400
MONGODB_URL=mongodb://localhost:27017/hotel-booking
JWT_SECRET_KEY=your_super_secret_key
FRONTEND_URLS=http://localhost:5173
```

`FRONTEND_URLS` is a comma-separated list of allowed CORS origins.

**`frontend/.env`**

```env
VITE_API_BASE_URL=http://localhost:4400/api/v1
```

### Admin access

Register a normal account and then promote it from the backend directory:

```bash
npm run admin:promote -- admin@example.com
```

The account must already exist in MongoDB. Sign out and back in after promotion, then open `/admin`. Admins can view platform totals and change account roles. Admin endpoints require an authenticated user with the `admin` role.

The admin dashboard sidebar includes Overview, Users, Hotels, Bookings, and Chatbot Answers. Admins can review all accounts and hotel listings, change user roles, update booking and payment statuses, and manage every chatbot answer.

### Razorpay payments

Add Razorpay credentials to `backend/.env`; keep the secret values on the backend and never add them to the Vite frontend environment:

```env
RAZORPAY_TEST_KEY_ID=rzp_test_your_key_id
RAZORPAY_TEST_KEY_SECRET=your_test_key_secret
RAZORPAY_TEST_WEBHOOK_SECRET=
```

In `/admin`, open **Payments** to confirm the Test Mode configuration. Checkout is locked to Razorpay Test Mode and does not use live credentials. The server creates orders and verifies payment signatures and captured payment amounts before confirming a booking. New bookings require the test key ID and secret to be configured.

Configure a Razorpay test webhook to send `payment.captured` and `order.paid` events to `/api/v1/webhooks/razorpay`. Set its webhook secret in `RAZORPAY_TEST_WEBHOOK_SECRET` so captured payments can confirm bookings even if the guest closes checkout before returning to the site.

Admins can add, edit, publish, and delete chatbot answers from the dashboard. The authenticated chat button appears in the frontend for signed-in users. When `RAG_API_URL` is configured, chat messages are sent from the backend to that RAG service. Otherwise, the app answers from the local knowledge base: admins can preview drafts and other users only receive published answers.

### Connect an external RAG REST API

Create a non-revoked integration key in NexaDesk's **API keys** page, then set the RAG base URL and key in `backend/.env` (also listed in `backend/.env.example`):

```env
RAG_API_URL=http://localhost:8000
RAG_API_KEY=your_nexadesk_integration_key
RAG_API_QUERY_FIELD=message
RAG_API_AUTH_HEADER=Authorization
RAG_API_AUTH_SCHEME=Bearer
RAG_API_TIMEOUT_MS=15000
```

The backend calls NexaDesk's `POST /api/chat` endpoint with a Bearer integration key and `{ "message": "...", "conversation_id": null }`. It sends the returned conversation ID with later messages so the RAG assistant can preserve context. The chat supports messages up to 4,000 characters. You can set `RAG_API_URL` to the base URL above or the full `/api/chat` endpoint. The frontend only calls this app's authenticated `/api/v1/chatbot/message` endpoint, so the NexaDesk key stays on the backend. CORS is not needed for this server-to-server request. Admins can check that the endpoint and key are configured under **Chatbot Answers**. If the configured RAG service is unavailable or rejects the key, chat returns an error rather than silently switching to local answers.

To add the sample hotel listings and rooms to the configured database, run this from `backend/`:

```bash
npm run demo:hotels
```

This seed is safe to rerun; it updates the six demo listings and their sample rooms rather than creating duplicate demo entries.

---

## 🔌 API Reference

Base URL: `http://localhost:4400/api/v1`

### Auth
| Method | Endpoint        | Description                      |
| ------ | --------------- | -------------------------------- |
| POST   | `/auth/register`| Register user (multipart form)   |
| POST   | `/auth/login`   | Login, sets JWT cookie           |
| POST   | `/auth/logout`  | Clear JWT cookie                 |
| GET    | `/auth/me`      | Get current logged-in user       |

### Hotels
| Method | Endpoint        | Description                       |
| ------ | --------------- | --------------------------------- |
| POST   | `/hotels/hotel` | Register new hotel (owner only)   |
| PUT    | `/hotels/hotel/:id` | Update hotel (owner only)      |
| GET    | `/hotels/hotels`| Search hotels (filters + paging)  |
| GET    | `/hotels/hotel/:id` | Get hotel details + rooms     |
| GET    | `/hotels/user/:userId` | Get owner's hotel            |

Query params for `/hotels/hotels`:

```
destination (city), checkIn, checkOut, guests, minPrice, maxPrice,
rating (1-5), page, limit, category, hotelname (text search)
```

### Rooms
| Method | Endpoint     | Description                     |
| ------ | ------------ | ------------------------------- |
| POST   | `/room`      | Add room (owner only)           |
| PUT    | `/room/:id`  | Update room (owner only)        |
| DELETE | `/room/:id`  | Delete room (owner only)        |
| GET    | `/room/:hotelId` | Get all rooms of a hotel     |

### Bookings
| Method | Endpoint       | Description                        |
| ------ | -------------- | ---------------------------------- |
| POST   | `/bookings`    | Create booking                     |
| GET    | `/bookings/user/:userId` | Get user's bookings          |
| GET    | `/bookings/:id`    | Get booking details            |
| POST   | `/bookings/check-availability` | Check room availability |
| PUT    | `/bookings/cancel/:id` | Cancel a booking            |
| PUT    | `/bookings/:id`    | Update booking status (owner)  |
| GET    | `/bookings/hotel/:hotelId` | Get hotel bookings      |

---

## 🛣️ Frontend Routes

| Route                   | Page                        | Access          |
| ----------------------- | --------------------------- | --------------- |
| `/`                     | Home (Hero, Destinations, Featured, Reviews) | Public |
| `/hotels`               | Hotel listing + filters     | Public          |
| `/hotel/:id`            | Hotel details + rooms       | Public          |
| `/login`, `/register`   | Authentication              | Public          |
| `/about`                | About us                    | Public          |
| `/contact`              | Contact us                  | Public          |
| `/my-bookings`          | User's bookings             | Logged-in       |
| `/register-hotel`       | Register your hotel         | Logged-in       |
| `/setup-hotel`          | Owner dashboard             | Hotel owner     |
| `/setup-hotel/manage-rooms` | Manage rooms            | Hotel owner     |
| `/setup-hotel/manage-bookings` | Manage bookings      | Hotel owner     |

---

## 🔐 Authentication Flow

1. User registers → `bcrypt` hashed password saved, profile image uploaded.
2. User logs in → backend signs a JWT and sends it as an **httpOnly cookie**.
3. Frontend sends `withCredentials: true` on every Axios request.
4. `GET /auth/me` restores the user session on every page load.
5. Owner-only endpoints are protected by `authMiddleware` (JWT) + `checkOwnerMiddleware` (`role === "hotel-manager"`).

---

## 🧰 Available Scripts

### Backend (`backend/`)
| Script        | Description              |
| ------------- | ------------------------ |
| `npm run dev` | Start with nodemon       |
| `npm start`   | Start in production mode |

### Frontend (`frontend/`)
| Script      | Description           |
| ----------- | --------------------- |
| `npm run dev`    | Start Vite dev server |
| `npm run build`  | Production build      |
| `npm run lint`   | ESLint check          |
| `npm run preview`| Preview production build |

---

## 📌 Notes

- Hotel images are stored locally in `backend/uploads/` and served statically.
- `frontend/src/assets/demo_hotels_data.js` contains demo data used on the landing page.
- The app works with a running MongoDB instance — start it before the backend.
