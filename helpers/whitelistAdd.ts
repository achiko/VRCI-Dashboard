import { PrismaClient } from "../src/generated/client";

// ============================================================================
// CONFIGURE HERE
// ============================================================================
const ADDRESS = "5GKTbD7t2HX6c1NBR9EuRz35v9Gw3VEQJSxaUcJGqZ5BE3NA";
const NOTE: string | null = "Added via helpers/whitelistAdd.ts";
const ADDED_BY: string | null = null; // optional admin address
// ============================================================================

const prisma = new PrismaClient();

async function main() {
  const entry = await prisma.whitelist.upsert({
    where: { address: ADDRESS },
    update: {
      note: NOTE ?? undefined,
      addedBy: ADDED_BY ?? undefined,
    },
    create: {
      address: ADDRESS,
      note: NOTE,
      addedBy: ADDED_BY,
    },
  });

  console.log("Whitelisted wallet:");
  console.log(`  id:        ${entry.id}`);
  console.log(`  address:   ${entry.address}`);
  console.log(`  addedBy:   ${entry.addedBy ?? "—"}`);
  console.log(`  note:      ${entry.note ?? "—"}`);
  console.log(`  createdAt: ${entry.createdAt.toISOString()}`);
  console.log(`  updatedAt: ${entry.updatedAt.toISOString()}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
