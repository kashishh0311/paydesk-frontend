# PayDesk HRMS — Frontend Web Application

PayDesk is a modern, enterprise-grade HRMS, compensation management, and payroll processing frontend built with **React 18**, **TypeScript**, **Vite**, and **Tailwind CSS**.

---

## Technical Documentation (`docs/`)

Comprehensive architectural and engineering documentation is available in the [`docs/`](docs/README.md) directory:

- [Requirements Specification](docs/requirements.md) — Scope, user personas, acceptance criteria, and deliberate non-goals.
- [Project Planning](docs/project-planning.md) — Agile sprint breakdown and delivery roadmap.
- [Architecture & Structure](docs/architecture.md) — Feature-driven architecture, directory layout, and state management.
- [Component & Navigation Diagram](docs/component-diagram.md) — Mermaid diagram of routes, pages, and interactive tabs.
- [UI/UX Design System](docs/ui-design.md) — Design tokens, zero-emoji policy, and responsive layouts.
- [API Integration](docs/api-integration.md) — REST client, dual-token auth flow, and authenticated downloads.
- [Testing Strategy](docs/testing.md) — Vitest unit and integration test design (19 test files).
- [AI Prompts & Guidelines](docs/ai-prompts.md) — Prompts or instructions used with AI tools.
- [Development Notes](docs/development-notes.md) — Key technical decisions and bug fixes.
- [Deployment Guide](docs/deployment.md) — Environment variables and Render static site configuration.

---

## Key Features

1. **Salary Management Hub (`/salaries`)**:
   - **Employee Salary**: Real-time month filtering (defaulting to current month), search, department filtering, Annual & Monthly Income, Deductions, Net Take-Home, View Details modal with full leave quotas, and **Export dropdown** (CSV, Excel `.xlsx`, Print/PDF).
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
| **State Management** | Redux Toolkit (`userSlice`) |
| **Styling** | Tailwind CSS + Custom Design System |
| **Routing** | React Router v6 |
| **Icons** | Lucide React |
| **Testing** | Vitest & React Testing Library (19 files, 54 tests, 100% pass) |
| **Notifications** | Custom Toast System |
| **Currency** | Indian Rupee (`formatINR`, `₹`) |

---

## Directory Structure

```text
paydesk-frontend/
├── docs/                               # Comprehensive frontend documentation
│   ├── ai-prompts.md                   # Prompts or instructions used with AI tools
│   ├── api-integration.md              # REST client, dual-token auth, & stream downloads
│   ├── architecture.md                 # Component hierarchy, state flow, & design patterns
│   ├── component-diagram.md            # Mermaid component relationship & routing map
│   ├── deployment.md                   # Render static site deployment & SPA rewrites
│   ├── development-notes.md            # Frontend bug resolutions & architectural trade-offs
│   ├── project-planning.md             # Development plan, sprints, & feature priorities
│   ├── requirements.md                 # UI/UX specifications, user personas, & scope
│   ├── testing.md                      # Vitest testing strategy, mocks, & test categories
│   └── ui-design.md                    # Theme tokens, dark mode, typography, & layouts
├── src/                                # Frontend source code
│   ├── components/                     # Reusable UI component library
│   │   ├── common/                     # Core building blocks
│   │   │   ├── __tests__/              # Button, Input, Modal, Badge, StatCard unit tests
│   │   │   ├── Alert.tsx               # Status alert banners
│   │   │   ├── Badge.tsx               # Status & category badges
│   │   │   ├── Button.tsx              # Primary, secondary, danger button variants
│   │   │   ├── Card.tsx                # Container cards with elevation
│   │   │   ├── ConfirmModal.tsx        # Deletion & action confirmation modals
│   │   │   ├── Input.tsx               # Validated form text input fields
│   │   │   ├── Modal.tsx               # Accessible modal portal with backdrop
│   │   │   ├── Select.tsx              # Styled select dropdowns
│   │   │   ├── Skeleton.tsx            # Content placeholder loading skeletons
│   │   │   └── StatCard.tsx            # KPI metric cards with trends
│   │   ├── dashboard/                  # Dashboard analytical widgets
│   │   │   ├── __tests__/              # Dashboard charts unit tests
│   │   │   └── DashboardCharts.tsx     # Lightweight SVG payroll progression chart
│   │   └── salary/                     # Compensation workspace tabs
│   │       ├── __tests__/              # Tab-level component integration tests
│   │       ├── IncrementsPlannerTab.tsx # Monthly bonuses & annual salary revisions
│   │       ├── SalaryDeductionsTab.tsx # EPF, PT, Health Insurance, & LOP tracking
│   │       ├── SalaryDirectoryTab.tsx  # Employee directory with compensation details
│   │       ├── SalarySlipsTab.tsx      # Payslip generation & HTML downloads
│   │       └── SalaryStructureTab.tsx  # Allowance & deduction component breakdown
│   ├── context/                        # React Context providers
│   │   └── ThemeContext.tsx            # Light/Dark theme mode state provider
│   ├── features/                       # Redux Toolkit domain slices
│   │   └── user/                       # Authentication & user profile state
│   │       ├── __tests__/              # Redux slice & thunk lifecycle tests
│   │       └── userSlice.ts            # User state, login, logout, & error reducers
│   ├── hooks/                          # Custom reusable React hooks
│   │   ├── __tests__/                  # Hook unit tests
│   │   ├── useDebounce.ts              # Search input debounce hook
│   │   └── useOnClickOutside.ts        # Outside-click dismissal handler hook
│   ├── layouts/                        # Application layout containers
│   │   └── DashboardLayout.tsx         # Sidebar, top navigation bar, & content area
│   ├── pages/                          # Top-level view routes
│   │   ├── __tests__/                  # Page integration tests
│   │   ├── AIAssistant.tsx             # Interactive compensation query assistant
│   │   ├── AuditLogs.tsx               # Compliance audit trail & history table
│   │   ├── Dashboard.tsx               # Executive KPI overview & progression trends
│   │   ├── Employees.tsx               # Employee onboarding, management, & export
│   │   ├── Login.tsx                   # HR Manager authentication portal
│   │   ├── NotFound.tsx                # 404 error fallback view
│   │   ├── Salaries.tsx                # Unified 5-tab compensation hub
│   │   └── Settings.tsx                # Organization & user profile preferences
│   ├── services/                       # HTTP API communication layer
│   │   ├── __tests__/                  # API client unit tests
│   │   └── api.ts                      # Dual-token fetch client with session recovery
│   ├── types/                          # TypeScript interface & type definitions
│   │   └── index.ts                    # Employee, Salary, Deduction, & User types
│   ├── utils/                          # Utility & helper functions
│   │   ├── __tests__/                  # Utility unit tests
│   │   ├── currency.ts                 # Indian Rupee formatting (formatINR, compact)
│   │   ├── download.ts                 # Authenticated file export & print handler
│   │   └── toast.ts                    # Notification trigger dispatchers
│   ├── App.tsx                         # Route configuration & protected route guards
│   ├── index.css                       # Global CSS & Tailwind design tokens
│   └── main.tsx                        # React application bootstrap & Redux Provider
├── public/                             # Static public assets
├── index.html                          # HTML5 template entry point
├── package.json                        # Frontend dependencies & npm scripts
├── tsconfig.json                       # TypeScript compiler configuration
├── vite.config.ts                      # Vite build & Vitest test runner configuration
└── README.md                           # Frontend project overview & quickstart guide
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
