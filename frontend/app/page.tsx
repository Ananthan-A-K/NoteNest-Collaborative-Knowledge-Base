"use client";

import Link from "next/link";
import { useUserRole } from "@/contexts/UserRoleContext";

export default function Home() {
  const { isAuthenticated } = useUserRole();

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">NoteNest</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              {!isAuthenticated ? (
                <>
                  <Link href="#features" className="text-gray-700 hover:text-blue-600">Features</Link>
                  <Link href="#pricing" className="text-gray-700 hover:text-blue-600">Pricing</Link>
                  <Link href="/login" className="text-gray-700 hover:text-blue-600">Login</Link>
                  <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Get Started</Link>
                </>
              ) : (
                <>
                  <button className="text-gray-700 hover:text-blue-600">🔔</button>
                  <Link href="/profile" className="text-gray-700 hover:text-blue-600">Profile</Link>
                  <button className="text-gray-700 hover:text-blue-600">Logout</button>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to NoteNest
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Collaborative knowledge base for teams. Capture, organize, and share knowledge seamlessly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard" className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700">
              Create Your First Note
            </Link>
            <button className="border border-gray-300 text-gray-700 px-8 py-3 rounded-md hover:bg-gray-50">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Features</h3>
            <p className="text-xl text-gray-600">Everything you need to collaborate effectively</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-4xl mb-4">📝</div>
              <h4 className="text-xl font-semibold mb-2">Collaborative Notes</h4>
              <p className="text-gray-600">Write and edit notes together in real time.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-4xl mb-4">📂</div>
              <h4 className="text-xl font-semibold mb-2">Organized Spaces</h4>
              <p className="text-gray-600">Group notes by projects, teams, or topics.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-4xl mb-4">🔍</div>
              <h4 className="text-xl font-semibold mb-2">Powerful Search</h4>
              <p className="text-gray-600">Find information quickly across all notes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold mb-6">Ready to Get Started?</h3>
          <p className="text-xl mb-8">Join teams worldwide using NoteNest</p>
          <Link href="/login" className="bg-white text-blue-600 px-8 py-3 rounded-md hover:bg-gray-100">
            Get Started for Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4">NoteNest</h4>
              <p className="text-gray-400">Collaborative knowledge base for teams</p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Product</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Company</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Support</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 NoteNest. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
