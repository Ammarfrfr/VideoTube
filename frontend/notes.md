## Frontend ↔ Backend Integration Notes

This document explains, in detail, how the frontend (React + Vite) is connected to your backend (Express + Mongoose + Cloudinary). It describes the main integration points, data flows, authentication, common edge-cases and recommended next steps so you (or another engineer) can reproduce or extend this architecture in the future.

---

Table of contents
- Overview
- Project structure (frontend)
- API client and conventions
- Authentication flow
- Major page flows (Register / Login / Home / Video / Upload / Profile / My Videos)
- File upload flow (thumbnails & videos)
- Delete / cleanup flow
- Error handling and defensive code
- CORS and dev-time considerations
- Recommended backend improvements
- Testing & deployment tips

---

Overview
--------
The frontend communicates with the backend using a small axios-based API client (`frontend/src/api.js`). The backend exposes a JSON API under the base prefix `/api/v1` (e.g. `/api/v1/users/login`, `/api/v1/videos`).

The frontend uses React (functional components + hooks) and React Router for navigation. Important shared concerns are:
- Authentication: JWT access tokens (sometimes in cookies or in the response body). The frontend stores an access token (if returned) in localStorage and sets the Authorization header for subsequent requests.
- File uploads: performed using HTML forms + FormData and multipart requests. The backend uses multer and Cloudinary utilities to store files.
- Defensive / tolerant client code: the frontend handles inconsistent response shapes from the backend (common during development) and provides fallbacks where reasonable.

Project structure (frontend)
----------------------------
- `frontend/src/api.js` — the single axios instance used across the app. It exports helper functions to set and clear the Authorization header.
- `frontend/src/contexts/AuthContext.jsx` — manages user state, login/logout, fetches `current-user`, persists access token into `localStorage` if present, and exposes `useAuth()`.
- `frontend/src/components/*` — header, VideoCard, modals (EditVideoModal), and small reusable parts.
- `frontend/src/pages/*` — top-level routes: `Home`, `Video`, `Login`, `Register`, `Upload`, `Profile`, `MyVideos`.

API client and conventions
--------------------------
Key points in `api.js`:
- Base axios instance points at the Vite dev server context (requests from the browser will reach `http://localhost:8000/api/v1/...` when proxied or directly if you use CORS).
- Helpers: `setAuthToken(token)` / `clearAuthToken()` — mutate default Authorization header so callers don't need to attach tokens manually.
- Response tolerance: the client code often expects `res.data.data` (ApiResponse wrapper) or `res.data` (bare object). The frontend normalizes both patterns.

Authentication flow
-------------------
1. Login:
   - User submits credentials to `POST /api/v1/users/login` via `AuthContext.login`.
   - Backend may set cookies (accessToken/refreshToken) and may also return `accessToken` and `user` in the response body.
   - If the response includes an accessToken the frontend saves it in `localStorage` and calls `setAuthToken(token)` which sets `Authorization: Bearer <token>` on the axios instance.
   - After login, `AuthContext.fetchCurrentUser()` is called which hits `/api/v1/users/current-user` to fetch the current user object and populate React state.

2. Persisting session on reload:
   - On mount `AuthProvider` checks `localStorage` for an `accessToken`. If present, it sets the Authorization header and fetches the current user. If not present, it marks the user as unauthenticated.

3. Logout:
   - Calls `POST /api/v1/users/logout` (attempted), clears localStorage and Authorization header, and resets user state.

Major page flows
----------------
Register
- Route: `/register`.
- Multipart form (avatar & cover optional). The frontend uses FormData and posts to `/api/v1/users/register`.
- The backend expects an `avatar` file and returns the created user (after uploading to Cloudinary).

Login
- Route: `/login`.
- After login the app stores the accessToken (if returned) and fetches `current-user` to populate the UI.

Home
- Route: `/`.
- Fetches `GET /api/v1/videos` (protected on server) and displays `VideoCard`s. The client waits for auth to finish, because the backend restricts the route.

