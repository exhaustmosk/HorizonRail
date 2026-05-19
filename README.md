# 🌌 HorizonRail

> **Aligning Enterprise Performance, One Check-in at a Time.**

HorizonRail is a next-generation Enterprise Performance Management (EPM) platform designed to eliminate the friction of annual reviews. It replaces them with a dynamic, transparent, and automated continuous check-in framework. Built for our hackathon pitch, HorizonRail bridges the gap between individual goals and high-level organizational thrust areas.

---

## ✨ Key Features & Hackathon Highlights

### 1. Dynamic Organization Hierarchy & "Neuron" Graph
- **Interactive Visualization:** The **Analysis** tab features a stunning, interactive physics-based "Neuron Graph" that visualizes the entire organizational structure. 
- **Role-Based Views:** Admins see the entire company, Managers see their sub-teams, and Individual Contributors see their personal sphere of influence.
- **Automated Routing:** Join requests and goal approvals route automatically up the correct chain of command.

### 2. The Escalation Engine (Automated Workflows)
Managers are busy. HorizonRail watches your back.
- **Configurable Policies:** Admins can define custom rules (e.g., *"If goals are unapproved for 3 days, escalate to HR"*).
- **Auto-Routing:** The engine constantly evaluates employee compliance against the active check-in cycle.
- **Hackathon Demo Mode:** We built a "Run Engine" button in the Admin Panel so judges can watch escalations trigger and route in real-time!

### 3. Microsoft Entra ID (Azure AD) Integration
Seamless enterprise onboarding out-of-the-box.
- **Single Sign-On (SSO):** Users authenticate seamlessly via Microsoft.
- **Auto-Hierarchy Sync:** Upon login, HorizonRail fetches the user's group memberships and reporting lines from the Microsoft Graph API, instantly placing them under the correct manager and bypassing manual onboarding entirely.

### 4. Advanced Analytics & Insights
Data that actually helps you make decisions.
- **Goal Distributions:** Synchronized donut charts breaking down goals by Strategic Thrust Area, Measurement Type, and Current Status.
- **QoQ Performance Trends:** Track goal achievement scores over time, with interactive toggles to aggregate data by Individual, Team, or Department.
- **Leadership Effectiveness:** A dedicated dashboard (hidden from standard employees) that ranks Managers by their team's check-in completion rates.

### 5. Multi-Channel Notifications
Meet your employees where they already work.
- **Email:** Automated transactional emails via Resend.
- **Microsoft Teams:** Adaptive Card notifications delivered directly to Teams channels via Incoming Webhooks, complete with deep links back to the specific goal sheet in HorizonRail.

---

## 🛠 Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Styling:** Tailwind CSS, Framer Motion (Glassmorphism & Neon Aesthetics)
- **Data Visualization:** Recharts, Canvas API (Custom Physics Engine)
- **Backend/Database:** Supabase (PostgreSQL, Row Level Security, Edge Functions)
- **State Management:** Zustand
- **Routing:** React Router DOM

---

## 🚀 Getting Started (Local Development)

### Prerequisites
1. Node.js (v18+)
2. A Supabase project (for the database and Auth)

### Setup

1. **Clone the repository & install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Database Setup:**
   Run the SQL commands found in `supabase.sql` in your Supabase SQL Editor to generate the tables, RLS policies, and triggers.

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`.

---

## 🎭 Hackathon Demo Guide

When presenting to the judges, follow this flow to show off the platform's power:

1. **The Entra ID Magic:** Start at the Login page. Click **"Sign in with Microsoft"**. Explain how the simulated Graph API sync completely bypasses onboarding and drops the user directly into their pre-configured dashboard.
2. **The Neuron Graph:** Navigate to the `Analysis` tab and interact with the physics graph to show how the organization is mapped.
3. **Analytics:** Scroll down on the `Analysis` page to show off the strict, corporate-themed Recharts dashboards (QoQ Trends, Manager Effectiveness). Toggle the aggregations to show interactivity.
4. **The Escalation Engine:** Log in as an Admin, go to the **Admin Panel -> Escalations**. Create a rule, hit **"Run Engine"**, and watch the uncompliant employees populate the Escalation Inbox in real-time.

---
*Built with ❤️ for the Hackathon.*
