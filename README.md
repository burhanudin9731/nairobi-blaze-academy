# Nairobi Blaze Academy

Nairobi Blaze Academy is a football academy and youth development platform designed to promote player growth, community engagement, and streamlined player registration for youth football programmes in Nairobi, Kenya.

This repository contains the project website, the academy registration experience, and the admin management layer used to manage registration status, settings, and player records.

## Overview

The project includes:

- a landing page for Nairobi Blaze Academy and Club
- information about player development pathways and age groups
- a registration workflow for prospective players and guardians
- an admin dashboard for managing site settings and registrations
- a lightweight SQLite-backed backend for persistence
- a separate Next.js app under `nairobi-blaze/` for frontend experimentation and app-based development

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js + Express
- Database: SQLite (`node:sqlite`)
- Authentication: JWT + bcrypt
- Additional app: Next.js in `nairobi-blaze/`

## Project Structure

```text
.
├── assets/
│   ├── css/
│   ├── images/
│   └── js/
├── data/
│   └── site.db
├── nairobi-blaze/
│   ├── app/
│   ├── public/
│   ├── package.json
│   └── README.md
├── admin.html
├── index.html
├── package.json
├── server.js
├── .gitignore
└── README.md
```

## Features

- Academy branding and football club presentation
- Registration form for youth players and guardians
- Player details storage in SQLite
- Admin authentication with secure password hashing
- Management of academy settings such as registration status and fees
- Simple API endpoints for registration and admin workflows

## Getting Started

### Prerequisites

- Node.js 22 or newer
- npm

### Install dependencies

```bash
npm install
```

### Run the project locally

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

The application serves the main academy site and API routes from the root project.

## Admin Access

The default admin credentials are:

```text
Username: admin
Password: admin123
```

These are local-development defaults only. Production deployments should set
`ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `JWT_SECRET` as environment variables.
The server refuses to start in production if any are missing.

Configure them with:

```bash
ADMIN_USERNAME=your_username
ADMIN_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
PORT=3000
```

## API Endpoints

The backend exposes the following routes:

- `GET /api/site-status`
- `POST /api/register`
- `POST /api/admin/login`
- `GET /api/admin/registrations`
- `GET /api/admin/settings`
- `PUT /api/admin/settings`

## Next.js Sub-App

A separate Next.js project is included under `nairobi-blaze/`.

To run it independently:

```bash
cd nairobi-blaze
npm install
npm run dev
```

It is intended for app-based frontend work while the root project remains the main production-facing site and API backend.

## Deployment Notes

The GitHub Pages workflow publishes the public static website from the `main`
branch. In the repository settings, set **Pages** > **Build and deployment** >
**Source** to **GitHub Actions**. The Pages URL appears in the workflow's deploy
summary after it succeeds.

GitHub Pages serves only static files. The public preview hides the admin link
and disables registration because the Express API is not hosted there. For the
admin dashboard and registration API, deploy the Render Blueprint in
`render.yaml`: connect the repository in the Render dashboard and create a new
Blueprint. This provisions a Starter web service with a persistent disk. Render
generates the admin password and JWT secret; find the password in the service's
Environment settings. A fresh deployment opens registration by default.

Admins sign in at `/admin` on the Render service URL. Submitted players appear
in the dashboard's **Registrations** section. Use **Website Settings** to close
or reopen registration. The database is stored on the mounted persistent disk,
not in the Git repository; never commit `data/site.db` because it can contain
player and guardian information.

As a form-only alternative, deploy this repository to Netlify. The Netlify build
publishes the homepage and enables native Netlify Forms submissions; review
entries in the site's **Forms** dashboard. This alternative does not include the
custom `/admin` dashboard or its settings API.

## License

This project is for educational and project-development use. Add a license file if you plan to distribute it publicly or commercially.

## Contributing

Contributions are welcome. If you plan to extend the academy platform, registration flow, or admin features, please create a feature branch and keep the code organized and documented.
