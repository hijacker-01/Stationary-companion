# BPartner ERP 9+ (AI-Powered Medical ERP)

Welcome to **BPartner ERP 9+**, a next-generation Enterprise Resource Planning system specifically engineered for modern pharmacies and wholesale medical distributors. 

This platform bridges a critical gap in the industry: **It combines the bulletproof reliability, extreme data density, and lightning-fast keyboard navigation of legacy desktop software (like Marg ERP) with cutting-edge modern web technologies and a powerful on-premise Artificial Intelligence engine.**

---

## 🎯 Core Design Philosophy

1. **Extreme Data Density:** Designed to maximize screen real estate for operators. We strictly avoid bloated "SaaS-style" padding, utilizing `text-sm`, `text-[10px]`, and tight row heights (`px-1.5 py-3`) so operators can view dozens of line items simultaneously without scrolling.
2. **Keyboard-First Navigation (Mouseless Operation):** Built for speed. The entire billing and ledger interface can be navigated using `Tab`, `Arrow Keys`, `Enter`, and `Esc`. 
3. **Instant Search:** Replaced heavy JavaScript dropdowns with lightning-fast semantic HTML `<datalist>` typeaheads, allowing instant filtering of tens of thousands of drugs and customers by Name or Batch.
4. **Idempotent Architecture:** Network drops in web apps often cause duplicate billing. We implemented strict UUID-based idempotency keys on all financial mutations to guarantee data integrity.

---

## 🌟 Comprehensive Feature Breakdown

The system is organized into **6 highly integrated functional domains**, fulfilling 23 exhaustive enterprise requirements.

### 📦 Domain 1: Medical Inventory & Purchases
* **Complete Purchase Lifecycle:** Full flow from Draft Purchase Challan to Pending to Approved, and finally conversion into a Tax Purchase Bill.
* **Batch & Expiry Management:** Every SKU is tracked down to the individual Batch number and Expiry Date. 
* **Automated Stock Valuation:** Inventory is dynamically valued using Specific Identification (the pharmaceutical equivalent of strictly applied FIFO/Weighted Average based on exact batch costs).
* **Automated Costing:** Upon Purchase Bill conversion, product Cost Prices are instantly updated across the master catalog.
* **Stock Movement Logs:** A dedicated, immutable log table (`stockMovement.js`) records every single addition or deduction to inventory, preventing silent stock disappearances.

### 🛒 Domain 2: Sales & Billing Engine
* **Delivery Memo (DM) System:** Create Sales Challans (DMs) that can be dispatched and later converted into final Tax Invoices. Supports partial conversions.
* **High-Speed POS Grid:** A spreadsheet-like billing table where inputs (Qty, Free, Rate, Disc, GST) are embedded directly into table cells (`<td>`), automatically calculating line amounts, subtotals, and net totals in real-time.
* **Clinical Guardrails:** Built-in alerts warn operators immediately if they select an expired batch or attempt to bill a "Schedule H/H1/X" restricted drug without a prescription flag.
* **Negative Stock Prevention:** Strict backend and frontend validation prevents billing if requested quantity exceeds available stock across batches.
* **Professional Invoice Printing:** A4-optimized print views tailored for medical wholesale, including HSN codes, Batch, Expiry, granular GST breakdowns, and "amount in words".

### 💰 Domain 3: Financial Vouchers & Accounting
* **True Double-Entry Core:** Every single financial transaction (Sale, Purchase, Payment, Receipt) automatically generates balanced Journal Vouchers (Dr/Cr) updating the General Ledger in real-time.
* **Receipt & Payment Vouchers:** Dedicated modal workflows for recording Customer Receipts (Accounts Receivable) and Supplier Payments (Accounts Payable) across Cash, Bank, UPI, and Cheque modes.
* **Idempotency Guarantee:** Middleware intercepts duplicate network requests within 24 hours, ensuring a user double-clicking "Save" will never create two identical Journal Vouchers.

### 📊 Domain 4: Core Dashboards & Reports
* **The "Marg-Style" Dashboard:** A dense 3-column homepage granting one-click access to all critical business functions and real-time metrics (Gross Revenue, Active Bills, AI alerts).
* **Live Cash Book:** A date-filtered cash flow ledger tracking all inward and outward cash movements, with mathematically verified Opening and Closing balances.
* **Advanced Aging Summaries:** 
  * **Debtors Board:** Instantly view which customers owe money, categorized precisely into 0-30, 31-60, 61-90, and 90+ day aging buckets.
  * **Creditors Board:** Track outstanding supplier payables with identical aging metrics to optimize cash flow.
