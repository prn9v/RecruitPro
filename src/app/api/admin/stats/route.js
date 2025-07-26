import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only allow admins to access stats
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get stats for the admin's jobs only
    const [
      totalJobs,
      activeJobs,
      totalApplications,
      pendingApplications,
      recentApplications,
      monthlyStats
    ] = await Promise.all([
      // Total jobs created by this admin
      prisma.job.count({
        where: {
          publisherId: session.user.id,
        },
      }),
      
      // Active jobs (accepting applications)
      prisma.job.count({
        where: {
          publisherId: session.user.id,
          status: "ACTIVE",
        },
      }),
      
      // Total applications for all jobs by this admin
      prisma.application.count({
        where: {
          job: {
            publisherId: session.user.id,
          },
        },
      }),
      
      // Pending applications
      prisma.application.count({
        where: {
          job: {
            publisherId: session.user.id,
          },
          status: "PENDING",
        },
      }),
      
      // Recent applications (last 7 days)
      prisma.application.count({
        where: {
          job: {
            publisherId: session.user.id,
          },
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          },
        },
      }),
      
      // Monthly stats for the current month
      prisma.application.count({
        where: {
          job: {
            publisherId: session.user.id,
          },
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of current month
          },
        },
      }),
    ]);

    // Calculate percentage changes (mock data for now)
    const totalJobsChange = "+12%";
    const activeJobsChange = "+5%";
    const applicationsChange = "+24%";
    const pendingChange = "+8%";

    return NextResponse.json({
      totalJobs,
      activeJobs,
      totalApplications,
      pendingApplications,
      recentApplications,
      monthlyApplications: monthlyStats,
      changes: {
        totalJobs: totalJobsChange,
        activeJobs: activeJobsChange,
        applications: applicationsChange,
        pending: pendingChange,
      },
    });

  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 