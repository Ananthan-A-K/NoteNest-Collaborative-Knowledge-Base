"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import { SkeletonList } from "@/components/Skeleton";
import { usePermissions } from "@/hooks/usePermissions";

const STORAGE_KEY = "notenest-notes";
const TITLE_MAX_LENGTH = 200;

interface Note {
  id: number;
  title: string;
  content?: string;
}

function loadNotesFromStorage(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotesToStorage(notes: Note[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }
}

export default function NotesPage() {
  const searchParams = useSearchParams();
  const { canCreateNote, canDeleteNote, isViewer } = usePermissions();

  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createContent, setCreateContent] = useState("");
  const [createTitleError, setCreateTitleError] = useState("");
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [createSuccessMessage, setCreateSuccessMessage] =
    useState<string | null>(null);

  const createButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const stored = loadNotesFromStorage();
    setTimeout(() => {
      setNotes(
        stored.length > 0
          ? stored
          : [
              { id: 1, title: "Project Overview" },
              { id: 2, title: "Meeting Notes" },
            ]
      );
      setIsLoading(false);
    }, 600);
  }, []);

  useEffect(() => {
    if (!isLoading) saveNotesToStorage(notes);
  }, [notes, isLoading]);

  const handleCreateNote = () => {
    if (!canCreateNote) return;
    setCreateTitle("");
    setCreateContent("");
    setCreateTitleError("");
    setShowCreateModal(true);
  };

  const handleSubmitCreate = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const title = createTitle.trim();
      if (!title) {
        setCreateTitleError("Title is required");
        return;
      }

      setNotes((prev) => [
        ...prev,
        { id: Date.now(), title, content: createContent || undefined },
      ]);

      setCreateSuccessMessage("Note created successfully.");
      setShowCreateModal(false);
      setTimeout(() => setCreateSuccessMessage(null), 2000);
    },
    [createTitle, createContent]
  );

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header
          title="Notes"
          action={
            canCreateNote && (
              <button
                ref={createButtonRef}
                type="button"
                onClick={handleCreateNote}
                className="btn-primary"
              >
                Create Note
              </button>
            )
          }
        />

        <main className="flex-1 p-6" aria-busy={isLoading}>
          {createSuccessMessage && (
            <div role="status" aria-live="polite" className="mb-4 text-green-600">
              {createSuccessMessage}
            </div>
          )}

          {loadError && (
            <ErrorState
              title="Unable to load notes"
              message={loadError}
              variant="error"
            />
          )}

          {isLoading ? (
            <SkeletonList count={4} />
          ) : notes.length === 0 ? (
            <EmptyState
              title="No notes yet"
              description={
                isViewer
                  ? "You can view notes only."
                  : "Get started by creating your first note."
              }
              action={
                canCreateNote && (
                  <button
                    type="button"
                    onClick={handleCreateNote}
                    className="btn-primary"
                  >
                    Create your first note
                  </button>
                )
              }
            />
          ) : (
            <ul className="space-y-3">
              {notes.map((note) => (
                <li key={note.id} className="border p-4 rounded">
                  {note.title}
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">New note</h2>

            <form onSubmit={handleSubmitCreate} noValidate>
              <input
                type="text"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                className="w-full border p-2 mb-4"
                placeholder="Title"
              />

              <textarea
                value={createContent}
                onChange={(e) => setCreateContent(e.target.value)}
                className="w-full border p-2 mb-4"
                placeholder="Content (optional)"
              />

              <div className="flex justify-end gap-3">
                {/* ✅ FIX APPLIED HERE */}
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmittingCreate}
                >
                  Create note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
