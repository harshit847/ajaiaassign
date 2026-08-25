"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import Link from "next/link";

interface Document {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
}

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [ownedDocs, setOwnedDocs] = useState<Document[]>([]);
  const [sharedDocs, setSharedDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [showNewDoc, setShowNewDoc] = useState(false);
  const [error, setError] = useState("");

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setOwnedDocs(data.owned || []);
      setSharedDocs(data.shared || []);
    } catch {
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (user) {
      fetchDocs();
    }
  }, [user, authLoading, router, fetchDocs]);

  const createDocument = async () => {
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle || "Untitled Document" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      router.push(`/docs/${data.document.id}`);
    } catch {
      setError("Failed to create document");
    } finally {
      setCreating(false);
    }
  };

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

  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
          <button
            onClick={() => setShowNewDoc(!showNewDoc)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + New Document
          </button>
        </div>

        {showNewDoc && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
            <form
              onSubmit={(e) => { e.preventDefault(); createDocument(); }}
              className="flex gap-3 items-end"
            >
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Document title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Untitled Document"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </form>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-2 mb-6">
            {error}
          </div>
        )}

        {ownedDocs.length === 0 && sharedDocs.length === 0 && (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-lg">No documents yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first document to get started</p>
          </div>
        )}

        {ownedDocs.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Owned by me</h2>
            <div className="grid gap-3">
              {ownedDocs.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/docs/${doc.id}`}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all group"
                >
                  <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{doc.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Updated {new Date(doc.updatedAt).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {sharedDocs.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Shared with me</h2>
            <div className="grid gap-3">
              {sharedDocs.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/docs/${doc.id}`}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all group"
                >
                  <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{doc.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Updated {new Date(doc.updatedAt).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
