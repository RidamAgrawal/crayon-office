import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../../.env") });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma";

const url = process.env["DIRECT_DATABASE_URL"];
console.log("[prisma] DIRECT_DATABASE_URL starts with:", url?.slice(0, 40) ?? "UNDEFINED");

const adapter = new PrismaPg({ connectionString: url! });
export const prisma = new PrismaClient({ adapter });