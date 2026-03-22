import { connectDB } from "@/lib/mongodb";
import Member from "@/lib/models/Member";

export async function GET() {
  await connectDB();

  const members = await Member.find();

  return Response.json(members);
}
