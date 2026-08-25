import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { apiError, sanitizeTitle } from "@/lib/validation";

async function getDocWithAccess(docId: string, userId: string) {
  const doc = await prisma.document.findUnique({
    where: { id: docId },
    include: {
      shares: { select: { userId: true, permission: true } },
      owner: { select: { id: true, name: true, email: true } },
    },
  });

  if (!doc) return { doc: null, access: null };

  const isOwner = doc.ownerId === userId;
  const share = doc.shares.find((s) => s.userId === userId);
  const access = isOwner ? "owner" : share ? share.permission : null;

  return { doc, access };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const { doc, access } = await getDocWithAccess(id, user.id);

  if (!doc) return apiError("Document not found", 404);
  if (!access) return apiError("Access denied", 403);

  return Response.json({
    document: {
      id: doc.id,
      title: doc.title,
      content: doc.content,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      owner: doc.owner,
      permission: access,
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const { doc, access } = await getDocWithAccess(id, user.id);

  if (!doc) return apiError("Document not found", 404);
  if (!access) return apiError("Access denied", 403);

  try {
    const body = await request.json();
    const updateData: { title?: string; content?: string } = {};

    if (body.title !== undefined) {
      const sanitized = sanitizeTitle(body.title);
      if (!sanitized) return apiError("Title cannot be empty", 400);
      updateData.title = sanitized;
    }

    if (body.content !== undefined) {
      updateData.content = body.content;
    }

    const updated = await prisma.document.update({
      where: { id },
      data: updateData,
      select: { id: true, title: true, updatedAt: true },
    });

    return Response.json({ document: updated });
  } catch (error) {
    console.error("Update document error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const { doc, access } = await getDocWithAccess(id, user.id);

  if (!doc) return apiError("Document not found", 404);
  if (access !== "owner") return apiError("Only the owner can delete a document", 403);

  await prisma.document.delete({ where: { id } });
  return Response.json({ success: true });
}
