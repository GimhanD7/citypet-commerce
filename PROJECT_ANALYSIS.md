# City Pet project analysis

Reviewed: September 10, 2026.

## Overall assessment

This is a substantial React interface with a partially connected PHP/MySQL backend. It has grown beyond the frontend concept described in the README. It is suitable for continued development and demonstrations, but the current authentication, authorization, order handling, and demo fallbacks prevent production use with real customers.

This review covers repository structure, application state and navigation, frontend/API integration, PHP endpoints, database schema and installer, build configuration, and selected accessibility implementation. It is a source review with build and syntax verification, not an exhaustive browser or penetration test.

## Architecture

| Area | Implementation |
| --- | --- |
| Frontend | React JSX, Vite, Lucide icons, global CSS, Tailwind/PostCSS tooling |
| Navigation | App.jsx state and URL hash handling; product identity is not encoded in URLs |
| Client state | Component state plus localStorage for user, cart, admin tab, and fallback audit logs |
| API client | src/config/api.js fetch wrapper, src/services/api.js domain services |
| Backend | Individual PHP scripts using PDO and MySQL |
| Database | 15 tables covering users, taxonomy, products, variants, reviews, addresses, pets, clinical history, orders, tracking, wishlists, and audit logs |
| Development | Vite proxies /citypet/api to Apache on port 80 |
| Data | Live database responses mixed with bundled sample data and generated success responses |

The separation into layout, common, section, and admin components is useful. PDO prepared statements are used for most user-supplied query values, the schema uses decimal monetary columns and several foreign keys, and the API wrapper provides centralized error and timeout handling. Those foundations are worth retaining.

## Critical and high-priority findings

### 1. Critical: authentication and admin role assignment are bypassable

Evidence: api/auth.php:72, :128, :138, :173; src/services/api.js:61; src/App.jsx:27.

- OTP 123456 is universally accepted, without a prior challenge, expiry, consumption, or attempt limit.
- New users obtain admin roles when their identifier contains strings such as admin, director, or citypet.lk.
- The issued token is base64-encoded JSON, with no signature or server-side session backing.
- Frontend authentication falls back to successful demo login on backend failures.
- The UI trusts the role stored in localStorage and does not establish a validated session on reload.

Implement server-validated sessions, server-controlled role assignment, and expiring single-use OTP challenges. Remove authentication fallback from operational builds.

### 2. Critical: sensitive APIs lack authentication and ownership checks

Evidence: api/products.php, api/orders.php, api/profile.php, api/pets.php, api/admin/dashboard.php; src/config/api.js.

Product writes, order status changes, profile updates, order listings, and clinical records do not check a verified caller. Client-provided user IDs determine whose records are accessed. pets.php explicitly supports user_id=all. Order tracking returns contact and address details. The client does not automatically attach an authenticated token.

Add common server-side authentication and role checks, then derive customer identity from the session. Restrict customer queries to owned records and minimize public tracking responses.

### 3. Critical if web-accessible: the installer erases application data

Evidence: api/database/seed.php:25.

The seeder runs schema SQL, disables foreign-key checks, and truncates users, products, orders, pets, and related tables. It accepts browser execution and has no authentication or environment guard. An exposed Apache deployment could allow a request to reset data.

Exclude installation scripts from the public document root and restrict seeding to explicit development CLI execution. Use migrations for deployed databases. The seeder was not executed during this review.

### 4. High: failed writes become successful UI responses

Evidence: src/services/api.js:223, :294, :322, :349; src/components/sections/CheckoutPage.jsx:123.

Failed order creation fabricates order and tracking numbers; checkout then shows confirmation and clears the cart. Profile changes, pet creation, and order status updates also return success-shaped fallbacks. Tracking failures may return an unrelated sample order. These paths conceal validation failures, outages, and lost writes.

Propagate write failures, retain user input, and show actionable errors. Put sample data behind an explicit demo mode. Add idempotency to order submission so retries do not create duplicates.

