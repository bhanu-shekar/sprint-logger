import { connectDB } from "@/lib/mongodb";
import Task from "@/lib/models/Task";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  const task = await Task.findById(id)
    .populate("projectId")
    .populate("assigneeIds");
  if (!task) {
    return Response.json({ error: "Task not found" }, { status: 404 });
  }
  return Response.json(task);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  const body = await request.json();
  const task = await Task.findByIdAndUpdate(id, body, { new: true })
    .populate("projectId")
    .populate("assigneeIds");
  if (!task) {
    return Response.json({ error: "Task not found" }, { status: 404 });
  }
  return Response.json(task);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  const task = await Task.findByIdAndDelete(id);
  if (!task) {
    return Response.json({ error: "Task not found" }, { status: 404 });
  }
  return Response.json({ message: "Task deleted" });
}
