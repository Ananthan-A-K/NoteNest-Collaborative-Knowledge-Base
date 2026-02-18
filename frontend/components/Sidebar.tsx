"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import { useUserRole } from "@/contexts/UserRoleContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { type UserRole } from "@/lib/permissions";

export default function Sidebar() {
  const pathname = usePathname();
  const { canAccessManagement } = usePermissions();
  const { role, setRole } = useUserRole();
  const { activeWorkspace } = useWorkspace();

  const linkBase =
    "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2";

  // ✅ ACTIVE LINK (Dark Safe)
  const linkActive = {
    background: "rgba(59, 130, 246, 0.2)",
    color: "#FFFFFF",
  };

  // ✅ INACTIVE LINK (White Text)
  const linkInactive = {
    color: "#E5E7EB",
    opacity: 0.9,
  };

  return (
    <aside
      className="w-60 min-h-screen flex flex-col border-r shrink-0"
      style={{
        background: "#000000", // ✅ FULL BLACK SIDEBAR
        borderColor: "rgba(255,255,255,0.08)",
        color: "#FFFFFF",
      }}
      aria-label="Main navigation"
    >
      {/* HEADER */}
      <header
        className="p-5 border-b"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <Link
          href="/"
          className="font-bold text-xl tracking-tight hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-md px-2 py-1"
          style={{ color: "#FFFFFF" }}
          aria-label="NoteNest home page"
        >
          NoteNest
        </Link>
      </header>

      {/* NAV */}
      <nav
        className="flex-1 p-3 space-y-1"
        role="navigation"
        aria-label="Workspace navigation"
      >
        <Link
          href={`/workspace/${activeWorkspace.id}`}
          className={`${linkBase} flex items-center gap-2`}
          style={
            pathname === `/workspace/${activeWorkspace.id}`
              ? linkActive
              : linkInactive
          }
        >
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          Home
        </Link>

        <Link
          href={`/workspace/${activeWorkspace.id}/dashboard`}
          className={linkBase}
          style={
            pathname === `/workspace/${activeWorkspace.id}/dashboard`
              ? linkActive
              : linkInactive
          }
        >
          Dashboard
        </Link>

        <Link
          href={`/workspace/${activeWorkspace.id}/notes`}
          className={linkBase}
          style={
            pathname === `/workspace/${activeWorkspace.id}/notes`
              ? linkActive
              : linkInactive
          }
        >
          Notes
        </Link>

        {canAccessManagement && (
          <Link
            href="/management"
            className={`${linkBase} flex items-center gap-2`}
            style={pathname === "/management" ? linkActive : linkInactive}
          >
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0..."
              />
            </svg>
            Management
          </Link>
        )}
      </nav>

      {/* FOOTER */}
      <footer
        className="p-4 border-t flex flex-col items-center gap-3"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div className="w-full">
          <label
            htmlFor="role-select"
            className="block text-sm mb-1"
            style={{ color: "#BBBBBB" }}
          >
            Role (for testing)
          </label>

          <select
            id="role-select"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full rounded-lg border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              borderColor: "rgba(255,255,255,0.15)",
              color: "#FFFFFF",
              background: "#111111",
            }}
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
          style={{
            background: "#2563EB",
            color: "#FFFFFF",
          }}
        >
          N
        </div>
      </footer>
    </aside>
  );
}
