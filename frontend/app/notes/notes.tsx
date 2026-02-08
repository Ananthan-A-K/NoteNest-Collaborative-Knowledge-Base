"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import { SkeletonList } from "@/components/Skeleton";

interface Note {
  id: number;
  title: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading notes (no backend)
    const timer = setTimeout(() => {
      setNotes([
        { id: 1, title: "Project Overview" },
        { id: 2, title: "Meeting Notes" },
      ]);
      setLoadError(null);
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const retryLoad = () => {
    setLoadError(null);
    setIsLoading(true);
    setTimeout(() => {
      setNotes([
        { id: 1, title: "Project Overview" },
        { id: 2, title: "Meeting Notes" },
      ]);
      setIsLoading(false);
    }, 600);
  };

  const handleCreateNote = () => {
    setActionError(null);
    // In a real app, this would open a modal or navigate to create page
    console.log("Create note clicked");
  };

  const handleDeleteNote = (id: number) => {
    setActionError(null);
    setNotes(notes.filter((note) => note.id !== id));
  };

  return (
    <div className="flex">
      <Sidebar />

      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>Notes</h1>
          <button
            onClick={handleCreateNote}
            className="btn-primary"
            style={{
              fontSize: "var(--font-size-sm)",
              padding: "var(--space-sm) var(--space-md)",
              minHeight: "36px",
            }}
          >
            Create Note
          </button>
        </div>

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
            className="animate-fade-in bg-white rounded-lg border p-6"
            style={{
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
            description="Get started by creating your first note. Organize your thoughts, ideas, and knowledge in one place."
            action={
              <button
                onClick={handleCreateNote}
                className="btn-primary"
                style={{
                  fontSize: "var(--font-size-base)",
                  padding: "var(--space-sm) var(--space-lg)",
                }}
              >
                Create Your First Note
              </button>
            }
          />
          </div>
        ) : (
          <ul className="state-content-enter space-y-2">
            {notes.map((note, index) => (
              <li
                key={note.id}
                className="animate-fade-in-up bg-white p-4 rounded-lg shadow-sm border flex items-center justify-between group hover-lift"
                style={{
                  borderColor: "var(--color-border-light)",
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>{note.title}</span>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-500 hover:text-red-700 p-1"
                  aria-label={`Delete ${note.title}`}
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    padding: 'var(--space-xs)'
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
