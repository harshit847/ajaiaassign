import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { apiError } from "@/lib/validation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const ownedDocs = await prisma.document.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true, createdAt: true },
  });

  const sharedDocs = await prisma.document.findMany({
    where: { shares: { some: { userId: user.id } } },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true, createdAt: true },
  });

  return Response.json({ owned: ownedDocs, shared: sharedDocs });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const body = await request.json();
    const title = body.title?.trim() || "Untitled Document";

    if (title.length > 200) {
      return apiError("Title must be 200 characters or less", 400);
    }

    const doc = await prisma.document.create({
      data: {
        title,
        content: JSON.stringify({
          type: "doc",
          content: [{ type: "paragraph" }],
        }),
        ownerId: user.id,
      },
      select: { id: true, title: true, createdAt: true },
    });

    return Response.json({ document: doc }, { status: 201 });
  } catch (error) {
    console.error("Create document error:", error);
    return apiError("Internal server error", 500);
  }
}
