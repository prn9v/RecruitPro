import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const application = await prisma.application.findFirst({
      where: {
        id: params.id,
        applicantId: session.user.id,
      },
      include: {
        job: {
          include: {
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
        },
      },
    })

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    return NextResponse.json({ application })
  } catch (error) {
    console.error("Error fetching application:", error)
    return NextResponse.json({ error: "Failed to fetch application" }, { status: 500 })
  }
}
