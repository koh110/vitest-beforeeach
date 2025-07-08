import type { TestProject } from 'vitest/node'
import { PrismaClient } from '../src/generated/prisma/index.js'
import { getTestDbName, getTestDbParameters } from './utils.js'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'
const execAsync = promisify(exec)

export async function setup({ config }: TestProject) {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('not test!!!')
  }

  process.env.DATABASE_URL = 'postgres://xxxx'

  const { testDbUrl } = getTestDbParameters(process.env)
  const rootTestDatabaseName = process.env.TEST_DB_ROOT_DATABASE_NAME ?? 'test_db'

  const ROOT_TEST_DATABASE_URL = `${testDbUrl}/${rootTestDatabaseName}`
  console.log('[setup] rootTestDatabaseUrl:', ROOT_TEST_DATABASE_URL)
  const rootClient = new PrismaClient({
    datasourceUrl: ROOT_TEST_DATABASE_URL
  })

  const maxPool = config.poolOptions?.threads?.maxThreads ?? 1
  console.log('[setup] maxPool:', maxPool)

  const promises: ReturnType<typeof runMigrate>[] = []
  for (let i = 1; i <= maxPool; i++) {
    const databaseName = getTestDbName(`${i}`)
    promises.push(runMigrate({
      rootClient,
      databaseUrl: testDbUrl,
      databaseName
    }))
  }
  await Promise.all(promises)

  await rootClient.$disconnect()
}

async function runMigrate({
  rootClient,
  databaseUrl,
  databaseName
}: {
  rootClient: PrismaClient,
  databaseUrl: string
  databaseName: string
}) {
  console.log('[runMigrate] migrate start:', databaseName)
  await rootClient.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${databaseName}"`)

  const DATABASE_URL = `${databaseUrl}/${databaseName}`
  const { stdout } = await execAsync(`DATABASE_URL=${DATABASE_URL} npx prisma migrate dev`, {
    cwd: path.join(import.meta.dirname, '../')
  })
  console.log(`[runMigrate] migrate done:`, databaseName)
}
