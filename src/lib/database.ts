import { DATABASE } from '../config.js'
import { PrismaClient } from '../generated/prisma/index.js'
export { Prisma } from '../generated/prisma/index.js'

export function createClient() {
  return new PrismaClient({
    datasourceUrl: DATABASE.url
  })
}
