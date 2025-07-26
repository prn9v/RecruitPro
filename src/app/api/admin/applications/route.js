import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only allow admins to access applications
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    let whereClause = {
      job: {
        publisherId: session.user.id, // Only show applications for admin's jobs
      },
    };

    // Add filters
    if (jobId) {
      whereClause.jobId = jobId;
    }
    if (status) {
      whereClause.status = status;
    }

    // Get total count for pagination
    const totalCount = await prisma.application.count({
      where: whereClause,
    });

    // Get applications with related data
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
            phone: true,
            location: true,
            bio: true,
            skills: true,
            experience: true,
            education: true,
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

    // Get stats for the admin's applications
    const stats = await Promise.all([
      prisma.application.count({
        where: {
          job: {
            publisherId: session.user.id,
          },
        },
      }),
      prisma.application.count({
        where: {
          job: {
            publisherId: session.user.id,
          },
          status: "PENDING",
        },
      }),
      prisma.application.count({
        where: {
          job: {
            publisherId: session.user.id,
          },
          status: "ACCEPTED",
        },
      }),
      prisma.application.count({
        where: {
          job: {
            publisherId: session.user.id,
          },
          status: "REJECTED",
        },
      }),
    ]);

    return NextResponse.json({
      applications,
      stats: {
        totalApplications: stats[0],
        pendingApplications: stats[1],
        acceptedApplications: stats[2],
        rejectedApplications: stats[3],
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });

  } catch (error) {
    console.error("Error fetching admin applications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update application status
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { applicationId, status, notes } = body;

    if (!applicationId || !status) {
      return NextResponse.json(
        { error: "Application ID and status are required" },
        { status: 400 }
      );
    }

    // Verify the application belongs to the admin's job
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        job: {
          publisherId: session.user.id,
        },
      },
      include: {
        job: true,
        applicant: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Get the previous status for the log
    const previousStatus = application.status;

    // Update the application status
    const updatedApplication = await prisma.application.update({
      where: {
        id: applicationId,
      },
      data: {
        status: status,
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

    // Create action log
    await prisma.applicationLog.create({
      data: {
        applicationId: applicationId,
        action: `Status changed from ${previousStatus} to ${status}`,
        previousStatus: previousStatus,
        newStatus: status,
        notes: notes || `Application ${status.toLowerCase()} by admin`,
      },
    });

    return NextResponse.json({
      message: "Application status updated successfully",
      application: updatedApplication,
    });

  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 