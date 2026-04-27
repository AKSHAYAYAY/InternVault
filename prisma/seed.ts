import { PrismaClient, Role, Department, BatchMemberRole, IdeaStatus, ProjectStatus } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const password = await bcrypt.hash('Admin@1234', 10)

  // ─── Super Admin ───────────────────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@municipal.gov' },
    update: {},
    create: {
      email: 'superadmin@municipal.gov',
      name: 'Super Admin',
      password,
      role: Role.SUPER_ADMIN,
    },
  })

  // ─── Helper to create or fetch a user ─────────────────────────
  async function upsertUser(email: string, name: string, dept: Department, role: Role = Role.INTERN) {
    return prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name, password, role, department: dept },
    })
  }

  // ─── Helper to create batch ────────────────────────────────────
  async function createBatch(
    dept: Department,
    batchNumber: number,
    isActive: boolean,
    startDate: Date,
    endDate?: Date
  ) {
    return prisma.batch.upsert({
      where: { batchNumber_department: { batchNumber, department: dept } },
      update: {},
      create: {
        name: `${dept} Batch ${batchNumber}`,
        batchNumber,
        department: dept,
        isActive,
        startDate,
        endDate: endDate ?? null,
        createdById: superAdmin.id,
      },
    })
  }

  // ─── IT Department ─────────────────────────────────────────────
  // IT Batch 1 — CLOSED
  const coordItB1 = await upsertUser('coordinator.it.b1@municipal.gov', 'IT Coordinator B1', Department.IT, Role.COORDINATOR)
  const internItB1_1 = await upsertUser('intern.it.b1.1@municipal.gov', 'IT Intern B1-1', Department.IT)
  const internItB1_2 = await upsertUser('intern.it.b1.2@municipal.gov', 'IT Intern B1-2', Department.IT)
  const internItB1_3 = await upsertUser('intern.it.b1.3@municipal.gov', 'IT Intern B1-3', Department.IT)

  const itB1 = await createBatch(Department.IT, 1, false,
    new Date('2023-06-01'), new Date('2023-12-31'))

  await prisma.batchMember.createMany({
    data: [
      { batchId: itB1.id, userId: coordItB1.id, batchRole: BatchMemberRole.COORDINATOR },
      { batchId: itB1.id, userId: internItB1_1.id, batchRole: BatchMemberRole.INTERN },
      { batchId: itB1.id, userId: internItB1_2.id, batchRole: BatchMemberRole.INTERN },
      { batchId: itB1.id, userId: internItB1_3.id, batchRole: BatchMemberRole.INTERN },
    ],
    skipDuplicates: true,
  })

  // IT Batch 2 — CLOSED
  const coordItB2 = await upsertUser('coordinator.it.b2@municipal.gov', 'IT Coordinator B2', Department.IT, Role.COORDINATOR)
  const internItB2_1 = await upsertUser('intern.it.b2.1@municipal.gov', 'IT Intern B2-1', Department.IT)
  const internItB2_2 = await upsertUser('intern.it.b2.2@municipal.gov', 'IT Intern B2-2', Department.IT)
  const internItB2_3 = await upsertUser('intern.it.b2.3@municipal.gov', 'IT Intern B2-3', Department.IT)

  const itB2 = await createBatch(Department.IT, 2, false,
    new Date('2024-01-01'), new Date('2024-06-30'))

  await prisma.batchMember.createMany({
    data: [
      { batchId: itB2.id, userId: coordItB2.id, batchRole: BatchMemberRole.COORDINATOR },
      { batchId: itB2.id, userId: internItB2_1.id, batchRole: BatchMemberRole.INTERN },
      { batchId: itB2.id, userId: internItB2_2.id, batchRole: BatchMemberRole.INTERN },
      { batchId: itB2.id, userId: internItB2_3.id, batchRole: BatchMemberRole.INTERN },
    ],
    skipDuplicates: true,
  })

  // IT Batch 3 — ACTIVE
  const coordItB3 = await upsertUser('coordinator.it.b3@municipal.gov', 'IT Coordinator B3', Department.IT, Role.COORDINATOR)
  const internItB3_1 = await upsertUser('intern.it.b3.1@municipal.gov', 'IT Intern B3-1', Department.IT)
  const internItB3_2 = await upsertUser('intern.it.b3.2@municipal.gov', 'IT Intern B3-2', Department.IT)
  const internItB3_3 = await upsertUser('intern.it.b3.3@municipal.gov', 'IT Intern B3-3', Department.IT)
  const internItB3_4 = await upsertUser('intern.it.b3.4@municipal.gov', 'IT Intern B3-4', Department.IT)

  const itB3 = await createBatch(Department.IT, 3, true, new Date('2024-07-01'))

  await prisma.batchMember.createMany({
    data: [
      { batchId: itB3.id, userId: coordItB3.id, batchRole: BatchMemberRole.COORDINATOR },
      { batchId: itB3.id, userId: internItB3_1.id, batchRole: BatchMemberRole.INTERN },
      { batchId: itB3.id, userId: internItB3_2.id, batchRole: BatchMemberRole.INTERN },
      { batchId: itB3.id, userId: internItB3_3.id, batchRole: BatchMemberRole.INTERN },
      { batchId: itB3.id, userId: internItB3_4.id, batchRole: BatchMemberRole.INTERN },
    ],
    skipDuplicates: true,
  })

  // ─── REVENUE Department ────────────────────────────────────────
  // REVENUE Batch 1 — CLOSED
  const coordRevB1 = await upsertUser('coordinator.rev.b1@municipal.gov', 'REVENUE Coordinator B1', Department.REVENUE, Role.COORDINATOR)
  const internRevB1_1 = await upsertUser('intern.rev.b1.1@municipal.gov', 'REVENUE Intern B1-1', Department.REVENUE)
  const internRevB1_2 = await upsertUser('intern.rev.b1.2@municipal.gov', 'REVENUE Intern B1-2', Department.REVENUE)

  const revB1 = await createBatch(Department.REVENUE, 1, false,
    new Date('2023-06-01'), new Date('2024-01-31'))

  await prisma.batchMember.createMany({
    data: [
      { batchId: revB1.id, userId: coordRevB1.id, batchRole: BatchMemberRole.COORDINATOR },
      { batchId: revB1.id, userId: internRevB1_1.id, batchRole: BatchMemberRole.INTERN },
      { batchId: revB1.id, userId: internRevB1_2.id, batchRole: BatchMemberRole.INTERN },
    ],
    skipDuplicates: true,
  })

  // REVENUE Batch 2 — ACTIVE
  const coordRevB2 = await upsertUser('coordinator.rev.b2@municipal.gov', 'REVENUE Coordinator B2', Department.REVENUE, Role.COORDINATOR)
  const internRevB2_1 = await upsertUser('intern.rev.b2.1@municipal.gov', 'REVENUE Intern B2-1', Department.REVENUE)
  const internRevB2_2 = await upsertUser('intern.rev.b2.2@municipal.gov', 'REVENUE Intern B2-2', Department.REVENUE)

  const revB2 = await createBatch(Department.REVENUE, 2, true, new Date('2024-02-01'))

  await prisma.batchMember.createMany({
    data: [
      { batchId: revB2.id, userId: coordRevB2.id, batchRole: BatchMemberRole.COORDINATOR },
      { batchId: revB2.id, userId: internRevB2_1.id, batchRole: BatchMemberRole.INTERN },
      { batchId: revB2.id, userId: internRevB2_2.id, batchRole: BatchMemberRole.INTERN },
    ],
    skipDuplicates: true,
  })

  // ─── LAWS Department ──────────────────────────────────────────
  const coordLawsB1 = await upsertUser('coordinator.laws.b1@municipal.gov', 'LAWS Coordinator B1', Department.LAWS, Role.COORDINATOR)
  const internLawsB1_1 = await upsertUser('intern.laws.b1.1@municipal.gov', 'LAWS Intern B1-1', Department.LAWS)
  const internLawsB1_2 = await upsertUser('intern.laws.b1.2@municipal.gov', 'LAWS Intern B1-2', Department.LAWS)

  const lawsB1 = await createBatch(Department.LAWS, 1, true, new Date('2024-03-01'))

  await prisma.batchMember.createMany({
    data: [
      { batchId: lawsB1.id, userId: coordLawsB1.id, batchRole: BatchMemberRole.COORDINATOR },
      { batchId: lawsB1.id, userId: internLawsB1_1.id, batchRole: BatchMemberRole.INTERN },
      { batchId: lawsB1.id, userId: internLawsB1_2.id, batchRole: BatchMemberRole.INTERN },
    ],
    skipDuplicates: true,
  })

  // ─── AICSTL Department ────────────────────────────────────────
  const coordAicstlB1 = await upsertUser('coordinator.aicstl.b1@municipal.gov', 'AICSTL Coordinator B1', Department.AICSTL, Role.COORDINATOR)
  const internAicstlB1_1 = await upsertUser('intern.aicstl.b1.1@municipal.gov', 'AICSTL Intern B1-1', Department.AICSTL)
  const internAicstlB1_2 = await upsertUser('intern.aicstl.b1.2@municipal.gov', 'AICSTL Intern B1-2', Department.AICSTL)

  const aicstlB1 = await createBatch(Department.AICSTL, 1, true, new Date('2024-04-01'))

  await prisma.batchMember.createMany({
    data: [
      { batchId: aicstlB1.id, userId: coordAicstlB1.id, batchRole: BatchMemberRole.COORDINATOR },
      { batchId: aicstlB1.id, userId: internAicstlB1_1.id, batchRole: BatchMemberRole.INTERN },
      { batchId: aicstlB1.id, userId: internAicstlB1_2.id, batchRole: BatchMemberRole.INTERN },
    ],
    skipDuplicates: true,
  })

  // ─── Projects (IT only) ───────────────────────────────────────
  const grievancePortal = await prisma.project.create({
    data: {
      name: 'Grievance Portal',
      description: 'Online portal for citizen grievance submission and tracking.',
      department: Department.IT,
      status: ProjectStatus.COMPLETED,
      startedInBatch: 1,
      continuedInBatches: [2, 3],
      batchId: itB1.id,
      techStack: ['Next.js', 'PostgreSQL', 'Prisma'],
      tags: ['web', 'citizen-services'],
      createdById: coordItB1.id,
    },
  })

  const assetTracker = await prisma.project.create({
    data: {
      name: 'Asset Tracker',
      description: 'Digital inventory management for municipal assets.',
      department: Department.IT,
      status: ProjectStatus.COMPLETED,
      startedInBatch: 1,
      continuedInBatches: [],
      batchId: itB1.id,
      techStack: ['React', 'Node.js', 'MongoDB'],
      tags: ['inventory', 'asset-management'],
      createdById: coordItB1.id,
    },
  })

  const grievancePortalV2 = await prisma.project.create({
    data: {
      name: 'Grievance Portal v2',
      description: 'Enhanced version of the Grievance Portal with AI-based routing.',
      department: Department.IT,
      status: ProjectStatus.COMPLETED,
      startedInBatch: 1,
      continuedInBatches: [2, 3],
      batchId: itB2.id,
      techStack: ['Next.js', 'AI/ML', 'PostgreSQL'],
      tags: ['web', 'ai', 'citizen-services'],
      createdById: coordItB2.id,
    },
  })

  const budgetDashboard = await prisma.project.create({
    data: {
      name: 'Budget Dashboard',
      description: 'Real-time municipal budget tracking and visualization dashboard.',
      department: Department.IT,
      status: ProjectStatus.IN_PROGRESS,
      startedInBatch: 2,
      continuedInBatches: [],
      batchId: itB2.id,
      techStack: ['React', 'D3.js', 'Express'],
      tags: ['dashboard', 'finance'],
      createdById: coordItB2.id,
    },
  })

  const smartAttendance = await prisma.project.create({
    data: {
      name: 'Smart Attendance',
      description: 'Biometric-integrated attendance system for municipal employees.',
      department: Department.IT,
      status: ProjectStatus.IDEA,
      startedInBatch: 3,
      continuedInBatches: [],
      batchId: itB3.id,
      techStack: ['Python', 'OpenCV', 'FastAPI'],
      tags: ['biometric', 'hr'],
      createdById: coordItB3.id,
    },
  })

  // Add members to projects
  await prisma.projectMember.createMany({
    data: [
      { projectId: grievancePortal.id, userId: internItB1_1.id },
      { projectId: grievancePortal.id, userId: internItB1_2.id },
      { projectId: assetTracker.id, userId: internItB1_3.id },
      { projectId: grievancePortalV2.id, userId: internItB2_1.id },
      { projectId: grievancePortalV2.id, userId: internItB2_2.id },
      { projectId: budgetDashboard.id, userId: internItB2_3.id },
      { projectId: smartAttendance.id, userId: internItB3_1.id },
      { projectId: smartAttendance.id, userId: internItB3_2.id },
    ],
    skipDuplicates: true,
  })

  // ─── Ideas ────────────────────────────────────────────────────
  // IT Batch 3 (active) — 3 ideas
  await prisma.idea.createMany({
    data: [
      {
        title: 'AI-powered Complaint Classifier',
        description: 'Use NLP to auto-classify and route citizen complaints to the correct department.',
        department: Department.IT,
        tags: ['ai', 'nlp', 'citizen-services'],
        status: IdeaStatus.PENDING,
        submittedById: internItB3_1.id,
        batchId: itB3.id,
      },
      {
        title: 'Real-time GIS Dashboard',
        description: 'Interactive geographic information system for tracking infrastructure projects.',
        department: Department.IT,
        tags: ['gis', 'maps', 'dashboard'],
        status: IdeaStatus.APPROVED,
        submittedById: internItB3_2.id,
        batchId: itB3.id,
      },
      {
        title: 'Water Meter IoT Integration',
        description: 'Connect IoT water meters to municipal billing system for automated readings.',
        department: Department.IT,
        tags: ['iot', 'utilities', 'automation'],
        status: IdeaStatus.REJECTED,
        submittedById: internItB3_3.id,
        batchId: itB3.id,
      },
    ],
  })

  // REVENUE Batch 2 (active) — 3 ideas
  await prisma.idea.createMany({
    data: [
      {
        title: 'Property Tax Auto-Calculator',
        description: 'Automate property tax calculation based on satellite imagery and area data.',
        department: Department.REVENUE,
        tags: ['taxation', 'automation', 'gis'],
        status: IdeaStatus.PENDING,
        submittedById: internRevB2_1.id,
        batchId: revB2.id,
      },
      {
        title: 'Payment Reminder SMS System',
        description: 'Automated SMS reminders for pending tax payments.',
        department: Department.REVENUE,
        tags: ['sms', 'payments', 'notifications'],
        status: IdeaStatus.APPROVED,
        submittedById: internRevB2_2.id,
        batchId: revB2.id,
      },
      {
        title: 'Trader License Portal',
        description: 'Online portal for applying and renewing trader licenses.',
        department: Department.REVENUE,
        tags: ['licensing', 'portal', 'citizen-services'],
        status: IdeaStatus.PENDING,
        submittedById: internRevB2_1.id,
        batchId: revB2.id,
      },
    ],
  })

  // LAWS Batch 1 (active) — 3 ideas
  await prisma.idea.createMany({
    data: [
      {
        title: 'Legal Document Digitization',
        description: 'Scan and index all physical legal documents into searchable digital archives.',
        department: Department.LAWS,
        tags: ['digitization', 'legal', 'archives'],
        status: IdeaStatus.APPROVED,
        submittedById: internLawsB1_1.id,
        batchId: lawsB1.id,
      },
      {
        title: 'Case Status Tracker',
        description: 'Public portal to track municipal legal case statuses.',
        department: Department.LAWS,
        tags: ['portal', 'legal', 'transparency'],
        status: IdeaStatus.PENDING,
        submittedById: internLawsB1_2.id,
        batchId: lawsB1.id,
      },
      {
        title: 'Compliance Audit Tool',
        description: 'Tool to audit vendor compliance with municipal regulations.',
        department: Department.LAWS,
        tags: ['audit', 'compliance', 'vendors'],
        status: IdeaStatus.REJECTED,
        submittedById: internLawsB1_1.id,
        batchId: lawsB1.id,
      },
    ],
  })

  // AICSTL Batch 1 (active) — 3 ideas
  await prisma.idea.createMany({
    data: [
      {
        title: 'Smart Traffic Signal Controller',
        description: 'AI-based adaptive traffic signal system for city intersections.',
        department: Department.AICSTL,
        tags: ['ai', 'traffic', 'smart-city'],
        status: IdeaStatus.PENDING,
        submittedById: internAicstlB1_1.id,
        batchId: aicstlB1.id,
      },
      {
        title: 'Waste Bin Fill-level Monitor',
        description: 'IoT sensors on bins to optimize waste collection routes.',
        department: Department.AICSTL,
        tags: ['iot', 'waste-management', 'smart-city'],
        status: IdeaStatus.APPROVED,
        submittedById: internAicstlB1_2.id,
        batchId: aicstlB1.id,
      },
      {
        title: 'Street Light Fault Reporter',
        description: 'Mobile app for citizens to report faulty street lights with geo-tagging.',
        department: Department.AICSTL,
        tags: ['mobile', 'citizen-services', 'reporting'],
        status: IdeaStatus.PENDING,
        submittedById: internAicstlB1_1.id,
        batchId: aicstlB1.id,
      },
    ],
  })

  // ─── Print Summary ────────────────────────────────────────────
  console.log('\n✅ Seeding completed!\n')

  const allUsers = await prisma.user.findMany({
    select: { name: true, email: true, role: true, department: true },
    orderBy: [{ department: 'asc' }, { role: 'asc' }, { name: 'asc' }],
  })

  const batches = await prisma.batch.findMany({
    include: { _count: { select: { members: true } } },
    orderBy: [{ department: 'asc' }, { batchNumber: 'asc' }],
  })

  console.log('--- Seeded Users ---')
  console.table(allUsers)

  console.log('\n--- Seeded Batches ---')
  console.table(batches.map(b => ({
    name: b.name,
    department: b.department,
    batchNumber: b.batchNumber,
    isActive: b.isActive,
    members: b._count.members,
  })))

  console.log('\n📋 Login Credentials (password: Admin@1234)')
  console.log('─────────────────────────────────────────────────')
  console.log('SUPER ADMIN:  superadmin@municipal.gov')
  console.log('')
  console.log('IT Batch 1 (CLOSED):')
  console.log('  coordinator.it.b1@municipal.gov | intern.it.b1.1/2/3@municipal.gov')
  console.log('IT Batch 2 (CLOSED):')
  console.log('  coordinator.it.b2@municipal.gov | intern.it.b2.1/2/3@municipal.gov')
  console.log('IT Batch 3 (ACTIVE):')
  console.log('  coordinator.it.b3@municipal.gov | intern.it.b3.1/2/3/4@municipal.gov')
  console.log('REVENUE Batch 2 (ACTIVE):')
  console.log('  coordinator.rev.b2@municipal.gov | intern.rev.b2.1/2@municipal.gov')
  console.log('LAWS Batch 1 (ACTIVE):')
  console.log('  coordinator.laws.b1@municipal.gov | intern.laws.b1.1/2@municipal.gov')
  console.log('AICSTL Batch 1 (ACTIVE):')
  console.log('  coordinator.aicstl.b1@municipal.gov | intern.aicstl.b1.1/2@municipal.gov')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
