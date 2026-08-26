import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      console.error("CRON_SECRET is not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const githubToken = process.env.GITHUB_PAT;

    if (!githubToken) {
      console.error("GITHUB_PAT is not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const repoOwner = "lahiru-ai";
    const repoName = "wusl-notice-alert";

    const response = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
          "User-Agent": "wusl-notice-alert-cron",
        },
        body: JSON.stringify({ event_type: "check-notices" }),
      }
    );

    if (!response.ok) {
      const body = await response.text();
      console.error(
        `GitHub dispatch failed: ${response.status} ${response.statusText}`,
        body
      );
      return NextResponse.json(
        { error: "Failed to trigger workflow" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "GitHub Actions workflow triggered",
      time: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
