import { connectDB } from "@/lib/mongodb";
import Task from "@/lib/models/Task";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const sprintId = searchParams.get("sprintId");
  
  let query: any = {};
  if (sprintId) {
    query.sprintId = sprintId;
  }
  
  const tasks = await Task.find(query)
    .populate("projectId")
    .populate("assigneeIds")
    .sort({ order: 1, createdAt: -1 });
  return Response.json(tasks);
}

export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json();
  const task = await Task.create(body);
  const populatedTask = await Task.findById(task._id)
    .populate("projectId")
    .populate("assigneeIds");
  return Response.json(populatedTask, { status: 201 });
}
