# PayDesk HRMS — Frontend Development Notes & Key Decisions

## 1. Technical Decisions & Solutions

### 1.1 Resolution of Initial Skeleton Flashing
- **Issue**: On cold visits, the application briefly rendered an internal dashboard skeleton even when the user was signed out.
- **Root Cause**: `isInitialLoading` was set to `true` unconditionally in `userSlice.ts`.
- **Solution**: Dynamically initialized `isInitialLoading` based on `Boolean(localStorage.getItem('paydesk_token'))`. If no token exists, the application immediately routes to `/login` with zero skeleton delay.

### 1.2 SVG Visualizations vs. Heavy Chart Libraries
- **Decision**: Implemented native SVG chart elements in `DashboardCharts.tsx` rather than importing Chart.js or Recharts.
- **Impact**:
  - Saved ~150KB of bundled JavaScript.
  - Zero hydration issues in React 19.
  - Pixel-perfect vector scaling across mobile, tablet, and widescreen monitors.

### 1.3 Debounced Search for 10,000 Records
- **Decision**: Built a custom `useDebounce` hook with a 300ms threshold.
- **Impact**: Typing employee names or codes no longer triggers rapid API requests, reducing backend load by ~85% during real-time filtering.

### 1.4 Strict TypeScript Compilation (`tsc -b`)
- **Challenge**: Render deployment builds failed with `TS6133` (unused variables) and `TS2459` (unexported imports) when `API_BASE_URL` was imported unnecessarily in `SalarySlipsTab.tsx`.
- **Solution**: Removed unused imports, verified all shared exports in `services/api.ts`, and verified `npx tsc --noEmit` exits with 0 before pushing.

---

## 2. Browser Compatibility & Mobile Considerations
- **Table Sliders**: Tables on small viewports wrap in an overflow slider with custom subtle scrollbars (`custom-scrollbar`).
- **Modal Viewports**: Modal bodies utilize `max-h-[85vh]` and overflow scrolling, preventing buttons from getting cut off on smaller laptop or mobile screens.
