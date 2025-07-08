import { beforeAll, expect, test as baseTest } from 'vitest'
import { Prisma } from '../generated/prisma/index.js'
import {
  getTestDbClient,
  truncateTables
} from '../../test/utils.js'

import { addUser, getUsers, updateUser } from './index.js'

let dbClient: ReturnType<typeof getTestDbClient>

beforeAll(async () => {
  dbClient = getTestDbClient(process.env)
  await dbClient.$connect()
  await truncateTables(dbClient, [Prisma.ModelName.User])

  return async () => {
    await dbClient.$disconnect()
  }
})

function createUserData(prefix: string, { name, email }: { name: string, email: string }) {
  return {
    name: `${prefix}-${name}`,
    email: `${prefix}-${email}`
  } satisfies Omit<Prisma.$UserPayload['scalars'], 'id'>
}

const test = baseTest.extend<{
  seeds: {
    users: ReturnType<typeof createUserData>[]
  }
}>({
  seeds: async ({ task }, use) => {
    const seeds = Array.from({ length: 30 }).map((_, i) => {
      return createUserData(task.id, { name: `name-${i + 1}`, email: `email-${i +1}@koh.dev` })
    })
    await dbClient.user.createMany({
      data: seeds
    })
    await use({ users: seeds })
  }
})

test('getUser: count', async ({ task, seeds }) => {
  const users = await getUsers(dbClient!, {
    where: {
      name: {
        contains: task.id
      }
    },
    orderBy: {
      id: 'asc'
    }
  })
  expect(users.length).toStrictEqual(seeds.users.length)
})

test('getUser: expect params', async ({ task, seeds }) => {
  const users = await getUsers(dbClient!, {
    where: {
      name: {
        contains: task.id
      }
    },
    orderBy: {
      id: 'asc'
    }
  })
  expect(users[0].name).toStrictEqual(seeds.users[0].name)
  expect(users[0].email).toStrictEqual(seeds.users[0].email)
})

test('addUser: count', async ({ task }) => {
  const beforeUserCount = await dbClient!.user.count()
  const addSeed = {
    name: `${task.id}-new-user`,
    email: `${task.id}-new-email@koh.dev`
  }
  await addUser(dbClient!, {
    name: addSeed.name,
    email: addSeed.email
  })
  const afterUserCount = await dbClient!.user.count()
  expect(afterUserCount).toStrictEqual(beforeUserCount + 1)
})

test('addUser: expect params', async ({ task }) => {
  const addSeed = {
    name: `${task.id}-new-user`,
    email: `${task.id}-new-email@koh.dev`
  }
  const newUser = await addUser(dbClient!, {
    name: addSeed.name,
    email: addSeed.email
  })
  expect(newUser.name).toStrictEqual(addSeed.name)
  expect(newUser.email).toStrictEqual(addSeed.email)
})

test('updateUser', async ({ task }) => {
  const seed = createUserData(task.id, { name: 'name-to-update', email: 'email-to-update' })
  const user = await dbClient!.user.create({
    data: seed
  })

  const userToUpdate = await dbClient!.user.findUnique({
    where: { id: user.id }
  })

  expect(userToUpdate!.name).toStrictEqual(seed.name)
  expect(userToUpdate!.email).toStrictEqual(seed.email)

  const updateSeed = {
    name: `${task.id}-updated-name`,
    email: `${task.id}-update-email@koh.dev`
  } as const
  await updateUser(dbClient!, userToUpdate!.id, {
    name: updateSeed.name,
    email: updateSeed.email
  })

  const updatedUser = await dbClient!.user.findUnique({
    where: { id: user.id }
  })

  expect(updatedUser!.name).toStrictEqual(updateSeed.name)
  expect(updatedUser!.email).toStrictEqual(updateSeed.email)
})
