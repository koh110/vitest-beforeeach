import { type createClient, Prisma } from '../lib/database.js';

export async function addUser(client: ReturnType<typeof createClient>, userData: { email: string; name: string }) {
  const user = await client.user.create({
    data: {
      email: userData.email,
      name: userData.name,
    },
  });
  return user;
}

export async function getUsers(client: ReturnType<typeof createClient>, args: Prisma.UserFindManyArgs) {
  const user = await client.user.findMany(args)
  return user
}

export async function updateUser(client: ReturnType<typeof createClient>, userId: number, userData: { email?: string; name?: string }) {
  const user = await client.user.update({
    where: { id: userId },
    data: userData,
  });
  return user;
}
