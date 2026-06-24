# The Point Ko.fi POS System

A deployable small-business POS web app based on the menu photo. Built with **Next.js + Node.js API Routes + MongoDB** and ready for **Vercel**.

## Included features

- Register / cashier screen
- Menu categories and sub-categories
- Product variants, e.g. Soda-Pop 12oz / 16oz / 22oz
- Add-ons, e.g. Sea Salt Foam, Yakult Mist, Sea Salt Cream Cheese
- Cart quantity controls
- Cash, GCash, card, and bank transfer payment labels
- Fixed or percentage discount
- Tax and service-charge settings
- Receipt modal and browser print
- MongoDB order saving
- Inventory CRUD for products
- Stock tracking and low-stock alerts
- Order history with receipt reprint, CSV export, void/refund status
- Dashboard summary, top items, and recent activity
- Demo/offline mode if MongoDB is not yet configured
- Seed endpoint to insert the menu from the photo into MongoDB

## Menu items encoded from the photo

### Drinks

**Iced Ko.fi Series 16oz**

- Iced Latte — 75
- Spanish Latte — 85
- Caramel Macchiato — 95
- Mocha Latte — 95
- Dirty Matcha — 95
- Hazelnut Latte — 85
- Vanilla Latte — 85
- Iced Americano — 65
- Oreo Pink Latte — 99
- Oreo Latte — 85

**Non-Ko.fi Series 16oz**

- Matcha Latte — 95
- Berry Matcha — 99
- Oreo Matcha — 95
- Dark Chocolate Latte — 89
- Milky Strawberry — 85
- Milky Blueberry — 85
- Oreo Milo Bliss — 95

**Soda-Pop Series**

- Green Apple, Blueberry, Lychee, Strawberry, Blue Lemonade
- 12oz — 25
- 16oz — 35
- 22oz — 45
- Add-ons included in the seed data: Up Size 4oz, Sea Salt Foam, Yakult Mist, Sea Salt Cream Cheese

### Snacks

**Waffle Sandwich Series**

- Tuna WS — 65
- Burger WS — 55
- Egg WS — 50
- Ham WS — 50

**Overload Snack**

- Fries Overload — 120
- Natchos Overload — 100

**Fried Noodles - Cabbage Base**

- FN (Plain) — 50
- FN w/ Egg — 65
- FN w/ Siopao — 70
- FN w/ Ham — 65
- FN w/ Burger Patty — 65
- FN w/ Siomai — 65

**Samyang Buldak**

- Samyang Buldak Carbonara is included as inactive because the price is not visible in the photo. Edit the price and activate it in Inventory.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>.

## MongoDB setup

1. Create a MongoDB Atlas cluster.
2. Create a database user.
3. Allow your IP locally, and for Vercel you can use Atlas network access `0.0.0.0/0` if appropriate for your project.
4. Copy your MongoDB URI.
5. Add it to `.env.local`:

```bash
MONGODB_URI="mongodb+srv://dexterlambbb_db_user:<PASSWORD>@cluster0.wdrok43.mongodb.net/pos_system?retryWrites=true&w=majority&appName=Cluster0"
MONGODB_DB="pos_system"
```

Use the real password in place of `<PASSWORD>`. Do not paste the markdown format `[password@host](mailto:...)` and do not use `&amp;`; use `&`. MongoDB Atlas will auto-create the `pos_system` database after you seed the menu or save the first order.

Then run the app and go to **Settings → Seed menu to MongoDB**.

You may also seed via API:

```bash
curl -X POST http://localhost:3000/api/seed
```

## Deploy to Vercel

1. Push this folder to GitHub.
2. Go to Vercel → Add New Project → Import repository.
3. Add Environment Variables:
   - `MONGODB_URI`
   - `POS_DB_NAME` optional
   - `NEXT_PUBLIC_STORE_NAME` optional
4. Deploy.
5. Open the deployed URL, go to **Settings**, then click **Seed menu to MongoDB**.

## API endpoints

- `GET /api/products?all=1` — list products
- `POST /api/products` — create product
- `PUT /api/products/:id` — update product
- `DELETE /api/products/:id` — delete product
- `GET /api/orders` — list orders
- `POST /api/orders` — create paid order
- `PATCH /api/orders/:id` — update order status
- `GET /api/reports` — today sales summary
- `GET /api/settings` — business settings
- `POST /api/settings` — save business settings
- `POST /api/seed` — seed default menu and settings

## Notes

- This is a practical starter POS for a small business. For production, add authentication, role permissions, audit logs, and payment-provider integration.
- The receipt print uses the browser print dialog.
- Inventory stock is decremented only for products with `trackStock: true`.
