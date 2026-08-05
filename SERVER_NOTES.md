# Wallet feature — backend requirements

This zip only contains the **frontend** (`interval-ash-client`). Points and
cash balances must be persisted server-side, in the separate
`interval-ash-server` repo (the one `NEXT_PUBLIC_API_BASE_URL` points at) —
the same place that already owns the `User` and `Booking` collections.

The frontend now calls the two endpoints below (see `lib/api/wallet.ts`).
Nothing else in the client needs to change once these exist.

## 1. User schema — add two fields

```js
// User model
points: { type: Number, default: 0 },
cashBalance: { type: Number, default: 0 },
```

## 2. Signup bonus — `POST /api/users` (already exists)

When a new user document is created (first time this email is seen), set
`points: 1000` (matches `SIGNUP_BONUS_POINTS` in `lib/api/wallet.ts`) before
saving. Do **not** reset `points` on subsequent calls — this route already
returns the existing record for a returning email, so the bonus only fires
once per account, at creation time. Existing users keep whatever balance
they already have.

## 3. `GET /api/wallet?email=`

Returns the signed-in member's current balances.

```js
// 200
{ "success": true, "data": { "points": 1000, "cashBalance": 0 } }
```

## 4. `POST /api/wallet/convert`

Body: `{ "email": string, "points": number }`

Converts `points` into cash at a **30% commission** and credits the result
to `cashBalance`. Recompute everything server-side — never trust a
client-sent amount:

```js
const POINTS_TO_USD_RATE = 0.05;        // 1 point = $0.05 (matches lib/api/wallet.ts)
const COMMISSION_RATE = 0.3;            // 30%

grossAmount = points * POINTS_TO_USD_RATE;
commissionAmount = grossAmount * COMMISSION_RATE;
netAmount = grossAmount - commissionAmount;
```

Validation (return `400` with a clear `message` on failure):
- `points` must be a positive integer.
- `points` must be `<=` the user's current `points` balance — reject
  otherwise ("You don't have enough points for this conversion.").

On success, atomically:
```js
user.points -= points;
user.cashBalance += netAmount;
await user.save();
```

Response:
```js
// 200
{
  "success": true,
  "data": {
    "points": 500,           // updated balance
    "cashBalance": 17.5,     // updated balance
    "pointsConverted": 500,
    "grossAmount": 25,
    "commissionAmount": 7.5,
    "netAmount": 17.5
  }
}
```

Use a MongoDB transaction or a single atomic `findOneAndUpdate` with a
`points >= $points` filter guard to avoid a race where two simultaneous
conversion requests could push the balance negative.

---

# Admin panel — backend requirements

The admin panel (`/dashboard/admin/*`, see `lib/api/admin.ts`) needs three
more routes on the same backend. All three should require the caller to be
an authenticated admin — check `isAdmin` on the requesting user server-side,
don't rely on the frontend's route guard alone, since anyone can call the
API directly.

## 5. `GET /api/all-users`

Returns every registered user (admins and regular members).

```js
// 200
{
  "success": true,
  "data": [
    { "_id": "...", "name": "Jane Doe", "email": "jane@example.com", "isAdmin": false, "points": 1000, "cashBalance": 0, "createdAt": "..." },
    { "_id": "...", "name": "Admin User", "email": "admin@example.com", "isAdmin": true, "points": 1000, "cashBalance": 0, "createdAt": "..." }
  ]
}
```

## 6. `PATCH /api/update-user`

Body: `{ "email": string, "isAdmin": boolean }`

Updates one user's `isAdmin` flag and returns the updated record.

```js
// 200
{ "success": true, "data": { "_id": "...", "name": "Jane Doe", "email": "jane@example.com", "isAdmin": true, "points": 1000, "cashBalance": 0 } }
```

Validation:
- 404 if no user exists with that email.
- Reject (400/403) a request that would remove `isAdmin` from the account
  making the request — the frontend already disables this in the UI, but
  the backend should enforce it too so the rule can't be bypassed by
  calling the API directly.

## 7. `POST /api/resorts` — create a resort (admin-only)

Body matches `CreateResortInput` in `lib/api/admin.ts`:

```js
{
  "resortName": "...", "location": "...", "symbol": "...", "region": "...",
  "country": "...", "continent": "...", "description": "...",
  "onSite": "...", "nearby": "...", "contactInfo": "...",
  "nearestAirport": "...", "checkInDays": ["Saturday", "Sunday"],
  "img": "...", "img2": "...", "img3": "...", "img4": "..."
}
```

Saves a new document in the same `Resort` collection `GET /api/resorts`
already reads from, and returns it (with its generated `_id`):

```js
// 201
{ "success": true, "data": { "_id": "...", "resortName": "...", ... } }
```

If the existing resort-creation route on your server is already named
something else (e.g. the legacy `/api/add-resort` from an earlier version
of this project), either add `/api/resorts` as a POST route alongside it,
or tell me the actual route name and I'll point `lib/api/admin.ts` at it
instead — that's a one-line change.

