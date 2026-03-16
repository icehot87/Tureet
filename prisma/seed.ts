import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@testapp.com' },
    update: {},
    create: {
      email: 'admin@testapp.com',
      name: 'Admin User',
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  });

  const tester = await prisma.user.upsert({
    where: { email: 'tester@testapp.com' },
    update: {},
    create: {
      email: 'tester@testapp.com',
      name: 'Test User',
      password: hashedPassword,
      role: UserRole.TESTER,
    },
  });

  console.log('Created users:', { admin, tester });

  // Create sample folders
  const rootFolder = await prisma.folder.create({
    data: {
      name: 'Root',
      description: 'Root folder for test cases',
    },
  });

  const functionalFolder = await prisma.folder.create({
    data: {
      name: 'Functional Tests',
      description: 'Functional test cases',
      parentId: rootFolder.id,
    },
  });

  const regressionFolder = await prisma.folder.create({
    data: {
      name: 'Regression Tests',
      description: 'Regression test cases',
      parentId: rootFolder.id,
    },
  });

  console.log('Created folders');

  // Create sample test cases
  const testCase1 = await prisma.testCase.create({
    data: {
      title: 'User Login Functionality',
      description: 'Verify that users can log in with valid credentials',
      preconditions: 'User account exists and is active',
      steps: JSON.stringify([
        { step: 1, action: 'Navigate to login page', expected: 'Login page is displayed' },
        { step: 2, action: 'Enter valid email and password', expected: 'Credentials are accepted' },
        { step: 3, action: 'Click login button', expected: 'User is redirected to dashboard' },
      ]),
      expectedResults: 'User is successfully logged in and redirected to dashboard',
      status: 'ACTIVE',
      priority: 'HIGH',
      type: 'FUNCTIONAL',
      tags: ['login', 'authentication'],
      folderId: functionalFolder.id,
      createdById: admin.id,
    },
  });

  const testCase2 = await prisma.testCase.create({
    data: {
      title: 'Password Reset Flow',
      description: 'Verify password reset functionality works correctly',
      preconditions: 'User account exists',
      steps: JSON.stringify([
        { step: 1, action: 'Navigate to password reset page', expected: 'Password reset form is displayed' },
        { step: 2, action: 'Enter registered email address', expected: 'Email is accepted' },
        { step: 3, action: 'Submit reset request', expected: 'Confirmation message is shown' },
      ]),
      expectedResults: 'Password reset email is sent to user',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      type: 'FUNCTIONAL',
      tags: ['password', 'reset'],
      folderId: functionalFolder.id,
      createdById: admin.id,
    },
  });

  console.log('Created test cases');

  // Create a sample test plan
  const testPlan = await prisma.testPlan.create({
    data: {
      name: 'Q1 2024 Release Test Plan',
      description: 'Test plan for Q1 2024 release',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-03-31'),
      status: 'DRAFT',
      ownerId: admin.id,
      testCases: {
        create: [
          { testCaseId: testCase1.id, order: 1 },
          { testCaseId: testCase2.id, order: 2 },
        ],
      },
    },
  });

  console.log('Created test plan');

  // Create a test cycle
  const testCycle = await prisma.testCycle.create({
    data: {
      name: 'Sprint 1 Test Cycle',
      description: 'First sprint testing cycle',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-15'),
      status: 'NOT_STARTED',
      testPlanId: testPlan.id,
    },
  });

  console.log('Created test cycle');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