Video details
- Route: `/video/:id`.
- GET `/api/v1/videos/:videoId` to fetch one video.
- Note: during development the backend had an inconsistent `getVideoById` response (returned id string). The frontend handles this by falling back to fetching the videos list and finding the video by id when necessary.
- Owners see additional controls: Publish toggle (PATCH `/videos/toggle/publish/:videoId`) and Delete.

Upload
- Route: `/upload`.
- Uses FormData with fields `videoFile` and `thumbnail` to POST to `/api/v1/videos`.

Profile
- Route: `/profile` (protected).
- PATCH endpoints used to update avatar (`/api/v1/users/avatar`) and cover image (`/api/v1/users/update-cover-image`). The frontend uses FormData for file uploads.

My Videos (management)
- Route: `/my-videos` (protected).
- Fetches videos filtered by `userId` from `/api/v1/videos?userId=<id>`.
- Supports: selection, bulk-delete (delayed so user can undo), edit modal that PATCHes `/api/v1/videos/:videoId`.

File upload flow (thumbnail & video)
----------------------------------
1. The frontend creates a FormData object and attaches files and other fields.
2. It sends the request with Content-Type `multipart/form-data` and the browser sets correct boundaries.
3. The backend multer middleware stores files locally (temporary) and `uploadOnCloudinary()` moves them to Cloudinary and returns URLs and public IDs.
4. The backend saves video records with both the public URLs and the Cloudinary public_id(s) to support deletion/cleanup later.

Delete / cleanup flow
---------------------
- Backend's `deleteVideo` controller is careful:
  - It reads `videoPublicId` and `thumbnailPublicId` from the video document.
  - It calls `deleteFromCloudinary(publicId, type)` for the video and thumbnail to remove Cloudinary assets.
  - It then deletes the Video document from the database.

Frontend controls:
- Video detail page and VideoCard now both allow deletion for owners.
- My-videos page batch-delete schedules deletes with a short timeout to provide an undo window. After the timeout the frontend calls DELETE for each id.

Error handling and defensive code
--------------------------------
- Axios interceptor extracts messages from HTML error bodies so the UI shows readable messages when the backend returns Express error pages.
- The frontend tolerates different API response shapes (ApiResponse wrappers vs direct objects) by normalizing responses in `AuthContext` and page code.
- The frontend provides fallbacks when backend endpoints behave unexpectedly (for example fetching the list when single-get returns an id string).

CORS and dev-time considerations
-------------------------------
- Problem: in dev the backend's CORS sent `Access-Control-Allow-Origin: *` together with `Access-Control-Allow-Credentials: true`. Browsers reject `*` when credentials are allowed. Two practical dev options:
  1. Use token-in-header flow: store access token from login response and set `Authorization` header (what frontend does). This avoids cookies/credential issues.
 2. Configure backend to send the actual origin (e.g. `http://localhost:5173`) when credentials are allowed, and ensure `withCredentials` is handled consistently.

Recommended backend improvements (prioritized)
--------------------------------------------
1. Fix `getVideoById` to return the full video object (not the id string).
2. Populate `owner` consistently on list endpoints (use `.populate('owner', 'username avatar')`) so the frontend can rely on owner._id in lists.
3. Add explicit endpoints for removing avatar/cover if you want real deletes rather than replacing with a placeholder.
4. Implement soft-delete support (a `deletedAt` or `isDeleted`) with an undo window server-side for safe rollbacks.
5. Consider a `DELETE /videos` batch endpoint that accepts an array of ids for bulk delete (atomic server-side operation) — then the frontend can call a single request instead of triggering many deletes.

Testing and developing the flows locally
---------------------------------------
- Start the backend (default port 8000 in this project) and the frontend dev server (Vite usually runs at 5173). Ensure CORS is configured or use the token-in-header method described above.
- Use your Postman/curl scripts to verify endpoints return the expected shapes before wiring UI. Example:
  - GET /api/v1/videos?page=1&limit=10
  - GET /api/v1/videos/:id
  - POST /api/v1/users/login  (check cookies + response body)

