# PayDesk HRMS — Frontend Deployment Guide

## 1. Environment Variables Configuration

Create a `.env` file in the `paydesk-frontend/` directory (refer to `.env.example`):

```bash
# Primary backend API URL (Render or Local)
VITE_API_BASE_URL=<your-backend-url>/api/v1

# Fallback API URL
VITE_API_URL=<your-backend-url>/api/v1
```

For local development:
```bash
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

---

## 2. Local Setup & Execution

### 2.1 Prerequisites
- Node.js v18.0.0 or higher
- npm v9.0.0 or higher

### 2.2 Installation
```bash
# Navigate to frontend directory
cd paydesk-frontend

# Install dependencies
npm install
```

### 2.3 Running Locally
```bash
# Start Vite development server
npm run dev
```
The application will launch at `http://localhost:5173`.

---

## 3. Production Build & Validation

```bash
# Run TypeScript compilation check and Vite bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 4. Render Deployment (Static Site)

PayDesk frontend is configured for deployment on Render via `render.yaml`:

- **Service Type**: Static Site
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Rewrite Rules**:
  - Source: `/*`
  - Destination: `/index.html` (Required for React Router client-side routing)
- **Environment Variables**:
  - `VITE_API_BASE_URL`: Live backend Render URL
