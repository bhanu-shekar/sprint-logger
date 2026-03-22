import { connectDB } from "@/lib/mongodb";
import Project from "@/lib/models/Project";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  const project = await Project.findById(id);
  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }
  return Response.json(project);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  const body = await request.json();
  const project = await Project.findByIdAndUpdate(id, body, { new: true });
  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }
  return Response.json(project);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  const project = await Project.findByIdAndDelete(id);
  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }
  return Response.json({ message: "Project deleted" });
}
