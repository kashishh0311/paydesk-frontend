# PayDesk HRMS — UI/UX Design System & Principles

## 1. Design Aesthetics & Visual Identity
PayDesk was designed with an **executive monochromatic aesthetic**, avoiding playful or loud colors in favor of high-contrast data readability, subtle borders, and consistent typography.

### 1.1 Color Tokens
- **Background**: `#ffffff` (Clean enterprise surface)
- **Card Background**: `#ffffff` with subtle border `rgba(0, 0, 0, 0.08)`
- **Foreground / Text**: `#0f172a` (Slate 900)
- **Muted Text**: `#64748b` (Slate 500)
- **Brand Accent / Primary**: `#4f46e5` (Deep Indigo)
- **Status Badges**:
  - Positive / Paid: Emerald (`#10b981`)
  - Warning / In Review: Amber (`#f59e0b`)
  - Danger / Deductions: Rose (`#f43f5e`)

### 1.2 Zero-Emoji Policy
To maintain institutional HR credibility, all emojis are strictly banned from UI components, tables, toasts, and charts. All visual indicators use curated **Lucide React** icons (`Banknote`, `Users`, `Wallet`, `Clock`, `ShieldAlert`, `FileText`).

---

## 2. Shell & Navigation UX

### 2.1 Collapsible Sidebar (`DashboardLayout.tsx`)
- Desktop: Left-rail navigation with active route highlights, badge counts, and seamless collapse toggle.
- Mobile: Off-canvas overlay drawer toggled via a hamburger button that automatically dismisses upon route selection.

### 2.2 Top Header
- Displays the active workspace title, organization context, and HR User profile dropdown.
- Integrated quick-logout action that revokes JWT credentials and clears client state.

---

## 3. Reusable Atomic Components

### 3.1 Card Component (`components/common/Card.tsx`)
- Standardized container wrapping widgets, tables, and metric summaries.
- Supports optional `title`, `subtitle`, and top-right `action` element.

### 3.2 Modal Component (`components/common/Modal.tsx`)
- Renders an accessible portal dialog with smooth entry transition and backdrop blur.
- Implements `useOnClickOutside` to dismiss the modal whenever the user clicks outside the modal boundary.
- Supports `Escape` keyboard dismissal and automatic body scroll locking.

### 3.3 Animated Skeletons (`components/common/Skeleton.tsx`)
- Replaces generic spinners with layout-matching skeleton pulses (`DashboardSkeleton`, `TableSkeleton`, `ChartSkeleton`).
- Eliminates layout shift (CLS) while remote data loads.

---

## 4. Responsive Grid & Table Layouts
- **Tables**: Contained in horizontal scroll wrappers (`table-slider`) with sticky table headers so columns remain readable on mobile and tablet devices.
- **Charts**: Built with SVG `viewBox` coordinates (`viewBox="0 0 580 250"`) and `preserveAspectRatio="xMidYMid meet"`, scaling proportionally on any screen size.
- **Cards**: Responsive CSS Grid layouts transitioning from single-column on mobile (`grid-cols-1`) to multi-column on desktop (`lg:grid-cols-2` or `xl:grid-cols-4`).
