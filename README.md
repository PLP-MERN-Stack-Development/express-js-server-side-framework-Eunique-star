# express-js-server-side-framework-Eunique-star

Simple Express.js server for Week 2 assignment. This project implements a small in-memory products API with basic middleware, validation, filtering, pagination, search and statistics endpoints. The code is written in a beginner-friendly style.

## Requirements

- Node.js (v14+ recommended)
- npm (comes with Node.js)

## Install

From the project root, install dependencies (if any are listed in package.json):

```powershell
npm install
```

## Run the server

Start the server with:

```powershell
node server.js
```

By default the server listens on http://localhost:3000. You can change the port by setting the `PORT` environment variable.

Example (PowerShell):

```powershell
#$env:PORT = 3000; node server.js
node server.js
```

## Authentication

Write operations (POST, PUT, DELETE) require a simple API key header. Include `x-api-key: mysecretkey` in the request headers. Read endpoints (GET) are public in this example.

## API Endpoints

Base path: `/api/products`

1. GET /api/products

   - Description: List products. Supports optional query parameters for filtering, searching and pagination.
   - Query params:
     - `category` — filter by category (case-insensitive exact match)
     - `search` — search product name (case-insensitive partial match)
     - `page` — page number (default 1)
     - `limit` — items per page (default 10)
   - Response:
     - 200 OK
     - JSON: { page, limit, total, data: [ ...products ] }

   Example:

   Request:

   ```powershell
   Invoke-RestMethod http://localhost:3000/api/products
   ```

   Response (example):

   ```json
   {
     "page": 1,
     "limit": 10,
     "total": 3,
     "data": [
       {
         "id": "1",
         "name": "Laptop",
         "description": "High-performance laptop with 16GB RAM",
         "price": 1200,
         "category": "electronics",
         "inStock": true
       },
       {
         "id": "2",
         "name": "Smartphone",
         "description": "Latest model with 128GB storage",
         "price": 800,
         "category": "electronics",
         "inStock": true
       },
       {
         "id": "3",
         "name": "Coffee Maker",
         "description": "Programmable coffee maker with timer",
         "price": 50,
         "category": "kitchen",
         "inStock": false
       }
     ]
   }
   ```

2. GET /api/products/:id

   - Description: Get one product by id.
   - Response:
     - 200 OK with product object
     - 404 Not Found if id doesn't exist

   Example:

   ```powershell
   Invoke-RestMethod http://localhost:3000/api/products/1
   ```

   Response:

   ```json
   {
     "id": "1",
     "name": "Laptop",
     "description": "High-performance laptop with 16GB RAM",
     "price": 1200,
     "category": "electronics",
     "inStock": true
   }
   ```

3. POST /api/products

   - Description: Create a new product. Requires header `x-api-key: mysecretkey`.
   - Body JSON (example):
     - name (string), description (string), price (number >=0), category (string), inStock (boolean)
   - Response:
     - 201 Created with the created product (includes generated `id`)
     - 400 Bad Request for invalid data
     - 401 Unauthorized if missing/invalid API key

   Example (PowerShell):

   ```powershell
   $body = @{
   	 name = 'Tea Kettle'
   	 description = 'Electric kettle, 1.5L'
   	 price = 35
   	 category = 'kitchen'
   	 inStock = $true
   } | ConvertTo-Json

   Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/products -Body $body -ContentType 'application/json' -Headers @{ 'x-api-key' = 'mysecretkey' }
   ```

   Response (example):

   ```json
   {
     "id": "<uuid>",
     "name": "Tea Kettle",
     "description": "Electric kettle, 1.5L",
     "price": 35,
     "category": "kitchen",
     "inStock": true
   }
   ```

4. PUT /api/products/:id

   - Description: Replace/update a product. Requires `x-api-key` header and full product body (same shape as POST).
   - Response:
     - 200 OK with updated object
     - 400 Bad Request for invalid data
     - 401 Unauthorized if missing/invalid API key
     - 404 Not Found if product id doesn't exist

5. DELETE /api/products/:id

   - Description: Delete a product by id. Requires `x-api-key` header.
   - Response:
     - 200 OK with { message: 'Product deleted', product: { ... } }
     - 401 Unauthorized if missing/invalid API key
     - 404 Not Found if product id doesn't exist

6. GET /api/products/stats
   - Description: Return simple statistics (total count and counts grouped by category).
   - Response:
     - 200 OK
     - Example:
   ```json
   { "total": 3, "byCategory": { "electronics": 2, "kitchen": 1 } }
   ```
