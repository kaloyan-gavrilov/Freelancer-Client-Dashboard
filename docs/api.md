# API Reference

Base URL: `http://localhost:3000` (local) / `https://api.freelancer-dashboard.example.com` (production)

Swagger UI: `{BASE_URL}/api/docs`

All authenticated endpoints require a `Bearer` token in the `Authorization` header. Tokens are issued by Supabase Auth.

---

## Projects

### POST /projects

Create a new project. Requires **CLIENT** role.

**Request:**

```http
POST /projects
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "title": "E-commerce Website Redesign",
  "description": "Full redesign of the online store with modern UI",
  "budgetMin": 1000,
  "budgetMax": 5000,
  "deadline": "2026-06-01T00:00:00.000Z",
  "projectType": "FIXED",
  "requiredSkills": ["React", "Node.js"]
}
```

**Response: `201 Created`**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "clientId": "c1d2e3f4-a5b6-7890-cdef-123456789abc",
  "title": "E-commerce Website Redesign",
  "description": "Full redesign of the online store with modern UI",
  "budgetMin": 1000,
  "budgetMax": 5000,
  "deadline": "2026-06-01T00:00:00.000Z",
  "status": "DRAFT",
  "projectType": "FIXED",
  "requiredSkills": ["React", "Node.js"],
  "createdAt": "2026-02-23T10:00:00.000Z",
  "updatedAt": "2026-02-23T10:00:00.000Z"
}
```

**Error responses:** `400` Validation error · `401` Unauthorized · `403` CLIENT role required

---

### GET /projects

List projects (public, paginated, filterable). No authentication required.

**Request:**

```http
GET /projects?page=1&limit=20&status=OPEN&skills=React,Node.js&budgetMin=1000&budgetMax=5000
```

**Response: `200 OK`**

```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "clientId": "c1d2e3f4-a5b6-7890-cdef-123456789abc",
      "title": "E-commerce Website Redesign",
      "description": "Full redesign of the online store with modern UI",
      "budgetMin": 1000,
      "budgetMax": 5000,
      "deadline": "2026-06-01T00:00:00.000Z",
      "status": "OPEN",
      "projectType": "FIXED",
      "requiredSkills": ["React", "Node.js"],
      "createdAt": "2026-02-23T10:00:00.000Z",
      "updatedAt": "2026-02-23T10:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

---

### GET /projects/:id

Get project by ID. No authentication required.

**Request:**

```http
GET /projects/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Response: `200 OK`**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "clientId": "c1d2e3f4-a5b6-7890-cdef-123456789abc",
  "freelancerId": null,
  "title": "E-commerce Website Redesign",
  "description": "Full redesign of the online store with modern UI",
  "budgetMin": 1000,
  "budgetMax": 5000,
  "deadline": "2026-06-01T00:00:00.000Z",
  "status": "OPEN",
  "projectType": "FIXED",
  "agreedRate": null,
  "requiredSkills": ["React", "Node.js"],
  "createdAt": "2026-02-23T10:00:00.000Z",
  "updatedAt": "2026-02-23T10:00:00.000Z"
}
```

**Error responses:** `404` Project not found

---

### PATCH /projects/:id/status

Update project status (state machine enforced). Requires **CLIENT** role.

**Request:**

```http
PATCH /projects/a1b2c3d4-e5f6-7890-abcd-ef1234567890/status
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "status": "OPEN"
}
```

