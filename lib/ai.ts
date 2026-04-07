import OpenAI from "openai";

// --- OPENROUTER CONFIG (COMMENTED OUT) ---
// const client = new OpenAI({
//   baseURL: "https://openrouter.ai/api/v1",
//   apiKey: process.env.OPENROUTER_API_KEY || "",
// });
//
// const MODELS = [
//   "qwen/qwen3.6-plus-preview:free",
//   "nvidia/llama-3.3-nemotron-super-49b-v1.5",
//   "minimax/minimax-m2.5:free",
// ];

// --- GROQ CONFIG ---
const client = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1", // Groq's OpenAI-compatible endpoint
  apiKey: process.env.GROQ_API_KEY || "",
});

// Models in priority order — IDs must match Groq's supported models
const MODELS = [
  "llama-3.3-70b-versatile", // Primary — extremely fast, excellent reasoning
  "llama-3.1-8b-instant",    // Fast fallback
  "mixtral-8x7b-32768",      // High context fallback
  "qwen/qwen3-32b",
];

export async function generateSprintReport(sprintData: any): Promise<any> {
  const prompt = buildPrompt(sprintData);

  for (const model of MODELS) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages: [
          {
            // Simplified system prompt: Groq's Llama models don't need the Nemotron toggle,
            // but they DO need you to explicitly mention "JSON" when using json_object mode.
            role: "system",
            content: "You are a scrum master assistant. Always output your response in JSON format.",
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

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function chatWithAI(
  sprintData: any,
  currentSummary: string,
  conversationHistory: ChatMessage[]
): Promise<string> {
  const systemPrompt = `You are a scrum master assistant helping to refine a sprint summary. 

Current Sprint Summary:
${currentSummary}

Sprint Data:
- Sprint Name: ${sprintData.sprintName}
- Duration: ${sprintData.startDate} to ${sprintData.endDate}
- Total Tasks: ${sprintData.totalTasks}
- Completed Tasks: ${sprintData.completedTasks}
- In Progress: ${sprintData.inProgressTasks}
- Blocked/To Do: ${sprintData.todoTasks}

Projects:
${sprintData.projects
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
${sprintData.memberWorkload
  .map(
    (m: any) =>
      `- ${m.name} (${m.role}): ${m.taskCount} tasks, ${m.totalHours}h assigned`
  )
  .join("\n")}

Your role is to help the user refine and update the sprint summary based on their input. 

IMPORTANT: When the user asks you to make changes, ALWAYS respond with the COMPLETE updated summary text. Do NOT just describe the changes — output the FULL revised summary that can be directly applied. The user's editor will display your full response as the new summary.

If they ask questions about the sprint, answer based on the sprint data provided, then provide an updated summary that incorporates your insights.

Keep the same format and structure as the original summary unless the user specifically asks to change the format.`;

  // Build messages array with conversation history
  const messages: any[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.map((msg) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    })),
  ];

  for (const model of MODELS) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = completion.choices[0].message.content || "";
      return content.trim();
    } catch (error: any) {
      console.log(`${model} failed in chat:`, error?.message ?? error);
      continue;
    }
  }

  return "I'm sorry, I'm unable to process that request right now. Please try again.";
}