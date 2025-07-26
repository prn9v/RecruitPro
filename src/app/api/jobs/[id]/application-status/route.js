// /api/jobs/[id]/application-status
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const jobId = params.id;

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Check if user has applied to this job
    const existingApplication = await prisma.application.findUnique({
      where: {
        jobId_applicantId: {
          jobId: jobId,
          applicantId: session.user.id,
        },
      },
      include: {
        job: {
          select: {
            title: true,
            department: true,
            location: true,
          },
        },
        actionLogs: {
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        },
      },
    });

    return NextResponse.json({
      hasApplied: !!existingApplication,
      application: existingApplication,
    });

  } catch (error) {
    console.error("Error checking application status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}