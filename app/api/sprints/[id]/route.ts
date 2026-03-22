import { connectDB } from "@/lib/mongodb";
import Sprint from "@/lib/models/Sprint";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  const sprint = await Sprint.findById(id);
  if (!sprint) {
    return Response.json({ error: "Sprint not found" }, { status: 404 });
  }
  return Response.json(sprint);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  const body = await request.json();
  const sprint = await Sprint.findByIdAndUpdate(id, body, { new: true });
  if (!sprint) {
    return Response.json({ error: "Sprint not found" }, { status: 404 });
  }
  return Response.json(sprint);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  const sprint = await Sprint.findByIdAndDelete(id);
  if (!sprint) {
    return Response.json({ error: "Sprint not found" }, { status: 404 });
  }
  return Response.json({ message: "Sprint deleted" });
}
