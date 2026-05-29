# BPartner ERP 9+ (AI-Powered Medical ERP)

Welcome to **BPartner ERP 9+**, a next-generation Enterprise Resource Planning system specifically engineered for modern pharmacies and medical distributors. It combines the bulletproof reliability and classic navigation of legacy software (like Marg ERP) with cutting-edge web technologies and a powerful on-premise AI engine.

![BPartner ERP 9+](https://img.shields.io/badge/Status-Active-success) ![License](https://img.shields.io/badge/License-Proprietary-blue) 

## 🌟 Key Features

### 🏢 Core ERP Infrastructure
* **True Double-Entry Accounting:** Every sale, purchase, and payment automatically generates balanced journal vouchers updating the general ledger in real-time.
* **Immutable Audit Trails:** A comprehensive system audit log tracks every action (creates, updates, deletes) alongside a dedicated **Stock Movement Log** that permanently records every change to inventory quantities.
* **Idempotency Guarantee:** Built-in middleware prevents accidental duplicate transactions (e.g., double-clicking the "Save Bill" button).
* **Role-Based Access Control (RBAC):** Granular, permission-based security (`billing.create`, `ledger.read`, etc.) tied to JWT authentication.
* **Classic UI, Modern Tech:** A blazingly fast React frontend designed with the structural layout of classic ERPs (fast keyboard shortcuts, dense information displays) but built with modern TailwindCSS glassmorphism.

### 🧠 Integrated AI Capabilities (Local & Private)
BPartner ERP 9+ includes a dedicated Python/FastAPI microservice powered by **LangChain**, **Ollama**, and **ChromaDB**. All AI processing happens locally, keeping your patient and financial data strictly private.
* **Smart Ledger & Invoice Parsing:** Automatically extract items, quantities, and prices from vendor invoices using OCR and LLMs.
* **AI Re-Order Agent:** Analyzes 90-day sales velocity and stock levels to intelligently predict demand and generate automatic draft purchase orders.
* **Expiry Guard:** Proactively identifies near-expiry stock and suggests discounting or return strategies before they become a loss.
* **Anomaly Detection:** Scans the ledger for unusual transaction patterns, off-hours billing, or potential fraud, assigning risk scores in real-time.

---

## 🏗️ System Architecture

The platform is divided into three distinct services:

1. **Frontend (`/frontend`)**
   * React 18, Vite, TailwindCSS, Recharts, React Router.
   * Provides the classic "Marg-style" 3-column dashboard, keyboard shortcut navigation (`Alt+S` for Sales, etc.), and rich data visualizations.
2. **Backend Engine (`/backend`)**
   * Node.js, Express, Sequelize (PostgreSQL).
   * The core transactional engine handling billing, double-entry accounting, auth, and data persistence.
3. **AI Microservice (`/ai-service`)**
   * Python, FastAPI, LangChain, psycopg2.
   * Houses the RAG (Retrieval-Augmented Generation) pipeline, embedding models, and endpoints for forecasting, anomaly detection, and OCR.

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18+)
* **Python** (3.10+)
* **PostgreSQL** (v14+)
* **Ollama** (Running locally with `llama3` or similar model installed)

### 1. Database Setup
Ensure PostgreSQL is running. Create a database for the ERP.
```bash
# Example
createdb bpartner_erp
```

### 2. Backend Setup (Node.js)
```bash
cd backend
npm install

# Create a .env file based on environment variables
# DB_NAME, DB_USER, DB_PASS, JWT_SECRET, AI_SERVICE_URL=http://localhost:8000

# Start the server (runs on http://localhost:5000)
npm run dev
```

### 3. AI Service Setup (Python)
```bash
cd ai-service
python -m venv venv

# Activate venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt

# Start the FastAPI service (runs on http://localhost:8000)
uvicorn main:app --reload --port 8000
```

### 4. Frontend Setup (React)
```bash
cd frontend
npm install

# Start the Vite dev server (runs on http://localhost:5173)
npm run dev
```

---

## ⌨️ Keyboard Shortcuts

Power users can navigate the entire system without a mouse:
* `Alt + S` : Open Billing / Point of Sale
* `Alt + P` : Open Purchase Entry
* `Alt + I` : Open Inventory / Stock Status
* `Alt + L` : Open Ledger / Chart of Accounts
* `Alt + D` : Return to Dashboard

---

## 🛡️ Security & Idempotency
To prevent data corruption during network drops, all financial mutation endpoints require an `Idempotency-Key` header. The frontend `apiClient` automatically generates and attaches these UUIDs to every POST, PUT, and DELETE request.

## 🤝 Development & Maintenance
Maintained by the **BPartners Pharma** development team. For support, check the internal Wiki or contact the system administrator.
