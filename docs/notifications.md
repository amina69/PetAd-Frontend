# Real-Time Notifications & Transport Decision

> Branch: `feat/notifications-realtime`

## Overview

This document records the architecture and protocol decisions agreed upon with the backend team for real-time notifications and status updates across the PetAd platform (Epic C).

---

## Transport Protocol

- **Agreed Transport:** WebSocket (`wss://` in production, `ws://` in local development)
- **Endpoint:** `/api/ws/notifications`
- **Fallback:** Server-Sent Events (SSE) via `/api/sse/notifications` if WebSocket connection fails after 3 retry attempts.

---

## Authentication Mechanism

- **Connection Handshake:** Authentication token is passed via query parameter during the initial WebSocket handshake:
  ```text
  wss://api.petad.example.com/api/ws/notifications?token=<JWT_BEARER_TOKEN>
  ```
- If the token is missing or expired, the server terminates the connection with code `4001` (Unauthorized).

---

## Message Envelope Shape

All real-time messages adhere to the following JSON envelope structure:

```json
{
  "eventId": "evt_9f8e7d6c5b4a3",
  "type": "ESCROW_FUNDED",
  "timestamp": "2025-03-30T12:00:00.000Z",
  "payload": {
    "id": "notif-101",
    "title": "Escrow Funded",
    "message": "Your escrow for pet-1 has been successfully funded.",
    "isRead": false,
    "metadata": {
      "resourceId": "adoption-001"
    }
  }
}
```

---

## Reconnect & Heartbeat Expectations

- **Heartbeat / Ping-Pong:** The client sends a `ping` frame every 30 seconds. The server responds with a `pong` frame. If no pong is received within 10 seconds, the client initiates a reconnection.
- **Reconnect Backoff:** Exponential backoff starting at 1 second up to a maximum interval of 30 seconds, with full jitter.

---

## References

- Linked from PR descriptions across all Epic C issues.
- Closes #C1
