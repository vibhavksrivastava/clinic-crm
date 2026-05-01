# Clinic CRM - Project Setup Instructions

This is a full-stack clinic management system built with Next.js, TypeScript, and Tailwind CSS.

## Project Setup Checklist

- [x] Create copilot-instructions.md file
- [x] Scaffold Next.js project with TypeScript, Tailwind, and ESLint
- [x] Customize for clinic CRM features
- [x] Install dependencies
- [x] Create development task
- [ ] Launch development server

## Project Features

### Core Modules
- **Patient Management** - Store patient records, contact info, medical history
- **Appointment Scheduling** - Calendar-based booking, reminders, scheduling
- **Prescription Management** - Create, refill, and track prescriptions
- **Staff Management** - Manage doctors, nurses, receptionists, and roles
- **Invoicing & Billing** - Generate and track patient invoices
- **User Authentication** - Secure login with role-based access control

## Technology Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Linting**: ESLint
- **Package Manager**: npm
- **Runtime**: Node.js 25.9.0+

## Project Structure

```
clinic-crm/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── api/               # API routes
│   ├── appointments/      # Appointment management
│   ├── patients/          # Patient management
│   ├── prescriptions/     # Prescription management
│   ├── staff/             # Staff management
│   └── invoicing/         # Invoice management
├── components/            # Reusable React components
├── lib/                   # Utility functions and helpers
├── public/                # Static assets
├── styles/                # Global styles and Tailwind config
└── README.md             # Documentation
```

## Development

### Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for Production
```bash
npm run build
npm start
```

### Lint Code
```bash
npm run lint
```

## Next Steps

1. Create API routes and database models
2. Build patient management components
3. Implement appointment scheduling system
4. Add prescription management features
5. Set up user authentication and role-based access
6. Create invoicing system
