# XTB Clone Project

XTB Clone is a web application that simulates a simple trading platform.

The system allows users to manage a wallet, buy and sell instruments, track positions, upload profile avatars and receive live price updates through WebSocket communication.

The project is built as a multi-module Docker-based web system with HTTPS reverse proxy, network separation, persistent storage, authentication and rate limiting.

---

## Tech Stack

### Frontend

- Angular
- TypeScript
- SignalR client
- ngx-toastr
- nginx static hosting

### Backend

- ASP.NET Core Web API
- Entity Framework Core
- JWT authentication
- SignalR
- Rate limiting
- BCrypt password hashing
- Redis
- MySQL

### Infrastructure

- Docker Compose
- nginx reverse proxy
- HTTPS with local self-signed certificate
- Docker networks
- Docker volumes

---

## System Architecture

The system consists of 5 Docker modules:

1. `nginx` - reverse proxy and HTTPS entry point
2. `frontend` - Angular application served by nginx
3. `backend` - ASP.NET Core Web API
4. `mysql` - relational database
5. `redis` - cache module used by the backend

```txt
Browser
   |
   | HTTPS
   v
nginx reverse proxy
   |
   |-- /          -> frontend
   |-- /api       -> backend
   |-- /uploads   -> backend static files
   |-- /hubs      -> backend SignalR hub
                    |
                    |-- MySQL
                    |-- Redis
```

Only nginx exposes public ports. Backend, MySQL and Redis are available only inside Docker networks.

---

## Main Features

- user registration and login
- JWT-based authentication
- password hashing with BCrypt
- user profile management
- avatar upload and static file serving
- wallet with PLN, EUR and USD balances
- deposits and withdrawals
- currency conversion using ECB exchange rates
- total wallet value displayed in selected currency
- instrument list
- buy trades
- automatic currency conversion when USD balance is insufficient
- open positions list
- closing positions
- transaction history
- live price updates through SignalR WebSocket
- rate limiting for selected endpoints
- toast notifications on frontend actions

---

## Requirements

To run the full system:

- Docker
- Docker Compose
- Git

Optional for local development without Docker:

- .NET 8 SDK
- Node.js
- MySQL

---

## Quick Start

Follow these steps to run the full system locally with Docker Compose.

### 1. Clone the repository

```bash
git clone https://github.com/chr1317/XTBCloneProject.git
cd XTBCloneProject
```

### 2. Create environment file

