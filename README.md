# E-Commerce Web Application

Node.js + Express + MongoDB (Mongoose) + JWT auth, with a plain HTML/JS frontend.

## Run
1. Install Node.js and MongoDB (or set an Atlas URI in `.env`)
2. `npm install`
3. `npm run seed`   (creates admin, demo user, sample products)
4. `npm start`      -> http://localhost:5000

Logins: admin@shop.com / admin123, user@shop.com / user123

## API
- POST /api/auth/register, /api/auth/login
- GET /api/products, GET /api/products/:id
- POST/PUT/DELETE /api/products (admin)
- POST /api/orders, GET /api/orders/mine
- GET /api/orders, PUT /api/orders/:id/status (admin)
