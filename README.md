# Test Management System

A comprehensive test management tool built with Next.js, TypeScript, Prisma, and PostgreSQL.

## Features

- **Test Case Management**: Create, organize, and manage test cases with folders, tags, priorities, and statuses
- **Test Planning**: Organize test cases into test plans with dates and status tracking
- **Test Cycles**: Create execution cycles from test plans
- **Test Execution**: Execute tests and record results (Pass/Fail/Blocked/Skipped)
- **Reporting & Analytics**: View test execution statistics, pass rates, and export reports
- **User Management**: Role-based access control (Admin, Tester, Viewer)
- **Authentication**: Secure authentication with NextAuth.js

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript
- **UI**: Tailwind CSS, shadcn/ui components
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Tureet
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Update `.env` with your database URL and NextAuth secret:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/testmanagement?schema=public"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

4. Set up the database:
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed the database (optional)
npm run prisma:seed
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Credentials

After seeding the database, you can log in with:
- **Admin**: admin@testapp.com / admin123
- **Tester**: tester@testapp.com / admin123

## Project Structure

```
/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Database seed script
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── auth/          # Authentication pages
│   │   ├── test-cases/    # Test cases page
│   │   ├── test-plans/    # Test plans page
│   │   ├── test-cycles/   # Test cycles page
│   │   ├── test-runs/     # Test runs/execution page
│   │   ├── reports/       # Reports page
│   │   └── layout.tsx     # Root layout
│   ├── components/
│   │   ├── ui/            # UI components (shadcn/ui)
│   │   ├── navigation.tsx # Navigation component
│   │   └── providers.tsx  # React providers
│   └── lib/
│       ├── auth.ts        # NextAuth configuration
│       ├── prisma.ts      # Prisma client
│       ├── permissions.ts # Permission helpers
│       └── utils.ts       # Utility functions
└── public/                # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed the database

## Database Schema

The application uses the following main entities:
- **User**: Authentication and user management
- **Folder**: Hierarchical organization of test cases
- **TestCase**: Test cases with steps, expected results, status, priority, type, and tags
- **TestPlan**: Test plans that group test cases
- **TestCycle**: Execution cycles created from test plans
- **TestRun**: Individual test executions with results

## Features in Detail

### Test Cases
- Create, edit, and delete test cases
- Organize with folders and tags
- Set priority (Low, Medium, High, Critical)
- Define test type (Functional, Regression, Integration, etc.)
- Track status (Draft, Active, Obsolete)
- Search and filter test cases

### Test Plans
- Create test plans with start/end dates
- Add test cases to plans
- Track plan status (Draft, Active, Completed, Cancelled)
- View test case count and cycle count

### Test Cycles
- Create cycles from test plans
- Set cycle dates and status
- Link to parent test plan
- Track test runs in cycle

### Test Execution
- Execute test cases within cycles
- Record results (Passed, Failed, Blocked, Skipped)
- Add notes and actual results
- Link to bug tracking systems
- Track executor and execution time

### Reporting
- Dashboard with overview statistics
- Test execution trends
- Pass rate calculations
- Export reports to CSV

## License

MIT
