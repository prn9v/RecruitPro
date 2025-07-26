"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function ApplicationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState({})
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState("")
  const [filters, setFilters] = useState({
    status: "",
    job: "",
    search: "",
  })
  const [jobs, setJobs] = useState([])

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user.role !== "ADMIN") {
      router.push("/auth/signin")
      return
    }

    fetchApplications()
    fetchJobs()
  }, [session, status, router, filters])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const queryParams = new URLSearchParams()
      if (filters.status) queryParams.append("status", filters.status)
      if (filters.job) queryParams.append("jobId", filters.job)
      if (filters.search) queryParams.append("search", filters.search)

      const response = await fetch(`/api/admin/applications?${queryParams}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch applications: ${response.status}`)
      }
      
      const data = await response.json()
      setApplications(data.applications || [])
    } catch (error) {
      console.error("Error fetching applications:", error)
      setError("Failed to load applications. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/admin/jobs")
      
      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.status}`)
      }
      
      const data = await response.json()
      setJobs(data.jobs || [])
    } catch (error) {
      console.error("Error fetching jobs:", error)
    }
  }

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [applicationId]: true }))
      setError(null)
      setSuccessMessage("")

      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to update status: ${response.status}`)
      }

      const data = await response.json()
      setSuccessMessage(`Application ${newStatus.toLowerCase()} successfully!`)
      
      // Refresh the applications list
      await fetchApplications()
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("")
      }, 3000)
      
    } catch (error) {
      console.error("Error updating application:", error)
      setError(error.message || "Failed to update application status")
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setError(null)
      }, 5000)
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [applicationId]: false }))
    }
  }

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session || session.user.role !== "ADMIN") {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full -translate-y-16 translate-x-16 opacity-10"></div>

            <div className="relative flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  All{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                    Applications
                  </span>
                  📋
                </h1>
                <p className="text-gray-600 text-lg">Review and manage job applications from candidates</p>
              </div>
              <div className="hidden md:block">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4 rounded-2xl shadow-lg">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {successMessage}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 mb-8">
          <div className="flex items-center mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Filter Applications</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">🔍 Search Applicants</label>
              <input
                type="text"
                name="search"
                placeholder="Search by name or email..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">📊 Status</label>
              <select
                name="status"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">⏳ Pending</option>
                <option value="ACCEPTED">✅ Accepted</option>
                <option value="REJECTED">❌ Rejected</option>
                <option value="ON_HOLD">⏸️ On Hold</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">💼 Job Position</label>
              <select
                name="job"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                value={filters.job}
                onChange={handleFilterChange}
              >
                <option value="">All Jobs</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-6">
          {applications.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 border border-gray-100 text-center">
              <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">No applications found</h3>
              <p className="text-gray-600 text-lg">No applications match your current filters</p>
            </div>
          ) : (
            applications.map((application) => (
              <div
                key={application.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
              >
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-12 h-12 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {application.applicant.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{application.applicant.name}</h3>
                        <p className="text-gray-600 mb-2">{application.applicant.email}</p>
                        <div className="flex items-center space-x-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {application.job.title}
                          </span>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                            {application.job.department}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}
                      >
                        {application.status}
                      </span>
                      <p className="text-sm text-gray-500 mt-2">
                        Applied {new Date(application.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Application Actions */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => updateApplicationStatus(application.id, "ACCEPTED")}
                        disabled={updatingStatus[application.id]}
                        className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                      >
                        {updatingStatus[application.id] ? (
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        )}
                        {updatingStatus[application.id] ? "Updating..." : "Accept"}
                      </button>
                      <button
                        onClick={() => updateApplicationStatus(application.id, "REJECTED")}
                        disabled={updatingStatus[application.id]}
                        className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                      >
                        {updatingStatus[application.id] ? (
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        {updatingStatus[application.id] ? "Updating..." : "Reject"}
                      </button>
                      <button
                        onClick={() => updateApplicationStatus(application.id, "ON_HOLD")}
                        disabled={updatingStatus[application.id]}
                        className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                      >
                        {updatingStatus[application.id] ? (
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        )}
                        {updatingStatus[application.id] ? "Updating..." : "Hold"}
                      </button>
                    </div>

                   
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
