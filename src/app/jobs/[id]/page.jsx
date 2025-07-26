"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [applicationData, setApplicationData] = useState({
    answers: {},
    resumeFile: null,
  })
  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    if (params.id) {
      fetchJob()
      if (session) {
        checkApplicationStatus()
      }
    }
  }, [params.id, session])

  const fetchJob = async () => {
    try {
      const response = await fetch(`/api/jobs/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setJob(data.job)
      } else {
        router.push("/jobs")
      }
    } catch (error) {
      console.error("Error fetching job:", error)
      router.push("/jobs")
    } finally {
      setLoading(false)
    }
  }

  const checkApplicationStatus = async () => {
    try {
      const response = await fetch(`/api/applications?jobId=${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setHasApplied(data.applications && data.applications.length > 0)
      }
    } catch (error) {
      console.error("Error checking application status:", error)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Validate resume if required
    if (job.resumeRequired && !applicationData.resumeFile) {
      newErrors.resume = "Resume is required for this position"
    }

    // Validate custom questions
    if (job.customQuestions && job.customQuestions.length > 0) {
      job.customQuestions.forEach((question, index) => {
        const questionKey = question.id ? question.id.toString() : question.question;
        if (question.required && (!applicationData.answers[questionKey] || applicationData.answers[questionKey].trim() === "")) {
          newErrors[`question_${index}`] = `This question is required`
        }
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleApplicationSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setApplying(true)
    setErrors({})

    try {
      const formData = new FormData()
      formData.append("jobId", params.id)
      formData.append("answers", JSON.stringify(applicationData.answers))
      
      if (applicationData.resumeFile) {
        formData.append("resume", applicationData.resumeFile)
      }

      const response = await fetch("/api/applications", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setSuccessMessage("Application submitted successfully!")
        setShowApplicationForm(false)
        setApplicationData({ answers: {}, resumeFile: null })
        setHasApplied(true)
      } else {
        setErrors({ submit: data.error || "Failed to submit application" })
      }
    } catch (error) {
      console.error("Error submitting application:", error)
      setErrors({ submit: "Network error. Please try again." })
    } finally {
      setApplying(false)
    }
  }

  const handleAnswerChange = (questionIndex, answer) => {
    const question = job.customQuestions[questionIndex];
    const questionKey = question.id ? question.id.toString() : question.question;
    
    setApplicationData((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionKey]: answer,
      },
    }))
    
    // Clear error for this question
    if (errors[`question_${questionIndex}`]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[`question_${questionIndex}`]
        return newErrors
      })
    }
  }

  const handleFileChange = (file) => {
    setApplicationData((prev) => ({ ...prev, resumeFile: file }))
    
    // Clear resume error
    if (errors.resume) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.resume
        return newErrors
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Job not found</h1>
          <Link href="/jobs" className="text-blue-600 hover:text-blue-800">
            Back to Jobs
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl relative">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {successMessage}
            </div>
            <button
              onClick={() => setSuccessMessage("")}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full -translate-y-16 translate-x-16 opacity-10"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-400 to-blue-500 rounded-full translate-y-12 -translate-x-12 opacity-10"></div>

            <div className="relative">
              {/* Breadcrumb */}
              <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
                <Link href="/jobs" className="hover:text-blue-600 transition-colors duration-200">
                  Jobs
                </Link>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-gray-900 font-medium">{job.title}</span>
              </nav>

              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">{job.title}</h1>
                  <div className="flex flex-wrap gap-4 mb-6">
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      {job.department}
                    </span>
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      {job.location}
                    </span>
                    {job.salary && (
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                          />
                        </svg>
                        {job.salary}
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${job.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full mr-2 ${job.status === "ACTIVE" ? "bg-green-400" : "bg-gray-400"}`}
                      ></div>
                      {job.status}
                    </span>
                  </div>
                </div>

                <div className="hidden md:block">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-2xl shadow-lg">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex items-center text-gray-500 mb-6">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                {job.publisher && (
                  <>
                    <span className="mx-2">•</span>
                    <span>by {job.publisher.name}</span>
                  </>
                )}
              </div>

              {/* Apply Button */}
              <div className="flex items-center space-x-4">
                {!session ? (
                  <Link
                    href="/auth/signin"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Sign In to Apply
                  </Link>
                ) : hasApplied ? (
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center px-6 py-4 rounded-xl text-green-800 bg-green-100 font-semibold">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Application Submitted
                    </span>
                    <Link
                      href="/profile?tab=applications"
                      className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                    >
                      View Status →
                    </Link>
                  </div>
                ) : job.status === "ACTIVE" ? (
                  <button
                    onClick={() => setShowApplicationForm(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Apply Now
                  </button>
                ) : (
                  <span className="inline-flex items-center px-6 py-4 rounded-xl text-gray-600 bg-gray-100 font-semibold">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Position Closed
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Job Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Job Description */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 ml-4">Job Description</h2>
              </div>
              <div className="prose prose-lg max-w-none text-gray-700">
                <p className="whitespace-pre-line leading-relaxed">{job.description}</p>
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-r from-green-500 to-teal-600 p-3 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 ml-4">Requirements</h2>
              </div>
              <div className="prose prose-lg max-w-none text-gray-700">
                <p className="whitespace-pre-line leading-relaxed">{job.requirements}</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Info</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-lg mr-3">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Department</p>
                    <p className="font-medium text-gray-900">{job.department}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="bg-purple-100 p-2 rounded-lg mr-3">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium text-gray-900">{job.location}</p>
                  </div>
                </div>

                {job.salary && (
                  <div className="flex items-center">
                    <div className="bg-green-100 p-2 rounded-lg mr-3">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Salary</p>
                      <p className="font-medium text-gray-900">{job.salary}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <div className="bg-orange-100 p-2 rounded-lg mr-3">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Posted</p>
                    <p className="font-medium text-gray-900">{new Date(job.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Similar Jobs */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Similar Jobs</h3>
              <div className="space-y-3">
                <Link
                  href="#"
                  className="block p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 border border-gray-100"
                >
                  <h4 className="font-medium text-gray-900 text-sm mb-1">Frontend Developer</h4>
                  <p className="text-xs text-gray-500">Engineering • Remote</p>
                </Link>
                <Link
                  href="#"
                  className="block p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 border border-gray-100"
                >
                  <h4 className="font-medium text-gray-900 text-sm mb-1">UI/UX Designer</h4>
                  <p className="text-xs text-gray-500">Design • New York</p>
                </Link>
                <Link
                  href="#"
                  className="block p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 border border-gray-100"
                >
                  <h4 className="font-medium text-gray-900 text-sm mb-1">Product Manager</h4>
                  <p className="text-xs text-gray-500">Product • San Francisco</p>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Application Modal */}
        {showApplicationForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Apply for {job.title}</h3>
                  <button
                    onClick={() => {
                      setShowApplicationForm(false)
                      setErrors({})
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Error Messages */}
                {errors.submit && (
                  <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
                    {errors.submit}
                  </div>
                )}

                <form onSubmit={handleApplicationSubmit} className="space-y-6 text-black">
                  {/* Resume Upload */}
                  {job.resumeRequired && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Resume * <span className="text-red-500">Required</span>
                      </label>
                      <div className={`border-2 border-dashed rounded-xl p-6 text-center hover:border-blue-400 transition-colors duration-200 ${errors.resume ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}>
                        <svg
                          className="w-12 h-12 text-gray-400 mx-auto mb-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleFileChange(e.target.files[0])}
                          className="hidden"
                          id="resume-upload"
                        />
                        <label
                          htmlFor="resume-upload"
                          className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Click to upload your resume
                        </label>
                        <p className="text-sm text-gray-500 mt-2">PDF, DOC, or DOCX (max 5MB)</p>
                        {applicationData.resumeFile && (
                          <p className="text-sm text-green-600 mt-2">✓ {applicationData.resumeFile.name}</p>
                        )}
                      </div>
                      {errors.resume && (
                        <p className="text-red-500 text-sm mt-2">{errors.resume}</p>
                      )}
                    </div>
                  )}

                  {/* Custom Questions */}
                  {job.customQuestions && job.customQuestions.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-900">Additional Questions</h4>
                      {job.customQuestions.map((question, index) => (
                        <div key={index}>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            {question.question}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <textarea
                            rows={4}
                            required={question.required}
                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none ${
                              errors[`question_${index}`] ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Your answer..."
                            value={applicationData.answers[question.id ? question.id.toString() : question.question] || ""}
                            onChange={(e) => handleAnswerChange(index, e.target.value)}
                          />
                          {errors[`question_${index}`] && (
                            <p className="text-red-500 text-sm mt-2">{errors[`question_${index}`]}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowApplicationForm(false)
                        setErrors({})
                      }}
                      className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={applying}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {applying ? (
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
                          Submitting...
                        </div>
                      ) : (
                        "Submit Application"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}