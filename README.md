# Matrix Flow Dashboard

A modern, interactive dashboard for visualizing critical data flows and data quality metrics for the Matrix project. Built with React 18, Vite, Mermaid.js, and Tailwind CSS.

![Matrix Flow Dashboard](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5+-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3+-06B6D4?logo=tailwindcss&logoColor=white)

## Features

- **Interactive Flow Diagrams** - Visualize complex data pipelines with Mermaid.js
- **PNG Export** - Download flow diagrams as PNG images
- **7 Critical Flows Documented**:
  - Attribution Flow (Marketing)
  - Offline Conversions Flow (Marketing)
  - Company Funnel Flow (CRM)
  - Payments Processing Flow (Payments)
  - **HubSpot Push Flow** (CRM) - Matrix → HubSpot data sync
  - **HubSpot Pull Flow** (CRM) - HubSpot → Matrix webhook processing
  - **HubSpot Scheduled Jobs Flow** (CRM) - Periodic sync and monitoring jobs
- **Data Quality Dashboard** - Track validation gaps across all flows with P0/P1/P2 priority levels
- **Responsive Design** - Works on desktop and mobile devices
- **Modern UI** - Clean, professional interface with Tailwind CSS

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher recommended)
- **npm** (v9 or higher) or **yarn**

You can verify your installations with:

```bash
node --version
npm --version
```

## Installation

1. **Clone the repository** (if you haven't already):

   ```bash
   git clone <repository-url>
   cd diagrams/flow-dashboard
   ```

2. **Navigate to the project directory**:

   ```bash
   cd /Users/ferasghanim/PycharmProjects/diagrams/flow-dashboard
   ```

3. **Install dependencies**:

   ```bash
   npm install
   ```

   This will install all required packages including:
   - React 18
   - React Router v6
   - Mermaid.js
   - Tailwind CSS
   - Lucide React (icons)

## Running the Application

### Development Mode

Start the development server with hot module replacement (HMR):

```bash
npm run dev
```

The application will be available at:
- **http://localhost:5173** (default port)

If port 5173 is in use, Vite will automatically try the next available port (5174, 5175, etc.), or you can specify a custom port:

```bash
npm run dev -- --port 5180
```

### Production Build

Build the application for production:

```bash
npm run build
```

The build output will be in the `dist/` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

## Project Structure

```
flow-dashboard/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout.jsx       # Main layout with sidebar
│   │   ├── Sidebar.jsx      # Navigation sidebar (with collapsible HubSpot menu)
│   │   ├── FlowDiagram.jsx  # Mermaid diagram renderer (with PNG export)
│   │   ├── MetricCard.jsx   # Metric display cards
│   │   ├── PriorityBadge.jsx # P0/P1/P2 badges
│   │   └── WorkerCard.jsx   # Worker info cards
│   ├── pages/               # Route pages
│   │   ├── Dashboard.jsx    # Overview dashboard
│   │   ├── AttributionFlow.jsx
│   │   ├── OfflineConversions.jsx
│   │   ├── CompanyFunnel.jsx
│   │   ├── PaymentsFlow.jsx
│   │   ├── HubspotPushFlow.jsx    # HubSpot Push Flow (Matrix → HubSpot)
│   │   ├── HubspotPullFlow.jsx    # HubSpot Pull Flow (HubSpot → Matrix)
│   │   ├── HubspotScheduledFlow.jsx # HubSpot Scheduled Jobs
│   │   └── DataQuality.jsx  # Quality metrics dashboard
│   ├── data/
│   │   └── flows/           # Flow data definitions
│   │       ├── attribution.js
│   │       ├── offline.js
│   │       ├── company.js
│   │       ├── payments.js
│   │       └── hubspot.js   # HubSpot Integration (Push, Pull, Scheduled)
│   ├── App.jsx              # Router configuration
│   ├── main.jsx             # React entry point
│   └── index.css            # Tailwind CSS imports
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## Available Routes

| Route | Description |
|-------|-------------|
| `/` | Dashboard overview with all flows |
| `/attribution` | Attribution Flow details |
| `/offline-conversions` | Offline Conversions Flow details |
| `/company-funnel` | Company Funnel Flow details |
| `/payments` | Payments Processing Flow details |
| `/hubspot/push` | HubSpot Push Flow (Matrix → HubSpot) |
| `/hubspot/pull` | HubSpot Pull Flow (HubSpot → Matrix webhooks) |
| `/hubspot/scheduled` | HubSpot Scheduled Jobs (crons, backfill, monitoring) |
| `/data-quality` | Data Quality metrics dashboard |

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **React Router v6** - Client-side routing
- **Mermaid.js** - Flow diagram rendering
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library

## Troubleshooting

### Port Already in Use

If you see "Port 5173 is in use", either:
1. Kill the process using the port: `lsof -ti :5173 | xargs kill -9`
2. Use a different port: `npm run dev -- --port 5180`

### Mermaid Diagrams Not Rendering

Clear Vite's cache and restart:

```bash
rm -rf node_modules/.vite
npm run dev
```

### Dependency Issues

If you encounter module resolution errors:

```bash
rm -rf node_modules package-lock.json
npm install
```

## License

Internal project - Matrix Team
