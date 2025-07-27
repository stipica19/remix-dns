import { PrismaClient } from "@prisma/client";


let db: PrismaClient;

declare global {
  var __db: PrismaClient | undefined;
}

if (process.env.NODE_ENV === "production") {
  db = new PrismaClient();
} else {
  // Sprječava višestruko kreiranje klijenta u development okruženju (HMR)
  if (!global.__db) {
    global.__db = new PrismaClient();
  }
  db = global.__db;
}

export { db };


