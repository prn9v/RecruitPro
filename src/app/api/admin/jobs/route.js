import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !session.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const status = searchParams.get("status")
        const department = searchParams.get("department")
        const search = searchParams.get("search")
        const limit = searchParams.get("limit")

        const where = {
            publisherId: session.user.id // Always filter by admin's jobs
        }
        
        if (status) where.status = status
        if (department) where.department = department
        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ]
        }

        const jobs = await prisma.job.findMany({
            where,
            include: {
                _count: { select: { applications: true } },
                publisher: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            ...(limit ? { take: parseInt(limit, 10) } : {}),
        })
        return NextResponse.json({ jobs })
    } catch (error) {
        console.error("Error fetching jobs:", error)
        return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 })
    }
}

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !session.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { title, department, location, salary, description, requirements, resumeRequired, customQuestions } = body

        if (!title || !department || !location || !description || !requirements) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const jobData = {
            title,
            department,
            location,
            salary,
            description,
            requirements,
            resumeRequired: typeof resumeRequired === "boolean" ? resumeRequired : true,
            customQuestions: customQuestions || [],
            publisherId: session.user.id,
        }

        const job = await prisma.job.create({
            data: jobData,
            include: {
                publisher: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        })

        return NextResponse.json({ message: "Job created successfully", job }, { status: 201 })
    } catch (error) {
        console.error("Error creating job:", error)
        return NextResponse.json({ error: "Failed to create job" }, { status: 500 })
    }
}