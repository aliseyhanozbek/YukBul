# 🚚 Yük Bul - Cargo Transportation Platform

A modern, full-stack cargo transportation platform that connects customers, drivers, and companies. Built with React, TypeScript, and Supabase (Backend-as-a-Service).

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Deployment](#deployment)

## 🎯 Overview

Yük Bul is a comprehensive cargo transportation platform that enables:
- **Customers** to find and book cargo transportation services
- **Drivers** to create listings and manage their shipments
- **Companies** to manage fleets and track operations

The platform features real-time messaging, shipment tracking, location sharing, and comprehensive statistics dashboards.

## ✨ Features

### For Customers
- Browse available cargo listings
- Real-time messaging with drivers
- Track active shipments
- View shipment history
- Rate and review drivers

### For Drivers
- Create and manage cargo listings
- Receive and manage orders
- Real-time location sharing
- Statistics and analytics dashboard
- Profile management

### For Companies
- Company profile management
- Driver fleet management
- Company-wide statistics
- Interactive map view
- Operational insights

## 🛠 Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - UI component library
- **Leaflet** - Interactive maps
- **Recharts** - Data visualization

### Backend & Infrastructure
- **Supabase** - Backend-as-a-Service (BaaS)
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions
  - Row Level Security (RLS)

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **TypeScript** - Static type checking

## 🏗 Architecture

This project follows a **modern frontend architecture** with **Backend-as-a-Service** pattern:

```
┌─────────────────────────────────────────┐
│         Frontend (React + Vite)         │
│  ┌──────────┐  ┌──────────┐           │
│  │  Pages   │  │Components│           │
│  └──────────┘  └──────────┘           │
│  ┌──────────┐  ┌──────────┐           │
│  │ Contexts │  │  Hooks   │           │
│  └──────────┘  └──────────┘           │
│  ┌──────────────────────────┐          │
│  │   Supabase Client (SDK)  │          │
│  └──────────────────────────┘          │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│      Supabase (Backend-as-a-Service)    │
│  ┌──────────┐  ┌──────────┐           │
│  │PostgreSQL│  │   Auth   │           │
│  │ Database │  │  Service │           │
│  └──────────┘  └──────────┘           │
│  ┌──────────┐  ┌──────────┐           │
│  │  RLS     │  │ Real-time│           │
│  │ Policies │  │  Subscriptions       │
│  └──────────┘  └──────────┘           │
└─────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **BaaS Pattern**: Using Supabase eliminates the need for a separate backend server, reducing complexity and infrastructure costs.
2. **Component-Based Architecture**: Modular React components with clear separation of concerns.
3. **Type Safety**: Full TypeScript implementation for better developer experience and fewer runtime errors.
4. **State Management**: React Context API for global state, TanStack Query for server state.
5. **Routing**: Client-side routing with React Router for SPA experience.

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**
- **Supabase account** and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd school_project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
   
   **Important**: 
   - Do not add quotes around values
   - No trailing spaces
   - File must be named exactly `.env.local`
   - Get your credentials from [Supabase Dashboard](https://app.supabase.com) → Settings → API

4. **Set up the database**
   
   See [Database Setup](#database-setup) section below.

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to `http://localhost:8080`

## 📁 Project Structure

```
school_project/
├── database/
│   ├── schema.sql              # Base database schema
│   └── migrations/             # Database migration scripts
│       ├── 001_uuid_fix.sql
│       ├── 002_increment_views_rpc.sql
│       ├── 003_company_feature.sql
│       └── ...
│       └── README.md           # Migration guide
│
├── public/                     # Static assets
│   ├── favicon.ico
│   └── robots.txt
│
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── ...
│   │
│   ├── contexts/               # React Context providers
│   │   └── AuthContext.tsx
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useUserProfile.ts
│   │   └── ...
│   │
│   ├── lib/                    # Utility libraries
│   │   ├── supabaseClient.ts   # Supabase client configuration
│   │   └── utils.ts            # Helper functions
│   │
│   ├── pages/                   # Page components
│   │   ├── Index.tsx           # Landing page
│   │   ├── Giris.tsx           # Login
│   │   ├── Kayit.tsx           # Registration
│   │   ├── musteri/            # Customer pages
│   │   ├── sofor/              # Driver pages
│   │   └── sirket/             # Company pages
│   │
│   ├── utils/                   # Utility functions
│   │   ├── conversationUtils.ts
│   │   └── storageCleanup.ts
│   │
│   ├── App.tsx                  # Main app component
│   ├── main.tsx                 # Application entry point
│   └── index.css                # Global styles
│
├── .env.local                   # Environment variables (not in git)
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🗄 Database Setup

### Initial Setup

1. **Create Supabase Project**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Create a new project
   - Wait for the project to be fully provisioned

2. **Run Base Schema**
   - Open Supabase SQL Editor
   - Copy and paste contents of `database/schema.sql`
   - Execute the script

3. **Run Migrations**
   - Run migrations in numerical order (001, 002, 003, etc.)
   - See `database/migrations/README.md` for detailed instructions
   - Each migration file should be executed separately

### Migration Order

1. `001_uuid_fix.sql` - Converts user ID columns to UUID
2. `002_increment_views_rpc.sql` - Creates RPC function for views
3. `003_company_feature.sql` - Adds company support
4. `004_add_separate_unread_counts.sql` - Separate unread counts
5. `005_add_price_columns.sql` - Price columns for conversations
6. `006_add_arrival_date.sql` - Arrival date for listings
7. `007_add_approval_columns.sql` - Approval columns for conversations

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |

**Security Note**: Never commit `.env.local` to version control. It's already in `.gitignore`.

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 8080) |
| `npm run build` | Build for production |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## 🚢 Deployment

### Recommended Platforms

- **Vercel** - Recommended for React apps
- **Netlify** - Great for static sites
- **Supabase Hosting** - Integrated with Supabase

### Deployment Steps

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Configure environment variables**
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your hosting platform's environment variables

3. **Deploy**
   - Upload the `dist` folder to your hosting platform
   - Or connect your Git repository for automatic deployments

### Environment Variables in Production

Make sure to set the same environment variables in your hosting platform's dashboard.

## 🤝 Contributing

This is a school project. For contributions, please follow standard Git workflow:
1. Create a feature branch
2. Make your changes
3. Submit a pull request

## 📝 License

This project is part of a school assignment.

## 👤 Author

Developed as part of a school project.

---

**Built with ❤️ using React, TypeScript, and Supabase**
