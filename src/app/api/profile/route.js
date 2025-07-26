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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ profile: user })
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { name, phone, location, bio, skills, experience, education } = data

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        phone,
        location,
        bio,
        skills,
        experience,
        education,
      },
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
    })

    return NextResponse.json({ profile: updatedUser })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
