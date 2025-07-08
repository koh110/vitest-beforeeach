import { PrismaClient, Prisma } from '../src/generated/prisma/index.js'

export function getTestDbName(suffix: string) {
  return `test_db_${suffix}`
}

export function getTestDbParameters(env: NodeJS.ProcessEnv) {
  const host = process.env.TEST_DB_HOST ?? 'localhost'
  const user = process.env.TEST_DB_USER ?? 'testuser'
  const password = process.env.TEST_DB_PASSWORD ?? 'testpassword'
  const port = process.env.TEST_DB_PORT ? Number(process.env.TEST_DB_PORT) : 5433
  const testDbName = env.VITEST_POOL_ID ? getTestDbName(env.VITEST_POOL_ID) : null

  return {
    user,
    password,
    host,
    port,
    testDbUrl: `postgresql://${user}:${password}@${host}:${port}`,
    testDbName
  }
}

export function getTestDbClient(env: NodeJS.ProcessEnv) {
  const { user, password, host, port, testDbName } = getTestDbParameters(env)
  const databaseUrl = `postgresql://${user}:${password}@${host}:${port}/${testDbName}`
  return new PrismaClient({
    datasourceUrl: databaseUrl
  })
}

export async function truncateTables(dbClient: PrismaClient, tables: typeof Prisma.ModelName[keyof typeof Prisma.ModelName][]) {
  const tableNames = tables.map(table => `"${table}"`).join(', ')
  await dbClient.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames} CASCADE`)
}
