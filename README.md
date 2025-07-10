# Welcome to Echo Forge Create

## Project info

**URL**: https://lovable.dev/projects/6667d60f-ccee-484d-a2b6-dcce2046a8f7

## 🚀 New Feature: RESTful API with Swagger Documentation

This project now includes a comprehensive RESTful API for the Supabase `voices` table with full Swagger/OpenAPI documentation.

### 🎯 API Features

- **Full CRUD Operations** - Create, Read, Update, Delete voices
- **Interactive Swagger UI** - Test APIs directly in the browser
- **OpenAPI 3.0 Specification** - Industry-standard API documentation
- **Search Functionality** - Text-based search across voice names and descriptions
- **Pagination Support** - Handle large datasets efficiently
- **Comprehensive Error Handling** - Detailed error messages and status codes
- **CORS Enabled** - Ready for frontend integration
- **Row Level Security** - Supabase RLS policies enforced

### 📚 API Documentation

- **Swagger UI**: `http://localhost:3001/api-docs`
- **Health Check**: `http://localhost:3001/health`
- **Base API URL**: `http://localhost:3001/api`

### 🔗 Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/voices` | Get all voices (with filtering & pagination) |
| GET | `/api/voices/search` | Search voices by name/description |
| GET | `/api/voices/{id}` | Get voice by ID |
| POST | `/api/voices` | Create new voice |
| PUT | `/api/voices/{id}` | Update voice |
| DELETE | `/api/voices/{id}` | Delete voice |
| GET | `/health` | API health check |

### 🛠️ Quick Start with API

1. **Install dependencies:**
   ```sh
   npm install
   ```

2. **Start the API server:**
   ```sh
   npm run dev:server
   ```

3. **Access Swagger UI:**
   Open `http://localhost:3001/api-docs` in your browser

4. **Start the frontend (separate terminal):**
   ```sh
   npm run dev
   ```

### 📁 Project Structure

```
├── server/                 # Express API server
│   ├── index.js           # Main server file
│   ├── lib/
│   │   └── supabase.js    # Supabase client config
│   └── routes/
│       └── voices.js      # Voices API routes
├── src/
│   ├── components/
│   │   └── ApiDocs.tsx    # API documentation component
│   └── integrations/
│       └── supabase/      # Frontend Supabase config
├── .env.example           # Environment variables template
├── API_DOCUMENTATION.md   # Comprehensive API docs
└── README.md             # This file
```

### 🔧 Environment Setup

Create a `.env` file from `.env.example`:
```sh
cp .env.example .env
```

Update the Supabase service key in `.env` for production use.

### 📖 Detailed Documentation

For comprehensive API documentation including examples, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

---

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/6667d60f-ccee-484d-a2b6-dcce2046a8f7) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev

# Step 5: (Optional) Start the API server for backend functionality.
npm run dev:server
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

**Frontend:**
- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Database & Auth)

**Backend API:**
- Express.js
- Swagger UI Express
- Swagger JSDoc
- CORS
- Supabase JS Client

## How can I deploy this project?

**Frontend Deployment:**
Simply open [Lovable](https://lovable.dev/projects/6667d60f-ccee-484d-a2b6-dcce2046a8f7) and click on Share -> Publish.

**API Deployment:**
The Express API server can be deployed to any Node.js hosting service like:
- Vercel
- Netlify Functions
- Railway
- Heroku
- DigitalOcean App Platform

Make sure to set the environment variables in your hosting platform.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
