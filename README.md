# Microsoft Teams AI Agent

A production-grade Microsoft Teams Tab app featuring a conversational AI agent powered by **LangChain.js** and **AWS Bedrock**.
The agent integrates with mcp tools to answer real-time queries beyond its base model knowledge.

---

## ✨ Key Features

* **Conversational AI:** Powered by LangChain.js + AWS Bedrock (Claude 3.5 Sonnet).
* **External Tools:** Fetch live contextual data through external integrations.
* **Real-time Chat Streaming:** Uses SSE for continuous agent thought updates.
* **Conversation History:** Stored and grouped in MongoDB for persistence.
* **Azure AD SSO:** Secure Teams authentication for verified access.
* **Fluent UI + Teams SDK:** Seamless user experience inside Teams.
* **Flexible Deployment:** Manual dev setup + production-ready Docker build.

---

## 🧩 Technology Stack

| Frontend (Vite)             | Backend (Node.js + Express)               |
| --------------------------- | ----------------------------------------- |
| ✅ React + TypeScript (Vite) | ✅ LangChain.js + AWS Bedrock (Claude 3.5) |
| ✅ Fluent UI + Teams SDK     | ✅ MongoDB (Mongoose ODM)                  |
| ✅ Vite environment support  | ✅ MCP Gateway for tool access             |

| AI & Security                     | Infrastructure                    |
| --------------------------------- | --------------------------------- |
| ✅ AWS Bedrock (Claude 3.5 Sonnet) | ✅ Docker-based production build   |
| ✅ Azure Active Directory (SSO)    | ✅ Environment-based configuration |
| ✅ JWT Validation + JWKS-RSA       | ✅ ngrok for local Teams testing   |

---

## 🧠 Local Development Setup (Manual)

You can run the frontend and backend separately for local testing.
This is the preferred approach during active development.

## Prerequisites

* **Node.js:** v22.x
* **MongoDB:** Local instance or MongoDB Atlas
* **ngrok:** To expose your servers for Teams testing
* **Azure AD App Registration:** For SSO
* **AWS Bedrock access**

### Azure App Registration

This is a mandatory step to enable SSO and secure Agent. 

1.  Go to the **Azure Portal** -> **Azure Active Directory** -> **App registrations** -> **+ New registration**.
2.  **Name:** `Teams AI Agent`
3.  **Supported account types:** Select `Accounts in any organizational directory (Any Azure AD directory - Multitenant) and personal Microsoft accounts`.
4.  Click **Register**.
    * **Save the `Application (client) ID` and `Directory (tenant) ID`.** You will need these for your environment variables.
5.  Go to the **Expose an API** blade.
    * Click **Set** next to "Application ID URI". The default `api://<frontend_uri>/<this_azure_app_client_id>` is fine for now. We will update this with our Railway URL later.
6.  Click **+ Add a scope**.
    *   **Scope name:** `access_as_user`
    *   **Who can consent?:** `Admins and users`
    *   Fill in the admin/user consent descriptions (e.g., "Allows the app to access the AI agent API as the signed-in user.").
    *   Click **Add scope**.
7.  Click **+ Add a client application**.
    * Add MS Teams client id `1fec8e78-bce4-4aaf-ab1b-5451cc387264`
    * Select `access_as_user` in Authorize scopes
8. Go to the **API permissions** blade.
    * Click **+ Add a permission** -> **APIs of my Org**.
    * Select your `Teams AI Agent` app.
    * Check the box for the `access_as_user` permission and click **Add permissions**.
    * Click the **Grant admin consent** button.
9.  Go to the **Authentication** blade.
    * Click **+ Add a platform** -> **Web**.
    * **Redirect URIs:** You will add your Railway frontend URL here later (e.g., `https://my-frontend.up.railway.app`)
    * And also add `Mobile and desktop applications` and check all default urls

---



### Step 1: Clone Repository

