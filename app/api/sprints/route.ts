import { connectDB } from "@/lib/mongodb";
import Sprint from "@/lib/models/Sprint";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit") || "10";
  
  const sprints = await Sprint.find()
    .sort({ startDate: -1 })
    .limit(parseInt(limit));
  
  return Response.json(sprints);
}

export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json();
  const sprint = await Sprint.create(body);
  return Response.json(sprint, { status: 201 });
}
