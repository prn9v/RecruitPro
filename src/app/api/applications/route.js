import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadResumeFile } from "@/lib/fileUpload";

export async function POST(request) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only allow regular users to apply (not admins)
    if (session.user.role === "ADMIN") {
      return NextResponse.json(
        { error: "Admins cannot apply to jobs" },
        { status: 403 }
      );
    }

    // Parse the request body - handle both JSON and FormData
    let jobId, answers, resumeUrl, resumeFile;
    const contentType = request.headers.get("content-type");

    if (contentType && contentType.includes("multipart/form-data")) {
      // Handle FormData (with file upload)
      const formData = await request.formData();
      jobId = formData.get("jobId");
      const answersString = formData.get("answers");
      answers = answersString ? JSON.parse(answersString) : {};
      resumeFile = formData.get("resume");
      
      // Upload file if provided
      if (resumeFile) {
        try {
          resumeUrl = await uploadResumeFile(resumeFile, session.user.id, jobId);
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          return NextResponse.json(
            { error: uploadError.message || "Failed to upload resume" },
            { status: 400 }
          );
        }
      }
    } else {
      // Handle JSON request
      const body = await request.json();
      ({ jobId, answers, resumeUrl } = body);
    }

    // Validate required fields
    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Check if the job exists and is active
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        publisher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    if (job.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "This job is not currently accepting applications" },
        { status: 400 }
      );
    }

    // Check if user is trying to apply to their own job
    if (job.publisherId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot apply to your own job posting" },
        { status: 400 }
      );
    }

    // Check if user has already applied to this job
    const existingApplication = await prisma.application.findUnique({
      where: {
        jobId_applicantId: {
          jobId: jobId,
          applicantId: session.user.id,
        },
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: "You have already applied to this job" },
        { status: 409 }
      );
    }

    // Validate answers if custom questions exist
    if (job.customQuestions && Array.isArray(job.customQuestions)) {
      if (!answers || typeof answers !== "object") {
        return NextResponse.json(
          { error: "Answers are required for this job application" },
          { status: 400 }
        );
      }

      // Check if all required questions are answered
      const requiredQuestions = job.customQuestions.filter(q => q.required);
      const answeredQuestions = Object.keys(answers);
      
      for (const question of requiredQuestions) {
        const questionKey = question.id ? question.id.toString() : question.question;
        if (!answeredQuestions.includes(questionKey) || !answers[questionKey]) {
          return NextResponse.json(
            { error: `Question "${question.question}" is required` },
            { status: 400 }
          );
        }
      }
    }

    // Validate resume if required
    if (job.resumeRequired && !resumeUrl && !resumeFile) {
      return NextResponse.json(
        { error: "Resume is required for this job application" },
        { status: 400 }
      );
    }

    // Create the application
    const application = await prisma.application.create({
      data: {
        jobId: jobId,
        applicantId: session.user.id,
        answers: answers || {},
        resumeUrl: resumeUrl || null,
        status: "PENDING",
      },
      include: {
        job: {
          include: {
            publisher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        applicant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create initial action log
    await prisma.applicationLog.create({
      data: {
        applicationId: application.id,
        action: "Application submitted",
        newStatus: "PENDING",
        notes: "Application submitted successfully",
      },
    });

    // TODO: Send notification emails to job publisher
    // await sendApplicationNotification(application);

    // Return success response
    return NextResponse.json(
      {
        message: "Application submitted successfully",
        application: {
          id: application.id,
          status: application.status,
          createdAt: application.createdAt,
          job: {
            id: application.job.id,
            title: application.job.title,
            department: application.job.department,
            location: application.job.location,
            publisher: application.job.publisher,
          },
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error creating application:", error);
    
    // Handle Prisma-specific errors
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "You have already applied to this job" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET method to retrieve applications (for admin or user's own applications)
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    let whereClause = {};

    if (session.user.role === "ADMIN") {
      // Admin can see all applications or filter by job
      if (jobId) {
        whereClause.jobId = jobId;
      }
      if (status) {
        whereClause.status = status;
      }
    } else {
      // Regular users can only see their own applications
      whereClause.applicantId = session.user.id;
      if (jobId) {
        whereClause.jobId = jobId;
      }
      if (status) {
        whereClause.status = status;
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.application.count({
      where: whereClause,
    });

    const applications = await prisma.application.findMany({
      where: whereClause,
      include: {
        job: {
          include: {
            publisher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        applicant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        actionLogs: {
          orderBy: {
            createdAt: "desc",
          },
          take: 5, // Limit action logs to recent 5
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    return NextResponse.json({ 
      applications,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    });

  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}