Edge cases and common gotchas
----------------------------
- Missing owner population: list endpoints may omit owner._id which hides owner-only UI. Always check the response shape during development.
- Inconsistent token usage: sometimes backend sets cookies, sometimes returns tokens in response. Prefer a single consistent strategy — either cookie-only (with proper CORS) or token-in-header.
- Large file uploads: upload progress, chunking and timeouts may be required for very large videos. Cloudinary supports large uploads but you may need server-side streaming or signed uploads.

How to extend this pattern from scratch (TL;DR)
---------------------------------------------
1. Create a small axios client (`api.js`) with helpers to set Authorization header.
2. Centralize auth in a React Context: login calls server, save token, fetch current user.
3. Protect routes in React Router with a `RequireAuth` wrapper.
4. For uploads, use FormData and multer on server; upload file to Cloudinary and persist URL + public_id to DB.
5. For delete, remove DB record and then call Cloudinary delete using stored public_id.

Appendix: Quick reference of important frontend files
---------------------------------------------------
- `frontend/src/api.js` — axios client, token helpers, interceptors.
- `frontend/src/contexts/AuthContext.jsx` — login/logout, `fetchCurrentUser`.
- `frontend/src/components/Header.jsx` — shows avatar/cover; reads from `useAuth()`.
- `frontend/src/components/VideoCard.jsx` — thumbnail card, owner avatar, delete/edit hooks.
- `frontend/src/pages/Home.jsx` — list of videos.
- `frontend/src/pages/Video.jsx` — playback, publish toggle, delete.
- `frontend/src/pages/Upload.jsx` — upload video form.
- `frontend/src/pages/Profile.jsx` — avatar/cover update and placeholder delete workaround.
- `frontend/src/pages/MyVideos.jsx` — management UI (selection, bulk delete, edit modal).

If you want, I can also:
- generate a minimal checklist for adding a new backend endpoint and wiring the frontend form to it,
- create a small Postman collection of the exact requests the frontend makes, or
- prepare a short runbook for deploying the backend + frontend together (CORS, env vars, Cloudinary credentials).

---

If you want this turned into a README or exported as a developer onboarding checklist, I can format it accordingly and add example curl/postman snippets for each important route.

Happy to expand any section — tell me which flow you want me to deep-dive into next (auth, upload, delete/undo, or deployment).

---

## Request / Response examples (practical snippets)

Below are concrete examples you can use with curl or Postman. They show request formats and the typical response JSON produced by the backend. The project wraps most responses in an `ApiResponse` object with structure: `{ statusCode, data, message }`.

### 1) Register (multipart/form-data)

Request (curl):

   curl -X POST "http://localhost:8000/api/v1/users/register" \
      -F "fullName=Alice Doe" \
      -F "email=alice@example.com" \
      -F "username=alice" \
      -F "password=secret" \
      -F "avatar=@/path/to/avatar.png" \
      -F "coverImage=@/path/to/cover.jpg"

Response (example):

   {
      "statusCode": 200,
      "data": {
         "_id": "<userId>",
         "fullName": "Alice Doe",
         "username": "alice",
         "email": "alice@example.com",
         "avatar": "https://res.cloudinary.com/.../avatar.png",
         "coverImage": "https://res.cloudinary.com/.../cover.jpg"
      },
      "message": "User registered Successfully"
   }

### 2) Login (JSON)

Request (curl):

   curl -X POST "http://localhost:8000/api/v1/users/login" \
      -H "Content-Type: application/json" \
      -d '{"username":"alice","password":"secret"}'

Response (example):

   {
      "statusCode": 200,
      "data": {
         "user": {"_id":"<userId>", "username":"alice", "avatar":"..."},
         "accessToken": "<jwt-access-token>",
         "refreshToken": "<jwt-refresh-token>"
      },
      "message": "User logged in successfully"
   }

Note: the server also sets cookies for tokens. The frontend reads `accessToken` from the response when present and sets the Authorization header.

### 3) Current user

Request (curl):

   curl -H "Authorization: Bearer <accessToken>" http://localhost:8000/api/v1/users/current-user

Response (example):

   {
      "statusCode": 200,
      "data": {"_id":"<userId>", "username":"alice", "email":"alice@example.com", "avatar":"...", "coverImage":"..."},
      "message": "Current user fetched successfully"
   }

### 4) List videos (paginated)

