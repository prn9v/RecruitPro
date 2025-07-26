import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch applications with job details and action logs
    const applications = await prisma.application.findMany({
      where: { applicantId: session.user.id },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            department: true,
            location: true,
            salary: true,
            status: true,
            publisher: {
              select: {
                name: true,
              },
            },
          },
        },
        actionLogs: {
          orderBy: {
            createdAt: "desc",
          },
          take: 5, // Get last 5 status changes
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Calculate statistics
    const stats = {
      totalApplications: applications.length,
      pendingApplications: applications.filter((app) => app.status === "PENDING").length,
      acceptedApplications: applications.filter((app) => app.status === "ACCEPTED").length,
      rejectedApplications: applications.filter((app) => app.status === "REJECTED").length,
      onHoldApplications: applications.filter((app) => app.status === "ON_HOLD").length,
    }

    return NextResponse.json({ applications, stats })
  } catch (error) {
    console.error("Error fetching applications:", error)
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 })
  }
}
