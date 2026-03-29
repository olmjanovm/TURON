const { PrismaClient } = require('@prisma/client');

// Instantiate PrismaClient
// Note: It will automatically pick up DATABASE_URL from your .env file
const prisma = new PrismaClient();

// Export the instance for use throughout the application
module.exports = prisma;
