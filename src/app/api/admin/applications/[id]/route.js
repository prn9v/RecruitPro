import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req, context) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = context.params;
        const body = await req.json();
        const { status, notes } = body;

        if (!status) {
            return NextResponse.json({ error: "Status is required" }, { status: 400 });
        }

        // Validate status
        const validStatuses = ["PENDING", "ACCEPTED", "REJECTED", "ON_HOLD"];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        // Verify the application belongs to the admin's job
        const application = await prisma.application.findFirst({
            where: {
                id: id,
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
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        // Get the previous status for the log
        const previousStatus = application.status;

        // Update the application status
        const updatedApplication = await prisma.application.update({
            where: {
                id: id,
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
                actionLogs: {
                    orderBy: {
                        createdAt: "desc",
                    },
                    take: 5,
                },
            },
        });

        // Create action log
        await prisma.applicationLog.create({
            data: {
                applicationId: id,
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
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// GET method to fetch individual application details
export async function GET(req, context) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = context.params;

        // Get application with full details
        const application = await prisma.application.findFirst({
            where: {
                id: id,
                job: {
                    publisherId: session.user.id,
                },
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
                },
            },
        });

        if (!application) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        return NextResponse.json({ application });

    } catch (error) {
        console.error("Error fetching application:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}