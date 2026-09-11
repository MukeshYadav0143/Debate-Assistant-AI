# Debate Assistant AI 🎯

An intelligent, AI-powered debate platform designed to help users sharpen critical thinking, generate structured arguments, challenge an interactive AI opponent, and receive detailed skill coaching with scoring.

---

## 👨‍💻 Developer Profile

- **Developer**: **Mukesh Yadav**
- **Institution**: **BBD University** (Babu Banarasi Das University)
- **Program**: **BCA (Data Science & Artificial Intelligence)** — *2nd Year*
- **GitHub**: [@MukeshYadav0143](https://github.com/MukeshYadav0143)
- **Project Repository**: [Debate-Assistant-AI](https://github.com/MukeshYadav0143/Debate-Assistant-AI)

---

## 🏗️ System Architecture & Workflow

The platform follows a modular, decoupled 3-tier architecture optimized for local privacy, high responsiveness, and scalable database integration.

```
┌─────────────────────────────────────────────────────────────┐
│                 PRESENTATION LAYER (Frontend)               │
│             React 19 • Vite • Tailwind CSS                  │
│  - Real-time Dashboard & Debate Metrics                     │
│  - Interactive AI Opponent Arena                            │
│  - Skill Analysis Visualizer (Strength, Clarity, Reasoning) │
│  - Dynamic Topic Generator                                  │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON / HTTP REST APIs
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 APPLICATION LAYER (Backend)                 │
│                 FastAPI • Uvicorn • Pydantic                │
│  - CORS Middleware & Request Validation                     │
│  - Prompt Orchestration & Error Recovery                    │
│  - JSON Extraction & Sanitization Pipeline                  │
│  - MongoDB Async / Sync Connector                           │
└───────────────────┬─────────────────────────┬───────────────┘
                    │                         │
     Ollama HTTP API│                         │ PyMongo Driver
     (Port: 11434)  │                         │ (Port: 27017)
                    ▼                         ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│       AI INFERENCE ENGINE    │    │      PERSISTENCE LAYER       │
│   Ollama (Llama 3.2: 3B)     │    │      MongoDB Database        │
│  - Local on-device execution │    │  - Debate History Collection │
│  - OpenAI API Fallback option│    │  - Analytics & Skill Metrics │
└──────────────────────────────┘    └──────────────────────────────┘
```

### Architectural Highlights & Improvements:
1. **Decoupled Client-Server Protocol**: Frontend communicates via dynamic environment configurations (`VITE_API_BASE_URL`), allowing instant switching between local development and cloud production.
2. **Local AI Inference Engine**: Uses **Ollama with Llama 3.2 (3B)** for ultra-fast, offline, private AI debate reasoning with zero API cost.
3. **Resilient AI Pipeline**: Includes regex-based JSON sanitization and automatic fallback parsing to eliminate syntax breaks from LLM Markdown fences.
4. **Persistent Analytics**: Full debate transcripts and skill assessments are stored in MongoDB collections for dashboard tracking.

---

## 🚀 Key Features

- 💡 **AI Topic Generator**: Generates balanced debate topics across categories (Technology, Education, Science, Environment, Social Media, General).
- 🤖 **AI Argument Generator**: Produces well-structured PRO (FOR) and CON (AGAINST) arguments with supporting evidence.
- 🗣️ **Interactive AI Debate Opponent**: Analyzes user points and offers respectful, logically rigorous counterarguments with probing questions.
- 📊 **Debate Skill & Score Coach**: Evaluates arguments across 3 core dimensions:
  - **Argument Strength** (Score / 10)
  - **Clarity** (Score / 10)
  - **Reasoning & Logic** (Score / 10)
  - Overall Skill Score & Actionable Feedback.
- 📈 **Dynamic Dashboard**: Displays real-time statistics including total debates, recent topics, and your latest skill level.
- 💾 **Debate History Vault**: Stores user arguments and AI responses in MongoDB for continuous practice.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS, Lucide Icons |
| **Backend** | Python 3.13+, FastAPI, Uvicorn, Pydantic, python-dotenv |
| **AI / LLM Engine** | Ollama, Llama 3.2 (3B) Local Model, OpenAI API support |
| **Database** | MongoDB (PyMongo) |
| **DevOps / VCS** | Git, GitHub |

---

## 📂 Project Structure

```text
Debate-Assistant-AI/
├── backend/
│   ├── .env                  # Backend environment configuration
│   ├── .venv/                # Python virtual environment
│   ├── main.py               # FastAPI application & endpoints
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main React application component
│   │   ├── main.jsx          # React DOM root entrypoint
│   │   └── index.css         # Tailwind CSS styles
│   ├── index.html            # HTML shell
│   ├── package.json          # Node.js dependencies & scripts
│   └── vite.config.js        # Vite build & plugin configuration
├── screenshots/
│   └── dashboard.png         # UI preview screenshot
├── .gitignore                # Git ignore specifications
└── README.md                 # Project documentation
```

---

## ⚡ Quick Start Guide

### Prerequisites
- [Python 3.10+](https://www.python.org/)
- [Node.js 18+](https://nodejs.org/)
- [Ollama](https://ollama.com/) with `llama3.2:3b` (`ollama pull llama3.2:3b`)
- [MongoDB](https://www.mongodb.com/) running on port `27017`

### 1. Clone the Repository
```bash
git clone https://github.com/MukeshYadav0143/Debate-Assistant-AI.git
cd Debate-Assistant-AI
```

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# On macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Backend will be available at `http://127.0.0.1:8000` (Interactive API docs at `http://127.0.0.1:8000/docs`).

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Frontend will be available at `http://localhost:5173/`.

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server health check |
| `POST` | `/generate-topic` | Generate 5 debate topics by category |
| `POST` | `/generate-arguments`| Generate structured PRO/CON arguments |
| `POST` | `/debate-opponent` | Receive AI opponent counterargument |
| `POST` | `/analyze-debate` | Get detailed skill analysis & scores |
| `POST` | `/save-debate` | Save a debate session to MongoDB |
| `GET` | `/debates` | Retrieve debate history list |

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).

---

Developed with ❤️ by **Mukesh Yadav** — *BBD University (BCA DS-AI 2nd Year)*
