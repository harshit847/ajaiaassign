"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import TiptapEditor from "@/components/TiptapEditor";

interface DocumentData {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; name: string; email: string };
  permission: string;
}

interface ShareInfo {
  id: string;
  email: string;
  name: string;
}

export default function DocumentPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const docId = params.id as string;

  const [doc, setDoc] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "error">("saved");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [showShare, setShowShare] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [sharePermission, setSharePermission] = useState("EDIT");
  const [shareError, setShareError] = useState("");
  const [shares, setShares] = useState<ShareInfo[]>([]);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentContentRef = useRef<string>("");

  const fetchDoc = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents/${docId}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 404) {
        setError("Document not found");
        setLoading(false);
        return;
      }
      if (res.status === 403) {
        setError("You don't have access to this document");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setDoc(data.document);
      setTitle(data.document.title);
      currentContentRef.current = data.document.content;
    } catch {
      setError("Failed to load document");
    } finally {
      setLoading(false);
    }
  }, [docId, router]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (user) {
      fetchDoc();
    }
  }, [user, authLoading, router, fetchDoc]);

  const saveDoc = useCallback(async (updates: { title?: string; content?: string }) => {
    setSaving(true);
    setSaveStatus("unsaved");
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        setSaveStatus("error");
        return;
      }
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }, [docId]);

  const handleContentUpdate = useCallback((content: string) => {
    currentContentRef.current = content;
    setSaveStatus("unsaved");

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveDoc({ content });
    }, 1000);
  }, [saveDoc]);

  const handleTitleBlur = () => {
    if (title.trim() && title !== doc?.title) {
      saveDoc({ title: title.trim() });
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setShareError("");
    try {
      const res = await fetch(`/api/documents/${docId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: shareEmail, permission: sharePermission }),
      });
      const data = await res.json();
      if (!res.ok) {
        setShareError(data.error);
        return;
      }
      setShareEmail("");
      fetchShares();
    } catch {
      setShareError("Failed to share document");
    }
  };

  const fetchShares = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents/${docId}/share`);
      const data = await res.json();
      setShares(data.shares || []);
    } catch {
      // ignore
    }
  }, [docId]);

  const removeShare = async (userId: string) => {
    try {
      await fetch(`/api/documents/${docId}/share`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      fetchShares();
    } catch {
      // ignore
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      const res = await fetch(`/api/documents/${docId}/import`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setImportFile(null);
      fetchDoc();
    } catch {
      setError("Failed to import file");
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      if (res.ok) router.push("/");
    } catch {
      setError("Failed to delete document");
    }
  };

  useEffect(() => {
    if (doc?.permission === "owner") {
      fetchShares();
    }
  }, [doc?.permission, fetchShares]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={() => router.push("/")} className="text-blue-600 hover:text-blue-700 text-sm">
              Back to documents
            </button>
          </div>
        </div>
      </>
    );
  }

  const canEdit = doc?.permission === "owner" || doc?.permission === "EDIT";
  const isOwner = doc?.permission === "owner";

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            {canEdit ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                className="text-xl font-bold text-gray-900 w-full bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                placeholder="Document title"
              />
            ) : (
              <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            )}
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
              <span>{isOwner ? "You own this" : `Shared by ${doc?.owner?.name}`}</span>
              <span className={saveStatus === "saved" ? "text-green-500" : saveStatus === "unsaved" ? "text-amber-500" : "text-red-500"}>
                {saving ? "Saving..." : saveStatus === "saved" ? "Saved" : saveStatus === "unsaved" ? "Unsaved changes" : "Save error"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-50 transition-colors">
              Import file
              <input
                type="file"
                accept=".txt,.md,.markdown"
                className="hidden"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
            </label>

            {isOwner && (
              <button
                onClick={() => setShowShare(!showShare)}
                className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-50 transition-colors"
              >
                Share
              </button>
            )}

            {isOwner && (
              <button
                onClick={handleDelete}
                className="text-sm text-red-500 hover:text-red-700 border border-red-200 rounded-md px-3 py-1.5 hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {importFile && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between">
            <span className="text-sm text-blue-700">
              Ready to import: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleImport}
                disabled={importing}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {importing ? "Importing..." : "Import"}
              </button>
              <button
                onClick={() => setImportFile(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {showShare && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
            <h3 className="font-medium text-gray-900 mb-3">Share document</h3>
            <form onSubmit={handleShare} className="flex flex-col sm:flex-row gap-2 mb-3">
              <input
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="User email"
                required
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={sharePermission}
                onChange={(e) => setSharePermission(e.target.value)}
                className="border border-gray-300 rounded-md text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="EDIT">Can edit</option>
                <option value="VIEW">Can view</option>
              </select>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Share
              </button>
            </form>
            {shareError && (
              <p className="text-sm text-red-600 mb-2">{shareError}</p>
            )}
            {shares.length > 0 && (
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-500 mb-2">Shared with:</p>
                <div className="space-y-2">
                  {shares.map((s) => (
                    <div key={s.id} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{s.name} ({s.email})</span>
                      <button
                        onClick={() => removeShare(s.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {canEdit ? (
          <TiptapEditor
            content={doc?.content || '{"type":"doc","content":[{"type":"paragraph"}]}'}
            onUpdate={handleContentUpdate}
          />
        ) : (
          <div className="border border-gray-200 rounded-lg p-4 bg-white text-gray-700">
            <p className="text-sm text-gray-400 italic mb-2">Read-only mode</p>
            <div
              dangerouslySetInnerHTML={{
                __html: (() => {
                  try {
                    const parsed = JSON.parse(doc?.content || "{}");
                    return renderTiptapToHtml(parsed);
                  } catch {
                    return doc?.content || "";
                  }
                })(),
              }}
            />
          </div>
        )}
      </main>
    </>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function renderTiptapToHtml(node: any): string {
  if (!node || !node.type) return node?.text || "";
  if (node.type === "text") {
    let text = node.text || "";
    if (node.marks) {
      for (const mark of node.marks) {
        if (mark.type === "bold") text = `<strong>${text}</strong>`;
        if (mark.type === "italic") text = `<em>${text}</em>`;
        if (mark.type === "underline") text = `<u>${text}</u>`;
      }
    }
    return text;
  }
  const inner = (node.content || []).map((n: any) => renderTiptapToHtml(n)).join("");
  switch (node.type) {
    case "doc": return inner;
    case "paragraph": return `<p>${inner}</p>`;
    case "heading": {
      const level = node.attrs?.level || 1;
      return `<h${level}>${inner}</h${level}>`;
    }
    case "bulletList": return `<ul>${inner}</ul>`;
    case "orderedList": return `<ol>${inner}</ol>`;
    case "listItem": return `<li>${inner}</li>`;
    default: return inner;
  }
}
