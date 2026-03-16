// Prisma 7 configuration for migrations
// Connection URL is read from DATABASE_URL environment variable
export default {
  datasource: {
    url: process.env.DATABASE_URL,
  },
};
