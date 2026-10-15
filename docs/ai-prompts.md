# PayDesk HRMS — Prompts or instructions used with AI tools

This document tracks the prompts I used while designing and building the PayDesk frontend, the UI and state issues I caught, and how we fixed them.

---

## 1. Initial Requirements & Project Scoping

### My Prompt
```text
project requirement:
Goal: Build an employee salary management software for an organization with 10,000 employees.
User Persona: HR Manager of the organization.
Problem Statement: Currently, the HR team manages salary data for 10,000 employees across multiple countries using Excel spreadsheets, which is tedious, error-prone, and lacks visibility. We need a web-based system where the HR manager can manage salary data, process increments, handle deductions, generate payslips, and answer questions about how the organization pays people.
First, analyze this problem and write a comprehensive one-page requirements document outlining the project goals, architecture, scope, key features, and deliberate trade-offs before we start building.

Frontend layout requirements:
- Design a clean, responsive layout using Tailwind CSS.
- Include a sticky top header with quick actions,and profile controls.
- Build a collapsible sidebar navigation for easy switching between Dashboard, Salaries, AI Assistant, and Audit Logs.
- Implement light and dark theme modes using Tailwind CSS with clean semantic color tokens, setting default to light theme.
```

### What I Caught and Fixed
- Wanted a sticky top navigation header that stays pinned in place while scrolling through large data views.
- Designed a collapsible sidebar that expands and collapses smoothly without breaking table layouts.
- Configured light and dark theme modes using custom Tailwind CSS color variables in `index.css`, setting light mode as default.
- Clarified that the frontend UI must be designed specifically for the HR Manager persona with enterprise-grade typography and Indian Rupee formatting (`formatINR`).

### What We Did
- Formulated the frontend requirements and UI architecture in [requirements.md].
- Built [DashboardLayout.tsx] with a sticky top header, collapsible navigation sidebar, and instant theme toggling via [ThemeContext.tsx].
- Configured Tailwind CSS design tokens in `tailwind.config.js` and `src/index.css` for clean dark/light mode transitions.

---

## 2. HR Login Page & Authentication System

### My Prompt
```text
Build the login interface for the HR portal.
Use Redux Toolkit for auth state management and react-toastify for clean feedback notifications.
Validate email and password fields, displaying user-friendly messages for empty inputs or invalid credentials.
Include a demo login button to quickly populate the HR manager credentials for testing.
Protect dashboard routes so unauthenticated users are redirected to /login.
```

### What I Caught and Fixed
- Wanted default light theme and simple design without clutter.
- Switched from browser alert popups to clean bottom-right toast notifications with react-toastify.
- Added client-side validation so empty fields show clear messages without raw error codes.
- Added demo login button to quickly fill `[Email-Address]` and password for fast testing.
- Protected all dashboard routes so non-logged-in users are redirected to `/login`.

### What We Did
- Built [Login.tsx] with email and password inputs, form validation, and toast alerts.
- Configured Redux Toolkit in [userSlice.ts] to manage authentication state and logged-in HR profile.
- Configured [App.tsx] with protected route guards to keep unauthenticated users out of the dashboard.

---

## 3. 5-Tab Salary Management Workspace

### My Prompt
```text
Build a unified /salaries workspace divided into 5 distinct tabs:
1. Employee Salary Directory
2. Salary Structure Management
3. Salary Deductions & Loss of Pay
4. Increments & Bonuses Planner
5. Salary Slips & History
Add search debouncing so filtering through 10,000 employees is fast, and add export options for CSV and printable salary slips.
```

### What I Caught and Fixed
- Increments needed to support both a one-time monthly bonus ("This Month Only Increment") and permanent annual revisions.
- Loss of pay needed to calculate deductions dynamically from unpaid leave days without changing the base salary structure.

### What We Did
- Built [Salaries.tsx] with 5 modular tab components in `src/components/salary/`.
- Added search debouncing (`useDebounce`) so searching across 10,000 employees stays smooth.
- Added [download.ts] to handle CSV/Excel exports and instant printable HTML salary slips.

---

## 4. Fixing Login Session Drops & Screen Flash

### My Prompt
```text
On page refresh, the dashboard occasionally flickers and redirects back to the login screen with a 401 error.
Fix this by persisting the JWT token in localStorage, sending it via the Authorization Bearer header, and verifying authentication state before rendering the dashboard.
```

