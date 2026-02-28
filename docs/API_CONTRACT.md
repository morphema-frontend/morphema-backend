# API Contract (Minimal)

Base prefix: `/api`

## Auth

### POST /api/auth/login
Request:
```json
{ "email": "user@example.com", "password": "Password123!" }
```

Success 200:
```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>",
  "user": { "id": 1, "email": "user@example.com", "role": "worker" }
}
```

Failure:
- 400 `{ "message": "Email and password are required", "code": "BAD_REQUEST" }`
- 401 `{ "message": "Invalid credentials", "code": "AUTH_INVALID" }`

### POST /api/auth/register
Request:
```json
{ "email": "user@example.com", "password": "Password123!", "role": "worker" }
```

Success 200: same shape as login.

Failure:
- 409 `{ "message": "Account already exists", "code": "AUTH_EXISTS" }`

## Errors (General)
All errors are JSON:
```json
{ "message": "Error message", "code": "ERROR_CODE" }
```

## Audit Notes
- `audit_events.entityId` is numeric and reserved for numeric entity IDs.
- Session UUIDs are stored in `payload.sessionId` for session-related actions.
