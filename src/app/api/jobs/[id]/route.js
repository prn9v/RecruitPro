// /api/jobs/[id]
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req, context) {
    try {
        const { id } = context.params;
        const job = await prisma.job.findUnique({ where: { id } });
        return NextResponse.json({ job });
    } catch (error) {
        console.error("Error fetching job:", error);
        return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 });
    }
}