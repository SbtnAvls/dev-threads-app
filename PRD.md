# Dev Threads - Product Requirements Document (PRD)

## 1. Product Overview

**Dev Threads** (formerly QA Threads) is an internal issue tracking and quality assurance management application for development teams. It enables team members to create, track, review, approve, or reject development issues, and maintain a timeline of activity per issue.

- **Frontend:** React 19 SPA with Vite, Tailwind CSS, Framer Motion
- **Backend:** Django REST Framework API at `http://localhost:8001/api/dev/`
- **Base URL:** `http://localhost:5173/`

## 2. User Roles & Permissions

| Role | Permissions |
|------|------------|
| **admin** | Full access (wildcard `*`) |
| **lead** | create_dev, assign_dev, close_dev, reject_dev, approve_dev, comment, manage_users, mark_tech_debt, view_all |
| **product_manager** | create_dev, assign_dev, close_dev, approve_dev, reject_dev, comment, view_all |
| **qa** | create_dev, assign_dev, approve_dev, reject_dev, comment, view_all |
| **developer** | comment, change_status, add_commit, view_assigned |

### Test Accounts (all password: `Test1234!`)

| Email | Role |
|-------|------|
| admin@dev.local (password: Admin123!) | admin |
| lead@cashblock.com | lead |
| pm@cashblock.com | product_manager |
| qa@cashblock.com | qa |
| dev1@cashblock.com | developer |
| dev2@cashblock.com | developer |

## 3. Pages & Features

### 3.1 Login Page (`/login`)
- Email and password form with validation
- Show/hide password toggle
- Loading state during authentication
- Error message display for invalid credentials
- JWT token storage in localStorage (`dev_access_token`, `dev_refresh_token`)
- Automatic redirect to previous page after login
- Automatic token refresh on 401 responses

### 3.2 Dashboard (`/`)
- **Stats cards:** Total Issues, En Revision, Aprobados, Rechazados (4 cards with counts)
- **Developers panel:** Shows top 4 team members with avatar, name, role. "Ver todos" link to developers page
- **Recent Issues panel:** Last 5 recently updated issues with status badge, assignee, timeline count, relative time
- **Rejected alert banner:** Warning when rejected issues exist, with "Revisar ahora" link to filtered view
- Loading skeleton placeholders

### 3.3 Issues List Page (`/issues`)
- **Create Issue button** (permission-gated: `create_dev`)
- **Search bar:** Debounced text search (400ms) by title/description
- **View mode toggle:** Grid view (cards) vs List view (compact rows)
- **Status filter pills:** Todos, Abiertos, En Revision, Rechazados, Aprobados, Deuda Tecnica (each shows count)
- **Issue Cards display:**
  - Priority color bar (critical=red, high=orange, medium=yellow, low=green)
  - Title, truncated description
  - Status badge with color-coded dot (pulsing for in_review)
  - Priority badge
  - Tags as `#tag` chips
  - Assignee avatar and name
  - Timeline event count
  - Relative time since last update
- **Empty state** with illustration when no issues match filters
- URL query params for shareable filter state (`?status=rejected`)

#### New Issue Modal (triggered from Issues page)
- **Fields:** Title (required), Description (required), Assign to (dropdown, required), Priority (dropdown, default: Media), Tags (toggle buttons + custom input)
- **8 predefined tags:** frontend, backend, api, autenticacion, interfaz, rendimiento, error, funcionalidad
- **Custom tag input** with "Agregar" button
- Developer preview (avatar, name, email) below form
- Toast notification on success/error

### 3.4 Issue Detail Page (`/issue/:id`)
- **Issue detail card:** Status badge, priority badge, title, description, tags
- **Sidebar metadata:**
  - Assigned to (avatar, name, email, clickable)
  - Created by (avatar, name, email, clickable)
  - Dates (created, updated, due date)
  - Statistics (total events, commits, comments, rejections)
