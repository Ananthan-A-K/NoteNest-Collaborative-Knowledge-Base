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
  createdAt: number;
}

function loadNotesFromStorage(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveNotesToStorage(notes: Note[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }
}

function formatRelativeTime(timestamp?: number) {
  if (!timestamp || Number.isNaN(timestamp)) {
    return "Created recently";
  }

  const diff = Date.now() - timestamp;
  if (Number.isNaN(diff) || diff < 0) {
    return "Created recently";
  }

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);

  if (minutes < 1) return "Created just now";
  if (minutes < 60)
    return `Created ${minutes} minute${minutes > 1 ? "s" : ""} ago`;

  return `Created ${hours} hour${hours > 1 ? "s" : ""} ago`;
}

export default function NotesPage() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";
const { canCreateNote, isViewer } = usePermissions();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] =
    useState<"newest" | "oldest" | "az">("newest");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createContent, setCreateContent] = useState("");
  const [createTitleError, setCreateTitleError] = useState("");
  const [createSuccessMessage, setCreateSuccessMessage] =
    useState<string | null>(null);

  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

  const createButtonRef = useRef<HTMLButtonElement>(null);

  /* ---------- ESC to close modals ---------- */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowCreateModal(false);
        setNoteToDelete(null);
        createButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  /* ---------- Initial Load ---------- */
  useEffect(() => {
    const stored = loadNotesFromStorage();
    const timer = setTimeout(() => {
      setNotes(
        stored.length > 0
          ? stored
          : [
              {
                id: 1,
                title: "Project Overview",
                content: "A high-level overview of the project.",
                createdAt: Date.now() - 1000 * 60 * 60,
              },
              {
                id: 2,
                title: "Meeting Notes",
                content: "Key points from the last team sync.",
                createdAt: Date.now() - 1000 * 60 * 5,
              },
            ]
      );
      setIsLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  /* ---------- Sync URL search ---------- */
  useEffect(() => {
    setSearchQuery(search);
  }, [search]);

  /* ---------- Persist notes ---------- */
  useEffect(() => {
    if (!isLoading) saveNotesToStorage(notes);
  }, [notes, isLoading]);

  /* ---------- Filtered notes ---------- */
  const filteredNotes = notes.filter((note) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(query) ||
      note.content?.toLowerCase().includes(query)
    );
  });

 /* ---------- Sorted notes ---------- */
const sortedNotes = [...filteredNotes].sort((a, b) => {
  const aTime = a.createdAt ?? a.id;
  const bTime = b.createdAt ?? b.id;

  if (sortBy === "newest") {
    if (bTime !== aTime) return bTime - aTime;
    return b.id - a.id; // tie-breaker
  }

  if (sortBy === "oldest") {
    if (aTime !== bTime) return aTime - bTime;
    return a.id - b.id; // tie-breaker
  }

  if (sortBy === "az") {
    return a.title.localeCompare(b.title);
  }

  return 0;
});

  /* ---------- Create Note ---------- */
  const handleCreateNote = useCallback(() => {
    if (!canCreateNote) return;
    setEditingNoteId(null);
    setCreateTitle("");
    setCreateContent("");
    setCreateTitleError("");
    setShowCreateModal(true);
  }, [canCreateNote]);

  /* ---------- Edit Note ---------- */
  const handleEditNote = useCallback((note: Note) => {
    setEditingNoteId(note.id);
    setCreateTitle(note.title);
    setCreateContent(note.content || "");
    setCreateTitleError("");
    setShowCreateModal(true);
  }, []);

  /* ---------- Submit ---------- */
  const handleSubmitCreate = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const title = createTitle.trim();
      if (!title) {
        setCreateTitleError("Title is required");
        return;
      }

      if (title.length > TITLE_MAX_LENGTH) {
        setCreateTitleError(
          `Title must be ${TITLE_MAX_LENGTH} characters or less`
        );
        return;
      }

      setIsSubmitting(true);

      if (editingNoteId !== null) {
        setNotes((prev) =>
          prev.map((note) =>
            note.id === editingNoteId
              ? { ...note, title, content: createContent.trim() || undefined }
              : note
          )
        );
      } else {
        setNotes((prev) => [
          ...prev,
          {
            id: Date.now(),
            title,
            content: createContent.trim() || undefined,
            createdAt: Date.now(),
          },
        ]);
      }

      setCreateSuccessMessage(
        editingNoteId !== null
          ? "Note updated successfully."
          : "Note created successfully."
      );

      setShowCreateModal(false);
      setEditingNoteId(null);
      setCreateTitle("");
      setCreateContent("");

      setTimeout(() => {
        setCreateSuccessMessage(null);
        setIsSubmitting(false);
      }, 2000);
    },
    [createTitle, createContent, editingNoteId]
  );

 return (
  <>
    <div className="flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Notes"
          showSearch
          action={
            canCreateNote ? (
             <button
  ref={createButtonRef}
  type="button"
  onClick={handleCreateNote}
  className="
    px-4 py-2
    rounded-lg
    bg-blue-600
    text-white
    font-semibold
    shadow-md
    hover:bg-blue-700
    hover:shadow-lg
    focus:outline-none
    focus:ring-2
    focus:ring-blue-400
    transition
  "
>
  + Create Note
</button>
            ) : null
          }
        />

        <main className="flex-1 overflow-y-auto" aria-busy={isLoading}>
          <div className="max-w-3xl mx-auto p-6">
            {/* Sort Dropdown */}
            <div className="mb-4 flex justify-end">
             <select
  value={sortBy}
  onChange={(e) =>
    setSortBy(e.target.value as "newest" | "oldest" | "az")
  }
  aria-label="Sort notes"
  className="
    bg-white
    text-slate-800
    border
    border-slate-300
    rounded-lg
    px-3
    py-2
    text-sm
    shadow-md
    hover:border-blue-400
    focus:outline-none
    focus:ring-2
    focus:ring-blue-400
    focus:border-blue-400
    transition
  "
>
  <div className="mb-4 flex justify-end items-center gap-2">
  <span className="text-sm text-slate-300">
    Sort by
  </span>

  <select>...</select>
</div>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="az">A–Z</option>
              </select>
            </div>

            {isLoading ? (
              <SkeletonList count={4} />
            ) : sortedNotes.length === 0 ? (
              <EmptyState
                title="No results found"
                description="Try adjusting your search keywords."
              />
            ) : (
              <ul className="space-y-3">
                {sortedNotes.map((note) => (
                  <li
                    key={note.id}
                    className="rounded-xl border p-4 bg-white shadow-sm flex justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-semibold">{note.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatRelativeTime(note.createdAt)}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {note.content || "No content"}
                      </p>
                    </div>

                    {!isViewer && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditNote(note)}
                          className="text-blue-600"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => setNoteToDelete(note)}
                          className="text-red-600"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>
    </div>

    {/* Create / Edit Modal */}
    {showCreateModal && (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-modal-title"
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      >
        <div className="relative bg-white p-6 rounded w-full max-w-md">
          <button
            type="button"
            onClick={() => setShowCreateModal(false)}
            aria-label="Close dialog"
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>

          <h2 id="note-modal-title" className="text-xl font-semibold mb-4">
            {editingNoteId !== null ? "Edit note" : "New note"}
          </h2>

          <form onSubmit={handleSubmitCreate} noValidate>
            <input
              type="text"
              autoFocus
              value={createTitle}
              onChange={(e) => {
                setCreateTitle(e.target.value);
                setCreateTitleError("");
              }}
              className="w-full border p-2 mb-2"
              placeholder="Title"
            />

            <p className="text-xs text-gray-500 mb-2">
              {createTitle.length} / {TITLE_MAX_LENGTH} characters
            </p>

            {createTitleError && (
              <p className="text-sm text-red-600 mb-2">
                {createTitleError}
              </p>
            )}

            <textarea
              value={createContent}
              onChange={(e) => setCreateContent(e.target.value)}
              className="w-full border p-2 mb-4"
              placeholder="Content (optional)"
            />

            <div className="flex justify-end gap-3">
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
                disabled={
                  isSubmitting || createTitle.trim().length === 0
                }
              >
                {isSubmitting
                  ? "Saving..."
                  : editingNoteId !== null
                  ? "Update note"
                  : "Create note"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </>
);
}