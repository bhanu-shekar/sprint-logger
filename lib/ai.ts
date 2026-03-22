import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

// Models in priority order — IDs must match OpenRouter slugs exactly
const MODELS = [
  "nvidia/llama-3.3-nemotron-super-49b-v1.5", // Primary — strong reasoning, 128K ctx
  "minimax/minimax-m2.5:free",                 // Fallback — free tier, fast
];

export async function generateSprintReport(sprintData: any): Promise<any> {
  const prompt = buildPrompt(sprintData);

  for (const model of MODELS) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages: [
          {
            // Nemotron Super needs reasoning mode toggled via system prompt
            role: "system",
            content: "detailed thinking off",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0].message.content || "{}";
      const cleaned = content.replace(/```json|```/g, "").trim();

      try {
        return JSON.parse(cleaned);
      } catch {
        console.log(`${model} returned invalid JSON, trying next...`);
        continue;
      }
    } catch (error: any) {
      console.log(`${model} failed:`, error?.message ?? error);
      // Try next model
    }
  }

  // All models failed — return sensible fallback
  console.error("All AI models failed, returning basic report");
  return {
    sprintSummary: `Sprint completed with ${sprintData.completedTasks} of ${sprintData.totalTasks} tasks done.`,
    velocityNote: `${Math.round((sprintData.completedTasks / sprintData.totalTasks) * 100)}% completion rate achieved.`,
    highlights: ["Sprint goals reviewed"],
    risks: ["No major blockers identified"],
    recommendations: ["Continue current velocity"],
    memberInsights: sprintData.memberWorkload.map((m: any) => ({
      name: m.name,
      insight: `${m.name} completed ${m.taskCount} tasks (${m.totalHours}h).`,
    })),
    nextSprintFocus: "Continue with planned sprint objectives.",
  };
}

function buildPrompt(data: any): string {
  return `
You are a scrum master assistant. Generate a professional weekly sprint report.

Return ONLY valid JSON with this exact structure:
{
  "sprintSummary": "2-3 sentence executive summary of the sprint",
  "velocityNote": "one sentence about velocity/completion rate",
  "highlights": ["achievement 1", "achievement 2", "achievement 3"],
  "risks": ["risk or blocker 1", "risk 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "memberInsights": [
    {
      "name": "member name",
      "insight": "one sentence about their contribution and workload"
    }
  ],
  "nextSprintFocus": "one paragraph suggestion for next sprint"
}

Sprint Data:
- Sprint Name: ${data.sprintName}
- Duration: ${data.startDate} to ${data.endDate}
- Total Projects: ${data.projects.length}
- Total Tasks: ${data.totalTasks}
- Completed Tasks: ${data.completedTasks}
- In Progress: ${data.inProgressTasks}
- Blocked/To Do: ${data.todoTasks}

Projects & Tasks:
${data.projects
  .map(
    (p: any) => `
  Project: ${p.name} (${p.status})
  Tasks:
  ${p.tasks
    .map(
      (t: any) =>
        `  - ${t.title} | ${t.type} | ${t.status} | ${t.timeValue}${t.timeUnit} | Assignees: ${t.assignees.join(", ")}`
    )
    .join("\n")}
`
  )
  .join("\n")}

Team Members Workload:
${data.memberWorkload
  .map(
    (m: any) =>
      `- ${m.name} (${m.role}): ${m.taskCount} tasks, ${m.totalHours}h assigned`
  )
  .join("\n")}
`;
}