### 5. High: order prices and integrity are controlled by the request

Evidence: api/orders.php:170 and :190.

The server accepts subtotal, discounts, delivery fee, item prices, and quantities from the client. It does not verify product existence, selected variant pricing, positive quantity, inventory, or promotion eligibility. Order, item, and tracking inserts are not enclosed in a transaction, so failures can leave partial orders. Random order numbers can collide with the unique database constraint without retry handling.

Resolve products and variant prices on the server, validate all quantities and delivery/payment choices, calculate totals independently, and save the complete order transactionally. Implement persistent inventory before promising stock availability.

### 6. High: activity logging cannot reach its database implementation

Evidence: api/activity_logs.php:20 and :25.

The endpoint requires config/database.php, which does not exist. It also calls Database::getInstance(), while the actual class in config/db.php exposes static getConnection(). Correcting only the filename will leave the second failure. Syntax lint does not detect these runtime errors. Client-side fallback logs currently mask the problem.

After repairing the connection, derive audit actor identity on the server and create audit records alongside actual mutations. Client-supplied role/name fields and localStorage records are not a reliable audit trail.

### 7. High: search can throw a runtime exception

Evidence: src/components/common/SearchModal.jsx:36; src/data/storeData.js.

Search calls p.description.toLowerCase(), while product descriptions are arrays of paragraphs. A nonmatching search that reaches this condition throws TypeError, potentially taking down the interface because there is no application error boundary.

Normalize searchable text, for example by joining description arrays, and add a regression check for a query absent from product names and brands.

### 8. High: checkout does not associate orders with the signed-in user

Evidence: src/App.jsx checkout props; src/components/sections/CheckoutPage.jsx:35 and :104; api/orders.php userId handling.

App passes authUser, but CheckoutPage does not accept it and does not send userId. Instead it starts with sample customer details. Orders therefore receive a null user_id, while customer history requests filter by the user's ID (or an email equal to that ID). Newly placed orders can be missing from account history.

Populate customer fields from the authenticated profile and bind ownership on the server. Remove sample customer, address, card, and automatic discount values from normal checkout. Card inputs currently have no payment-provider processing behind them; the page must not imply successful card payment or verified payment security.

## Other functional and data issues

| Finding | Evidence and impact |
| --- | --- |
| Different sizes merge in cart | App.jsx:223 matches only product.id. Adding a second size increments the first entry and preserves its price/size. Use product plus variant identity for add/update/remove. |
| New visitors start with products in cart | App.jsx initializes three sample items; initialize empty in operational mode. |
| Product URLs cannot identify products | Every product uses #product, while selectedProduct is transient. Reloading or sharing opens the default product. |
| Store/search data differs from catalog | StoreProducts and SearchModal use static storeData; catalog fetches products. Added/deleted products need not appear consistently. |
| Product detail integration is incomplete | ProductDetail does not request the single-product endpoint that includes customerReviews; full_name is not mapped to the frontend fullName contract. |
| Catalog truncates larger inventories | Catalog fetches the default product list once; the endpoint defaults to 50 and service discards total/pagination metadata. |
| Admin categories do not persist | CategoriesView uses component state, while categories.php only reads taxonomy. Changes vanish on remount. |
| Stock adjustments do not persist | AdminDashboard.handleUpdateStockCount updates state and logs an action but never updates inventory in the database; schema has only in_stock. |
| Admin order creation is a simulation | CreateOrderModal inserts a hardcoded local row and ignores persistence. |
| Report download is a toast | GenerateReportModal does not generate or download a PDF/CSV. |
| Many admin sections are placeholders | GenericSubView displays a synchronization claim without fetching records. |
| Profile save is a notification | CustomerProfile's settings save button displays an alert rather than persisting settings. |
| Metrics are misleading | DashboardOverview hardcodes KPIs; the backend replaces real zero totals with sample values and hardcodes trends/chart/stock alerts. Profile counts similarly replace zero with sample counts. |
| Status and tracking can disagree | PUT orders changes order status without synchronizing tracking steps. |

