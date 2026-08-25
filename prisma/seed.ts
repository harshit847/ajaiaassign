import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 12);

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      name: "Alice",
      passwordHash: password,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      email: "bob@example.com",
      name: "Bob",
      passwordHash: password,
    },
  });

  const doc = await prisma.document.create({
    data: {
      title: "Welcome to DocCollab",
      content: JSON.stringify({
        type: "doc",
        content: [
          { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Welcome!" }] },
          { type: "paragraph", content: [{ type: "text", text: "This is a sample document created during seeding. Try editing it!" }] },
          { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Features" }] },
          { type: "bulletList", content: [
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Rich text editing" }] }] },
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Auto-save" }] }] },
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Document sharing" }] }] },
          ] },
        ],
      }),
      ownerId: alice.id,
    },
  });

  await prisma.documentShare.create({
    data: {
      documentId: doc.id,
      userId: bob.id,
      permission: "EDIT",
    },
  });

  console.log("Seeded users: alice@example.com, bob@example.com");
  console.log("Password for both: password123");
  console.log(`Created sample document "${doc.title}" shared with Bob`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
