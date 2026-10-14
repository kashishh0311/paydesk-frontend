# PayDesk HRMS — Frontend Web Application

PayDesk is a modern, enterprise-grade HRMS, compensation management, and payroll processing frontend built with **React 18**, **TypeScript**, **Vite**, and **Tailwind CSS**.

---

## Key Features

1. **Salary Management Hub (`/salaries`)**:
   - **Employee Salary**: Real-time month filtering (defaulting to current month), search, department filtering, Annual & Monthly Income, Deductions, Net Take-Home, View Details modal with full leave quotas, and **Export dropdown** (CSV, Excel `.xls`, Print/PDF).
   - **Salary Structure**: Component breakdown (Basic, 40% HRA, 20% Special, 12% EPF, PT ₹200, Health ₹120, LOP), add/edit structure form, leave balances.
   - **Salary Deductions**: Itemized deduction registry, detail popup with regulatory sources, automatic leave deduction synchronization.
   - **Increments & Bonuses**: Monthly Increment ("This Month Only Increment") vs Annual Base revisions, synchronized audit trail.
   - **Salary Slips & History**: Interactive payslip preview modal, direct HTML salary slip download, synchronized compensation revisions timeline matching calculations exactly.

2. **Employee Directory (`/employees`)**:
   - High-performance directory with search, department, and country filters.
   - Onboard employee modal with starting salary configuration.
   - Safe employee record deletion with cascading backend cleanup.
   - Data export in CSV, Excel, and PDF.

3. **Dashboard & Analytics (`/dashboard`)**:
   - Live KPI cards: Total Employees, Monthly Payroll, Net Salary Payable, Total Deductions, Pending Approvals, Paid Salaries.
   - Monthly payroll disbursement progression chart.
   - Payroll status distribution breakdown.

4. **Compliance Audit Trail (`/audit-logs`)**:
   - Complete chronological logs of compensation adjustments, employee additions, and profile deletions with previous and new values.

5. **AI Salary Assistant (`/ai-assistant`)**:
   - Interactive chat assistant answering natural-language compensation queries using real backend calculations.
   - User-friendly error messaging for quota, network, and data availability states.

---

## Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | React 18 with TypeScript |
| **Build Tool** | Vite |
| **Styling** | Tailwind CSS + Custom Design System |
| **Routing** | React Router v6 |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Notifications** | Custom Toast System |
| **Currency** | Indian Rupee (`formatINR`, `₹`) |

---

## Directory Structure

```
paydesk-frontend/
├── src/
│   ├── components/
│   │   ├── common/         # Button, Card, Input, Select, Modal, Toast
│   │   ├── salary/         # SalaryStructureTab, DeductionsLopTab, IncrementsBonusesTab, SalarySlipsTab
│   │   └── dashboard/      # Stat cards, trend charts
│   ├── hooks/              # useDebounce, useOnClickOutside
│   ├── layouts/            # DashboardLayout (sidebar, header, user menu)
│   ├── pages/              # Dashboard, Employees, Salaries, AuditLogs, AIAssistant, Login
│   ├── services/           # api.ts (cross-origin auth and fetch wrapper)
│   ├── utils/              # currency.ts (formatINR), download.ts (stream exports)
│   ├── App.tsx             # Route definitions & authentication guards
│   └── main.tsx            # Application entry point
├── requirements.md         # Detailed frontend requirements
└── README.md               # Frontend documentation
```

---

## Running Locally

1. **Install Dependencies**:
   ```bash
   cd paydesk-frontend
   npm install
   ```

2. **Environment Variables (`.env`)**:
   ```env
   VITE_API_URL=http://localhost:5000/api/v1
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173`.

4. **Build for Production**:
   ```bash
   npm run build
   ```
