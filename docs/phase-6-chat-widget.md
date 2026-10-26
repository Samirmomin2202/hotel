# Phase 6: Hotel chat integration

## What is mounted

`frontend/src/components/ChatbotWidget.jsx` is mounted from `frontend/src/App.jsx` inside `UserContext`, beside the shared routes. It is available to signed-in users, owners, and admins. It does not replace or modify the existing route pages. The existing widget styles in `ChatbotWidget.css` provide the floating launcher, panel, responsive layout, focusable controls, suggested questions, and scroll-to-latest behavior.

## Verified API contract

The frontend uses its existing Axios client (`frontend/src/api/api.jsx`), which reads `VITE_API_BASE_URL` and sends cookies with `withCredentials: true`.

The verified hotel Express endpoint is `POST /api/v1/chatbot/message` (relative to the configured API base URL). The router applies `authMiddleware`. It accepts JSON `{ "message": "...", "conversation_id": "..." }`; `conversation_id` is optional. Success returns `{ "success": true, "data": { "answer": "...", "source": "...", "conversation_id": "..." } }`. The Express controller validates message length and derives the customer identity from the authenticated cookie, including when it looks up that customer's bookings. The conversation ID is only a conversation-scoping value, not authentication.

The React widget validates the success flag and non-empty answer before rendering. Assistant text and source labels render as React text nodes; model HTML is never injected. A failed request leaves the submitted question visible and offers a retry without adding a duplicate question bubble. Chat messages and conversation IDs stay in bounded React state (up to 80 messages) and are not written to browser storage. The component resets its in-memory chat when the signed-in account or role changes.

Questions about check-in/check-out times are answered from the active hotels' stored schedule fields. If the question names a hotel, the response uses that hotel's values; otherwise it lists up to eight configured schedules and asks which property the guest means.

Questions asking for hotel/resort listings or details use active public hotel records. Best/top requests are ranked by stored star rating, resort requests are filtered to the resort category, and a destination after “in” or “near” narrows the results. Room recommendations use live room capacity and listed room rates; they do not claim availability until dates are provided and checked. Customer booking requests are matched to the authenticated account; platform-wide user, booking, payment, and revenue requests are blocked for non-admin roles before they reach RAG. Admins can use the admin dashboard data queries.

## AI service status and limitations

Only the hotel MERN repository was available in the workspace. No FastAPI/RAG repository, previous-phase report, or chatbot test suite was present, and the Git executable was unavailable in the environment, so Git status and a separate AI service contract could not be verified. No AI service endpoint or schema is claimed as verified.

The current Express controller proxies general authenticated guest and admin questions, including greetings, to the external RAG client when it is configured. The integration key remains on the server, and RAG memory is scoped using a hash of the authenticated user ID and conversation ID. A recognized request for the customer's own bookings is answered from that customer's authenticated database records. If RAG is not configured, guest questions use published MongoDB knowledge entries. The RAG index must contain guest-safe hotel help documents and must not contain private customer records; that document policy is not enforceable or verifiable from this checkout. The existing booking handoff uses the hotel's Express hotel, availability, booking, and payment endpoints, and does not claim booking success before payment verification. These flows have not been end-to-end tested here.

The RAG base URL and Bearer key are configured in the backend environment (their values are intentionally not included here). Browser requests still go only to Express. Express trims configured CORS origins and does not return upstream provider bodies. Upstream provider authentication failures are reported as a gateway/service error rather than as a browser-session 401; an upstream 404 is reported as a gateway error, and upstream rate limits/timeouts retain 429/504. A 401 from Express indicates that the hotel authentication cookie is missing or expired. The standalone chatbot's browser Network panel is separate and is not available from this workspace.

The widget gives safe, generic messages for expired authentication, rate limiting, service errors, timeouts, and network failures. The API client has a per-chat 20-second timeout. Expired or invalid JWTs now return HTTP 401 from the shared authentication middleware. Credentials remain server-side.

## Run locally

- Frontend: `cd frontend; npm install; npm run dev`
- Express backend: `cd backend; npm install; npm run dev`
- Set the frontend `VITE_API_BASE_URL` to the Express API base URL and configure the backend environment using the existing `.env.example`; do not put AI service credentials in the frontend.
- The separate FastAPI service cannot be documented or started from this checkout because its source and verified run instructions were not provided.

## Verification performed

Commands run from this checkout:

- `npm.cmd run build` in `frontend`: passed (Vite production build).
- `npx.cmd eslint src/components/ChatbotWidget.jsx src/api/api.jsx` in `frontend`: passed.
- `npm.cmd run lint` in `frontend`: failed on two existing unused `Icon` errors in `src/pages/AdminDashboard.jsx` (lines 300 and 485); the changed chat files passed focused lint. It also reported 10 warnings in existing context and booking pages.
- `node --check controllers/chatbotController.js; node --check middlewares/authMiddleware.js` in `backend`: passed.

There is no frontend test framework configured in `frontend/package.json`; no new framework or test dependency was added. Git status could not be read because Git is unavailable in the environment. A real hotel/RAG query was not tested because the required running services and verified AI contract were unavailable.
