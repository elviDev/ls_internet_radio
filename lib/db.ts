import { prisma } from "./prisma";

export async function connectToDatabase() {
  try {
    await prisma.$connect();
    console.log("Connected to database");
    return { prisma };
  } catch (error) {
    console.error("Failed to connect to database:", error);
    throw error;
  }
}

export default prisma;
