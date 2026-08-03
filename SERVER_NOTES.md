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
const POINTS_TO_USD_RATE = 0.025;       // 1 point = $0.025 (matches booking pricing)
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
    "cashBalance": 12.5,     // updated balance
    "pointsConverted": 500,
    "grossAmount": 12.5,
    "commissionAmount": 3.75,
    "netAmount": 8.75
  }
}
```

Use a MongoDB transaction or a single atomic `findOneAndUpdate` with a
`points >= $points` filter guard to avoid a race where two simultaneous
conversion requests could push the balance negative.
