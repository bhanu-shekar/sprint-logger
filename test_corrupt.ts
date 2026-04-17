import { generateDocxWithProgress } from "./lib/reportGenerators/streamingDocxGenerator";
import { generatePptxWithProgress } from "./lib/reportGenerators/streamingPptxGenerator";
import fs from "fs";

const mockSprint = {
  sprintName: "Test Sprint",
  startDate: "2026-04-01",
  endDate: "2026-04-14",
  totalTasks: 10,
  completedTasks: 5,
  inProgressTasks: 3,
  projects: [{ name: "P1", status: "Active", tasks: [{ title: "T1", status: "Done", type: "Bug", assignees: ["A"], timeValue: 2, timeUnit: "h" }] }],
  memberWorkload: [{ name: "Alice", role: "Dev", taskCount: 2, totalHours: 10 }],
};
const mockAi = {};

async function test() {
  try {
    const docxBuf = await generateDocxWithProgress(mockSprint, mockAi, () => {}, false);
    fs.writeFileSync("test.docx", docxBuf);
    console.log("DOCX written");
  } catch (e) {
    console.error("DOCX error:", e);
  }
  try {
    const pptxBuf = await generatePptxWithProgress(mockSprint, mockAi, () => {}, false);
    fs.writeFileSync("test.pptx", pptxBuf as Buffer);
    console.log("PPTX written");
  } catch (e) {
    console.error("PPTX error:", e);
  }
}
test();
