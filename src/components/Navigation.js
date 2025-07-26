"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { useState } from "react"

export default function Navigation() {
  const { data: session, status } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  return (
    <nav className="bg-white shadow-lg fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-blue-600">RecruitPro</h1>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/jobs" className="text-gray-700 hover:text-blue-600 transition-colors">
              Jobs
            </Link>

            {session ? (
              <>
                {session.user.role === "ADMIN" && (
                  <>
                    <Link href="/admin/dashboard" className="text-gray-700 hover:text-blue-600 transition-colors">
                      Admin Dashboard
                    </Link>
                    <Link href="/admin/jobs/create" className="text-gray-700 hover:text-blue-600 transition-colors">
                      Post Job
                    </Link>
                  </>
                )}

                {session.user.role === "USER" && (
                  <Link href="/profile" className="text-gray-700 hover:text-blue-600 transition-colors">
                    Profile
                  </Link>
                )}

                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">Hi, {session.user.name}</span>
                  <button onClick={handleSignOut} className="text-gray-700 hover:text-blue-600 transition-colors cursor-pointer">
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/auth/signin" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Sign In
                </Link>
                <Link href="/auth/signup" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 cursor-pointer transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              <Link href="/jobs" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
                Jobs
              </Link>

              {session ? (
                <>
                  {session.user.role === "ADMIN" && (
                    <>
                      <Link href="/admin/dashboard" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
                        Admin Dashboard
                      </Link>
                      <Link href="/admin/jobs/create" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
                        Post Job
                      </Link>
                    </>
                  )}

                  {session.user.role === "USER" && (
                    <Link href="/profile" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
                      Profile
                    </Link>
                  )}

                  <button
                    onClick={handleSignOut}
                    className="block w-full cursor-pointer text-left px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/signin" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
                    Sign In
                  </Link>
                  <Link href="/auth/signup" className="block px-3 py-2 text-gray-700 hover:text-blue-600">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
