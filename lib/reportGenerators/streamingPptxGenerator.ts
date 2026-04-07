import pptxgen from "pptxgenjs";

const P = {
  NAVY:    "0F1B2D",
  INDIGO:  "1E3A5F",
  STEEL:   "2563A8",
  ICE:     "CADCFC",
  MINT:    "02C39A",
  AMBER:   "F59E0B",
  ROSE:    "E11D48",
  WHITE:   "FFFFFF",
  OFF:     "F7F9FC",
  MUTED:   "64748B",
  BORDER:  "CBD5E1",
  CARD:    "FFFFFF",
};

const makeShadow = () => ({
  type: "outer" as const,
  blur: 8,
  offset: 3,
  angle: 135,
  color: "000000",
  opacity: 0.10,
});

function slideHeader(prs: pptxgen, slide: pptxgen.Slide, title: string, subtitle?: string) {
  slide.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: 13.3, h: 0.95, fill: { color: P.NAVY }, line: { color: P.NAVY } });
  slide.addShape(prs.ShapeType.rect, { x: 0, y: 0.95, w: 13.3, h: 0.06, fill: { color: P.STEEL }, line: { color: P.STEEL } });
  slide.addText(title, { x: 0.45, y: 0, w: 9, h: 0.95, fontSize: 26, bold: true, color: P.WHITE, valign: "middle", margin: 0 });
  if (subtitle) {
    slide.addText(subtitle, { x: 0.45, y: 0, w: 12, h: 0.95, fontSize: 12, color: P.ICE, align: "right", valign: "middle", margin: 0 });
  }
}

function metricCard(prs: pptxgen, slide: pptxgen.Slide, x: number, y: number, value: string, label: string, accent: string) {
  slide.addShape(prs.ShapeType.rect, { x, y, w: 2.9, h: 1.45, fill: { color: P.CARD }, line: { color: P.BORDER, pt: 1 }, shadow: makeShadow() });
  slide.addShape(prs.ShapeType.rect, { x, y, w: 0.07, h: 1.45, fill: { color: accent }, line: { color: accent } });
  slide.addText(value, { x: x + 0.18, y: y + 0.1, w: 2.7, h: 0.75, fontSize: 36, bold: true, color: accent, valign: "bottom" });
  slide.addText(label, { x: x + 0.18, y: y + 0.88, w: 2.7, h: 0.45, fontSize: 11, color: P.MUTED, valign: "top" });
}

