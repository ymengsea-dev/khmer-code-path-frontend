# 🇰🇭 Khmer Code Path - Frontend

Welcome to the frontend repository for **Khmer Code Path**, a modern, AI-enhanced Learning Management System (LMS) web application. The interface features a sleek glassmorphic UI, rich interactive animations, and responsive dashboards. 

Built using **Next.js 16 (App Router)** and **React 19**, it is styled with **Tailwind CSS v4** and **Shadcn UI**, and supports deployment directly to **Cloudflare Pages** via OpenNext.

---

## ✨ Features

- **Dynamic LMS Dashboard**: Navigate courses, view institutions/faculties, classes, departments, and track attendance dynamically.
- **Embedded IDE**: Write, run, and test code in-browser via an integrated code editor component.
- **AI-Chat Interface**: Integrated chat helper connected to the backend RAG engine. Users can ask questions about course content or selected text ranges inside lessons.
- **Interactive Quiz & Exam Taking**: Beautifully designed UI for taking assignments, answering multiple-choice questions, writing markdown submissions, and viewing graded results.
- **Notebook Workspace**: Full markdown notebook workspace featuring tag filters and a rich text editor.
- **Real-Time System Alerts**: Synchronized notifications from the backend using Server-Sent Events (SSE).
- **Secure Authentication**: Fully configured JWT credentials session-handling and Google OAuth2 login powered by **Auth.js (NextAuth v5)**.
- **Glassmorphism & Micro-animations**: Curated Tailwind v4 colors, backdrop-blur layout themes, and smooth transition states utilizing **Framer Motion 12**.

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| **Framework** | **Next.js 16** (App Router) |
| **UI Core** | **React 19**, **@base-ui/react** (un-styled accessibility primitives) |
| **State Management** | **TanStack React Query v5** (Server State caching) |
| **Authentication** | **NextAuth.js v5 (Auth.js)** (JWT sessions, silent token refreshes) |
| **Styling** | **Tailwind CSS v4**, **Shadcn UI**, `tw-animate-css` |
| **Animations** | **Framer Motion 12** (Liquid Press/Bouncy morph states) |
| **Icons & Renderers** | `lucide-react`, `react-markdown` + `remark-gfm` |
| **Cloudflare Adaptor** | `@opennextjs/cloudflare` & `wrangler` |
| **HTTP Client** | **Axios** |

---

## 📁 Project Structure

```
khmer-code-path-frontend/
├── app/                  # Next.js App Router (pages, layout, auth route groups)
│   ├── (auth)/           # Authentication views (login, register, reset-password)
│   ├── api/              # API Route Handlers (auth callbacks, NextAuth handlers)
│   ├── globals.css       # Core design tokens and custom CSS variables
│   └── page.tsx          # Single-Page Entrypoint (mounts HomePage)
├── components/           # UI Components
│   ├── app/              # Core layout orchestrator (HomePage.tsx)
│   ├── ui/               # Reusable atomic elements (button, dialog, input)
│   ├── ai-chat/          # AI conversational chat panels
│   ├── assignments-exams/# Quizzes, Exam taking, and builder controls
│   ├── classes/          # Class detail panels, course views, comments
│   ├── course/           # Course cards, breakdowns, chips, forms
│   ├── code/             # In-browser Embedded IDE
│   ├── notebook/         # Markdown notepad and tag selector
│   └── motion/           # Custom Framer Motion micro-interaction wrappers
├── lib/                  # Shared helper functions, API clients, and hooks
├── types/                # TS Interfaces (Courses, Users, Exams)
├── wrangler.jsonc        # Cloudflare pages deployment deployment bindings
└── Dockerfile            # Multi-stage production image builder
```

---

## ⚙️ Local Development Setup

### 1. Prerequisites

- **Node.js**: `v20+` or `v22+` (recommended)
- **PNPM**: `v10.33.0+` (package manager defined)

### 2. Configure Environment Variables

Create a `.env.local` file inside the `khmer-code-path-frontend` directory. Populate it using the variables below:

```ini
# Auth.js Secret — generate with: openssl rand -base64 32
AUTH_SECRET=your-random-32-byte-secret
AUTH_URL=http://localhost:3000

# Backend API (server-side calls, used by NextAuth handlers)
API_BASE_URL=http://localhost:8080/api/v1

# Client-side API calls (Axios client config)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_BACKEND_ORIGIN=http://localhost:8080
NEXT_PUBLIC_APP_URL=http://localhost:3000

# OAuth Callback redirect target (registered on backend)
FRONTEND_URL=http://localhost:3000
```

### 3. Installation

Install all frontend package dependencies:

```bash
pnpm install
```

### 4. Running the Dev Server

Launch the development server locally:

```bash
pnpm dev
```

The application will be accessible at **`http://localhost:3000`**.

---

## ☁️ Deploying to Cloudflare

This repository is optimized to build and run on **Cloudflare Pages/Workers** using `@opennextjs/cloudflare`. 

The compilation config is defined in `open-next.config.ts`, routing build results into the `.open-next/` directory.

To build and deploy your local version to Cloudflare:
```bash
pnpm run deploy
```
*Note: This command runs `opennextjs-cloudflare build` to translate the Next.js routes into edge worker assets, followed by `wrangler deploy` to push the build.*

---

## 🐳 Docker Production Build

You can package the frontend to run as a standalone Next.js server container:

1. **Build the Container Image**:
   Make sure to pass your target API URLs as arguments during build time:
   ```bash
   docker build \
     --build-arg NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1 \
     --build-arg NEXT_PUBLIC_BACKEND_ORIGIN=http://localhost:8080 \
     --build-arg NEXT_PUBLIC_APP_URL=http://localhost:3000 \
     -t khmer-code-path-frontend:latest .
   ```

2. **Run the Container**:
   Expose the application on port 3000:
   ```bash
   docker run -d -p 3000:3000 khmer-code-path-frontend:latest
   ```