### What Was the Issue
- Cross-origin cookies were not always reliable on initial login across different domains.
- The UI would briefly flash the login page before checking the session.

### What We Did
- Updated [api.ts] to save the JWT token in `localStorage` on login and automatically send it in the `Authorization: Bearer <token>` header.
- Initialized `isInitialLoading` in [userSlice.ts] by checking for the stored token before rendering, which stopped the login screen flash.

---

## 5. Dashboard Charts & Payroll Trends Visualization

### My Prompt
```text
Improve the dashboard graphs and payroll visualization:
1. Simplify chart colors so the interface looks clean and professional rather than cluttered.
2. Format the timeline graph x-axis clearly with month and year markers (e.g., Jan '24, Feb '24) to track payroll trends over time.
3. Make the department breakdown chart responsive so cards wrap properly on smaller screens.
```

### What I Caught and Fixed
- The original chart used too many contrasting colors and date labels were confusing to read.
- Department breakdown elements overflowed on medium screen widths.

### What We Did
- Refactored [DashboardCharts.tsx] and [Dashboard.tsx] with a streamlined color scheme and clean label formatting.
- Added responsive flex-wrapping to department metric cards.

---

## 6. Printable Salary Slips & Export Functionality

### My Prompt
```text
Implement salary slip printing and employee payroll export:
1. Generate printable salary slips that format neatly as a clean document or PDF preview with company branding.
2. Support CSV/Excel export for employee compensation data without unnecessary clutter.
3. Optimize download speed so exporting large lists remains fast without lagging the browser.
```

### What I Caught and Fixed
- Exporting data took too long when handling large employee lists.
- Printable slips needed proper print media CSS styles (`@media print`) so pages print cleanly without navigation bars or buttons.

### What We Did
- Created [download.ts] for instant client-side CSV downloads and printable HTML salary slip generation.
- Added dedicated print styling ensuring clean page breaks and proper margins.

---

## 7. Responsive Tables with Horizontal & Vertical Scrolling

### My Prompt
```text
Make all data tables fully responsive across the salary management workspace:
1. Wrap large data tables (employee directory, salary structures, deductions, and history) in responsive containers.
2. Add smooth horizontal and vertical scrolling so columns do not clip, collapse, or distort on laptops and tablets.
3. Ensure sticky table headers stay in place while scrolling through large lists.
```

### What I Caught and Fixed
- Wide table columns (employee ID, basic salary, allowances, deductions, net pay, actions) were wrapping awkwardly or overflowing screen boundaries on smaller laptop viewports.
- The page itself would scroll horizontally instead of keeping navigation controls fixed.

### What We Did
- Wrapped all tabular views in [Salaries.tsx] and tab components with `overflow-x-auto overflow-y-auto` containers.
- Added sticky headers (`sticky top-0 bg-card z-10`) so column headers remain visible while scrolling through records.

---

## 8. AI Assistant Height, Chat Scrolling & Fixed Input Bar

### My Prompt
```text
Fix the AI Assistant interface layout and scrolling behavior:
1. Set a fixed viewport height for the assistant container so it fits neatly without page-level vertical scrollbars.
2. Keep the message input bar firmly pinned at the bottom while allowing only the chat history area to scroll.
3. Automatically scroll down smoothly when a new response arrives, and adjust padding so message bubbles don't get cut off.
```

### What I Caught and Fixed
- When long conversations were generated, the entire webpage expanded, pushing the input bar down below the screen fold.
- Missing bottom padding caused message bubbles to touch the input border.

### What We Did
- Refactored [AIAssistant.tsx] using a flexbox column layout (`h-[calc(100vh-140px)] flex flex-col`).
- Separated the scrollable chat area (`flex-1 min-h-0 overflow-y-auto p-4 sm:p-5`) from the fixed bottom input bar (`shrink-0 border-t`).
- Added automatic smooth scrolling (`scrollToBottom`) triggered whenever new messages are rendered or the loading skeleton appears.

---

## 9. Frontend Skeleton Loaders & Screen Flicker Prevention

### My Prompt
```text
Implement skeleton loading states across the entire frontend application:
1. Create reusable skeleton components for tables, KPI cards, dashboard charts, salary slips, and AI chat messages.
2. Fix the layout flicker: when a user logs out or visits /login while signed out, do not flash the dashboard skeleton before redirecting.
3. Show clean shimmer animations while fetching 10,000 employees or calculating aggregations, so the UI feels smooth and responsive.
```