**Response: `200 OK`**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "OPEN",
  "updatedAt": "2026-02-23T10:05:00.000Z"
}
```

**Valid state transitions:**

```
DRAFT       → OPEN | CANCELLED
OPEN        → IN_PROGRESS | CANCELLED
IN_PROGRESS → REVIEW | DISPUTED | CANCELLED
REVIEW      → COMPLETED | IN_PROGRESS | DISPUTED
DISPUTED    → COMPLETED | CANCELLED
```

**Error responses:** `401` Unauthorized · `403` Forbidden · `404` Project not found · `409` Invalid state transition

---

### DELETE /projects/:id

Delete a project. Requires **CLIENT** role. Only allowed when project is in `DRAFT` status.

**Request:**

```http
DELETE /projects/a1b2c3d4-e5f6-7890-abcd-ef1234567890
Authorization: Bearer <token>
```

**Response: `204 No Content`**

(empty body)

**Error responses:** `401` Unauthorized · `403` Forbidden · `404` Project not found · `409` Project is not in DRAFT status

---

## Bids

### POST /projects/:id/bids

Place a bid on a project. Requires **FREELANCER** role.

**Request:**

```http
POST /projects/a1b2c3d4-e5f6-7890-abcd-ef1234567890/bids
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "proposedRate": 75.5,
  "estimatedDurationDays": 30,
  "coverLetter": "I have 5 years of experience building e-commerce platforms and can deliver a modern, responsive redesign within the timeline."
}
```

**Response: `201 Created`**

```json
{
  "id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
  "projectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "freelancerId": "f1e2d3c4-b5a6-7890-fedc-ba9876543210",
  "proposedRate": 75.5,
  "estimatedDurationDays": 30,
  "coverLetter": "I have 5 years of experience building e-commerce platforms and can deliver a modern, responsive redesign within the timeline.",
  "status": "PENDING",
  "createdAt": "2026-02-23T11:00:00.000Z",
  "updatedAt": "2026-02-23T11:00:00.000Z"
}
```

**Error responses:** `400` Validation error · `401` Unauthorized · `403` FREELANCER role required · `404` Project not found · `409` Project is not in OPEN status

---

### GET /projects/:id/bids

Get ranked bids for a project. Requires **CLIENT** role.

**Request:**

```http
GET /projects/a1b2c3d4-e5f6-7890-abcd-ef1234567890/bids?rankBy=composite
Authorization: Bearer <token>
```

| Query param | Values | Default |
|-------------|--------|---------|
| `rankBy` | `price`, `rating`, `composite` | `price` |

**Response: `200 OK`**

```json
[
  {
    "id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
    "projectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "freelancerId": "f1e2d3c4-b5a6-7890-fedc-ba9876543210",
    "proposedRate": 75.5,
    "estimatedDurationDays": 30,
    "coverLetter": "I have 5 years of experience...",
    "status": "PENDING",
    "freelancerRating": 4.8,
    "createdAt": "2026-02-23T11:00:00.000Z"
  },
  {
    "id": "c3d4e5f6-a7b8-9012-cdef-345678901234",
    "projectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "freelancerId": "e2d3c4b5-a6f7-8901-edcb-a98765432109",
    "proposedRate": 90.0,
    "estimatedDurationDays": 25,
    "coverLetter": "Senior full-stack developer with...",
    "status": "PENDING",
    "freelancerRating": 4.95,
    "createdAt": "2026-02-23T11:30:00.000Z"
  }
]
```

**Error responses:** `401` Unauthorized · `403` CLIENT role required

---

### PATCH /bids/:id/accept

Accept a bid. Requires **CLIENT** role. Transitions the project to `IN_PROGRESS` and rejects all other pending bids.

**Request:**

```http
PATCH /bids/b2c3d4e5-f6a7-8901-bcde-f23456789012/accept
Authorization: Bearer <token>
```

**Response: `200 OK`**

```json
{
  "id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
  "status": "ACCEPTED",
  "projectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "freelancerId": "f1e2d3c4-b5a6-7890-fedc-ba9876543210",
  "updatedAt": "2026-02-23T12:00:00.000Z"
}
```

**Error responses:** `401` Unauthorized · `403` Forbidden · `404` Bid not found · `409` Bid is not in PENDING status

---

### PATCH /bids/:id/reject

Reject a bid. Requires **CLIENT** role.

**Request:**

```http
PATCH /bids/c3d4e5f6-a7b8-9012-cdef-345678901234/reject
Authorization: Bearer <token>
```

**Response: `200 OK`**

```json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-345678901234",
  "status": "REJECTED",
  "projectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "freelancerId": "e2d3c4b5-a6f7-8901-edcb-a98765432109",
  "updatedAt": "2026-02-23T12:05:00.000Z"
}
```

**Error responses:** `401` Unauthorized · `403` Forbidden · `404` Bid not found · `409` Bid is not in PENDING status

---

## Milestones

### GET /projects/:id/milestones

Get milestones for a project. Requires authentication.

**Request:**

```http
GET /projects/a1b2c3d4-e5f6-7890-abcd-ef1234567890/milestones
Authorization: Bearer <token>
```

**Response: `200 OK`**

```json
[
  {
    "id": "d4e5f6a7-b8c9-0123-defg-456789012345",
    "projectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "Design Phase",
    "description": "Complete wireframes and mockups",
    "amount": 2500,
    "order": 1,
    "status": "COMPLETED",
    "createdAt": "2026-02-23T13:00:00.000Z",
    "updatedAt": "2026-02-24T09:00:00.000Z"
  },
  {
    "id": "e5f6a7b8-c9d0-1234-efgh-567890123456",
    "projectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "Development Phase",
    "description": "Implement frontend and backend features",
    "amount": 4000,
    "order": 2,
    "status": "IN_PROGRESS",
    "createdAt": "2026-02-23T13:00:00.000Z",
    "updatedAt": "2026-02-25T10:00:00.000Z"
  }
]
```

**Error responses:** `401` Unauthorized

---

### POST /projects/:id/milestones

Create a milestone. Requires **CLIENT** role.

**Request:**

```http
POST /projects/a1b2c3d4-e5f6-7890-abcd-ef1234567890/milestones
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "title": "Design Phase",
  "description": "Complete wireframes and mockups",
  "amount": 2500,
  "order": 1
}
```

**Response: `201 Created`**

```json
{
  "id": "d4e5f6a7-b8c9-0123-defg-456789012345",
  "projectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "Design Phase",
  "description": "Complete wireframes and mockups",
  "amount": 2500,
  "order": 1,
  "status": "PENDING",
  "createdAt": "2026-02-23T13:00:00.000Z",
  "updatedAt": "2026-02-23T13:00:00.000Z"
}
```

**Error responses:** `400` Validation error · `401` Unauthorized · `403` CLIENT role required · `404` Project not found

---

### PATCH /milestones/:id

Update milestone status. Requires authentication.

**Request:**

```http
PATCH /milestones/d4e5f6a7-b8c9-0123-defg-456789012345
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "status": "IN_PROGRESS"
}
```

**Response: `200 OK`**

```json
{
  "id": "d4e5f6a7-b8c9-0123-defg-456789012345",
  "projectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "Design Phase",
  "status": "IN_PROGRESS",
  "updatedAt": "2026-02-23T14:00:00.000Z"
}
```

**Valid milestone statuses:** `PENDING`, `IN_PROGRESS`, `COMPLETED`

**Error responses:** `400` Validation error · `401` Unauthorized · `404` Milestone not found

---

## Files

### POST /milestones/:id/files

Upload a deliverable file. Requires **FREELANCER** role. Multipart form data.

**Request:**

```http
POST /milestones/d4e5f6a7-b8c9-0123-defg-456789012345/files?projectId=a1b2c3d4-e5f6-7890-abcd-ef1234567890
Authorization: Bearer <token>
Content-Type: multipart/form-data

