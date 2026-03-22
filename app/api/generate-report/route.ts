import { NextRequest } from "next/server";
import { generateSprintReport } from "@/lib/ai";
import { generateDocx } from "@/lib/reportGenerators/docxGenerator";
import { generatePptx } from "@/lib/reportGenerators/pptxGenerator";
import { connectDB } from "@/lib/mongodb";
import Project from "@/lib/models/Project";
import Task from "@/lib/models/Task";
import Member from "@/lib/models/Member";
import Sprint from "@/lib/models/Sprint";

export async function POST(request: NextRequest) {
  try {
    const { format, sprintId, generateOnly } = await request.json();

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

    // Shape the data for AI prompt
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
      inProgressTasks: tasks.filter((t: any) => t.status === "In Progress")
        .length,
      todoTasks: tasks.filter(
        (t: any) => t.status === "To Do" || t.status === "Review"
      ).length,
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
          (t.assigneeIds || []).some(
            (a: any) => a._id?.toString() === m._id.toString()
          )
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

    // Get AI-generated content
    const aiContent = await generateSprintReport(sprintData);

    // If only generating AI content (not downloading file), return JSON
    if (generateOnly) {
      return Response.json(aiContent);
    }

    // Generate file based on format
    if (format === "docx") {
      const buffer = await generateDocx(sprintData, aiContent);
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="sprint-report-${sprint.name.replace(/\s+/g, "-")}.docx"`,
        },
      });
    }

    if (format === "pptx") {
      const buffer = await generatePptx(sprintData, aiContent);
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "Content-Disposition": `attachment; filename="sprint-report-${sprint.name.replace(/\s+/g, "-")}.pptx"`,
        },
      });
    }

    return Response.json({ error: "Invalid format" }, { status: 400 });
  } catch (error) {
    console.error("Report generation error:", error);
    return Response.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
