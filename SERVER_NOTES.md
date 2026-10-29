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

Converts `points` into cash at **$0.05 per point with no commission**
(100,000 points = $5,000) and credits the result to `cashBalance`.
Recompute everything server-side — never trust a client-sent amount:

```js
const POINTS_TO_USD_RATE = 0.05;        // 1 point = $0.05 (matches lib/api/wallet.ts)

grossAmount = points * POINTS_TO_USD_RATE;
netAmount = grossAmount;                // no commission is deducted
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
    "cashBalance": 25,       // updated balance
    "pointsConverted": 500,
    "grossAmount": 25,
    "netAmount": 25
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

## 8. `PATCH /api/resorts/:id` — edit a resort (admin-only)

Body is a partial `CreateResortInput` (`UpdateResortInput` in
`lib/api/admin.ts`) — only the fields being changed need to be sent, though
the edit form currently sends the full set every time:

```js
// 200
{ "success": true, "data": { "_id": "...", "resortName": "...", ... } }
```

404 if no resort exists with that id.

## How the backend identifies "is this caller an admin?"

Every request from `lib/api/admin.ts` (create/edit resort, list users,
change a user's role) now carries an `x-user-email` header set to the
signed-in Firebase user's email — see `getCurrentUserEmail()` in that file.
The backend's `requireAdmin` middleware looks that email up in the `User`
collection and checks `isAdmin`, rejecting with 401 (no/unrecognized email)
or 403 (recognized but not an admin) before the route handler runs. This is
the same `isAdmin` field the frontend's `AuthProvider` already trusts, so
there's one consistent source of truth for who's an admin — it is not a
verified Firebase ID token, so it stops casual/direct API calls but not a
determined attacker who knows another admin's email. Swapping in real
token verification (`firebase-admin`'s `verifyIdToken`) later would only
mean changing what `requireAdmin` reads the caller's identity from — the
route wiring and the 401/403 behavior stay the same.

## 9. The resort card's edit icon

`components/resorts/ResortCard.tsx` shows a small pencil icon (top-right of
the thumbnail) only when the signed-in user's role is `"admin"`. Clicking
it goes to `/dashboard/admin/resorts/[id]/edit`, which loads the resort via
the existing `GET /api/resorts/:id`, prefills the same fields as "Add
Resort," and saves via the new `PATCH /api/resorts/:id` above. Non-admins
and signed-out visitors never see the icon and the route itself is behind
the same admin guard as the rest of `/dashboard/admin/*`.


---

# Pricing parity with the client (flights, cars, exchange fee)

The client now shows these figures; the server recomputes totals on
booking, so update it to match or confirmations will show the old numbers.

- **Flights — member discount is 23%** (was 47%): `discountedPrice =
  retailPrice * 0.77`. The flight detail page re-prices the fare at 23%
  (`withMemberDiscount` in `lib/types/flight.ts`) and saves it to the draft;
  the points fare is scaled by the same change, plus the 10% processing fee.
- **Flight add-ons** (`FLIGHT_ADDON_PRICING`): seat $45 / 1,125 pts per
  seat (was $15 / 375), extra checked bag $85 / 2,125 pts (was $35 / 875).
- **Car add-ons** are shown in points at 25 pts per $1 (e.g. insurance
  $18/day = 450 pts/day), the same rate used to convert cash to points.
- **Resort exchange fee** (points bookings): $59 for the first night + $20
  for each additional night, shown on `/resort-directory/:id` and on the
  available-unit page. It is display-only for now; it is not yet added to
  checkout/payment totals or sent to the server.