Copy the example environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
copy .env.example .env
```

Then open `.env` and fill in required values, for example:

```env
FINNHUB_API_KEY=your_api_key
```

### 3. Generate local HTTPS certificate

The project uses a local self-signed certificate for HTTPS in nginx.

Certificates are not committed to the repository because they contain a local private key.

Create the certificate directory:

```powershell
mkdir nginx\certs
```

Generate a local self-signed certificate using Docker:

```powershell
docker run --rm -v "${PWD}\nginx\certs:/certs" alpine/openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /certs/localhost.key -out /certs/localhost.crt -subj "/CN=localhost"
```

After this command, these files should exist:

```txt
nginx/certs/localhost.crt
nginx/certs/localhost.key
```

### 4. Start the system

From the root directory of the project:

```bash
docker compose down
docker compose up --build
```

This starts all modules:

```txt
nginx
frontend
backend
mysql
redis
```

### 5. Open the application

Go to:

```txt
https://localhost
```

The browser will show a warning because the certificate is self-signed. This is expected for local development.

Choose **Advanced** and continue to the site.

HTTP traffic is automatically redirected to HTTPS:

```txt
http://localhost -> https://localhost
```

### 6. Verify running containers

```bash
docker compose ps
```

Expected containers:

```txt
xtb_nginx
xtb_frontend
xtb_backend
xtb_mysql
xtb_redis
```

Only nginx should expose public ports:

```txt
80
443
```

Backend, MySQL and Redis should not expose public ports directly on the host.

### 7. Stop the system

```bash
docker compose down
```

---

## Environment Variables

The Docker Compose setup passes required environment variables to the backend container.

Example `.env` file:

```env
FINNHUB_API_KEY=your_api_key
```

Other values such as database connection string, JWT key and Redis connection string are configured in `docker-compose.yml`.

---

## HTTPS

The system uses nginx as the HTTPS entry point.

The browser communicates with nginx through HTTPS:

```txt
https://localhost
```

nginx then forwards traffic to internal Docker services:

```txt
/api      -> backend
/uploads  -> backend static files
/hubs     -> backend SignalR hub
/         -> frontend
```

Because the certificate is self-signed, the browser will not trust it automatically. This is normal for local development and project presentation.

---

## Network Separation

The system uses Docker networks to separate public and internal communication.

The user accesses the system only through nginx.

Correct access:

```bash
curl -k -i https://localhost/api/instruments
```

Direct backend access should not work:

```bash
curl -i http://localhost:8080/api/instruments
```

Redis should not be directly accessible from the host. It can be checked from inside Docker:

```bash
docker exec -it xtb_redis redis-cli ping
```

Expected result:

```txt
PONG
```

MySQL and Redis are used only by backend inside Docker networks.

---

## WebSocket / SignalR

Live price updates are delivered through SignalR.

SignalR hub path:

```txt
/hubs/prices
```

In browser DevTools:

```txt
Network -> WS -> wss://localhost/hubs/prices
```

This confirms that WebSocket communication is going through nginx over HTTPS/WSS.

---

## Rate Limiting

The backend uses ASP.NET Core rate limiting policies.

Example test for login rate limiting:

```powershell
1..7 | ForEach-Object {
  curl.exe -k -i -X POST https://localhost/api/auth/login `
    -H "Content-Type: application/json" `
    -d "{\"email\":\"bad@test.com\",\"password\":\"bad\"}"
}
```

After exceeding the limit, the API should return:

```txt
HTTP/1.1 429 Too Many Requests
```

---

## Persistent Storage

The project uses Docker volumes:

```txt
mysql_data
uploads_data
```

These volumes persist:

- MySQL database data
- uploaded files, including user avatars

This means database data and uploaded files are preserved between container restarts.

---

## API Overview

### Auth

```txt
POST /api/auth/register
POST /api/auth/login
```

### Users

```txt
GET    /api/users
GET    /api/users/{id}
PUT    /api/users/{id}
DELETE /api/users/{id}
GET    /api/users/me
PUT    /api/users/me
```

### Files

```txt
POST /api/files/avatar
```

### Wallet

```txt
GET  /api/wallet
GET  /api/wallet/total?currency=USD
POST /api/wallet/deposit
POST /api/wallet/withdraw
POST /api/wallet/convert
```

### Instruments

```txt
GET /api/instruments
GET /api/instruments/{id}
```

### Trades

```txt
GET  /api/trades
POST /api/trades
```

### Positions

```txt
GET  /api/positions
POST /api/positions/close
```

### WebSocket

```txt
/hubs/prices
```

---

## HTTP Status Codes

The API uses standard HTTP status codes, including:

```txt
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
429 Too Many Requests
500 Internal Server Error
```

Examples:

- `200 OK` - successful data retrieval
- `201 Created` - resource created
- `400 Bad Request` - invalid input data
- `401 Unauthorized` - missing or invalid token
- `403 Forbidden` - user does not have permission
- `404 Not Found` - resource does not exist
- `409 Conflict` - additional user action required, for example auto-conversion confirmation
- `429 Too Many Requests` - rate limit exceeded
- `500 Internal Server Error` - unexpected server error

---

## Local Development Without Docker

The recommended way to run the full system is Docker Compose.

For development, backend and frontend can also be run separately.

### Backend

```bash
cd Backend/XTBCloneAPI
dotnet restore
dotnet ef database update
dotnet run
```

### Frontend

```bash
cd xtb-clone-front
npm install
npm start
```

When running outside Docker, make sure the backend, database and required environment variables are configured correctly.

---

## Notes

- Local SSL certificates are ignored by Git.
- The application should be accessed through `https://localhost` when running with Docker Compose.
- Backend, MySQL and Redis should not be accessed directly from the host in the Docker setup.
- API requests, uploads and WebSocket traffic are routed through nginx.