export async function generatePptxWithProgress(
  sprintData: any,
  ai: any,
  onProgress?: (stage: string, percent: number) => void,
  includeBlockerNotes: boolean = true
): Promise<Buffer> {
  const prs = new pptxgen();
  prs.layout = "LAYOUT_WIDE";
  prs.theme = { headFontFace: "Calibri", bodyFontFace: "Calibri" };

  const totalSlides = 6 + sprintData.projects.length;
  let currentSlide = 0;

  const reportProgress = (stage: string) => {
    currentSlide++;
    const percent = Math.round(15 + (currentSlide / totalSlides) * 85);
    onProgress?.(stage, percent);
  };

  // Slide 1 — Cover
  {
    const s = prs.addSlide();
    s.background = { color: P.NAVY };
    s.addShape(prs.ShapeType.ellipse, { x: 9.5, y: 3.8, w: 5.5, h: 5.5, fill: { color: P.INDIGO }, line: { color: P.INDIGO } });
    s.addShape(prs.ShapeType.ellipse, { x: 10.2, y: 4.5, w: 4.0, h: 4.0, fill: { color: P.STEEL, transparency: 70 }, line: { color: P.STEEL, transparency: 70 } });
    s.addShape(prs.ShapeType.rect, { x: 0, y: 2.0, w: 0.12, h: 2.8, fill: { color: P.MINT }, line: { color: P.MINT } });
    s.addText("SPRINT REPORT", { x: 0.45, y: 1.5, w: 8, h: 0.55, fontSize: 13, bold: true, color: P.ICE, charSpacing: 6 });
    s.addText(sprintData.sprintName, { x: 0.45, y: 2.05, w: 9, h: 1.5, fontSize: 52, bold: true, color: P.WHITE, wrap: true });
    s.addText("Weekly Engineering Update", { x: 0.45, y: 3.65, w: 8, h: 0.5, fontSize: 16, color: P.ICE, italic: true });
    s.addShape(prs.ShapeType.line, { x: 0.45, y: 4.25, w: 4, h: 0, line: { color: P.STEEL, pt: 1 } });
    s.addText(`${sprintData.startDate}  —  ${sprintData.endDate}`, { x: 0.45, y: 4.35, w: 6, h: 0.45, fontSize: 13, color: P.MUTED });
    const bottomStats = [{ v: String(sprintData.totalTasks), l: "Total Tasks" }, { v: String(sprintData.completedTasks), l: "Completed" }, { v: String(sprintData.projects.length), l: "Projects" }];
    bottomStats.forEach(({ v, l }, i) => {
      const x = 0.45 + i * 2.2;
      s.addText(v, { x, y: 5.6, w: 2, h: 0.7, fontSize: 30, bold: true, color: P.WHITE });
      s.addText(l, { x, y: 6.3, w: 2, h: 0.4, fontSize: 10, color: P.ICE });
    });
  }
  reportProgress("Creating cover slide");

  // Slide 2 — Executive Summary
  {
    const s = prs.addSlide();
    s.background = { color: P.OFF };
    slideHeader(prs, s, "Executive Summary", `${sprintData.startDate} – ${sprintData.endDate}`);
    s.addShape(prs.ShapeType.rect, { x: 0.4, y: 1.2, w: 7.8, h: 3.5, fill: { color: P.WHITE }, line: { color: P.BORDER, pt: 1 }, shadow: makeShadow() });
    s.addShape(prs.ShapeType.rect, { x: 0.4, y: 1.2, w: 0.07, h: 3.5, fill: { color: P.STEEL }, line: { color: P.STEEL } });
    s.addText("Summary", { x: 0.7, y: 1.35, w: 7, h: 0.45, fontSize: 13, bold: true, color: P.STEEL });
    s.addText(ai.sprintSummary || "", { x: 0.7, y: 1.85, w: 7.3, h: 2.5, fontSize: 14, color: P.NAVY, wrap: true, valign: "top" });
    s.addShape(prs.ShapeType.rect, { x: 8.5, y: 1.2, w: 4.4, h: 1.5, fill: { color: P.NAVY }, line: { color: P.NAVY }, shadow: makeShadow() });
    s.addText("VELOCITY", { x: 8.7, y: 1.3, w: 4, h: 0.35, fontSize: 10, bold: true, color: P.ICE, charSpacing: 4 });
    s.addText(ai.velocityNote || "", { x: 8.7, y: 1.65, w: 4.0, h: 0.9, fontSize: 13, color: P.WHITE, wrap: true, italic: true });
    const rate = Math.round((sprintData.completedTasks / sprintData.totalTasks) * 100);
    s.addShape(prs.ShapeType.ellipse, { x: 9.1, y: 2.95, w: 2.8, h: 2.8, fill: { color: P.INDIGO }, line: { color: P.STEEL, pt: 3 }, shadow: makeShadow() });
    s.addText(`${rate}%`, { x: 9.1, y: 3.35, w: 2.8, h: 0.9, fontSize: 36, bold: true, color: P.MINT, align: "center" });
    s.addText("Completion\nRate", { x: 9.1, y: 4.25, w: 2.8, h: 0.6, fontSize: 11, color: P.ICE, align: "center" });
  }
  reportProgress("Creating executive summary");

  // Slide 3 — Sprint Metrics
  {
    const s = prs.addSlide();
    s.background = { color: P.OFF };
    slideHeader(prs, s, "Sprint Metrics");
    const total = sprintData.totalTasks;
    const done = sprintData.completedTasks;
    const inprog = sprintData.inProgressTasks;
    const todo = sprintData.todoTasks ?? (total - done - inprog);
    const rate = Math.round((done / total) * 100);
    const cards = [{ v: String(total), l: "Total Tasks", a: P.STEEL }, { v: String(done), l: "Completed", a: P.MINT }, { v: String(inprog), l: "In Progress", a: P.AMBER }, { v: `${rate}%`, l: "Completion Rate", a: P.STEEL }];
    cards.forEach(({ v, l, a }, i) => { metricCard(prs, s, 0.4 + i * 3.1, 1.2, v, l, a); });
    s.addChart(prs.ChartType.bar, [{ name: "Tasks", labels: ["Completed", "In Progress", "To Do"], values: [done, inprog, todo] }], { x: 0.4, y: 2.9, w: 7.8, h: 4.2, barDir: "col", chartColors: [P.MINT, P.AMBER, P.BORDER], chartArea: { fill: { color: P.WHITE }, roundedCorners: false }, catAxisLabelColor: P.MUTED, valAxisLabelColor: P.MUTED, valGridLine: { color: P.BORDER, size: 0.5 }, catGridLine: { style: "none" }, showValue: true, dataLabelColor: P.NAVY, dataLabelFontSize: 12, showLegend: false, title: "Task Distribution", showTitle: true, titleColor: P.NAVY, titleFontSize: 13 } as any);
    const summaryItems = [{ label: "Sprint Duration", value: `${sprintData.startDate} → ${sprintData.endDate}` }, { label: "Projects Active", value: String(sprintData.projects.length) }, { label: "Team Members", value: String(sprintData.memberWorkload.length) }];
    summaryItems.forEach(({ label, value }, i) => {
      const y = 2.9 + i * 1.42;
      s.addShape(prs.ShapeType.rect, { x: 8.5, y, w: 4.4, h: 1.2, fill: { color: P.WHITE }, line: { color: P.BORDER, pt: 1 }, shadow: makeShadow() });
      s.addText(label, { x: 8.7, y: y + 0.1, w: 4.0, h: 0.35, fontSize: 10, color: P.MUTED });
      s.addText(value, { x: 8.7, y: y + 0.45, w: 4.0, h: 0.55, fontSize: 16, bold: true, color: P.NAVY });
    });
  }
  reportProgress("Creating sprint metrics");

  // Slide 4 — Highlights & Risks
  {
    const s = prs.addSlide();
    s.background = { color: P.OFF };
    slideHeader(prs, s, "Highlights & Risks");
    s.addShape(prs.ShapeType.rect, { x: 0.4, y: 1.2, w: 6.1, h: 5.9, fill: { color: P.WHITE }, line: { color: P.BORDER, pt: 1 }, shadow: makeShadow() });
    s.addShape(prs.ShapeType.rect, { x: 0.4, y: 1.2, w: 6.1, h: 0.55, fill: { color: P.MINT }, line: { color: P.MINT } });
    s.addText("✓  HIGHLIGHTS", { x: 0.55, y: 1.2, w: 5.8, h: 0.55, fontSize: 13, bold: true, color: P.WHITE, valign: "middle", margin: 0 });
    (ai.highlights || []).slice(0, 6).forEach((h: string, i: number) => {
      const y = 1.95 + i * 0.8;
      s.addShape(prs.ShapeType.ellipse, { x: 0.65, y: y + 0.05, w: 0.28, h: 0.28, fill: { color: P.MINT, transparency: 80 }, line: { color: P.MINT } });
      s.addText(h, { x: 1.1, y, w: 5.2, h: 0.7, fontSize: 13, color: P.NAVY, wrap: true, valign: "middle" });
    });
    
    if (includeBlockerNotes) {
      s.addShape(prs.ShapeType.rect, { x: 6.8, y: 1.2, w: 6.1, h: 5.9, fill: { color: P.WHITE }, line: { color: P.BORDER, pt: 1 }, shadow: makeShadow() });
      s.addShape(prs.ShapeType.rect, { x: 6.8, y: 1.2, w: 6.1, h: 0.55, fill: { color: P.ROSE }, line: { color: P.ROSE } });
      s.addText("⚠  RISKS & BLOCKERS", { x: 6.95, y: 1.2, w: 5.8, h: 0.55, fontSize: 13, bold: true, color: P.WHITE, valign: "middle", margin: 0 });
      (ai.risks || []).slice(0, 6).forEach((r: string, i: number) => {
        const y = 1.95 + i * 0.8;
        s.addShape(prs.ShapeType.ellipse, { x: 7.05, y: y + 0.05, w: 0.28, h: 0.28, fill: { color: P.ROSE, transparency: 80 }, line: { color: P.ROSE } });
        s.addText(r, { x: 7.5, y, w: 5.2, h: 0.7, fontSize: 13, color: P.NAVY, wrap: true, valign: "middle" });
      });
    }
  }
  reportProgress("Creating highlights & risks");

  // Slide 5 — Team Performance
  {
    const s = prs.addSlide();
    s.background = { color: P.OFF };
    slideHeader(prs, s, "Team Performance");
    const members = sprintData.memberWorkload;
    s.addChart(prs.ChartType.bar, [{ name: "Hours", labels: members.map((m: any) => m.name), values: members.map((m: any) => m.totalHours) }, { name: "Tasks", labels: members.map((m: any) => m.name), values: members.map((m: any) => m.taskCount) }], { x: 0.4, y: 1.2, w: 7.8, h: 5.9, barDir: "bar", barGrouping: "clustered", chartColors: [P.STEEL, P.ICE], chartArea: { fill: { color: P.WHITE }, roundedCorners: false }, catAxisLabelColor: P.MUTED, valAxisLabelColor: P.MUTED, valGridLine: { color: P.BORDER, size: 0.5 }, catGridLine: { style: "none" }, showValue: true, dataLabelColor: P.NAVY, dataLabelFontSize: 10, showLegend: true, legendPos: "b", legendColor: P.MUTED, title: "Hours & Tasks per Member", showTitle: true, titleColor: P.NAVY, titleFontSize: 13 } as any);
    members.slice(0, 5).forEach((m: any, i: number) => {
      const y = 1.2 + i * 1.18;
      const hours = m.totalHours;
      const status = hours > 40 ? "Overloaded" : hours > 32 ? "At Capacity" : hours > 20 ? "Healthy" : "Optimal";
      const statusColor = hours > 40 ? P.ROSE : hours > 32 ? P.AMBER : P.MINT;
      s.addShape(prs.ShapeType.rect, { x: 8.5, y, w: 4.4, h: 1.0, fill: { color: P.WHITE }, line: { color: P.BORDER, pt: 1 }, shadow: makeShadow() });
      s.addShape(prs.ShapeType.rect, { x: 8.5, y, w: 0.07, h: 1.0, fill: { color: statusColor }, line: { color: statusColor } });
      s.addText(m.name, { x: 8.7, y: y + 0.08, w: 3.0, h: 0.35, fontSize: 13, bold: true, color: P.NAVY });
      s.addText(`${m.taskCount} tasks  •  ${hours}h`, { x: 8.7, y: y + 0.45, w: 2.8, h: 0.3, fontSize: 10, color: P.MUTED });
      s.addText(status, { x: 11.0, y: y + 0.25, w: 1.8, h: 0.45, fontSize: 11, bold: true, color: statusColor, align: "right" });
    });
  }
  reportProgress("Creating team performance");

  // Slide 6 — Project Overview Summary
  {
    const s = prs.addSlide();
    s.background = { color: P.OFF };
    slideHeader(prs, s, "Projects Overview");
    
    const projectStats = sprintData.projects.map((p: any) => ({
      name: p.name,
      status: p.status,
      taskCount: p.tasks?.length || 0,
    }));
    
    s.addChart(prs.ChartType.pie, [{
      name: "Projects",
      labels: projectStats.map((p: any) => p.name),
      values: projectStats.map((p: any) => p.taskCount),
    }], {
      x: 0.5, y: 1.3, w: 6, h: 5.5,
      chartColors: [P.STEEL, P.MINT, P.AMBER, P.ROSE, P.INDIGO, P.ICE],
      showLegend: true,
      legendPos: "b",
      title: "Tasks per Project",
      showTitle: true,
      titleColor: P.NAVY,
      titleFontSize: 13,
    } as any);
    
    const statusList = projectStats.map((p: any, i: number) => ({
      name: p.name,
      status: p.status,
      tasks: p.taskCount,
    }));
    
    statusList.forEach((p: any, i: number) => {
      const y = 1.3 + i * 0.9;
      const statusColor = p.status === "Completed" ? P.MINT : p.status === "Active" ? P.STEEL : P.AMBER;
      s.addShape(prs.ShapeType.rect, { x: 7.5, y, w: 5.3, h: 0.75, fill: { color: P.WHITE }, line: { color: P.BORDER, pt: 1 }, shadow: makeShadow() });
      s.addShape(prs.ShapeType.rect, { x: 7.5, y, w: 0.06, h: 0.75, fill: { color: statusColor }, line: { color: statusColor } });
      s.addText(p.name, { x: 7.65, y: y + 0.08, w: 3.5, h: 0.35, fontSize: 12, bold: true, color: P.NAVY });
      s.addText(`${p.tasks} tasks`, { x: 7.65, y: y + 0.42, w: 2, h: 0.28, fontSize: 10, color: P.MUTED });
      s.addText(p.status, { x: 11.5, y: y + 0.25, w: 1.2, h: 0.35, fontSize: 10, bold: true, color: statusColor, align: "right" });
    });
  }
  reportProgress("Creating project overview");

  // Per-Project Slides
  for (const p of sprintData.projects) {
    const s = prs.addSlide();
    s.background = { color: P.OFF };
    slideHeader(prs, s, p.name, p.status);
    const statusColor = p.status === "Completed" ? P.MINT : p.status === "In Progress" ? P.AMBER : P.ROSE;
    const tasks = p.tasks as any[];
    s.addShape(prs.ShapeType.roundRect, { x: 11.5, y: 0.18, w: 1.5, h: 0.42, fill: { color: statusColor }, line: { color: statusColor }, rectRadius: 0.1 });
    s.addText(p.status, { x: 11.5, y: 0.18, w: 1.5, h: 0.42, fontSize: 10, bold: true, color: P.WHITE, align: "center", valign: "middle", margin: 0 });
    const headerRow = [{ text: "Task", options: { bold: true, color: P.WHITE, fill: { color: P.NAVY }, fontSize: 11 } }, { text: "Type", options: { bold: true, color: P.WHITE, fill: { color: P.NAVY }, fontSize: 11 } }, { text: "Status", options: { bold: true, color: P.WHITE, fill: { color: P.NAVY }, fontSize: 11 } }, { text: "Time", options: { bold: true, color: P.WHITE, fill: { color: P.NAVY }, fontSize: 11 } }, { text: "Assignees", options: { bold: true, color: P.WHITE, fill: { color: P.NAVY }, fontSize: 11 } }];
    const dataRows = tasks.map((t, ri) => {
      const bg = ri % 2 === 0 ? P.WHITE : "F1F5F9";
      const statusC = t.status === "Done" || t.status === "Completed" ? P.MINT : t.status === "In Progress" ? P.AMBER : P.MUTED;
      return [{ text: t.title, options: { fill: { color: bg }, fontSize: 11, color: P.NAVY } }, { text: t.type, options: { fill: { color: bg }, fontSize: 11, color: P.MUTED } }, { text: t.status, options: { fill: { color: bg }, fontSize: 11, bold: true, color: statusC } }, { text: `${t.timeValue}${t.timeUnit}`, options: { fill: { color: bg }, fontSize: 11, color: P.MUTED } }, { text: t.assignees.join(", "), options: { fill: { color: bg }, fontSize: 11, color: P.MUTED } }];
    });
    (s as any).addTable([headerRow, ...dataRows], { x: 0.4, y: 1.15, w: 12.5, border: { type: "solid", color: P.BORDER, width: 0.5 }, rowH: 0.48, colW: [4.2, 1.6, 1.6, 1.0, 4.1] });
    reportProgress(`Adding project: ${p.name}`);
  }

  // Final Slide — Recommendations + Next Sprint
  {
    const s = prs.addSlide();
    s.background = { color: P.NAVY };
    s.addShape(prs.ShapeType.ellipse, { x: 10, y: 4, w: 6, h: 6, fill: { color: P.INDIGO }, line: { color: P.INDIGO } });
    s.addText("RECOMMENDATIONS", { x: 0.5, y: 0.45, w: 9, h: 0.45, fontSize: 11, bold: true, color: P.ICE, charSpacing: 5 });
    s.addText("& Next Steps", { x: 0.5, y: 0.9, w: 9, h: 0.9, fontSize: 36, bold: true, color: P.WHITE });
    s.addShape(prs.ShapeType.line, { x: 0.5, y: 1.9, w: 3, h: 0, line: { color: P.MINT, pt: 2 } });
    (ai.recommendations || []).slice(0, 5).forEach((r: string, i: number) => {
      const y = 2.1 + i * 0.82;
      s.addShape(prs.ShapeType.rect, { x: 0.5, y, w: 0.06, h: 0.6, fill: { color: P.MINT }, line: { color: P.MINT } });
      s.addText(r, { x: 0.75, y, w: 8.5, h: 0.72, fontSize: 14, color: P.ICE, wrap: true, valign: "middle" });
    });
    s.addShape(prs.ShapeType.rect, { x: 9.3, y: 1.4, w: 3.6, h: 3.8, fill: { color: P.INDIGO }, line: { color: P.STEEL, pt: 1 }, shadow: makeShadow() });
    s.addShape(prs.ShapeType.rect, { x: 9.3, y: 1.4, w: 3.6, h: 0.5, fill: { color: P.STEEL }, line: { color: P.STEEL } });
    s.addText("NEXT SPRINT", { x: 9.4, y: 1.4, w: 3.4, h: 0.5, fontSize: 11, bold: true, color: P.WHITE, charSpacing: 3, valign: "middle", margin: 0 });
    s.addText(ai.nextSprintFocus || "", { x: 9.4, y: 2.0, w: 3.3, h: 3.0, fontSize: 13, color: P.ICE, wrap: true, valign: "top" });
    s.addText(`${sprintData.sprintName}  |  ${sprintData.endDate}`, { x: 0.5, y: 6.9, w: 12.3, h: 0.4, fontSize: 10, color: P.MUTED, align: "center" });
  }
  reportProgress("Finalizing presentation");

  return (await (prs as any).stream()) as unknown as Buffer;
}
