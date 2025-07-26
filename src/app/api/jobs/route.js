// /api/jobs
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const department = searchParams.get("department")
    const location = searchParams.get("location")

    const where = {
      status: "ACTIVE",
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    if (department) {
      where.department = department
    }

    if (location) {
      where.location = { contains: location, mode: "insensitive" }
    }

    const jobs = await prisma.job.findMany({
      where,
      include: {
        publisher: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ jobs })
  } catch (error) {
    console.error("Error fetching jobs:", error)
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 })
  }
}

