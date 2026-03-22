import { connectDB } from "@/lib/mongodb";
import Member from "@/lib/models/Member";
import { NextRequest } from "next/server";

export async function GET() {
  await connectDB();
  const members = await Member.find().sort({ createdAt: -1 });
  return Response.json(members);
}

export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json();
  const member = await Member.create(body);
  return Response.json(member, { status: 201 });
}
