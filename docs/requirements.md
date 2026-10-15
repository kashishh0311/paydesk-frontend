# PayDesk HRMS — Frontend Requirements Specification

## 1. Project Goal & Scope
PayDesk is a modern, web-based compensation management platform designed for the **HR Manager** of an enterprise employing **10,000+ employees across multiple global jurisdictions**.

### 1.1 Problem Statement
The HR team previously tracked 10,000 employee salaries, allowances, and revisions using disconnected spreadsheets. This caused:
- Formula discrepancies and accidental cell overrides.
- Inability to answer questions about organizational pay scales and statutory deductions in real time.
- Tedious, slow manual report and payslip generation.

PayDesk frontend replaces spreadsheets with an interactive, responsive Single Page Application (SPA) providing real-time compensation exploration, automated slip downloads, and conversational AI insights.

---

## 2. Target User Persona
- **Primary Persona**: **HR Manager & Compensation Lead**
  - Needs: Fast search across 10,000 records, dynamic filtering by department/country, compensation revisions (Annual base vs. one-time monthly bonuses), and official salary slip exports.
- **Secondary Persona**: **Audit & Executive Leadership**
  - Needs: Visual wage distribution charts, audit trail inspection, and macro compensation analytics.

---

## 3. Core Features & Functional Scope

### 3.1 Authentication & Session Management
- **Single-sign-on login screen** with credential verification.
- **Immediate token hydration**: JWT stored in `localStorage` and Redux state.
- **Automatic session restore**: Protected routes redirect unauthenticated users to `/login` without flash-of-content.

### 3.2 Global Compensation Dashboard (`/dashboard`)
- Executive KPI overview cards: Total Payroll Budget, Monthly Payroll Run-Rate, Net Payable, Total Deductions, and Paid Salaries.
- **Monthly Payroll Progression**: Native SVG bar chart visualizing 12-month payroll budget progression.
- **Department Breakdown**: Horizontal bar chart comparing departmental compensation distribution.
- **Currency & Regional Distribution**: Visual share of global compensation across currencies (INR, USD, EUR, GBP, AED, SGD, JPY, CAD, AUD).
- **Recent Compensation Actions**: Live audit log table showing recent changes and approvals.

### 3.3 Employee Salary Workspace (`/salaries`)
Organized into 5 dedicated workflow tabs:
1. **Employee Salary Directory**:
   - Monthly cycle selector (e.g. October 2026).
   - Debounced search (300ms) by name or employee code (`EMP-XXXXXX`).
   - Department filter.
   - Per-row actions: **View Details** (breakdown modal) and **Revise** (increment launcher).
   - Multi-format exports: CSV, Excel (.xls), and Print/PDF.
2. **Salary Structure Management**:
   - Search employee and inspect full monthly statutory breakdown: Basic, HRA (40%), Special Allowance (20%), EPF (12%), Professional Tax (₹200), Health Insurance (₹120), and LOP.
   - Paid Leave Quota card: Casual Leave (12 days), Sick Leave (10 days), and Unpaid Leave / LOP days.
3. **Salary Deductions & Loss of Pay**:
   - Filterable deduction registry by statutory type.
   - Modal inspection showing regulatory source and deduction justification.
4. **Increments & Bonuses Planner**:
   - Dual-mode salary revision form:
     - **Monthly Increment**: One-time bonus for the selected month's cycle without altering annual CTC.
     - **Annual Base Revision**: Permanent salary raise recalculating all future allowances and statutory deductions.
   - Comprehensive audit trail table with status tags.
5. **Salary Slips & History**:
   - Interactive modal payslip viewer with corporate branding.
   - Direct download of official styled `.html` payslip for offline viewing and native browser print to PDF.
   - Historical salary revision timeline matching figures to the exact rupee.

### 3.4 Employee Directory (`/employees`)
- Full directory table supporting 10,000+ records with server-side pagination.
- Modal to onboard new employees with automatic code generation (`EMP-XXXXXX`).
- Cascading delete confirmation dialog with complete dependency removal.
- Bulk export dropdown for directory records.

### 3.5 AI Salary Assistant (`/ai-assistant`)
- Natural-language conversational interface powered by Google Gemini.
- Pre-set prompt suggestions (e.g. "What is our total payroll budget?", "Compare Engineering vs Sales spend").
- Markdown table formatting, error callouts, and deterministic statistical fallbacks on quota limits.

---

## 4. What Was Deliberately Left Out & Rationale
1. **Client-Side Financial Computations**:
   - *Rationale*: All mathematical rounding, statutory deductions, LOP, and net take-home pay formulas are executed exclusively by the backend to prevent discrepancies between web UI and printed slips.
2. **Heavy Third-Party Charting Libraries (Chart.js / Highcharts)**:
   - *Rationale*: Replaced with lightweight, native custom SVGs to save ~150KB of bundle size and eliminate canvas rendering lag.
3. **Direct Bank Wire Execution**:
   - *Rationale*: Banking clearing rails require external banking gateways. PayDesk provides bank-ready CSV/Excel export formats for batch uploading into banking portals.

---

## 5. Acceptance Criteria
- [x] Initial page load completes in <1.5s on broadband.
- [x] All monetary amounts formatted in Indian Rupees (`formatINR`).
- [x] Modals dismiss cleanly when clicking outside (`useOnClickOutside`).
- [x] All tables support empty states and loading skeletons.
- [x] No compilation or TypeScript errors (`tsc -b` exits with 0).
