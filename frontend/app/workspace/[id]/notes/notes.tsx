"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import { SkeletonList } from "@/components/Skeleton";
import { usePermissions } from "@/hooks/usePermissions";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { apiService, Note } from "@/lib/api";
import VersionHistoryModal from "@/components/VersionHistoryModal";

const TITLE_MAX_LENGTH = 200;

const CREATE_RESTRICTED_TITLE = "You need Editor or Admin role to create notes.";
const DELETE_RESTRICTED_TITLE = "You need Editor or Admin role to delete notes.";

interface ActiveUser {
  userId: string;
  name: string;
}

export default function WorkspaceNotesPage({ workspaceId }: { workspaceId: string }) {
  const searchParams = useSearchParams();
  const { activeWorkspace } = useWorkspace();
  const { canCreateNote, canDeleteNote, isViewer } = usePermissions();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Create note modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createContent, setCreateContent] = useState("");
  const [createTitleError, setCreateTitleError] = useState("");
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [createSuccessMessage, setCreateSuccessMessage] = useState<string | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const createButtonRef = useRef<HTMLButtonElement>(null);

  // Load notes from API
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const fetchedNotes = await apiService.getNotesForWorkspace(workspaceId);
        setNotes(fetchedNotes);
        setLoadError(null);
      } catch (error) {
        setLoadError("Failed to load notes");
      } finally {
        setIsLoading(false);
      }
    };
    loadNotes();
  }, [workspaceId]);

  // Open create modal when landing from "Create Your First Note" (e.g. /notes?new=1) — only if allowed
  useEffect(() => {
    if (searchParams.get("new") === "1" && canCreateNote) {
      setShowCreateModal(true);
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [searchParams, canCreateNote]);

  // Close view modal on Escape
  useEffect(() => {
    if (!viewingNote) return;
    const handleEsc = () => setViewingNote(null);
    window.addEventListener("shortcut-esc", handleEsc);
    return () => window.removeEventListener("shortcut-esc", handleEsc);
  }, [viewingNote]);

  // Socket connection for real-time collaboration
  useEffect(() => {
    if (viewingNote) {
      const newSocket = io("http://localhost:5001", {
        auth: { token: "current-user-id" }, // TODO: get actual token
      });
      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log("Connected to server");
        newSocket.emit("join-note", { noteId: viewingNote._id, workspaceId });
      });

      newSocket.on("active-users", (users) => {
        setActiveUsers(users.map((u: any) => ({ userId: u._id, name: u.name })));
      });

      newSocket.on("user-joined", (data) => {
        setActiveUsers((prev) => [...prev, data]);
      });

      newSocket.on("user-left", (data) => {
        setActiveUsers((prev) => prev.filter((u) => u.userId !== data.userId));
      });

      newSocket.on("note-updated", (data) => {
        if (data.noteId === viewingNote._id) {
          setViewingNote((prev) => prev ? { ...prev, title: data.title, content: data.content } : null);
          setNotes((prev) => prev.map((note) => (note._id === data.noteId ? { ...note, title: data.title, content: data.content } : note)));
        }
      });

      return () => {
        newSocket.disconnect();
        setSocket(null);
        setActiveUsers([]);
      };
    }
  }, [viewingNote, workspaceId]);

  const handleEditNote = () => {
    if (viewingNote) {
      setEditingNote(viewingNote);
      setEditTitle(viewingNote.title);
      setEditContent(viewingNote.content);
    }
  };

  const handleSaveNote = async () => {
    if (!editingNote) return;
    setIsSaving(true);
    try {
      await handleUpdateNote(editingNote._id, editTitle, editContent);
      if (socket) {
        socket.emit("update-note", { noteId: editingNote._id, title: editTitle, content: editContent });
      }
      setEditingNote(null);
    } catch (error) {
      setActionError("Failed to save note");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setEditTitle("");
    setEditContent("");
  };

  const retryLoad = () => {
    setLoadError(null);
    setIsLoading(true);
    const loadNotes = async () => {
      try {
        const fetchedNotes = await apiService.getNotesForWorkspace(workspaceId);
        setNotes(fetchedNotes);
        setLoadError(null);
      } catch (error) {
        setLoadError("Failed to load notes");
      } finally {
        setIsLoading(false);
      }
    };
    loadNotes();
  };

  const handleCreateNote = useCallback(() => {
    if (!canCreateNote) return;
    setActionError(null);
    setCreateTitle("");
    setCreateContent("");
    setCreateTitleError("");
    setShowCreateModal(true);
  }, [canCreateNote]);

  const handleCloseCreateModal = useCallback(() => {
    if (isSubmittingCreate) return;
    setShowCreateModal(false);
    setCreateTitle("");
    setCreateContent("");
    setCreateTitleError("");
    createButtonRef.current?.focus();
  }, [isSubmittingCreate]);

  // Close create modal on Escape (keyboard shortcut)
  useEffect(() => {
    if (!showCreateModal) return;
    const handleEsc = () => handleCloseCreateModal();
    window.addEventListener("shortcut-esc", handleEsc);
    return () => window.removeEventListener("shortcut-esc", handleEsc);
  }, [showCreateModal, handleCloseCreateModal]);

  const handleSubmitCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const title = createTitle.trim();
      if (!title) {
        setCreateTitleError("Title is required");
        return;
      }
      if (title.length > TITLE_MAX_LENGTH) {
        setCreateTitleError(`Title must be ${TITLE_MAX_LENGTH} characters or less`);
        return;
      }
      setCreateTitleError("");
      setIsSubmittingCreate(true);
      try {
        const newNote = await apiService.createNote(title, createContent.trim(), workspaceId, "current-user-id"); // TODO: get current user ID
        setNotes((prev) => [...prev, newNote]);
        setCreateSuccessMessage("Note created");
        setShowCreateModal(false);
        setCreateTitle("");
        setCreateContent("");
        createButtonRef.current?.focus();
        setTimeout(() => setCreateSuccessMessage(null), 2000);
      } catch (error) {
        setActionError("Failed to create note");
      } finally {
        setIsSubmittingCreate(false);
      }
    },
    [createTitle, createContent, workspaceId]
  );

  const handleUpdateNote = useCallback(
    async (noteId: string, title: string, content: string) => {
      try {
        const updatedNote = await apiService.updateNote(noteId, title, content, "current-user-id"); // TODO: get current user ID
        setNotes((prev) => prev.map((note) => (note._id === noteId ? updatedNote : note)));
        if (viewingNote?._id === noteId) {
          setViewingNote(updatedNote);
        }
      } catch (error) {
        setActionError("Failed to update note");
      }
    },
    [viewingNote]
  );

  const handleDeleteNote = async (id: string) => {
    setActionError(null);
    if (viewingNote?._id === id) setViewingNote(null);
    try {
      await apiService.deleteNote(id, "current-user-id"); // TODO: get current user ID
      setNotes(notes.filter((note) => note._id !== id));
    } catch (error) {
      setActionError("Failed to delete note");
    }
  };

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={`Notes - ${activeWorkspace.name}`}
          showSearch
          action={
            canCreateNote ? (
              <button
                ref={createButtonRef}
                type="button"
                onClick={handleCreateNote}
                className="btn-primary"
                data-shortcut="create-note"
                style={{
                  fontSize: "var(--font-size-sm)",
                  padding: "var(--space-sm) var(--space-md)",
                  minHeight: "36px",
                }}
              >
                Create Note
              </button>
            ) : (
              <span
                className="inline-flex items-center rounded-lg border px-3 py-2 text-sm opacity-70 cursor-not-allowed"
                style={{
                  minHeight: "36px",
                  borderColor: "var(--color-border-light)",
                  color: "var(--color-text-muted)",
                }}
                title={CREATE_RESTRICTED_TITLE}
              >
                Create Note
              </span>
            )
          }
        />
      <main
        className="flex-1 overflow-auto"
        style={{
          background: "var(--color-background)",
        }}
      >
        <div className="max-w-3xl mx-auto p-4 sm:p-6 md:p-8">
        {createSuccessMessage && (
          <div
            className="animate-fade-in-up mb-4 rounded-lg border flex items-center gap-3 px-4 py-3"
            style={{
              borderColor: "var(--color-success)",
              background: "rgba(34, 197, 94, 0.08)",
              color: "var(--color-success)",
            }}
            role="status"
            aria-live="polite"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">{createSuccessMessage}</span>
          </div>
        )}

        {loadError && (
          <ErrorState
            title="Couldn't load notes"
            message={loadError}
            variant="error"
            onDismiss={() => setLoadError(null)}
            action={
              <button type="button" onClick={retryLoad} className="btn-primary" style={{ fontSize: "var(--font-size-sm)", padding: "var(--space-sm) var(--space-md)" }}>
                Try again
              </button>
            }
            className="mb-6"
          />
        )}

        {actionError && (
          <ErrorState
            title="Something went wrong"
            message={actionError}
            variant="warning"
            onDismiss={() => setActionError(null)}
            action={
              <button type="button" onClick={() => setActionError(null)} className="btn-secondary" style={{ fontSize: "var(--font-size-sm)", padding: "var(--space-sm) var(--space-md)" }}>
                Dismiss
              </button>
            }
            className="mb-4"
          />
        )}

        {isLoading ? (
          <div
            className="animate-fade-in rounded-xl border p-6"
            style={{
              background: "var(--color-background)",
              borderColor: "var(--color-border-light)",
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
            }}
          >
            <SkeletonList count={4} variant="list-item" />
          </div>
        ) : notes.length === 0 ? (
          <div className="state-content-enter">
          <EmptyState
            size="large"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            title="No notes yet"
            description={
              isViewer
                ? "You can view notes only. Ask an Editor or Admin to create notes for you."
                : "Get started by creating your first note. Organize your thoughts, ideas, and knowledge in one place."
            }
            action={
              canCreateNote ? (
                <button
                  type="button"
                  onClick={handleCreateNote}
                  className="btn-primary"
                  style={{
                    fontSize: "var(--font-size-base)",
                    padding: "var(--space-sm) var(--space-lg)",
                  }}
                >
                  Create Your First Note
                </button>
              ) : (
                <span
                  className="text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                  title={CREATE_RESTRICTED_TITLE}
                >
                  View only — create not allowed
                </span>
              )
            }
          />
          </div>
        ) : (
          <ul className="state-content-enter space-y-3">
            {notes.map((note, index) => (
              <li
                key={note._id}
                className="animate-fade-in-up rounded-xl border flex items-stretch gap-4 group hover-lift overflow-hidden"
                style={{
                  background: "var(--color-background)",
                  borderColor: "var(--color-border-light)",
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <div
                  className="shrink-0 flex items-center justify-center w-12"
                  style={{ color: "var(--color-text-muted)" }}
                  aria-hidden
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingNote(note)}
                  className="flex-1 min-w-0 py-4 pr-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 rounded-lg"
                  style={{ "--tw-ring-color": "var(--color-info)" } as React.CSSProperties}
                >
                  <span className="font-semibold block truncate" style={{ color: "var(--color-text-primary)", fontSize: "var(--font-size-base)" }}>
                    {note.title}
                  </span>
                  {note.content ? (
                    <span
                      className="text-sm block truncate mt-1"
                      style={{ color: "var(--color-text-muted)", lineHeight: "var(--line-height-normal)" }}
                    >
                      {note.content.length > 80 ? `${note.content.slice(0, 80)}…` : note.content}
                    </span>
                  ) : (
                    <span className="text-sm block mt-1 italic" style={{ color: "var(--color-text-muted)" }}>
                      No content
                    </span>
                  )}
                </button>
                {(canDeleteNote && (
                  <div className="flex items-center gap-1 pr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note._id);
                      }}
                      className="btn-icon rounded-lg"
                      style={{
                        padding: "var(--space-sm)",
                        color: "var(--color-error)",
                      }}
                      aria-label={`Delete ${note.title}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )) || (
                  <div className="pr-3 flex items-center">
                    <span
                      className="inline-block w-8 h-8 rounded-lg flex items-center justify-center cursor-not-allowed opacity-50"
                      style={{ color: "var(--color-text-muted)" }}
                      title={DELETE_RESTRICTED_TITLE}
                      aria-hidden
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        </div>
      </main>
      </div>

      {/* Create Note Modal – only when user can create */}
      {showCreateModal && canCreateNote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: "rgba(0, 0, 0, 0.5)" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-note-title"
          onClick={handleCloseCreateModal}
        >
          <div
            className="w-full max-w-md rounded-xl border shadow-xl animate-scale-in"
            style={{
              background: "var(--color-background)",
              borderColor: "var(--color-border-light)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2
                id="create-note-title"
                className="text-xl font-semibold mb-4"
                style={{ color: "var(--color-text-primary)" }}
              >
                New note
              </h2>
              <form onSubmit={handleSubmitCreate}>
                <div className="mb-4">
                  <label
                    htmlFor="create-note-title-input"
                    className="block text-sm font-medium mb-2"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Title <span style={{ color: "var(--color-error)" }}>*</span>
                  </label>
                  <input
                    id="create-note-title-input"
                    type="text"
                    value={createTitle}
                    maxLength={TITLE_MAX_LENGTH}
                    onChange={(e) => {
                      setCreateTitle(e.target.value);
                      setCreateTitleError("");
                    }}
                    placeholder="Note title"
                    autoFocus
                    className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-offset-1"
                    style={{
                      borderColor: createTitleError ? "var(--color-error)" : "var(--color-border-light)",
                      color: "var(--color-text-primary)",
                      fontSize: "var(--font-size-base)",
                    }}
                    aria-invalid={!!createTitleError}
                    aria-describedby={createTitleError ? "create-title-error" : "create-title-hint"}
                  />
                  <div className="flex justify-between items-baseline mt-1">
                    {createTitleError ? (
                      <p id="create-title-error" className="field-error">
                        {createTitleError}
                      </p>
                    ) : (
                      <span id="create-title-hint" className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {createTitle.length}/{TITLE_MAX_LENGTH}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mb-6">
                  <label
                    htmlFor="create-note-content"
                    className="block text-sm font-medium mb-2"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Content (optional)
                  </label>
                  <textarea
                    id="create-note-content"
                    value={createContent}
                    onChange={(e) => setCreateContent(e.target.value)}
                    placeholder="Add some content…"
                    rows={4}
                    className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-offset-1 resize-y"
                    style={{
                      borderColor: "var(--color-border-light)",
                      color: "var(--color-text-primary)",
                      fontSize: "var(--font-size-base)",
                    }}
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={handleCloseCreateModal}
                    className="btn-secondary"
                    style={{ fontSize: "var(--font-size-sm)", padding: "var(--space-sm) var(--space-md)" }}
                    disabled={isSubmittingCreate}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ fontSize: "var(--font-size-sm)", padding: "var(--space-sm) var(--space-md)" }}
                    disabled={isSubmittingCreate}
                    aria-busy={isSubmittingCreate}
                  >
                    {isSubmittingCreate ? "Creating…" : "Create note"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Note Modal */}
      {viewingNote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: "rgba(0, 0, 0, 0.5)" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="view-note-title"
          onClick={() => setViewingNote(null)}
        >
          <div
            className="w-full max-w-lg max-h-[85vh] rounded-xl border shadow-xl animate-scale-in flex flex-col"
            style={{
              background: "var(--color-background)",
              borderColor: "var(--color-border-light)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative p-6 border-b shrink-0" style={{ borderColor: "var(--color-border-light)" }}>
              <h2
                id="view-note-title"
                className="text-xl font-semibold pr-12"
                style={{ color: "var(--color-text-primary)" }}
              >
                {viewingNote.title}
              </h2>
              <div className="absolute top-3 right-3 flex gap-2">
                {activeUsers.length > 0 && (
                  <div className="text-xs text-gray-500">
                    {activeUsers.length} user{activeUsers.length > 1 ? 's' : ''} editing
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowVersionHistory(true)}
                  className="btn-secondary text-xs"
                  style={{ padding: "var(--space-xs) var(--space-sm)" }}
                  aria-label="View version history"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  History
                </button>
                <button
                  type="button"
                  onClick={() => setViewingNote(null)}
                  className="btn-icon"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1 min-h-0">
              {editingNote ? (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-primary)" }}>
                      Title
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-offset-1"
                      style={{
                        borderColor: "var(--color-border-light)",
                        color: "var(--color-text-primary)",
                        fontSize: "var(--font-size-base)",
                      }}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-primary)" }}>
                      Content
                    </label>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={10}
                      className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-offset-1 resize-y"
                      style={{
                        borderColor: "var(--color-border-light)",
                        color: "var(--color-text-primary)",
                        fontSize: "var(--font-size-base)",
                      }}
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="btn-secondary"
                      style={{ fontSize: "var(--font-size-sm)", padding: "var(--space-sm) var(--space-md)" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNote}
                      className="btn-primary"
                      style={{ fontSize: "var(--font-size-sm)", padding: "var(--space-sm) var(--space-md)" }}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {viewingNote.content ? (
                    <p
                      className="whitespace-pre-wrap text-sm leading-relaxed mb-4"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {viewingNote.content}
                    </p>
                  ) : (
                    <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
                      No content yet.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleEditNote}
                    className="btn-primary"
                    style={{ fontSize: "var(--font-size-sm)", padding: "var(--space-sm) var(--space-md)" }}
                  >
                    Edit Note
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {showVersionHistory && viewingNote && (
        <VersionHistoryModal
          noteId={viewingNote._id}
          currentNote={viewingNote}
          onClose={() => setShowVersionHistory(false)}
          onNoteRestored={(restoredNote) => {
            setNotes((prev) => prev.map((note) => (note._id === restoredNote._id ? restoredNote : note)));
            setViewingNote(restoredNote);
            setShowVersionHistory(false);
          }}
        />
      )}
    </div>
  );
}