------boundary
Content-Disposition: form-data; name="file"; filename="wireframes-v2.pdf"
Content-Type: application/pdf

<binary file data>
------boundary--
```

**Response: `201 Created`**

```json
{
  "fileId": "f6a7b8c9-d0e1-2345-fghi-678901234567",
  "name": "wireframes-v2.pdf",
  "mimeType": "application/pdf",
  "fileSize": 2048576,
  "downloadUrl": "https://xxxx.supabase.co/storage/v1/object/sign/deliverables/..."
}
```

**File validation rules:**
- Max size: 10 MB
- Allowed types: PDF, PNG, JPG, JPEG, GIF, ZIP, DOC, DOCX

**Error responses:** `400` Invalid file (size or type) · `401` Unauthorized · `403` FREELANCER role required

---

### GET /files/:id/download

Download a file. Returns a `302` redirect to a presigned Supabase Storage URL.

**Request:**

```http
GET /files/f6a7b8c9-d0e1-2345-fghi-678901234567/download
Authorization: Bearer <token>
```

**Response: `302 Found`**

```http
Location: https://xxxx.supabase.co/storage/v1/object/sign/deliverables/...?token=...&expires=...
```

The presigned URL is valid for a limited time (typically 60 seconds).

**Error responses:** `401` Unauthorized · `404` File not found

---

## Time Entries

### POST /projects/:projectId/time-entries

Log a time entry. Requires **FREELANCER** role.

**Request:**

```http
POST /projects/a1b2c3d4-e5f6-7890-abcd-ef1234567890/time-entries
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "hours": 4.5,
  "description": "Implemented user authentication flow",
  "date": "2026-02-23T00:00:00.000Z",
  "milestoneId": "d4e5f6a7-b8c9-0123-defg-456789012345"
}
```

**Response: `201 Created`**

```json
{
  "id": "g7b8c9d0-e1f2-3456-ghij-789012345678",
  "projectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "freelancerId": "f1e2d3c4-b5a6-7890-fedc-ba9876543210",
  "hours": 4.5,
  "description": "Implemented user authentication flow",
  "date": "2026-02-23T00:00:00.000Z",
  "milestoneId": "d4e5f6a7-b8c9-0123-defg-456789012345",
  "createdAt": "2026-02-23T15:00:00.000Z"
}
```

**Error responses:** `400` Validation error · `401` Unauthorized · `403` FREELANCER role required · `404` Project not found

---

### GET /projects/:projectId/time-entries

Get time entries for a project. Requires **CLIENT** or **FREELANCER** role.

**Request:**

```http
GET /projects/a1b2c3d4-e5f6-7890-abcd-ef1234567890/time-entries
Authorization: Bearer <token>
```

**Response: `200 OK`**

```json
[
  {
    "id": "g7b8c9d0-e1f2-3456-ghij-789012345678",
    "projectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "freelancerId": "f1e2d3c4-b5a6-7890-fedc-ba9876543210",
    "hours": 4.5,
    "description": "Implemented user authentication flow",
    "date": "2026-02-23T00:00:00.000Z",
    "milestoneId": "d4e5f6a7-b8c9-0123-defg-456789012345",
    "createdAt": "2026-02-23T15:00:00.000Z"
  },
  {
    "id": "h8c9d0e1-f2g3-4567-hijk-890123456789",
    "projectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "freelancerId": "f1e2d3c4-b5a6-7890-fedc-ba9876543210",
    "hours": 3.0,
    "description": "Set up database migrations and seed data",
    "date": "2026-02-22T00:00:00.000Z",
    "milestoneId": null,
    "createdAt": "2026-02-22T17:00:00.000Z"
  }
]
```

**Error responses:** `401` Unauthorized

---

## Error Response Format

All errors follow a consistent format via the global `HttpExceptionFilter`:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "budgetMin",
      "message": "budgetMin must not be less than 0"
    }
  ],
  "timestamp": "2026-02-23T10:00:00.000Z",
  "path": "/projects"
}
```

For domain-level errors (invalid state transitions, budget exceeded):

```json
{
  "statusCode": 409,
  "message": "Invalid project status transition: DRAFT → COMPLETED",
  "timestamp": "2026-02-23T10:05:00.000Z",
  "path": "/projects/a1b2c3d4-e5f6-7890-abcd-ef1234567890/status"
}
```
