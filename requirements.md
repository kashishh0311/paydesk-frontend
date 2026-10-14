# PayDesk HRMS — Frontend Architecture & Requirements Specification

## 1. Project Overview & Guiding Principles
PayDesk is an enterprise-grade HRMS compensation, payroll processing, and salary management platform built with React, TypeScript, and Tailwind CSS.

- **Frontend-Backend Contract**: All calculations, aggregations, statutory deductions, and payroll figures are computed by the backend. The frontend is responsible for requesting verified data, displaying responsive tables/cards, and managing user workflows.
- **Strict HR Role Access**: All compensation and salary management features are governed under the `HR_MANAGER` role.
- **Design & Currency Standards**:
  - Currency strictly formatted in Indian Rupees using `formatINR` (e.g., `₹65,000.00`).
  - Zero emojis in UI components.
  - Interactive modal dialogs and dropdown menus close gracefully when clicking outside via `useOnClickOutside`.

---

## 2. Implemented Salary Management Module (`/salaries`)

Organized as a unified 5-tab workspace:

### 2.1 Tab 1: Employee Salary
- **Month Selector**: Filter records dynamically by month (defaulting to the current cycle, e.g., `October 2026`).
- **Real-Time Filters**: Instant debounce search by employee name or code (`EMP-XXXXXX`) and department dropdown.
- **Table Data Columns**:
  - Employee (Name and Code)
  - Department
  - Annual Income (`₹XX,XXX.00`)
  - Monthly Income (`₹XX,XXX.00/mo`)
  - Deductions (`-₹X,XXX.00`)
  - Net Take-Home (`₹XX,XXX.00`)
  - Actions: **View Details** and **Revise**
- **View Details Modal**: Displays annual base, active bonus, statutory deductions, net take-home, verified deductions (EPF, PT, Health), and leave quota details (Casual Leave, Sick Leave, Loss of Pay per-day rate and days taken).
- **Export Action**: Direct export dropdown supporting **Export as CSV**, **Export as Excel (.xls)**, and **Print / Save as PDF** via backend streaming.

### 2.2 Tab 2: Salary Structure Management
- **Search & Select**: Lookup any employee profile by name or code.
- **Current Structure Overview**:
  - Annual base, bonuses, statutory deductions, net salary.
  - Monthly breakdown: Basic Pay, HRA (40%), Special Allowance (20%), Gross Monthly, EPF (12%), Professional Tax (₹200), Health Insurance (₹120), LOP, Total Deductions, and Net Monthly.
- **Add & Edit Structure Modal**: Form enabling HR managers to adjust base salary, performance incentives, effective dates, and justification reason.
- **Leave Balances Card**: Live visual cards for Casual Leave (12 days total), Sick Leave (10 days total), and Unpaid Leave / LOP.

### 2.3 Tab 3: Salary Deductions & Loss of Pay
- **Complete Registry**: Table listing all verified deductions with search and type filters.
- **Deduction Details Modal**: Full breakdown showing employee information, deduction type, monthly amount, deduction reason, statutory regulatory source, and approval status.
- **Deduction Categories**:
  - Employee Provident Fund (EPF)
  - Professional Tax (State statutory)
  - Health & Medical Insurance Premium
  - Loss of Pay (LOP) calculated according to unpaid leave days.

### 2.4 Tab 4: Increments & Bonuses Planner
- **Initiate Increment / Revision Form**:
  - Search and select employee.
  - **Increment Mode Toggle**:
    - **Monthly Increment (₹/mo)**: Specifies an increment for this month's payroll cycle without inflating the permanent annual base salary.
    - **Annual Base (₹/yr)**: Replaces the permanent annual base compensation.
  - Performance Bonus input, reason selector, and effective date picker.
- **Audit Trail Presentation**:
  - For Monthly Increments: Displays adjustment as `+₹X,XXX (This Month)` with `New Base: ₹XX,XXX (+₹X,XXX)`.
  - For Annual Revisions: Displays percentage increase `+XX%`.

### 2.5 Tab 5: Salary Slips & History
- **Employee Search**: Search lookup for any employee in the directory.
- **Monthly Salary Slips**:
  - Displays approved salary slip cards for available cycles.
  - **View Slip Button**: Opens interactive modal showing company branding, employee details, earnings (Basic, Allowances, Bonus, Gross), deductions (EPF, PT, Health, LOP, Total), and Net Take-Home Pay.
  - **Download Salary Slip Button**: Directly downloads the official styled `.html` salary slip with verified details without 404 errors.
- **Compensation Revisions Timeline**:
  - Chronological history of compensation adjustments.
  - Fully aligned with the verified salary structure: Monthly Base, Monthly Deductions (`-(EPF + PT + Health)`), and Monthly Net Pay match the slip figures to the exact Rupee.

---

## 3. Employee Directory Module (`/employees`)
- **Global Employee Management**: 10,000+ employee directory with instant search, department, and country filters.
- **Onboard New Employee**: Modal form with automatic employee code generation (`EMP-XXXXXX`) and salary setup.
- **Safe Record Removal**: Delete confirmation modal triggering backend cascading deletion without foreign key errors.
- **Exporting**: Dropdown for CSV, Excel, and PDF downloads.

---

## 4. First-Login Session Recovery
- Immediate storage of JWT token into `localStorage` and `authSlice` upon successful login.
- In `api.ts`, outgoing requests automatically attach `Authorization: Bearer <token>` alongside `credentials: 'include'`.
- Eliminates first-login 401 Unauthorized errors and prevents "No data found" false states.

---

## 5. UI Architecture & Design Standards
- **Styling**: Tailwind CSS with custom slate/card tokens, smooth borders, and purple accent (`primary: #4f46e5`).
- **Interactive Modals**: Controlled state with outside-click dismissal (`useOnClickOutside`), backdrop blur, and escape key handling.
- **Accessibility**: Semantic tables, ARIA labels on dropdowns, keyboard-navigable forms.
