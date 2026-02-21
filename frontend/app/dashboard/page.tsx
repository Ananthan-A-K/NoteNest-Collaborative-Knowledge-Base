"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { usePermissions } from "@/hooks/usePermissions";
import RouteGuard from "@/components/RouteGuard";

const CREATE_RESTRICTED_TITLE =
  "You need Editor or Admin role to create notes.";

/* ✅ Time Ago Formatter */
function getTimeAgo(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);

  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 10) return "Just now";
  if (seconds < 60) return `${seconds} sec ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}

export default function DashboardPage() {
  const { canCreateNote } = usePermissions();

  /* ✅ Badge Color Logic (NEW) */
  const getWorkspaceBadgeClass = (workspace: string) => {
    switch (workspace) {
      case "Team":
        return "bg-purple-500/10 text-purple-400";
      case "Personal":
        return "bg-blue-500/10 text-blue-400";
      case "Product":
        return "bg-green-500/10 text-green-400";
      default:
        return "bg-gray-500/10 text-gray-400";
    }
  };

  /* ✅ UPDATED — Use timestamps instead of text */
  const [recentNotes] = useState([
    {
      id: 1,
      title: "Project Plan",
      workspace: "Team",
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: "Meeting Notes",
      workspace: "Personal",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      title: "Design Ideas",
      workspace: "Product",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]);

  useEffect(() => {
    document.body.style.background = "#000";
    document.documentElement.style.background = "#000";
  }, []);

  const cardStyle = {
    background: "#0b0b0b",
    border: "1px solid #1f1f1f",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.9)",
  };

  return (
    <RouteGuard requireAuth>
      <div style={{ background: "#000", minHeight: "100vh", display: "flex" }}>
        <Sidebar />

        <div style={{ flex: 1, background: "#000" }}>
          <Header title="Dashboard" showSearch />

          <main style={{ background: "#000", minHeight: "100vh", padding: 32 }}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>

              {/* Welcome Section */}
              <section className="p-6 rounded-2xl" style={{ ...cardStyle }}>
                <h2 className="text-xl font-semibold mb-2 text-white">
                  Welcome back!
                </h2>

                <p className="text-sm mb-3 text-gray-400">
                  This is your NoteNest dashboard. Get started by creating your
                  first note and organizing your team's knowledge.
                </p>
              </section>

              {/* Quick Actions */}
              <section className="rounded-2xl mt-6 overflow-hidden" style={{ ...cardStyle }}>
                <div className="px-5 py-4 border-b border-[#222]">
                  <h3 className="text-white font-semibold">Quick Actions</h3>
                </div>

                <div className="p-5 flex gap-3">
                  {canCreateNote && (
                    <Link href="/notes?new=1" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition">
                      Create Note
                    </Link>
                  )}

                  <Link
                    href="/notes"
                    className="border border-[#333] hover:bg-[#1a1a1a] text-white px-4 py-2 rounded-lg font-medium transition"
                  >
                    View All Notes
                  </Link>
                </div>
              </section>

              {/* Recent Notes */}
              <section className="rounded-2xl mt-8 overflow-hidden" style={{ ...cardStyle }}>
                <div className="px-5 py-4 border-b border-[#222]">
                  <h3 className="text-gray-200 font-semibold flex items-center gap-2">
                    Recent Notes
                    <span className="bg-purple-500/15 text-purple-400 px-2.5 py-0.5 rounded-full text-xs font-medium">
                      {recentNotes.length}
                    </span>
                  </h3>
                </div>

                <div className="p-5">
                  {recentNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <div className="text-2xl mb-3">📝</div>
                      <div className="text-lg font-medium mb-1">
                        No recent notes
                      </div>
                      <div className="text-sm">
                        Start by creating your first note.
                      </div>

                      {canCreateNote && (
                        <Link
                          href="/notes?new=1"
                          className="mt-4 px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-sm transition"
                        >
                          Create Note
                        </Link>
                      )}
                    </div>
                  ) : (
                    recentNotes.map((note) => (
                      <div
                        key={note.id}
                        className="transition-all duration-200 ease-in-out hover:scale-[1.01] hover:shadow-lg cursor-pointer p-4 border border-[#222] hover:border-gray-500/40 rounded-xl mb-3 bg-[#0f0f0f]"
                      >
                        <div className="text-white font-semibold mb-1">
                          {note.title}
                        </div>

                        <div className={`text-sm font-medium ${getWorkspaceBadgeClass(note.workspace)} inline-block px-2 rounded mb-2`}>
                          {note.workspace}
                        </div>

                        <div className="text-gray-500 text-xs">
                          {getTimeAgo(note.createdAt)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

            </div>
          </main>
        </div>
      </div>
    </RouteGuard>
  );
}