Request (curl):

   curl -H "Authorization: Bearer <accessToken>" "http://localhost:8000/api/v1/videos?page=1&limit=10"

Response (example):

   {
      "statusCode": 200,
      "data": {
         "videos": [
            {"_id":"v1","title":"...","thumbnail":"...","owner": {"_id":"u1","username":"alice","avatar":"..."}, "isPublished": true },
            // ...
         ],
         "pagination": {"totalVideos": 42, "currentPage":1, "totalPages":5, "limit":10}
      },
      "message": "Videos fetched successfully"
   }

### 5) Get single video by id

Request (curl):

   curl -H "Authorization: Bearer <accessToken>" http://localhost:8000/api/v1/videos/<videoId>

Expected response (what the frontend expects):

   {
      "statusCode": 200,
      "data": {
         "_id": "<videoId>",
         "title": "My summer clip",
         "description": "...",
         "videoFile": "https://res.cloudinary.com/.../video.mp4",
         "videoPublicId": "...",
         "thumbnail": "https://.../thumb.jpg",
         "thumbnailPublicId": "...",
         "owner": {"_id":"u1","username":"alice","avatar":"..."},
         "isPublished": true,
         "duration": 123,
         "views": 10
      },
      "message": "Video fetched successfully"
   }

NOTE: a known bug in the backend returned `data: videoId` (string) instead of the object. If you see that, fix `getVideoById` to return the video object.

### 6) Publish / upload video (multipart)

Request (curl):

   curl -X POST "http://localhost:8000/api/v1/videos" \
      -H "Authorization: Bearer <accessToken>" \
      -F "title=My clip" \
      -F "description=..." \
      -F "videoFile=@/path/to/video.mp4" \
      -F "thumbnail=@/path/to/thumb.jpg"

Response (example):

   {
      "statusCode": 201,
      "data": {
         "_id": "<videoId>",
         "title": "My clip",
         "videoFile": "https://res.cloudinary.com/.../video.mp4",
         "videoPublicId": "...",
         "thumbnail": "https://.../thumb.jpg",
         "thumbnailPublicId": "...",
         "owner": "<userId>",
         "duration": 123
      },
      "message": "Video was published successfully"
   }

### 7) Update video (PATCH - title/description/thumbnail)

Request (curl, multipart):

   curl -X PATCH "http://localhost:8000/api/v1/videos/<videoId>" \
      -H "Authorization: Bearer <accessToken>" \
      -F "title=New title" \
      -F "description=New description" \
      -F "thumbnail=@/path/to/new-thumb.jpg"

Response (example):

   {
      "statusCode": 200,
      "data": { /* updated video object */ },
      "message": "Changes in the video saved successfully"
   }

### 8) Delete video

Request (curl):

   curl -X DELETE -H "Authorization: Bearer <accessToken>" http://localhost:8000/api/v1/videos/<videoId>

Response (example):

   {
      "statusCode": 200,
      "data": { /* deleted document */ },
      "message": "Video deleted successfully"
   }

### 9) Toggle publish state

Request (curl):

   curl -X PATCH -H "Authorization: Bearer <accessToken>" http://localhost:8000/api/v1/videos/toggle/publish/<videoId>

Response (example):

   {
      "statusCode": 200,
      "data": { /* video object with updated isPublished */ },
      "message": "Video is now Published"
   }

### 10) Update avatar / cover (multipart)

Avatar request (curl):

   curl -X PATCH "http://localhost:8000/api/v1/users/avatar" \
      -H "Authorization: Bearer <accessToken>" \
      -F "avatar=@/path/to/avatar.png"

Cover request (curl):

   curl -X PATCH "http://localhost:8000/api/v1/users/update-cover-image" \
      -H "Authorization: Bearer <accessToken>" \
      -F "coverImage=@/path/to/cover.jpg"

Responses: both return the updated user object in `data` (sans password/refreshToken) and a success message.

---

If you'd like, I can now:
- generate a Postman collection containing each of the above snippets, or
- produce a short runbook for deployment (env vars, CORS, Cloudinary config), or
- create an automated test script (node) that runs through these flows.

Tell me which one you'd like and I will create it.