```bash
git clone https://github.com/topcoder-platform/tc-mcp.git
cd tc-mcp
```

---

### Step 2: Backend Setup

```bash
pnpm install
cp .env.example .env
# Edit .env with MongoDB, Azure, AWS credentials
pnpm start:dev
```

Backend will run at `http://localhost:3000/v6/mcp/*`.

---

### Step 3: Frontend Setup

```bash
cd teamsTab
pnpm install
cp .env.example .env
# Add your API base URL and Teams App config
pnpm run dev
```

Frontend will run at `http://localhost:5173`.

> **Note:**
>
> * During development, you can set `VITE_API_BASE_URL=http://localhost:3000/v6/mcp/agent`
> * In production build, Vite will read VITE_API_BASE_URL from the container environment that was hardcoded in Dockerfile.

---

### Step 4: Expose Local Servers for Teams

To test inside Teams, both servers must be public.

```bash
# For frontend
ngrok http 5173
# For backend
ngrok http 3000
```

You’ll get two public URLs:

* Frontend → `https://<frontend-id>.ngrok-free.app`
* Backend → `https://<backend-id>.ngrok-free.app`

> **Note:**
> ngrok frontend url should be added to `teamsTab\vite.config.ts` allowed hosts for development environment

---

### Step 5: Configure Teams Manifest

Edit:

```
teamsTab/appPackageDev/manifest.json
```

Update:

```json
{
  "id": "<azure-client-id>",
  "contentUrl": "https://<frontend-id>.ngrok-free.app",
  "validDomains": [
    "<frontend-id>.ngrok-free.app",
    "<backend-id>.ngrok-free.app"
  ],
  "webApplicationInfo": {
    "id": "<azure-client-id>",
    "resource": "api://<frontend-id>.ngrok-free.app/<azure-client-id>"
  }
}
```

---

### Step 6: Sideload App in Teams

1. Zip the following from `teamsTab/appPackageDev/`:

   * `manifest.json`
   * `color.png`
   * `outline.png`
2. Go to **Microsoft Teams → Apps → Upload a custom app** and upload the zip.

You can now test the full AI agent directly in the Teams client.

---

## 🐳 Production / Deployment (Dockerized)

When you’re ready to deploy (e.g., on **Railway**, **Render**, or **AWS ECS**), use the provided `Dockerfile`.

### Dockerfile Overview

The Docker build:

* Installs dependencies
* Builds the frontend (`teamsTab/`)
* Builds the backend
* Starts the server using `appStartUp.sh`
* Frontend & Backend Agent will be available in single url
    - http://localhost:3000/teamsTab
    - http://localhost:3000/v6/mcp/agent


### Build and Run

```bash
docker build -t teams-ai-agent .
docker run -d -p 3000:3000 --env-file .env teams-ai-agent
```

> **💡 Note:**
> * The `VITE_API_BASE_URL` is already **hardcoded in your Dockerfile** using:
>
>   ```dockerfile
>   ENV VITE_API_BASE_URL=https://api.example.com
>   ```
>   This means the frontend is built with that value baked in at build time.
> * Configure environment variables **directly in your hosting platform’s dashboard**, such as **Railway**, **AWS ECS / Lightsail**, or **Render** — no `.env` file needed.
> * If you prefer using an `.env` file, mount or include it at runtime using the `--env-file .env` option (as shown above).
>

---


### Optional: ngrok for Local Preview in Docker

You can still run:

```bash
ngrok http 3000
```

And use that public URL in your Teams manifest for quick cloud-like testing.

---

### Summary

| Mode           | How to Run                                     | Notes                                         |
| -------------- | ---------------------------------------------- | --------------------------------------------- |
| **Local Dev**  | frontend + backend separately | Fast iteration, live reload                   |
| **Production** | `docker build && docker run`                   | Uses built Vite files, NestJS will serve frontend        |
| **Teams Test** | Use ngrok URLs                                 | Needed for Teams to access your local servers |

