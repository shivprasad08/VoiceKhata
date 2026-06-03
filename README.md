# 📱 VoiceKhata

VoiceKhata is a modern, AI-powered ledger (khata) system designed specifically for Indian kirana store owners and small vendors. It combines a familiar, premium interface with powerful financial analytics and an intelligent Business Advisor to help merchants track sales, manage credit (Udhar), and optimize their GST inputs.

![VoiceKhata Dashboard](https://img.shields.io/badge/UI-Paytm_Inspired-00BAF2?style=flat-square)
![Stack](https://img.shields.io/badge/Stack-React_%7C_FastAPI_%7C_PostgreSQL-blue?style=flat-square)
![AI](https://img.shields.io/badge/AI-Groq_%7C_LLaMA_3-orange?style=flat-square)

## ✨ Key Features

- **🤖 AI Business Advisor**: A conversational AI powered by Groq (LLaMA 3) that acts as a financial consultant. It analyzes your weekly/monthly data to generate actionable insights (e.g., "Your profit margin is 5.3%, reduce staff costs"). 
- **🛡️ Smart Fallback Engine**: If cloud AI APIs fail or are blocked (e.g., 403 network errors), the backend automatically falls back to a lightning-fast, rule-based local AI that parses context to answer questions about GST, Udhar, Sales, and Expenses.
- **⚡ Real-Time Live Feed**: Transactions are streamed instantly to the dashboard using WebSockets.
- **🎨 Premium UI/UX**: A clean, light-themed aesthetic inspired by modern Indian fintech apps (like Paytm), featuring micro-animations, glassmorphism, and responsive charts.
- **📒 Udhar & GST Management**: Track outstanding credit (Udhar) and monitor available Input Tax Credit (ITC) for GSTR-3B filings.

## 🛠️ Tech Stack

### Frontend
- **React (Vite) & TypeScript**: Lightning-fast development and type safety.
- **Tailwind CSS**: For custom, utility-first styling utilizing a bespoke `paytm-blue` design system.
- **Recharts**: For dynamic, interactive data visualization (Donut charts, Trend lines).

### Backend
- **FastAPI (Python)**: High-performance async API and WebSocket handling.
- **SQLAlchemy (Async)**: Modern async ORM for database interactions.
- **Groq API**: For ultra-low latency LLM inference.

### Infrastructure
- **PostgreSQL**: Robust relational database.
- **Docker & Docker Compose**: Containerized for instant, zero-configuration local deployment.

## 🚀 Quick Start (One-Command Setup)

To run this locally, you only need one command. Ensure you have Docker and Docker Compose installed.

```bash
docker-compose up -d --build
```

### What this does:
1. **PostgreSQL** spins up on port `5432` with a persistent volume.
2. **FastAPI Backend** starts on port `8000`. Upon startup, it automatically checks the database connection, runs the latest Alembic schema migrations, and injects 30 days of realistic seed data (because `DEMO_MODE=true` is set).
3. **React Frontend** starts on port `3000`. It proxies `/api` and `/ws` requests directly to the backend.
4. **pgAdmin** spins up on port `5050` for easy database inspection.

### Accessing the Application
- **Live Dashboard**: [http://localhost:3000](http://localhost:3000)
- **API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Database GUI (pgAdmin)**: [http://localhost:5050](http://localhost:5050)
  - **Email**: `admin@voicekhata.com`
  - **Password**: `admin`

## 🔑 Environment Variables

To enable the real Cloud AI features, you will need to add your API keys to the `.env` file at the root of the project:

```env
GROQ_API_KEY=your_groq_api_key_here
SARVAM_API_KEY=your_sarvam_api_key_here (optional)
```

*(Note: If no API key is provided, or if the network blocks the connection, the app will gracefully fall back to the built-in Smart Local AI!)*

## 🧪 Demo Mode

The `.env.demo` variables are automatically injected via Docker Compose to make local testing easy.
The critical flag is `DEMO_MODE=true`. 
- **Auto-Seeding**: When the FastAPI server starts, if it detects an empty database, it instantly runs `seed.py` to generate the demo user and 30 days of realistic transactions.
- **Auth Bypass**: It uses a fixed demo user so the dashboard works instantly without a login wall.

If you ever want to reset the data, simply delete the Docker volume (`docker-compose down -v`) and run `docker-compose up` again.

## ☁️ Deployment to Railway

This repository is configured for automated CI/CD to Railway.
- **railway.toml**: Specifies the build and start commands for the FastAPI app.
- **GitHub Actions**: The `.github/workflows/deploy.yml` workflow automatically deploys to Railway on every push to the `main` branch, provided the `RAILWAY_TOKEN` secret is set in your GitHub repository.
