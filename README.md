# SPIDEYVERSE — Frontend

> A web of connected agents for modern business execution.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

The app redirects to `/app/dashboard` by default.  
Auth screens are at `/auth/sign-in`, `/auth/sign-up`, `/auth/onboarding`.

---

## Project Structure

```
spideyverse/
├── app/
│   ├── layout.tsx               # Root layout (fonts, globals)
│   ├── page.tsx                 # Root redirect → /app/dashboard
│   ├── globals.css              # Design tokens, global styles
│   │
│   ├── auth/                    # Auth screens (no sidebar)
│   │   ├── layout.tsx           # Auth shell (split-panel)
│   │   ├── sign-in/page.tsx
│   │   ├── sign-up/page.tsx
│   │   └── onboarding/page.tsx
│   │
│   └── app/                     # Authenticated app
│       ├── layout.tsx           # App shell (Sidebar + main)
│       ├── dashboard/page.tsx
│       ├── campaigns/
│       │   ├── page.tsx         # Campaign list
│       │   ├── create/page.tsx  # Create campaign (5-step)
│       │   └── detail/page.tsx  # Campaign detail
│       ├── leads/page.tsx       # Leads + detail panel
│       ├── outreach/page.tsx    # Outreach review + editor
│       ├── agents/page.tsx      # Agent-Net overview
│       ├── reports/page.tsx     # Reports + detail
│       ├── settings/page.tsx    # Settings tabs
│       └── admin/page.tsx       # Admin control center
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx          # Persistent left nav
│   │   └── TopBar.tsx           # Per-page top bar
│   └── app/
│       ├── StatusBadge.tsx      # Unified badge system
│       ├── KPICard.tsx          # Metric cards
│       ├── WorkflowStepper.tsx  # 4-stage pipeline stepper
│       ├── AgentCard.tsx        # Agent status card
│       ├── ActivityTimeline.tsx # Event feed
│       └── EmptyState.tsx       # Empty state component
│
├── lib/
│   ├── types.ts                 # All TypeScript types
│   ├── mock-data.ts             # Seeded mock data
│   └── utils.ts                 # Formatters, status configs
│
├── tailwind.config.ts           # Design tokens
└── app/globals.css              # Global CSS + animations
```

---

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** (custom design tokens)
- **lucide-react** icons
- **Poppins** + **Inter** + **Manrope** (Google Fonts)

---

## Design System

### Colors
| Token | Value | Usage |
|---|---|---|
| Background | `#0A0F1C` | Page bg |
| Surface | `#121A2B` | Cards, panels |
| Sidebar | `#0D1525` | Sidebar/topbar bg |
| Accent Blue | `#3B82F6` | Primary actions |
| Accent Violet | `#8B5CF6` | Secondary/draft status |
| Text Primary | `#E5ECF6` | Main content |
| Text Secondary | `#94A3B8` | Descriptions, labels |
| Text Muted | `#64748B` | Hints, timestamps |

### Status Colors
| Status | Color |
|---|---|
| Running | `#3B82F6` (blue) |
| Needs Review | `#F59E0B` (amber) |
| Completed | `#10B981` (emerald) |
| Failed | `#EF4444` (red) |
| Draft | `#8B5CF6` (violet) |
| Idle/Pending | `#64748B` (slate) |

### Typography
- Headings: **Poppins** (600–700)
- Body/UI: **Inter** (400–500)
- Labels/Meta: **Manrope** (400–600)

---

## Screens

| Route | Screen |
|---|---|
| `/auth/sign-in` | Sign In |
| `/auth/sign-up` | Sign Up |
| `/auth/onboarding` | Workspace Setup |
| `/app/dashboard` | Main Dashboard |
| `/app/campaigns` | Campaign List |
| `/app/campaigns/create` | Create Campaign (5-step) |
| `/app/campaigns/detail` | Campaign Detail |
| `/app/leads` | Leads + Detail Panel |
| `/app/outreach` | Outreach Review |
| `/app/agents` | Agent-Net Overview |
| `/app/reports` | Reports |
| `/app/settings` | Settings |
| `/app/admin` | Admin Dashboard |
