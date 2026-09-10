# Multimedia Upload & Search API

Backend implementation for the Multimedia Upload & Search technical assessment.

## Stack

- Node.js 20 or newer
- Express.js
- MongoDB Atlas + Mongoose
- Cloudinary
- JWT access + refresh tokens
- HTTP-only cookies
- Multer
- Swagger/OpenAPI
- Jest + Supertest
- Helmet, CORS, rate limiting

## Features

- User registration/login/logout
- JWT authentication with access and refresh tokens
- Protected multimedia routes
- Image, video, audio and PDF uploads
- File type and file size validation
- Cloudinary storage
- MongoDB metadata storage
- File preview URL
- Search by filename and tags
- Date and file-type filters
- Relevance, popularity and recency ranking
- View count tracking
- Pagination
- Secure ownership checks
- Soft delete using `enabled`
- Centralized validation/error handling
- Swagger API documentation
- Jest/Supertest test setup
- Health endpoint

## Node version

Use **Node.js 20 or newer**.

## 1. Install

```bash
npm install
```

## 2. Environment

Copy `.env.example` to `.env` and fill in the required values. On Windows:

```powershell
Copy-Item .env.example .env
```

MongoDB selection:

- Local development uses `MONGODB_LOCAL_URI`, defaulting to `mongodb://127.0.0.1:27017/multimedia_app`.
- Production and Vercel use `MONGODB_URI`.
- Never commit `.env` or real credentials.

## 3. Run

```bash
npm run dev
```

Server:
`http://localhost:5000`

Swagger:
`http://localhost:5000/api-docs`

Health:
`http://localhost:5000/api/health`

Build check:

```bash
npm run build
```

## API

### Auth

- POST `/api/auth/register`
- POST `/api/auth/login`
- PATCH `/api/auth/forgot-password`
- POST `/api/auth/refresh`
- POST `/api/auth/logout`
- GET `/api/auth/:userId`

### Files

- POST `/api/files/upload`
- GET `/api/files`
- GET `/api/files/:id`
- GET `/api/files/:id/view`
- PUT `/api/files/:id`
- PATCH `/api/files/:id`

There is intentionally no separate search route. Search, filtering, pagination and sorting are handled by `GET /api/files`.

Protected routes require the access token returned by login:

```text
Authorization: Bearer <data.accessToken>
```

### Forgot password

```http
PATCH /api/auth/forgot-password
email: user@example.com
Content-Type: application/json
```

```json
{
  "password": "NewPassword@123"
}
```

## Get Files, Search and Filters

### Normal file list

```text
GET /api/files?page=1&limit=20
```

Files are returned newest-first by default.

### Search

```text
GET /api/files?search=video&page=1&limit=20
```

Search checks:

- `filename`
- `tags`

When a search query is supplied and no sort is specified, results are ranked using the relevance score. Read files from `data.items` and pagination from `data.pagination`.

### Date filter

```text
GET /api/files?from=2026-09-01&to=2026-09-30
```

The `from` date starts at `00:00:00` and the `to` date ends at `23:59:59.999`.

### File type filter

```text
GET /api/files?type=image
GET /api/files?type=video
GET /api/files?type=audio
GET /api/files?type=raw
```

### Sorting

```text
GET /api/files?sort=newest
GET /api/files?sort=oldest
GET /api/files?sort=popular
GET /api/files?sort=relevance&search=nature
```

`popular` sorts by `viewCount` descending and uses upload date as a tie-breaker.

For the Most Viewed page, the frontend can request:

```text
GET /api/files?sort=popular&type=image
GET /api/files?sort=popular&type=video
GET /api/files?sort=popular&type=audio
```

## View Count

When a user opens a media file, the frontend calls:

```text
GET /api/files/:id/view
```

The backend uses MongoDB's atomic `$inc` operation:

```js
{ $inc: { viewCount: 1 } }
```

This means multiple users can view the same file without losing increments.

The view endpoint does not require the file to belong to the logged-in user. This allows the application to count views when another user opens a file.

## Ranking

The ranking logic is implemented in `src/utils/ranking.js`.

### Relevance score

- Exact filename: `+100`
- Filename starts with query: `+60`
- Filename contains query: `+35`
- Exact tag: `+50`
- Tag contains query: `+25`

### Popularity score

View count contributes using a logarithmic calculation and is capped at 25 points. This prevents a very popular file from completely dominating text relevance.

### Recency score

Newer files receive up to 20 recency points. The contribution decreases as the file becomes older and reaches zero after 20 days.

### Final score

```text
final score = relevance + popularity + recency
```

The score is calculated at query time. It is not stored in MongoDB because relevance depends on the current search query.

## Upload

Use `multipart/form-data`.

Required field:

`file`

Optional field:

`tags`

Tags may be sent as comma-separated text:

```text
project,demo,video
```

Allowed types:

- JPG/JPEG
- PNG
- GIF
- WEBP
- MP4
- MOV
- WEBM
- MP3
- WAV
- M4A
- PDF

Default maximum size is 50 MB.

## Authentication

The existing authentication flow uses JWT access and refresh tokens with HTTP-only cookies.

For production, set:

```env
COOKIE_SECURE=true
```

and serve the API over HTTPS.

## MongoDB

The `User` collection stores account data and refresh-token information.

The `File` collection stores:

- owner (`userId`)
- filename
- Cloudinary public ID
- Cloudinary URL
- resource type
- MIME type
- extension
- size
- tags
- view count
- enabled status
- upload/update dates

## Cloudinary

The API uses Cloudinary for media storage and saves the file metadata and URL in MongoDB.

- Images use Cloudinary `image` resources.
- Videos use Cloudinary `video` resources.
- Audio is handled as a Cloudinary media resource while the original MIME type is retained in MongoDB.
- PDFs use Cloudinary `raw` resources.

## Testing

Run all tests:

```bash
npm test
```

The test suite covers:

- health endpoint
- authentication validation
- tag normalization
- filename/tag relevance
- popularity ranking
- date/type search filters
- atomic view-count increment
- missing-file view errors

Cloudinary uploads are kept outside unit tests so tests remain fast and do not depend on an external Cloudinary account.

## Vercel deployment



This repository includes `vercel.json` and uses `src/server.js` as the Express entrypoint.

1. Push the repository to GitHub without `.env`, `node_modules`, archives, or credentials.
2. Import the repository into Vercel.
3. Add `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and all Cloudinary variables in Vercel Project Settings.
4. Deploy. The API will be available at `https://<project>.vercel.app`.
5. Check `https://<project>.vercel.app/api/health` and `https://<project>.vercel.app/api-docs`.

Vercel must use a reachable MongoDB Atlas URI. A local MongoDB URI cannot be reached from Vercel.

## Other production deployment

Set all environment values in the hosting provider's environment settings. Do not upload the `.env` file.

## Project structure

```text
src/
├── config/
├── controllers/
├── docs/
├── middlewares/
├── models/
├── routes/
├── services/
├── utils/
└── validators/

tests/
├── auth-validation.test.js
├── file-service.test.js
├── file-validation.test.js
├── health.test.js
└── ranking.test.js
```

## Architecture

```text
Route
  ↓
Controller
  ↓
Service
  ↓
Model / Cloudinary
```

The Files module keeps search, filters, pagination and ranking inside `file.service.js`. There is no separate search controller/service/route.
