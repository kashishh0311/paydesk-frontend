# PayDesk HRMS — Frontend Testing Strategy

## 1. Testing Philosophy
The frontend testing suite focuses on **deterministic, high-value unit and integration tests** verifying core business logic:
- Redux state transitions (login, logout, error clearing).
- Monetary and currency formatting accuracy (`formatINR`).
- User feedback and toast delivery integrity.

---

## 2. Test Runner: Vitest
We chose **Vitest** for frontend testing because:
- Native ESM support out-of-the-box matching Vite's pipeline.
- Instant execution speed (<400ms for full test suite).
- Seamless TypeScript support without Babel transpilation overhead.

---

## 3. Test Organization

```text
src/
├── components/
│   ├── common/
│   │   └── __tests__/
│   │       ├── Badge.test.tsx          # Status badges (active, inactive, pending)
│   │       ├── Button.test.tsx         # Primary, secondary, danger, and loading states
│   │       ├── Input.test.tsx          # Text fields, error states, and change handlers
│   │       ├── Modal.test.tsx          # Modal backdrop, ESC key closing, and child portals
│   │       └── StatCard.test.tsx       # KPI metrics, trend badges, and currency displays
│   └── salary/
│       └── __tests__/
│           ├── IncrementsPlannerTab.test.tsx # Bonus adjustments and annual revisions
│           ├── SalaryDeductionsTab.test.tsx  # EPF, PT, Health Insurance, and LOP calculation
│           ├── SalaryDirectoryTab.test.tsx   # Employee directory, searching, and pagination
│           ├── SalarySlipsTab.test.tsx       # Historical payslips and download actions
│           └── SalaryStructureTab.test.tsx   # Basic pay, HRA, and Special Allowance breakdown
├── features/
│   └── user/
│       └── __tests__/
│           └── userSlice.test.ts       # Redux state, thunk fulfilled/rejected tests
├── pages/
│   └── __tests__/
│       ├── AuditLogs.test.tsx          # Audit history table and filter controls
│       ├── Dashboard.test.tsx          # KPI stat cards and payroll progression SVG chart
│       ├── Login.test.tsx              # Form input validation and authentication submit
│       ├── Salaries.test.tsx           # 5-tab workspace switching and view states
│       └── Settings.test.tsx           # Security settings, notifications, and preferences
└── utils/
    └── __tests__/
        ├── currency.test.ts            # Currency formatting and compact INR tests
        ├── download.test.ts            # Authenticated blob downloads and HTML print triggers
        └── toast.test.ts               # Toast notification emission tests
```

---

## 4. Test Categories

### 4.1 State Management Tests (`userSlice.test.ts`)
- **Initial State**: Confirms state defaults when no session token is stored.
- **Error Clearing**: Validates `clearError` action resets error messages.
- **Login Fulfilled**: Verifies user profile is injected into Redux state.
- **Login Rejected**: Confirms error strings are captured on invalid credentials.
- **Logout**: Ensures user credentials and tokens are scrubbed from memory.

### 4.2 Component & Salary Tab Tests (`src/components/`)
- **Common UI Elements**: Verifies loading spinners, button disable states, input change triggers, modal mounting/unmounting, and badge variants.
- **Salary Directory & Structure**: Validates table rendering of 10,000 employee data, search filtering, and allowance calculation displays.
- **Deductions & Increments**: Verifies statutory deduction items (EPF, PT, Health), Loss of Pay leave calculations, and annual vs monthly revision toggles.
- **Salary Slips**: Verifies payslip listing, itemized summaries, and download triggers.

### 4.3 Page-Level Integration Tests (`src/pages/`)
- **Dashboard**: Verifies rendering of aggregate metrics (total employees, payroll expenditure) and SVG chart.
- **Salaries Workspace**: Verifies switching between the 5 tabs and active tab indicators.
- **Audit Logs**: Confirms filtering by action type and timestamp presentation.
- **Login & Settings**: Confirms credentials submission and organization preferences.

### 4.4 Utility Tests (`currency.test.ts`, `download.test.ts`, `toast.test.ts`)
- **Monetary Formatting**: Verifies Indian numbering system (`₹12,50,000.00`), negative sign placement, and compact Lakhs/Crores abbreviations.
- **Authenticated Downloads**: Verifies JWT header inclusion, blob URL generation, and print window triggers.
- **Notifications**: Verifies success and error toast delivery.

---

## 5. Running Frontend Tests

```bash
# Run tests once (CI mode)
npm test

# Run tests in watch mode
npm run test:watch
```