### What I Caught and Fixed
- When signed out, the dashboard skeleton was briefly flashing on screen before redirecting to the login page.
- Tables showed awkward empty spaces before employee data finished loading over the network.

### What We Did
- Built modular skeleton components in [Skeleton.tsx] (`TableSkeleton`, `KpiCardSkeleton`, `CardSkeleton`, `SalarySlipSkeleton`, `AIAssistantMessageSkeleton`) with Tailwind shimmer animations.
- Refactored route protection in [App.tsx] and auth state in [userSlice.ts] so unauthenticated routes never render private dashboard skeleton placeholders.
- Embedded skeleton states across all 5 salary tabs and the dashboard.

---

## 10. User-Friendly Error Messages & Toast Notifications

### My Prompt
```text
Standardize error handling across all frontend forms and API requests.
Instead of showing generic alerts or technical error codes, display clear toast notifications using react-toastify for network failures, validation errors, and invalid credentials.
```

### What I Wanted
- When an API request fails, toast notifications should show clear human messages, not status codes or database errors.

### What We Did
- Standardized toast notifications across all forms, modals, and login actions using `react-toastify`.
- Displayed user-friendly messages for network issues, validation errors, and invalid credentials.

---

## 11. Full Frontend Test Coverage (Vitest)

### My Prompt
```text
Create complete test coverage for the frontend using Vitest and React Testing Library.
Write unit and integration tests for all common UI components, the 5 salary workspace tabs, pages, Redux slices, and utilities.
Make sure all tests pass with npm test.
```

### What We Did
- Added 19 test files with 54 passing tests in Vitest:
  - All UI components (`Button`, `Input`, `Modal`, `Badge`, `Card`, `Alert`, `Select`, `Skeleton`, `ConfirmModal`).
  - All 5 Salary workspace tabs.
  - All pages (`Dashboard`, `Login`, `Salaries`, `AuditLogs`, `Settings`, `NotFound`).
  - Redux slice (`userSlice`), API service, hooks, and utilities.
- Verified 100% pass rate (54 / 54 passing tests) across all test files.

---

## Summary of Fixes

| Area | What Was the Problem | How We Fixed It | Result |
| :--- | :--- | :--- | :--- |
| **Requirements & Scoping** | Org managed 10k employees in Excel without audit trails | Analyzed requirements and wrote comprehensive specification before coding | Clear scope and architecture |
| **Layout & Themes** | Needed responsive navigation with light/dark theme and sticky controls | Built [DashboardLayout.tsx] with sticky header, collapsible sidebar, and Tailwind theme tokens | Clean layout with default light theme |
| **Authentication & Login** | Needed login page for HR with toast errors and demo credentials | Built [Login.tsx], Redux [userSlice.ts], and react-toastify alerts | Clean HR login workflow |
| **Session Drops** | Session dropped on refresh with 401 error | Stored token in localStorage and sent in headers | Persistent login |
| **Salary Management** | Complex 5-tab workspace needed for 10k employees | Built modular tabs with debounced search | Fast responsive interface |
| **Dashboard Charts** | Graph colors were noisy and date labels on x-axis were confusing | Cleaned color palette and formatted month/year labels | Clear payroll trends |
| **PDF & Export** | Export was slow and salary slip print layout was cluttered | Added fast client-side CSV export and instant printable HTML slips | One-click downloads & print |
| **Responsive Tables** | Wide table columns overflowed on smaller screens | Added horizontal and vertical scroll containers with sticky headers | Clean table navigation |
| **AI Assistant UI** | Chat input bar was pushed off-screen and scrolling broke | Pinned input bar to bottom and added internal auto-scrolling container | Smooth conversational chat |
| **Skeleton Loaders** | Dashboard skeleton flashed on logout and tables lacked loading states | Created modular skeleton components in [Skeleton.tsx] and fixed route guards | Smooth loading experience without flickering |
| **Error Feedback** | Technical errors shown on API failures | Standardized toast notifications with user-friendly text | Clear toast messages |
| **Testing** | Many components and pages had no tests | Wrote 19 test files covering all modules | 54 / 54 tests passing (100%) |
