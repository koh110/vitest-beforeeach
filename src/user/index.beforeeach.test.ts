import { beforeAll, beforeEach, expect, test } from 'vitest'
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

beforeEach(async ({ task }) => {
  await dbClient.user.createMany({
    data: Array.from({ length: 30 }).map((_, i) => {
      return createUserData(task.id, { name: `name-${i + 1}`, email: `email-${i +1}@koh.dev` })
    })
  })
})

test('getUser: count', async ({ task }) => {
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
  expect(users.length).toStrictEqual(30)
})

test('getUser: expect params', async ({ task }) => {
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
  expect(users[0].name).toStrictEqual(`${task.id}-name-1`)
  expect(users[0].email).toStrictEqual(`${task.id}-email-1@koh.dev`)
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
