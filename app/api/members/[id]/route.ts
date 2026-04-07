import { connectDB } from "@/lib/mongodb";
import Member from "@/lib/models/Member";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  const member = await Member.findById(id);
  if (!member) {
    return Response.json({ error: "Member not found" }, { status: 404 });
  }
  return Response.json(member);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  const body = await request.json();

  const member = await Member.findById(id);
  if (!member) {
    return Response.json({ error: "Member not found" }, { status: 404 });
  }

  member.set(body);               // uses Mongoose setters — change detection fires properly
  member.markModified("avatar");  // mark the whole avatar object, not just config
  await member.save();

  return Response.json(member);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  const member = await Member.findByIdAndDelete(id);
  if (!member) {
    return Response.json({ error: "Member not found" }, { status: 404 });
  }
  return Response.json({ message: "Member deleted" });
}
