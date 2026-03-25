# АСУ ОП СГУ

Автоматизированная система учёта отпусков и согласования заявок сотрудников Сочинского государственного университета.

Приложение предназначено для:
- подачи заявок на отпуск;
- согласования заявок заведующим кафедрой и администратором;
- управления расписанием и заменами занятий;
- просмотра календаря отпусков;
- администрирования сотрудников, кафедр и настроек системы.

---

## Tech Stack

### Frontend
- React
- JSX
- React Router
- Zustand
- Tailwind CSS
- Framer Motion
- Headless UI
- React Hot Toast
- React Day Picker
- date-fns
- react-to-print
- Heroicons

### Backend / Data
- Supabase
- PostgreSQL
- Supabase Auth

### Build / Deploy
- Vite
- Vercel

---

## Main Features

### For teachers
- sign in with email and password;
- view dashboard with vacation statistics;
- create a new vacation request;
- view personal requests and their statuses;
- delete pending requests;
- view vacation calendar;
- view schedule;
- work with replacements.

### For heads of department
- view requests of department employees;
- approve or reject requests;
- assign replacements for classes;
- use automatic replacement distribution;
- view department schedule and calendar.

### For administrators
- view all requests;
- final approval or rejection of requests;
- assign order number;
- update used vacation days;
- manage users;
- manage departments;
- manage subjects;
- manage system settings;
- generate weekly schedule.

### Additional features
- print vacation application;
- print order document;
- in-app notifications;
- role-based access;
- adaptive interface.

---

## Project Structure

```bash
src/
├── components/
│   ├── calendar/
│   ├── dev/
│   ├── icons/
│   ├── layout/
│   ├── print/
│   ├── ui/
│   └── vacation/
├── lib/
│   └── supabase.jsx
├── pages/
├── store/
├── App.jsx
├── index.css
└── index.jsx
Frontend
The frontend is implemented in React and located in the src/ directory.

Entry point
src/index.jsx — application startup
src/App.jsx — routing and protected routes
src/index.css — global styles
Pages
src/pages/LoginPage.jsx
src/pages/DashboardPage.jsx
src/pages/MyRequestsPage.jsx
src/pages/NewRequestPage.jsx
src/pages/CalendarPage.jsx
src/pages/SchedulePage.jsx
src/pages/ReplacementsPage.jsx
src/pages/DepartmentRequestsPage.jsx
src/pages/AllRequestsPage.jsx
src/pages/AdminRequestsPage.jsx
src/pages/UsersPage.jsx
src/pages/DepartmentsPage.jsx
src/pages/SettingsPage.jsx
Components
src/components/layout/* — layout components
src/components/ui/* — UI elements
src/components/vacation/* — vacation request components
src/components/calendar/* — calendar
src/components/print/* — printable documents
src/components/icons/* — logo and icons
State management
src/store/authStore.jsx
src/store/vacationStore.jsx
src/store/notificationStore.jsx
Backend
A separate backend server is not used.

The backend is implemented through Supabase, which provides:

PostgreSQL database;
authentication;
API access to tables;
SQL functions and database logic.
Connection layer
src/lib/supabase.jsx
This file contains:

Supabase client initialization;
methods for working with database entities;
access to profiles, departments, requests, schedule, replacements, notifications, and settings.
Database
The project uses the following main tables in Supabase / PostgreSQL:

profiles
departments
subjects
schedule
weekly_schedule
vacation_requests
teacher_replacements
notifications
vacation_settings
overtime_hours (optional / if enabled in DB)
Roles
teacher
Available sections:

Dashboard
My Requests
New Request
Schedule
Replacements
Calendar
head
Available sections:

all teacher sections
Department Requests
admin
Available sections:

Dashboard
All Requests
Users
Departments
Schedule
Calendar
Settings
Routing
Routing is configured in:

src/App.jsx
Protected access is implemented through:

ProtectedRoute
PublicRoute
Access rules
unauthenticated users can open only the login page;
authenticated users are redirected to dashboard;
restricted pages are доступны only for specific roles.
UI and Styling
Styling is implemented using Tailwind CSS.

Global styles and utility classes are located in:

src/index.css
Additional configuration:

tailwind.config.cjs
Main reusable UI classes:

btn-primary
btn-secondary
btn-success
btn-danger
card
input-field
status-badge
Notifications
Toast notifications are implemented with:

react-hot-toast
Main file:

src/components/ui/Toast.jsx
Application notifications are stored in:

notifications table in Supabase
State management:

src/store/notificationStore.jsx
Printing
The project supports printing:

vacation application
vacation order
Files:

src/components/print/PrintableApplication.jsx
src/components/print/PrintableOrder.jsx
Printing is triggered from:

src/components/vacation/VacationRequestCard.jsx
Auth
Authentication is implemented through Supabase Auth.

Main file:

src/store/authStore.jsx
Features:

session initialization;
sign in;
sign out;
profile loading;
session persistence;
auth state subscription.
Available Scripts
In the project directory, you can run:

npm install
Installs all project dependencies.

npm run dev
Runs the app in development mode.

Open:

Bash

http://localhost:3000
npm run build
Builds the app for production to the build folder.

npm run preview
Runs a local preview of the production build.

Environment Variables
Create a .env file in the project root and add:

env

VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
Example:

env

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_public_anon_key
Getting Started
1. Clone the repository
Bash

git clone <repository_url>
cd <project_folder>
2. Install dependencies
Bash

npm install
3. Configure environment variables
Create a .env file and set:

env

VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
4. Start development server
Bash

npm run dev
Build
To build the project for production:

Bash

npm run build
Build output directory:

Bash

build/
Deploy
The project is prepared for deployment on Vercel.

Configuration files:

vercel.json
vite.config.js
Main deployment settings
framework: Vite
build command: npm run build
output directory: build
Config Files
vite.config.js
Contains:

React plugin;
dev server settings;
build output configuration;
alias configuration.
tailwind.config.cjs
Contains:

Tailwind content paths;
custom SGU color palette;
fonts.
vercel.json
Contains:

build settings;
rewrite rules for SPA;
response headers.
Development Notes
The project includes a development-only quick login component:

src/components/dev/QuickLogin.jsx
It is intended for testing and should be removed or disabled before production deployment.

Author
Course project for the discipline:

Programming and Web Application Development

Project topic:

Development of a web application for automation of vacation accounting and approval for employees of Sochi State University
