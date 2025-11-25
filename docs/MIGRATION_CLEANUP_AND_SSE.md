# Migration Cleanup & Support Ticket SSE

## 1. Why Cleanup Was Needed
The original baseline migration failed during shadow DB application (`P3006`). We added new models (`SellerReview`, `SupportTicket`, `SupportMessage`) and extended `User` (social auth + seller rating aggregates) after the baseline existed. Instead of stacking an inconsistent migration sequence, we regenerated a clean baseline SQL reflecting the current schema. This is acceptable ONLY for environments where historical migration integrity is not critical (fresh dev / staging reset).

## 2. When NOT To Do This
Do *not* rewrite an applied baseline in production. It breaks the linear migration history and can orphan database state. In production, always generate delta migrations (`npx prisma migrate dev --name <change>`). Use cleanup only if:
- You recreated the database from scratch.
- You intentionally reset migrations for a new environment.

## 3. Recommended Fresh Rebuild Procedure
```
# Backup (if needed)
mysqldump -u root -p my_store_db > backup_before_reset.sql

# Optional: Drop & recreate database (dev only)
mysql -u root -p -e "DROP DATABASE my_store_db; CREATE DATABASE my_store_db;"

# Remove old migration history
rm -rf prisma/migrations

# Recreate baseline from current datamodel
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --output prisma/migrations/00000000000000_baseline/migration.sql
npx prisma generate
npx prisma migrate dev --name baseline
```

## 4. Social & Seller Changes Summary
- `User`: added `socialProvider`, `socialProviderId`, `sellerRatingAvg`, `sellerRatingCount` + indexes.
- `SellerReview`: separate moderation flow from product reviews.
- Support ticket system: `SupportTicket`, `SupportMessage` with status enum.

## 5. Support Ticket SSE
New endpoint: `GET /api/support/tickets/:id/stream`
Emits events:
- `ticket_init`: initial snapshot `{ ticketId, status, messages }`
- `ticket_message`: on new message `{ ticketId, message }`
- `ticket_status`: on status change `{ ticketId, status }`
 - `ping`: heartbeat every `SSE_HEARTBEAT_MS` (default 25000ms) to keep connection alive

### Subscribe Example (curl)
```
curl -H "Authorization: Bearer <TOKEN>" http://localhost:8829/api/support/tickets/<TICKET_ID>/stream
```

### Frontend JS Example
```js
const es = new EventSource(`/api/support/tickets/${ticketId}/stream`, { withCredentials: true });
es.addEventListener('ticket_init', e => {
  const data = JSON.parse(e.data);
  console.log('Init', data);
});
es.addEventListener('ticket_message', e => {
  const { ticketId, message } = JSON.parse(e.data);
  // append message to UI
});
es.addEventListener('ticket_status', e => {
  const { status } = JSON.parse(e.data);
  // update status badge
});
es.addEventListener('ping', e => {
  // optional: update latency metrics
});
```

## 6. Broadcasting Logic
Implemented inside `server/controllers/support.js` using an in-memory `Map(ticketId -> Set<res>)`. Added in-memory rate limiting:
- Per-user/IP concurrent streams: `USER_MAX_CONNECTIONS` (env, default 5)
- Per-ticket subscribers cap: `SSE_TICKET_MAX_SUBSCRIBERS` (env, default 50)
Heartbeat `ping` events keep intermediaries from closing idle streams.
For horizontal scale, move subscriptions to Redis pub/sub and enforce limits centrally.

## 7. Next Hardening Ideas
- Add rate limiting per ticket stream.
- Idle timeout cleanup / heartbeat events.
- Persist message read/unread states.
- Replace in-memory with Redis when clustering.
 - Observability: count active streams and expose metrics endpoint.
 - Backpressure: queue bursts & drop after N consecutive failures.

## 8. Rolling Back
If baseline was rewritten accidentally in a live environment:
1. Stop deployment.
2. Restore DB from backup.
3. Revert migration folder to original state in version control.
4. Reapply only incremental migrations.

## 9. Audit Integration
All create/update actions emit `audit` events with entity `supportTicket` or `sellerReview` for traceability.

## 10. Verification Checklist
- `npx prisma db push` or `migrate dev` succeeds.
- `GET /api/support/tickets/:id/stream` returns SSE headers and `ticket_init`.
- Posting `/api/support/tickets/:id/messages` fires `ticket_message`.
- Patching `/api/support/tickets/:id/status` fires `ticket_status`.

---
Document maintained by AI assistant. Update when introducing persistence or distributed streaming.
