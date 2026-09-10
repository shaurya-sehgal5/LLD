import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const problems = [
  {
    title: "Vending Machine",
    slug: "vending-machine",
    description:
      "Design a vending machine that supports product selection, coin insertion, inventory management, payment validation, dispensing products, and returning change. Explain your assumptions, classes, interfaces, responsibilities, relationships, trade-offs, and important edge cases.",
  },
  {
    title: "Parking Lot",
    slug: "parking-lot",
    description:
      "Design a parking lot system that manages different vehicle types, parking spots, entry and exit, ticket generation, availability, and payment. Explain your assumptions, classes, interfaces, responsibilities, relationships, trade-offs, and important edge cases.",
  },
  {
    title: "Library Management",
    slug: "library-management",
    description:
      "Design a library management system that supports books, members, borrowing, returning, availability tracking, and overdue handling. Explain your assumptions, classes, interfaces, responsibilities, relationships, trade-offs, and important edge cases.",
  },
  {
    title: "Elevator System",
    slug: "elevator-system",
    description:
      "Design an elevator system that manages multiple elevators, floor requests, internal requests, elevator movement, scheduling, and state transitions. Explain your assumptions, classes, interfaces, responsibilities, relationships, trade-offs, and important edge cases.",
  },
];

async function main() {
  for (const problem of problems) {
    await prisma.problem.upsert({
      where: {
        slug: problem.slug,
      },
      update: problem,
      create: problem,
    });
  }

  console.log(`Seeded ${problems.length} LLD problems.`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