- **Timeline:** Vertical timeline with connected nodes showing all activity
- **Add Timeline Entry:** Expandable form with 5 action types:
  - **Comment** (permission: `comment`): text content
  - **Commit** (permission: `add_commit`): text + commit hash + branch
  - **Approval** (permission: `approve_dev`): text content, only when status is `in_review`
  - **Rejection** (permission: `reject_dev`): text + rejection reason, only when status is `in_review`
  - **Tech Debt** (permission: `mark_tech_debt`): text + tentative resolution date
- **Confetti animation** when an issue is approved
- **Context-aware toasts** per action type

#### Timeline Entry Types
| Type | Icon | Color | Extra UI |
|------|------|-------|----------|
| created | Plus | Blue | - |
| comment | MessageSquare | Blue | - |
| commit | GitCommit | Cyan | Hash, branch, GitHub link |
| status_change | ArrowRight | Yellow | Previous -> New status pills |
| approval | CheckCircle | Green | - |
| rejection | XCircle | Red | Red highlighted rejection reason |
| tech_debt | Clock | Purple | Purple highlighted tentative date |

### 3.5 Developers Page (`/developers`)
- **Stats bar:** Total members, developers count, QA engineers count, leaders count
- **Developer cards grid** (3 columns):
  - Avatar with colored ring
  - Full name, role badge (color-coded by role), email
  - Clickable, links to developer detail

### 3.6 Developer Detail Page (`/developer/:id`)
- **Profile header:** Large avatar, name, role (Spanish label), email
- **Stats grid (6 boxes):** Total, Open, In Review, Approved, Rejected, Tech Debt
- **Issues section:** Tab filters (6 tabs with counts) + issue cards grid
- Client-side filtering of developer's assigned issues

### 3.7 Settings Page (`/settings`)
- Placeholder "Coming Soon" page

## 4. Navigation & Layout

### Sidebar Navigation
- **Main:** Panel (/), Desarrolladores (/developers), Todos los Issues (/issues)
- **Quick Filters:** En Revision, Rechazados, Aprobados (link to /issues with status filter)
- **Footer:** Configuracion (/settings)
- Mobile: slide-in overlay with backdrop

### Header
- Logo ("Dev Threads" with bug icon)
- Global search bar (placeholder, not functional)
- Notification bell (placeholder)
- User info (avatar, name, role)
- Logout button

## 5. API Endpoints Used

| Method | Endpoint | Page |
|--------|----------|------|
| POST | /auth/login/ | Login |
| GET | /auth/me/ | App mount (session restore) |
| POST | /auth/token/refresh/ | Automatic on 401 |
| GET | /issues/ | Dashboard, Issues list |
| GET | /issues/:id/ | Issue detail |
| POST | /issues/ | New Issue modal |
| GET | /issues/:id/timeline/ | Issue detail |
| POST | /issues/:id/timeline/ | Issue detail (add entry) |
| GET | /stats/ | Dashboard, Issues list |
| GET | /stats/developer/:id/ | Developer detail |
| GET | /users/ | Dashboard, Developers, New QA modal |
| GET | /users/:id/ | Developer detail |

## 6. Issue Status Flow

```
open -> in_review -> approved (terminal)
open -> in_review -> rejected -> open (cycle)
open -> tech_debt
in_review -> tech_debt
```

## 7. Issue Priority Levels

| Priority | Color | Label |
|----------|-------|-------|
| critical | Red | Critica |
| high | Orange | Alta |
| medium | Yellow | Media |
| low | Green | Baja |

## 8. Technical Details

- **Authentication:** Custom JWT (not Django SimpleJWT). Access token: 8h, Refresh token: 7d
- **Token storage:** `localStorage` keys: `dev_access_token`, `dev_refresh_token`
- **Auto-refresh:** On 401 response, refresh token is used automatically. On refresh failure, user is logged out
- **Date formatting:** Spanish locale via date-fns
- **Animations:** Framer Motion throughout (page transitions, card entrances, hover effects, confetti)
- **Theme:** Dark theme (#0a0a0f background), glassmorphism, glow effects on hover
- **Responsive:** Mobile sidebar overlay, responsive grids