* **Immutable Audit Trails:** A global audit log tracks every create, update, convert, and delete action across the platform, recording the User ID, timestamp, and the exact Old vs. New JSON state.

### 📈 Domain 5: Advanced Analytics & Valuation
* **Real-Time Profit Analytics:** Intelligent backend aggregation calculates exact profit margins based on the historic cost of the specific batch sold. Includes three distinct views:
  * *Product-Wise Profit:* Which SKUs drive your bottom line.
  * *Customer-Wise Profit:* Which clients are most valuable.
  * *Invoice-Wise Profit:* Granular transaction margins.
* **Inventory Valuation Report:** Generates a real-time, print-ready report of all available SKUs, their stock levels, purchase cost rates, and total aggregate stock value for balance sheet reporting.

### 🧠 Domain 6: Integrated AI Capabilities (Local & Private)
BPartner ERP 9+ offloads heavy computation to a dedicated Python/FastAPI microservice powered by **LangChain**, **Ollama**, and **ChromaDB**. All AI runs locally—your patient and financial data never leaves your server.
* **AI Re-Order Agent:** Analyzes 90-day sales velocity and current stock levels to intelligently predict demand, generating automatic draft Purchase Orders for fast-moving items.
* **Expiry Guard AI:** Proactively scans millions of stock records to identify inventory entering the critical 30/60/90 day expiry windows, suggesting discounting or supplier return strategies before they become a dead loss.
* **Smart Ledger OCR:** Automatically extracts items, quantities, and prices from scanned vendor invoices (PDF/Images) using LLMs, converting them directly into Purchase Challans.
* **Anomaly Detection:** Scans the ledger for unusual transaction patterns, off-hours billing, or potential fraud, assigning risk scores in real-time.

---

## 🏗️ System Architecture & Tech Stack

The platform is designed as a modern decoupled microservices architecture:

### 1. Frontend (`/frontend`)
* **Framework:** React 18, Vite.
* **Styling:** TailwindCSS (Strictly configured for high density, slate/grey color palettes, and minimal DOM nodes).
* **Icons:** Lucide React.
* **Routing:** React Router v6.

### 2. Backend Engine (`/backend`)
* **Runtime:** Node.js, Express.
* **Database & ORM:** PostgreSQL managed via Sequelize ORM.
* **Security:** JWT Authentication, BCrypt Password Hashing, Role-Based Access Control (RBAC) middleware (`protect`, `requirePermission`).

### 3. AI Microservice (`/ai-service`)
* **Runtime:** Python 3.10+, FastAPI.
* **AI Stack:** LangChain, HuggingFace embeddings, local Ollama (Llama3/Mistral).
* **Database Connector:** psycopg2 for direct Read-Only analytical queries against the PostgreSQL database.

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18+)
* **Python** (3.10+)
* **PostgreSQL** (v14+)
* **Ollama** (Running locally with a model like `llama3` installed for AI features)

### 1. Database Setup
Ensure PostgreSQL is running. Create a database for the ERP.
```bash
createdb bpartner_erp
```

### 2. Backend Setup (Node.js)
```bash
cd backend
npm install

# Create a .env file based on environment variables
# DB_NAME, DB_USER, DB_PASS, JWT_SECRET, AI_SERVICE_URL=http://localhost:8000

# Start the transactional server (runs on http://localhost:5000)
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

# Start the FastAPI AI engine (runs on http://localhost:8000)
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

## ⌨️ Keyboard-First Navigation Reference

Power users can navigate the entire system without lifting their hands from the keyboard:
* **Global Navigation:** Use the Sidebar and Header dropdowns natively.
* **Billing Grid:** 
  * Type part of a drug name and press `Down Arrow` to select from the auto-complete `<datalist>`.
  * Press `Tab` to instantly jump to Quantity -> Rate -> Discount -> Next Row.
* **Modals (Receipts/Payments):**
  * Press `Enter` inside any form field to Submit/Save.
  * Press `Esc` to instantly close dialogs and clear state.

---

## 🤝 Development & Maintenance
Architected and developed by the **BPartners Pharma Technology Team**. 
For support, system administration, or architecture modifications, consult the internal developer Wiki.