## Database and backend quality

- Add validation for formats, lengths, enums, positive prices/quantities, bounded pagination, and malformed JSON. Return consistent errors and method restrictions.
- Use a least-privileged database account. Current defaults are root with a blank password, and connection failure triggers an attempt to create the database.
- Schema SQL hardcodes citypet_db and USE citypet_db, even though the connection supports DB_NAME; seeding can therefore target a different database than configured.
- Add uniqueness where required, including tracking references and normalized customer phone identities. Seven-digit suffix matching is ambiguous and scans all users.
- Use native date/time fields for clinical dates rather than display strings when scheduling and sorting become operational requirements.
- Address default uniqueness and references between orders/users and products/taxonomy need explicit integrity decisions.
- Product listing executes a size query per product; order listing executes two detail queries per order. Batch these queries and paginate collections as data grows.
- cors.php reflects arbitrary origins and enables credentials. Restrict origins to known deployments or use same-origin requests.
- health.php returns HTTP success even when disconnected; readiness monitoring needs a failure status when essential dependencies fail.

## Maintainability, performance, deployment, and accessibility

- src/styles.css has 13,990 lines. CustomerProfile has 1,461 lines, ProductDetail 929, CheckoutPage 856, and StoreCatalog 799. Split by feature and extract repeated forms/modal/state behavior as those features are repaired.
- All application views are eagerly imported. The verified build produces one 516.96 kB JavaScript chunk (137.87 kB gzip) and 216.69 kB CSS (38.27 kB gzip). Vite reports its large-chunk warning. Lazy-load account/admin/detail views and reduce unused styles.
- Several images are 500–800 kB; hero.png is approximately 1.49 MB. Resize/compress assets and use responsive image variants. Build size alone does not establish actual page load time.
- Vite has no deployment base configured. Built HTML points at /assets/. If served under /citypet/ or /citypet/dist/ on ordinary Apache, these asset URLs resolve outside that directory. Configure base and document the intended deployment layout.
- README still says there is no login, database, or backend. Document PHP/MySQL requirements, database installation, environment variables, demo mode, and deployment.
- package.json has build/dev/preview only: no tests, lint, or typecheck scripts. Several dependencies use latest ranges; the lockfile pins the current installation, but future dependency resolution is less controlled. No vulnerability audit was performed.
- Basic description/Open Graph metadata exists, but pages share one title and product identity is absent from URLs.
- Common dialogs declare aria-modal but lack focus trapping, focus restoration, and Escape handling. Product-card click targets and modal keyboard navigation need browser accessibility testing.

## Verification performed

- Production build: PASS using npm run build -- --outDir .analysis-build; existing dist was preserved.
- PHP syntax: PASS for all 12 PHP files using C:/xampp/php/php.exe -l.
- Static review confirmed the missing activity-log include, incompatible Database method, array/string search mismatch, demo fallbacks, and missing authorization checks.
- No database seeding, database mutations, payment attempts, or external publishing were performed.
- Database connectivity, live endpoint responses, browser rendering, mobile layouts, and end-to-end flows were not verified. Passing compilation and syntax checks does not establish these behaviors.

## Suggested repair sequence

1. Remove public seeding access and implement real authentication, server-controlled roles, and API ownership checks.
2. Remove operational write/auth fallbacks; repair activity logging and surface failures honestly.
3. Make checkout transactional and server-priced, bind customer identity, and implement the intended payment/inventory behavior.
4. Repair search and cart variant identity; unify product data and stable product routes.
5. Connect admin, profile, reports, and metrics to actual persisted functionality, or visibly mark unfinished features.
6. Add regression coverage for access control, failed writes, order totals, variant carts, and order history; then address deployment, accessibility, performance, and documentation.
