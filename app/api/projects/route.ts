import { connectDB } from "@/lib/mongodb";
import Project from "@/lib/models/Project";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const archived = searchParams.get("archived");
  const all = searchParams.get("all");
  const sprintId = searchParams.get("sprintId");
  
  let query: any = {};
  
  if (sprintId) {
    query.sprintId = sprintId;
  }
  
  if (archived === "true") {
    query.status = "Completed";
  } else if (all !== "true") {
    query.status = { $ne: "Completed" };
  }
  
  const projects = await Project.find(query).sort({ order: 1, createdAt: -1 });
  return Response.json(projects);
}

export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json();
  const project = await Project.create(body);
  return Response.json(project, { status: 201 });
}
