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
* **[Azure AD App Registration: For SSO](./docs/AzureConfig.md)**
* **AWS Bedrock access**

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
# Edit .env with MongoDB, Azure, AWS credentials, Frontend env too
pnpm start:dev
```

Backend will run at `http://localhost:3000/v6/mcp/*`.

---

### Step 3: Frontend Setup

```bash
cd teamsTab
pnpm install
pnpm run dev
```

Frontend will run at `http://localhost:5173/teamsTab`.

---

### Step 4: Expose Local Servers for Teams

To test inside Teams, both servers must be public. It's best to get static url from ngrok for frontend, So we can setup Azure AD, MS Teams app with this static url once, and also prefer to take static url for backend too.

```bash
# For frontend
ngrok http --url=your-ngrok-static-url-frontend.app 5173
# For backend
ngrok http 3000
```

You’ll get two public URLs:

* Frontend → `https://your-ngrok-static-url-frontend.app`
* Backend → `https://<backend-id>.ngrok-free.app`

> **Note:**
> * ngrok frontend url should be added to `teamsTab\vite.config.ts` allowed hosts for development environment.
> * ngrok backend url should be added to `.env` for `VITE_API_BASE_URL` development
- Example: `VITE_API_BASE_URL=https://<backend-id>.ngrok-free.app/v6/mcp/agent`

---

### Step 5: Configure Teams Manifest

Edit:

```
teamsTab/appPackageDev/manifest.json
```

### Read: [MsTeamsConfig.md](./MsTeamsConfig.md)


---

### Step 6: Sideload App in Teams

1. Zip the following from `teamsTab/appPackageDev/`:

   * `manifest.json`
   * `color.png`
   * `outline.png`
2. Go to **Microsoft Teams → Apps → Upload a custom app** and upload the zip.

You can now test the full AI agent directly in the Teams client.

---

# 🐳 Production / Deployment (Dockerized)

When you’re ready to deploy (e.g., on **Railway**, **Render**, or **AWS ECS**), use the provided `Dockerfile`.

### Dockerfile Overview

* Installs dependencies
* Builds the frontend (`teamsTab/`)
* Builds the backend
* Starts the server using `appStartUp.sh`
* Frontend & Backend Agent will be available in single url
    - http://localhost:3000/teamsTab - Frontend for MS Teams app
    - http://localhost:3000/v6/mcp/agent - Backend Agent for frontend
    - http://localhost:3000/v6/mcp/* - Other Backend endpoints - `/mcp`, `/sse` etc


### Build and Run

```bash
docker build -t teams-ai-agent .
docker run -d -p 3000:3000 teams-ai-agent
```

> **Note:**
> * Configure environment variables **directly in your hosting platform’s dashboard**, such as **Railway**, **AWS ECS / Lightsail**, or **Render** — no `.env` file needed.
> * Most CI/CD platforms automatically include environment variables for required build arguments when running the Docker build.
>
> - For example, the build command would be like:
>   `docker build --build-arg VITE_API_BASE_URL="https://api.topcoder.com/v6/mcp/agent" -t teams-ai-agent .`
> 
> *
> **💡 Note:**
> * Local docker build will use root .env since it is not added to `.dockerignore`, 
> * So no need to pass VITE_API_BASE_URL as Arg at `docker build -t teams-ai-agent .`

---


### Optional: ngrok for Local Preview in Docker

You can still run:

```bash
ngrok http --url=your-ngrok-static-url-frontend.app 3000
```

And use that public URL in your Teams manifest for quick cloud-like testing.

---
### Read: [AzureConfig.md](./docs/AzureConfig.md), [MsTeamsConfig.md](./docs/MsTeamsConfig.md)

### Summary

| Mode           | How to Run                                     | Notes                                         |
| -------------- | ---------------------------------------------- | --------------------------------------------- |
| **Local Dev**  | frontend + backend separately | Fast iteration, live reload                   |
| **Production** | `docker build && docker run`                   | Uses built Vite files, NestJS will serve frontend        |
| **Teams Test** | Use ngrok URLs                                 | Needed for Teams to access your local servers |

