# Policy Claims Tracker

Policy Claims Tracker is a full-stack application for managing insurance policies and claims. It includes JWT authentication, policy and claim CRUD workflows, a dashboard, Docker/SSL deployment, and Kubernetes manifests for a local Kind cluster.

## Architecture

The React/Vite client communicates with the Express API through an Nginx proxy. The API uses Mongoose to persist users, policies, claims, and claim notes in MongoDB. Docker Compose runs the local container stack; the `k8s/` manifests deploy the same services to Kind.

## Quick Start: Docker Compose

```bash
docker compose up --build -d
docker exec pct-api node dist/seed.js
```

Open http://localhost:3000 and sign in with `admin@capstone.dev` and `password123`.

Stop the stack with:

```bash
docker compose down
```

## Local Development

Prerequisites: Node.js 20+, MongoDB 7+ running locally, and npm.

```bash
cd capstone-api
npm install
# Set MONGODB_URI, JWT_SECRET, PORT=4000, and CLIENT_ORIGIN=http://localhost:5173 in .env
npm run dev
```

In a second terminal:

```bash
cd capstone-client
npm install
npm run dev
```

Seed local MongoDB with `cd capstone-api && npm run seed`.

## Production Docker Compose with SSL

Generate development-only self-signed certificates (Git Bash, WSL, or a Unix shell):

```bash
./generate-certs.sh
docker compose -f docker-compose.prod.yml up --build -d
docker exec pct-api node dist/seed.js
```

Open https://localhost:8443 and accept the expected self-signed certificate warning. HTTP traffic on http://localhost:8080 redirects to HTTPS. Set `JWT_SECRET` in the environment before starting production Compose.

## Kind Deployment

Prerequisites: Docker, Kind, and kubectl.

```bash
kind create cluster --config k8s/kind-config.yaml --name policy-claims
docker build -t capstone-api:latest ./capstone-api
docker build -t capstone-client:latest ./capstone-client
kind load docker-image capstone-api:latest --name policy-claims
kind load docker-image capstone-client:latest --name policy-claims
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/mongo.yaml
kubectl apply -f k8s/api.yaml
kubectl apply -f k8s/client.yaml
kubectl exec -n policy-claims deployment/api -- node dist/seed.js
```

The application is available at http://localhost:30080. Check workloads with `kubectl get pods -n policy-claims`.

## API Reference

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Register and receive a JWT |
| POST | `/api/auth/login` | Authenticate and receive a JWT |
| GET | `/api/auth/me` | Get current user |
| GET/POST | `/api/policies` | List/create policies |
| GET/PUT/DELETE | `/api/policies/:id` | Get, update, or delete a policy |
| GET/POST | `/api/claims` | List/create claims |
| GET | `/api/claims/stats` | Claim statistics |
| GET/PUT/DELETE | `/api/claims/:id` | Get, update, or delete a claim |
| POST | `/api/claims/:id/notes` | Add a claim note |
| GET | `/api/dashboard` | Dashboard totals and recent claims |

All policy, claim, and dashboard endpoints require `Authorization: Bearer <token>`.

## Testing

```bash
cd capstone-api && npm test
cd ../capstone-client && npm test
```

## Tech Stack

- Client: React, TypeScript, Vite, Axios, React Router
- API: Node.js, Express, TypeScript, Mongoose, bcryptjs, jsonwebtoken, express-validator
- Data: MongoDB
- Infrastructure: Docker, Nginx, Docker Compose, self-signed TLS, Kubernetes/Kind
- Testing: Vitest, Supertest, React Testing Library, jsdom
