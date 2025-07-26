"use client"

import { useState, useEffect, Suspense } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

// Separate component for the profile content that uses useSearchParams
function ProfileContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    skills: "",
    experience: "",
    education: "",
  })
  const [applications, setApplications] = useState([])
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    rejectedApplications: 0,
  })

  const [selectedApplication, setSelectedApplication] = useState(null)
  const [showApplicationModal, setShowApplicationModal] = useState(false)

  const viewApplicationDetails = async (applicationId) => {
    try {
      const response = await fetch(`/api/profile/applications/${applicationId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedApplication(data.application)
        setShowApplicationModal(true)
      }
    } catch (error) {
      console.error("Error fetching application details:", error)
    }
  }

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    if (session.user.role === "ADMIN") {
      router.push("/admin/dashboard")
      return
    }

    // Set active tab from URL parameter
    const tabParam = searchParams.get("tab")
    if (tabParam && ["overview", "profile", "applications"].includes(tabParam)) {
      setActiveTab(tabParam)
    }

    fetchProfileData()
    fetchApplications()
  }, [session, status, router, searchParams])

  const fetchProfileData = async () => {
    try {
      const response = await fetch("/api/profile")
      if (response.ok) {
        const data = await response.json()
        setProfileData(data.profile)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchApplications = async () => {
    try {
      const response = await fetch("/api/profile/applications")
      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications || [])
        setStats(data.stats || stats)
      }
    } catch (error) {
      console.error("Error fetching applications:", error)
    }
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      })

      if (response.ok) {
        const data = await response.json()
        setProfileData(data.profile)
      }
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "ACCEPTED":
        return "bg-green-100 text-green-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      case "ON_HOLD":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const tabs = [
    { id: "overview", name: "Overview", icon: "👤" },
    { id: "profile", name: "Edit Profile", icon: "✏️" },
    { id: "applications", name: "My Applications", icon: "📋" }
  ]

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session || session.user.role === "ADMIN") {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full -translate-y-16 translate-x-16 opacity-10"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400 to-indigo-500 rounded-full translate-y-12 -translate-x-12 opacity-10"></div>

            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-3xl font-bold">{session.user.name?.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Welcome back,{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                      {session.user.name}
                    </span>
                    ! 👋
                  </h1>
                  <p className="text-gray-600 text-lg">Manage your profile and track your job applications</p>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-lg">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{stats.totalApplications}</div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Applications</h3>
              <p className="text-gray-600 text-sm">All submitted applications</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-600 p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{stats.pendingApplications}</div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Pending</h3>
              <p className="text-gray-600 text-sm">Awaiting review</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{stats.acceptedApplications}</div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Accepted</h3>
              <p className="text-gray-600 text-sm">Successful applications</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-r from-red-500 to-pink-600 p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{stats.rejectedApplications}</div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Rejected</h3>
              <p className="text-gray-600 text-sm">Unsuccessful applications</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-8">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    Profile Overview
                  </h3>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100">
                        <h4 className="font-semibold text-gray-900 mb-4">Personal Information</h4>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <svg
                              className="w-5 h-5 text-blue-500 mr-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                              />
                            </svg>
                            <span className="text-gray-700">{profileData.email || session.user.email}</span>
                          </div>
                          {profileData.phone && (
                            <div className="flex items-center">
                              <svg
                                className="w-5 h-5 text-blue-500 mr-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                />
                              </svg>
                              <span className="text-gray-700">{profileData.phone}</span>
                            </div>
                          )}
                          {profileData.location && (
                            <div className="flex items-center">
                              <svg
                                className="w-5 h-5 text-blue-500 mr-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              <span className="text-gray-700">{profileData.location}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {profileData.bio && (
                        <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-xl border border-green-100">
                          <h4 className="font-semibold text-gray-900 mb-3">About Me</h4>
                          <p className="text-gray-700 leading-relaxed">{profileData.bio}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      {profileData.skills && (
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                          <h4 className="font-semibold text-gray-900 mb-3">Skills</h4>
                          <div className="flex flex-wrap gap-2">
                            {profileData.skills.split(",").map((skill, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                              >
                                {skill.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {profileData.experience && (
                        <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border border-orange-100">
                          <h4 className="font-semibold text-gray-900 mb-3">Experience</h4>
                          <p className="text-gray-700 leading-relaxed">{profileData.experience}</p>
                        </div>
                      )}

                      {profileData.education && (
                        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100">
                          <h4 className="font-semibold text-gray-900 mb-3">Education</h4>
                          <p className="text-gray-700 leading-relaxed">{profileData.education}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <div className="bg-gradient-to-r from-green-500 to-teal-600 p-2 rounded-lg mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    Quick Actions
                  </h3>

                  <div className="grid md:grid-cols-3 gap-6">
                    <Link
                      href="/jobs"
                      className="group block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                      <div className="flex items-center justify-center mb-4">
                        <svg
                          className="w-8 h-8 group-hover:scale-110 transition-transform duration-200"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-center">Browse Jobs</h4>
                      <p className="text-blue-100 text-center text-sm mt-2">Find your next opportunity</p>
                    </Link>

                    <button
                      onClick={() => setActiveTab("profile")}
                      className="group block bg-white hover:bg-gray-50 text-gray-800 p-6 rounded-xl transition-all duration-300 border-2 border-gray-200 hover:border-blue-300 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                    >
                      <div className="flex items-center justify-center mb-4">
                        <svg
                          className="w-8 h-8 text-gray-600 group-hover:scale-110 transition-transform duration-200"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-center">Update Profile</h4>
                      <p className="text-gray-600 text-center text-sm mt-2">Keep your info current</p>
                    </button>

                    <button
                      onClick={() => setActiveTab("applications")}
                      className="group block bg-white hover:bg-gray-50 text-gray-800 p-6 rounded-xl transition-all duration-300 border-2 border-gray-200 hover:border-blue-300 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                    >
                      <div className="flex items-center justify-center mb-4">
                        <svg
                          className="w-8 h-8 text-gray-600 group-hover:scale-110 transition-transform duration-200"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-center">View Applications</h4>
                      <p className="text-gray-600 text-center text-sm mt-2">Track your progress</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Profile Tab */}
            {activeTab === "profile" && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </div>
                  Edit Profile
                </h3>

                <form onSubmit={handleProfileUpdate} className="space-y-8 text-black">
                  {/* Personal Information */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                        <input
                          type="text"
                          name="name"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                          value={profileData.name || session.user.name}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          name="email"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                          value={profileData.email || session.user.email}
                          onChange={handleInputChange}
                          disabled
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                        <input
                          type="tel"
                          name="phone"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                          placeholder="(555) 123-4567"
                          value={profileData.phone}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                        <input
                          type="text"
                          name="location"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                          placeholder="City, State"
                          value={profileData.location}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h4>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                        <textarea
                          name="bio"
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                          placeholder="Tell us about yourself..."
                          value={profileData.bio}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Skills</label>
                        <input
                          type="text"
                          name="skills"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                          placeholder="JavaScript, React, Node.js (comma separated)"
                          value={profileData.skills}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Experience</label>
                        <textarea
                          name="experience"
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                          placeholder="Describe your work experience..."
                          value={profileData.experience}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Education</label>
                        <textarea
                          name="education"
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                          placeholder="Describe your educational background..."
                          value={profileData.education}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Saving...
                        </div>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Applications Tab */}
            {activeTab === "applications" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                    <div className="bg-gradient-to-r from-green-500 to-teal-600 p-2 rounded-lg mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                    My Applications ({applications.length})
                  </h3>
                  
                  {applications.length > 0 && (
                    <div className="flex space-x-2">
                      <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="ACCEPTED">Accepted</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="ON_HOLD">On Hold</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {applications.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">No applications yet</h4>
                      <p className="text-gray-500 mb-4">Start applying to jobs to see your applications here</p>
                      <Link
                        href="/jobs"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        Browse Jobs
                      </Link>
                    </div>
                  ) : (
                    applications.map((application) => (
                      <div
                        key={application.id}
                        className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
                      >
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-3">
                                <h4 className="text-xl font-bold text-gray-900">{application.job.title}</h4>
                                <span
                                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}
                                >
                                  <div
                                    className={`w-2 h-2 rounded-full mr-2 ${
                                      application.status === 'PENDING' ? 'bg-yellow-400' :
                                      application.status === 'ACCEPTED' ? 'bg-green-400' :
                                      application.status === 'REJECTED' ? 'bg-red-400' : 'bg-gray-400'
                                    }`}
                                  ></div>
                                  {application.status}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-3 mb-4">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                    />
                                  </svg>
                                  {application.job.department}
                                </span>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                  </svg>
                                  {application.job.location}
                                </span>
                                {application.job.salary && (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                      />
                                    </svg>
                                    {application.job.salary}
                                  </span>
                                )}
                                {application.job.publisher && (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                      />
                                    </svg>
                                    {application.job.publisher.name}
                                  </span>
                                )}
                              </div>

                              {/* Application Timeline */}
                              {application.actionLogs && application.actionLogs.length > 0 && (
                                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                  <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    Application Timeline
                                  </h5>
                                  <div className="space-y-2">
                                    {application.actionLogs.slice(0, 3).map((log, index) => (
                                      <div key={log.id} className="flex items-center text-sm">
                                        <div
                                          className={`w-2 h-2 rounded-full mr-3 ${
                                            log.newStatus === 'PENDING' ? 'bg-yellow-400' :
                                            log.newStatus === 'ACCEPTED' ? 'bg-green-400' :
                                            log.newStatus === 'REJECTED' ? 'bg-red-400' : 'bg-gray-400'
                                          }`}
                                        ></div>
                                        <span className="text-gray-700 flex-1">{log.action}</span>
                                        <span className="text-gray-500 text-xs">
                                          {new Date(log.createdAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                    ))}
                                    {application.actionLogs.length > 3 && (
                                      <div className="text-xs text-gray-500 ml-5">
                                        +{application.actionLogs.length - 3} more updates
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <div className="flex items-center text-gray-500">
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  <span className="text-sm">
                                    Applied {new Date(application.createdAt).toLocaleDateString()}
                                  </span>
                                  {application.updatedAt !== application.createdAt && (
                                    <>
                                      <span className="mx-2">•</span>
                                      <span className="text-sm">
                                        Updated {new Date(application.updatedAt).toLocaleDateString()}
                                      </span>
                                    </>
                                  )}
                                </div>

                                <div className="flex space-x-3">
                                  <button
                                    onClick={() => viewApplicationDetails(application.id)}
                                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 text-sm"
                                  >
                                    View Details
                                  </button>
                                  <Link
                                    href={`/jobs/${application.job.id}`}
                                    className="text-purple-600 hover:text-purple-800 font-medium transition-colors duration-200 text-sm"
                                  >
                                    View Job →
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Application Details Modal */}
      {showApplicationModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Application Details</h3>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Job Information */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Job Information</h4>
                    <div className="space-y-3">
                      <div>
                        <h5 className="font-medium text-gray-900">{selectedApplication.job.title}</h5>
                        <p className="text-gray-600">
                          {selectedApplication.job.department} • {selectedApplication.job.location}
                        </p>
                      </div>
                      {selectedApplication.job.salary && (
                        <div>
                          <span className="text-sm text-gray-500">Salary: </span>
                          <span className="font-medium text-gray-900">{selectedApplication.job.salary}</span>
                        </div>
                      )}
                      {selectedApplication.job.publisher && (
                        <div>
                          <span className="text-sm text-gray-500">Company: </span>
                          <span className="font-medium text-gray-900">{selectedApplication.job.publisher.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Application Status */}
                  <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-xl border border-green-100">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h4>
                    <div className="flex items-center">
                      <span
                        className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedApplication.status)}`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full mr-2 ${
                            selectedApplication.status === "PENDING"
                              ? "bg-yellow-400"
                              : selectedApplication.status === "ACCEPTED"
                                ? "bg-green-400"
                                : selectedApplication.status === "REJECTED"
                                  ? "bg-red-400"
                                  : "bg-gray-400"
                          }`}
                        ></div>
                        {selectedApplication.status}
                      </span>
                    </div>
                    <div className="mt-3 text-sm text-gray-600">
                      <p>Applied: {new Date(selectedApplication.createdAt).toLocaleDateString()}</p>
                      {selectedApplication.updatedAt !== selectedApplication.createdAt && (
                        <p>Last Updated: {new Date(selectedApplication.updatedAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>

                  {/* Resume */}
                  {selectedApplication.resumeUrl && (
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border border-orange-100">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Resume</h4>
                      <div className="flex items-center">
                        <svg className="w-8 h-8 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <div>
                          <p className="font-medium text-gray-900">Resume.pdf</p>
                          <a
                            href={selectedApplication.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Application Timeline & Answers */}
                <div className="space-y-6">
                  {/* Full Timeline */}
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Application Timeline</h4>
                    <div className="space-y-4">
                      {selectedApplication.actionLogs.map((log, index) => (
                        <div key={log.id} className="flex items-start">
                          <div
                            className={`w-3 h-3 rounded-full mt-1 mr-4 ${
                              log.newStatus === "PENDING"
                                ? "bg-yellow-400"
                                : log.newStatus === "ACCEPTED"
                                  ? "bg-green-400"
                                  : log.newStatus === "REJECTED"
                                    ? "bg-red-400"
                                    : "bg-gray-400"
                            }`}
                          ></div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{log.action}</p>
                            {log.notes && <p className="text-sm text-gray-600 mt-1">{log.notes}</p>}
                            <p className="text-xs text-gray-500 mt-1">{new Date(log.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Application Answers */}
                  {selectedApplication.answers && Object.keys(selectedApplication.answers).length > 0 && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Answers</h4>
                      <div className="space-y-4">
                        {Object.entries(selectedApplication.answers).map(([questionIndex, answer], index) => (
                          <div key={index}>
                            <p className="font-medium text-gray-900 mb-2">Question {Number.parseInt(questionIndex) + 1}:</p>
                            <p className="text-gray-700 bg-white p-3 rounded-lg border">{answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-xl transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Loading fallback component
function ProfilePageFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  )
}

// Main component that wraps ProfileContent with Suspense
export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfilePageFallback />}>
      <ProfileContent />
    </Suspense>
  )
}