"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { usePermissions } from "@/hooks/usePermissions";
import FeatureFlagExample from "@/components/FeatureFlagExample";
import { apiService } from "@/lib/api";

interface Group {
  _id: string;
  name: string;
  description?: string;
  members: string[];
  path: string;
}

interface Permission {
  _id: string;
  resourcePath: string;
  subjectId: string;
  subjectType: 'user' | 'group';
  permissions: string[];
  expiresAt?: string;
}

export default function ManagementPage() {
  const { canAccessManagement, isAdmin } = usePermissions();
  const [groups, setGroups] = useState<Group[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'groups' | 'permissions' | 'access-links'>('groups');

  if (!canAccessManagement) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header title="Management" />
          <main className="flex-1 p-6 overflow-auto flex items-center justify-center bg-black">
            <div className="max-w-md rounded-xl p-6 text-center" style={{ background: "#0b0b0b", border: "1px solid #1f1f1f", boxShadow: "0 10px 40px rgba(0,0,0,0.9)" }}>
              <p className="text-sm font-medium mb-2 text-white">
                Admin only
              </p>
              <p className="text-sm mb-6 text-gray-400">
                You need the Admin role to access Management. This area is for workspace settings, members, and roles.
              </p>
              <Link
                href="/dashboard"
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-5 py-2 transition-colors text-sm font-medium"
              >
                Back to Dashboard
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Management" />
        <main className="flex-1 p-6 overflow-auto bg-black text-white">
          <div className="max-w-4xl mx-auto">
            <section
              className="rounded-2xl p-6 mb-8"
              style={{ background: "#0b0b0b", border: "1px solid #1f1f1f", boxShadow: "0 10px 40px rgba(0,0,0,0.9)" }}
            >
              <h2 className="text-xl font-semibold mb-2 text-white">
                Hierarchical RBAC Management
              </h2>
              <p className="text-sm mb-6 text-gray-400">
                Manage groups, permissions, and access links for granular control over workspace resources.
              </p>

              {/* Tabs */}
              <div className="flex space-x-1 mb-6 border-b border-[#222] pb-1">
                {[
                  { id: 'groups', label: 'Groups' },
                  { id: 'permissions', label: 'Permissions' },
                  { id: 'access-links', label: 'Access Links' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[#1f1f1f] text-white border-t border-x border-[#333]'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1a1a]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === 'groups' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-semibold text-white">
                      User Groups
                    </h3>
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm transition font-medium">Create Group</button>
                  </div>
                  <div className="space-y-3">
                    {groups.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 border border-[#222] rounded-xl bg-[#0f0f0f]">
                        <p className="text-sm">No groups created yet.</p>
                      </div>
                    ) : (
                      groups.map((group) => (
                        <div key={group._id} className="flex items-center justify-between p-4 border border-[#222] bg-[#0f0f0f] rounded-xl hover:border-gray-500/40 transition">
                          <div>
                            <p className="font-medium text-white">{group.name}</p>
                            <p className="text-sm text-gray-400">{group.members.length} members</p>
                          </div>
                          <div className="flex space-x-3">
                            <button className="text-sm text-blue-400 hover:text-blue-300 transition">Edit</button>
                            <button className="text-sm text-red-500 hover:text-red-400 transition">Delete</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'permissions' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-semibold text-white">
                      Resource Permissions
                    </h3>
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm transition font-medium">Grant Permission</button>
                  </div>
                  <div className="space-y-3">
                    {permissions.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 border border-[#222] rounded-xl bg-[#0f0f0f]">
                        <p className="text-sm">No permissions granted yet.</p>
                      </div>
                    ) : (
                      permissions.map((perm) => (
                        <div key={perm._id} className="flex items-center justify-between p-4 border border-[#222] bg-[#0f0f0f] rounded-xl hover:border-gray-500/40 transition">
                          <div>
                            <p className="font-medium text-white">{perm.resourcePath}</p>
                            <p className="text-sm text-gray-400">
                              {perm.subjectType}: {perm.subjectId} - {perm.permissions.join(', ')}
                            </p>
                          </div>
                          <button className="text-sm text-red-500 hover:text-red-400 transition">Revoke</button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'access-links' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-semibold text-white">
                      Temporary Access Links
                    </h3>
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm transition font-medium">Create Access Link</button>
                  </div>
                  <div className="text-center py-8 text-gray-400 border border-[#222] rounded-xl bg-[#0f0f0f]">
                    <p className="text-sm">Access links functionality coming soon.</p>
                  </div>
                </div>
              )}
            </section>

            <section
              className="rounded-2xl p-6"
              style={{ background: "#0b0b0b", border: "1px solid #1f1f1f", boxShadow: "0 10px 40px rgba(0,0,0,0.9)" }}
            >
              <h2 className="text-xl font-semibold mb-2 text-white">
                Feature Flags
              </h2>
              <p className="text-sm mb-6 text-gray-400">
                Control experimental and optional features. Changes are saved automatically.
              </p>
              <FeatureFlagExample />
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
