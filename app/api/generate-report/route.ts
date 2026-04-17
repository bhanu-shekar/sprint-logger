import { NextRequest } from "next/server";
import { generateSprintReport } from "@/lib/ai";
import { generateDocx } from "@/lib/reportGenerators/docxGenerator";
import { generatePptx } from "@/lib/reportGenerators/pptxGenerator";
import { generateDocxWithProgress } from "@/lib/reportGenerators/streamingDocxGenerator";
import { generatePptxWithProgress } from "@/lib/reportGenerators/streamingPptxGenerator";
import { connectDB } from "@/lib/mongodb";
import Project from "@/lib/models/Project";
import Task from "@/lib/models/Task";
import Member from "@/lib/models/Member";
import Sprint from "@/lib/models/Sprint";

export async function POST(request: NextRequest) {
  try {
    const { format, sprintId, generateOnly, stream, includeAISummary, includeBlockerNotes, aiSummary } = await request.json();

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

    // If streaming is requested, use SSE
    if (stream) {
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        async start(controller) {
          const sendProgress = (stage: string, percent: number) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "progress", stage, percent })}\n\n`));
          };

          try {
            // Send AI start event
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "progress", stage: "Connecting to AI...", percent: 2 })}\n\n`));
            
            // Add intermediate AI progress (optimized models should be fast)
            setTimeout(() => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "progress", stage: "Analyzing sprint data...", percent: 5 })}\n\n`));
            }, 500);
            
            setTimeout(() => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "progress", stage: "Generating AI insights...", percent: 10 })}\n\n`));
            }, 1500);

            // Get AI-generated content or use user-provided summary
            let aiContent;

            if (includeAISummary && aiSummary) {
              // Skip AI API call — use user's custom summary
              // Build minimal structure with sprint data for other sections
              const rate = Math.round((sprintData.completedTasks / sprintData.totalTasks) * 100);
              aiContent = {
                sprintSummary: aiSummary,
                velocityNote: `${rate}% completion rate achieved.`,
                highlights: [],
                risks: [],
                recommendations: [],
                memberInsights: sprintData.memberWorkload.map((m: any) => ({
                  name: m.name,
                  insight: `${m.name} completed ${m.taskCount} tasks (${m.totalHours}h).`,
                })),
                nextSprintFocus: "",
              };
            } else {
              // Generate fresh AI content
              aiContent = await generateSprintReport(sprintData);
            }

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "progress", stage: "AI analysis complete", percent: 15 })}\n\n`));

            // Generate file with progress
            if (format === "docx") {
              const buffer = await generateDocxWithProgress(sprintData, aiContent, sendProgress, includeBlockerNotes);

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "progress", stage: "Finalizing...", percent: 100 })}\n\n`));
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "complete", size: buffer.length })}\n\n`));

              // Send buffer as base64
              const base64 = buffer.toString("base64");
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "file", data: base64, format: "docx", filename: `sprint-report-${sprint.name.replace(/\s+/g, "-")}.docx` })}\n\n`));
            } else if (format === "pptx") {
              const buffer = await generatePptxWithProgress(sprintData, aiContent, sendProgress, includeBlockerNotes);

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "progress", stage: "Finalizing...", percent: 100 })}\n\n`));
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "complete", size: buffer.length })}\n\n`));

              const base64 = buffer.toString("base64");
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "file", data: base64, format: "pptx", filename: `sprint-report-${sprint.name.replace(/\s+/g, "-")}.pptx` })}\n\n`));
            }
          } catch (error) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: "Failed to generate report" })}\n\n`));
          }

          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "X-Accel-Buffering": "no", // Disable nginx buffering
        },
      });
    }

    // Non-streaming fallback
    let aiContent;

    if (includeAISummary && aiSummary) {
      // Skip AI API call — use user's custom summary
      const rate = Math.round((sprintData.completedTasks / sprintData.totalTasks) * 100);
      aiContent = {
        sprintSummary: aiSummary,
        velocityNote: `${rate}% completion rate achieved.`,
        highlights: [],
        risks: [],
        recommendations: [],
        memberInsights: sprintData.memberWorkload.map((m: any) => ({
          name: m.name,
          insight: `${m.name} completed ${m.taskCount} tasks (${m.totalHours}h).`,
        })),
        nextSprintFocus: "",
      };
    } else {
      // Generate fresh AI content
      aiContent = await generateSprintReport(sprintData);
    }

    if (generateOnly) {
      return Response.json(aiContent);
    }

    if (format === "docx") {
      const buffer = await generateDocx(sprintData, aiContent, includeBlockerNotes);
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="sprint-report-${sprint.name.replace(/\s+/g, "-")}.docx"`,
        },
      });
    }

    if (format === "pptx") {
      const buffer = await generatePptx(sprintData, aiContent, includeBlockerNotes);
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "Content-Disposition": `attachment; filename="sprint-report-${sprint.name.replace(/\s+/g, "-")}.pptx"`,
        },
      });
    }

    return Response.json({ error: "Invalid format" }, { status: 400 });
  } catch (error) {
    console.error("Report generation error:", error);
    return Response.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
