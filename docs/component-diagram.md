# PayDesk HRMS — Frontend Component & Navigation Diagram

This document illustrates the hierarchical relationship between routes, layouts, pages, and interactive components.

---

## 1. Top-Level Route & Component Hierarchy

```mermaid
graph TD
    App["App.tsx (Router Root)"]

    App -->|"Route: /login"| Login["Login.tsx"]
    App -->|"Protected Routes"| Layout["DashboardLayout.tsx"]
    App -->|"Catch-All (*)"| CatchAll["CatchAllRoute -> NotFound.tsx"]

    subgraph "Navigation Shell (DashboardLayout.tsx)"
        Layout --> Sidebar["Sidebar Navigation"]
        Layout --> Header["Top Header & Profile Bar"]
        Layout --> ContentArea["Page Outlet Content Area"]
    end

    ContentArea -->|"/dashboard"| DashboardPage["Dashboard.tsx"]
    ContentArea -->|"/salaries"| SalariesPage["Salaries.tsx"]
    ContentArea -->|"/employees"| EmployeesPage["Employees.tsx"]
    ContentArea -->|"/analytics"| AnalyticsPage["Analytics.tsx"]
    ContentArea -->|"/audit-logs"| AuditLogsPage["AuditLogs.tsx"]
    ContentArea -->|"/ai-assistant"| AIAssistantPage["AIAssistant.tsx"]

    subgraph "Dashboard Page Components"
        DashboardPage --> KPI["Metric Cards (StatCards)"]
        DashboardPage --> TrendChart["PayrollTrendChart (SVG)"]
        DashboardPage --> DeptChart["DepartmentBarChart (SVG)"]
        DashboardPage --> CurrChart["CurrencyDistributionChart (SVG)"]
        DashboardPage --> AuditTable["Recent Audit Trail Table"]
    end

    subgraph "Salaries Page (5 Workspace Tabs)"
        SalariesPage --> TabNav["Tab Navigation Header"]
        SalariesPage --> Tab1["EmployeeSalaryTab.tsx"]
        SalariesPage --> Tab2["SalaryStructureTab.tsx"]
        SalariesPage --> Tab3["DeductionsLopTab.tsx"]
        SalariesPage --> Tab4["IncrementsBonusesTab.tsx"]
        SalariesPage --> Tab5["SalarySlipsTab.tsx"]
    end

    subgraph "Reusable Common Components"
        Card["Card.tsx"]
        Modal["Modal.tsx"]
        Select["Select.tsx"]
        Skeleton["Skeleton.tsx"]
    end

    Tab1 -.-> Card
    Tab1 -.-> Modal
    Tab2 -.-> Card
    Tab3 -.-> Modal
    Tab4 -.-> Modal
    Tab5 -.-> Modal
    EmployeesPage -.-> Modal
    EmployeesPage -.-> Card
```

---

## 2. Salary Workspace Component Breakdown

```mermaid
graph TD
    SalariesWorkspace["Salaries.tsx (Container)"]

    SalariesWorkspace -->|"activeTab = 'directory'"| Tab1["EmployeeSalaryTab"]
    Tab1 --> FilterBar["Search & Department Filter"]
    Tab1 --> DirectoryTable["Paginated Salary Table"]
    Tab1 --> ViewDetailsModal["Salary Breakdown Details Modal"]
    Tab1 --> ExportMenu["Export Dropdown (CSV, Excel, PDF)"]

    SalariesWorkspace -->|"activeTab = 'structure'"| Tab2["SalaryStructureTab"]
    Tab2 --> EmpSearch["Employee Search Autocomplete"]
    Tab2 --> CompOverview["Compensation Component Cards"]
    Tab2 --> LeaveCard["Paid Leave Balances Widget"]
    Tab2 --> EditStructureModal["Edit Base & Structure Modal"]

    SalariesWorkspace -->|"activeTab = 'deductions'"| Tab3["DeductionsLopTab"]
    Tab3 --> DeductionsTable["Statutory Deductions Table"]
    Tab3 --> DeductionModal["Deduction Breakdown Modal"]

    SalariesWorkspace -->|"activeTab = 'increments'"| Tab4["IncrementsBonusesTab"]
    Tab4 --> RevisionForm["Initiate Revision Form"]
    RevisionForm --> ModeToggle["Toggle: Monthly Increment vs Annual Base"]
    Tab4 --> AuditTrailTable["Revision Audit Trail Table"]

    SalariesWorkspace -->|"activeTab = 'slips'"| Tab5["SalarySlipsTab"]
    Tab5 --> SlipsGrid["Monthly Payslip Card Grid"]
    Tab5 --> PayslipModal["Interactive Styled Payslip Modal"]
    Tab5 --> DownloadSlip["Download HTML Payslip Action"]
```
