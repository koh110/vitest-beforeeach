if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

export const DATABASE = {
  url: process.env.DATABASE_URL
} as const
