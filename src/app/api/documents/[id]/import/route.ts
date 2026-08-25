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
  if (doc.ownerId !== user.id) {
    const share = await prisma.documentShare.findUnique({
      where: { documentId_userId: { documentId: id, userId: user.id } },
    });
    if (!share || share.permission !== "EDIT") {
      return apiError("Only editors can import content", 403);
    }
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) return apiError("No file provided", 400);

    const allowedExtensions = [".txt", ".md", ".markdown"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      return apiError("Only .txt and .md files are supported", 400);
    }

    if (file.size > 1_000_000) {
      return apiError("File size must be under 1MB", 400);
    }

    const text = await file.text();
    const lines = text.split("\n");
    const content: object[] = [];
    let currentList: { type: string; items: object[] } | null = null;

    for (const line of lines) {
      const bulletMatch = line.match(/^[\s]*[-*+]\s+(.*)/);
      const numberedMatch = line.match(/^[\s]*\d+\.\s+(.*)/);

      if (bulletMatch) {
        if (currentList?.type !== "bulletList") {
          if (currentList) content.push(currentList);
          currentList = { type: "bulletList", items: [] };
        }
        currentList.items.push({
          type: "listItem",
          content: [{ type: "paragraph", content: parseInlineMarkdown(bulletMatch[1]) }],
        });
        continue;
      }

      if (numberedMatch) {
        if (currentList?.type !== "orderedList") {
          if (currentList) content.push(currentList);
          currentList = { type: "orderedList", items: [] };
        }
        currentList.items.push({
          type: "listItem",
          content: [{ type: "paragraph", content: parseInlineMarkdown(numberedMatch[1]) }],
        });
        continue;
      }

      if (currentList) {
        content.push(currentList);
        currentList = null;
      }

      if (line.startsWith("### ")) {
        content.push({ type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: line.slice(4) }] });
      } else if (line.startsWith("## ")) {
        content.push({ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: line.slice(3) }] });
      } else if (line.startsWith("# ")) {
        content.push({ type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: line.slice(2) }] });
      } else if (line.trim() === "") {
        content.push({ type: "paragraph" });
      } else {
        content.push({ type: "paragraph", content: parseInlineMarkdown(line) });
      }
    }

    if (currentList) {
      content.push(currentList);
    }

    const tiptapDoc = {
      type: "doc",
      content: content.length > 0 ? content : [{ type: "paragraph" }],
    };

    await prisma.document.update({
      where: { id },
      data: { content: JSON.stringify(tiptapDoc) },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Import error:", error);
    return apiError("Failed to import file", 500);
  }
}

function parseInlineMarkdown(text: string): object[] {
  const nodes: object[] = [];
  const pattern = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|__(.+?)__|[^*_]+)/g;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match[2]) {
      nodes.push({ type: "text", text: match[2], marks: [{ type: "bold" }, { type: "italic" }] });
    } else if (match[3]) {
      nodes.push({ type: "text", text: match[3], marks: [{ type: "bold" }] });
    } else if (match[4]) {
      nodes.push({ type: "text", text: match[4], marks: [{ type: "italic" }] });
    } else if (match[5]) {
      nodes.push({ type: "text", text: match[5], marks: [{ type: "underline" }] });
    } else if (match[6]) {
      nodes.push({ type: "text", text: match[6] });
    }
  }

  return nodes.length > 0 ? nodes : [{ type: "text", text }];
}
