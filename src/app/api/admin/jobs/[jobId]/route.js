import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";

export async function PATCH(req, { params }) {
    try {
        const token = await getToken({ req, secret: authOptions.secret });
        if (!token || token.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { jobId } = params;
        const body = await req.json();
        const { status } = body;
        if (!status) {
            return NextResponse.json({ error: "Status is required" }, { status: 400 });
        }
        // Check if the job belongs to the current admin
        const job = await prisma.job.findUnique({ where: { id: jobId } });
        if (!job || job.publisherId !== token.id) {
            return NextResponse.json({ error: "Forbidden: You can only update your own jobs" }, { status: 403 });
        }
        const updatedJob = await prisma.job.update({
            where: { id: jobId },
            data: { status },
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
        });
        return NextResponse.json({ message: "Job status updated", job: updatedJob });
    } catch (error) {
        console.error("Error updating job:", error);
        return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const token = await getToken({ req, secret: authOptions.secret });
        if (!token || token.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { jobId } = params;
        // Check if the job belongs to the current admin
        const job = await prisma.job.findUnique({ where: { id: jobId } });
        if (!job || job.publisherId !== token.id) {
            return NextResponse.json({ error: "Forbidden: You can only delete your own jobs" }, { status: 403 });
        }
        await prisma.job.delete({
            where: { id: jobId },
        });
        return NextResponse.json({ message: "Job deleted" });
    } catch (error) {
        console.error("Error deleting job:", error);
        return NextResponse.json({ error: "Failed to delete job" }, { status: 500 });
    }
}

