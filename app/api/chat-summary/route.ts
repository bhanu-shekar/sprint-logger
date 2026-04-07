import { NextRequest } from "next/server";
import { chatWithAI } from "@/lib/ai";
import { connectDB } from "@/lib/mongodb";
import Project from "@/lib/models/Project";
import Task from "@/lib/models/Task";
import Member from "@/lib/models/Member";
import Sprint from "@/lib/models/Sprint";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { sprintId, currentSummary, message, conversationHistory }: {
      sprintId: string;
      currentSummary: string;
      message: string;
      conversationHistory: ChatMessage[];
    } = await request.json();

    if (!sprintId || !currentSummary || !message) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    // Fetch sprint details
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      return Response.json({ error: "Sprint not found" }, { status: 404 });
    }

    // Fetch all data for this sprint
    const projects = await Project.find({ sprintId });
    const tasks = await Task.find({ sprintId }).populate("assigneeIds");
    const members = await Member.find({});

    // Shape the data for AI
    const sprintData = {
      sprintName: sprint.name,
      startDate: new Date(sprint.startDate).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      endDate: new Date(sprint.endDate).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t: any) => t.status === "Done").length,
      inProgressTasks: tasks.filter((t: any) => t.status === "In Progress").length,
      todoTasks: tasks.filter((t: any) => t.status === "To Do" || t.status === "Review").length,
      projects: projects.map((p: any) => ({
        name: p.name,
        status: p.status,
        tasks: tasks
          .filter((t: any) => t.projectId?.toString() === p._id.toString())
          .map((t: any) => ({
            title: t.title,
            type: t.type,
            status: t.status,
            timeValue: t.timeValue,
            timeUnit: t.timeUnit,
            assignees: (t.assigneeIds || []).map((a: any) => a.name),
          })),
      })),
      memberWorkload: members.map((m: any) => {
        const memberTasks = tasks.filter((t: any) =>
          (t.assigneeIds || []).some((a: any) => a._id?.toString() === m._id.toString())
        );
        const totalHours = memberTasks.reduce((sum: number, t: any) => {
          return sum + (t.timeUnit === "d" ? t.timeValue * 8 : t.timeValue);
        }, 0);
        return {
          name: m.name,
          role: m.role,
          taskCount: memberTasks.length,
          totalHours,
        };
      }),
    };

    // Add user message to conversation history
    const updatedHistory = [
      ...conversationHistory,
      { role: "user" as const, content: message },
    ];

    // Get AI response
    const aiResponse = await chatWithAI(
      sprintData,
      currentSummary,
      updatedHistory
    );

    return Response.json({
      response: aiResponse,
      conversationHistory: [
        ...updatedHistory,
        { role: "assistant" as const, content: aiResponse },
      ],
    });
  } catch (error) {
    console.error("Chat error:", error);
    return Response.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
