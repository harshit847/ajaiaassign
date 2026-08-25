import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { apiError } from "@/lib/validation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return apiError("Document not found", 404);
  if (doc.ownerId !== user.id) return apiError("Only the owner can share", 403);

  try {
    const body = await request.json();
    const { email, permission = "EDIT" } = body;

    if (!email) return apiError("Email is required", 400);
    if (!["VIEW", "EDIT"].includes(permission)) {
      return apiError("Permission must be VIEW or EDIT", 400);
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!targetUser) return apiError("User not found with this email", 404);
    if (targetUser.id === user.id) return apiError("Cannot share with yourself", 400);

    const existingShare = await prisma.documentShare.findUnique({
      where: { documentId_userId: { documentId: id, userId: targetUser.id } },
    });

    if (existingShare) {
      await prisma.documentShare.update({
        where: { id: existingShare.id },
        data: { permission },
      });
    } else {
      await prisma.documentShare.create({
        data: { documentId: id, userId: targetUser.id, permission },
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Share error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return apiError("Document not found", 404);
  if (doc.ownerId !== user.id) return apiError("Only the owner can manage shares", 403);

  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) return apiError("userId is required", 400);

    await prisma.documentShare.deleteMany({
      where: { documentId: id, userId },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Unshare error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return apiError("Document not found", 404);
  if (doc.ownerId !== user.id) return apiError("Only the owner can view shares", 403);

  const shares = await prisma.documentShare.findMany({
    where: { documentId: id },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  return Response.json({ shares });
}
