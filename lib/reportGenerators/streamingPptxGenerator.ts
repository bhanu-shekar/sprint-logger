import pptxgen from "pptxgenjs";

// ============================================================================
// 🎨 COLOR & THEME CONSTANTS
// ============================================================================
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

// ============================================================================
// 🧱 REUSABLE HELPERS
// ============================================================================

// ✅ FIXED: Shadow config with correct pptxgenjs format
const makeShadow = () => ({
  type: "outer" as const,
  blur: 8,
  offset: 3,
  angle: 135,
  color: "000000",
  opacity: 0.10, // Must be 0.0-1.0 in pptxgenjs; values over 1 break the OOXML schema
});

// ✅ FIXED: Header with proper z-order (background first, then text)
function slideHeader(prs: pptxgen, slide: any, title: string, subtitle?: string) {
  // Background shapes FIRST (rendered behind)
  slide.addShape(prs.ShapeType.rect, {
    x: 0, y: 0, w: "100%", h: 0.95,
    fill: { color: P.NAVY },
    line: { color: P.NAVY },
  });
  slide.addShape(prs.ShapeType.rect, {
    x: 0, y: 0.95, w: "100%", h: 0.06,
    fill: { color: P.STEEL },
    line: { color: P.STEEL },
  });

  // Text SECOND (rendered on top)
  slide.addText(title, {
    x: 0.45, y: 0, w: 9, h: 0.95,
    fontSize: 26, bold: true, color: P.WHITE,
    valign: "middle", margin: 0,
  });

  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.45, y: 0, w: 12, h: 0.95,
      fontSize: 12, color: P.ICE,
      align: "right", valign: "middle", margin: 0,
    });
  }
}

// ✅ FIXED: Metric card with proper dimensions and shadow
function metricCard(
  prs: pptxgen,
  slide: any,
  x: number,
  y: number,
  value: string,
  label: string,
  accent: string
) {
  // Card background
  slide.addShape(prs.ShapeType.roundRect, {
    x, y, w: 2.9, h: 1.45,
    fill: { color: P.CARD },
    line: { color: P.BORDER, width: 1 },
    shadow: makeShadow(),
    rectRadius: 0.05,
  });

  // Accent bar
  slide.addShape(prs.ShapeType.rect, {
    x, y, w: 0.07, h: 1.45,
    fill: { color: accent },
    line: { color: accent },
  });

  // Value text (bottom-aligned)
  slide.addText(value, {
    x: x + 0.18, y: y + 0.1, w: 2.7, h: 0.75,
    fontSize: 36, bold: true, color: accent,
    valign: "bottom",
  });

  // Label text (top-aligned)
  slide.addText(label, {
    x: x + 0.18, y: y + 0.88, w: 2.7, h: 0.45,
    fontSize: 11, color: P.MUTED,
    valign: "top",
  });
}

// ✅ FIXED: Safe chart options builder with proper typing
function buildChartOptions(
  base: any,
  overrides: any = {}
): any {
  return {
    // Defaults for consistent styling
    chartArea: { fill: { color: P.WHITE } },
    catAxisLabelColor: P.MUTED,
    valAxisLabelColor: P.MUTED,
    valGridLine: { color: P.BORDER, width: 0.5 },
    catGridLine: { style: "none" },
    showValue: true,
    dataLabelColor: P.NAVY,
    dataLabelFontSize: 12,
    showLegend: false,
    titleColor: P.NAVY,
    titleFontSize: 13,
    // User overrides
    ...base,
    ...overrides,
  } as any;
}

// ✅ FIXED: Safe table row builder
function buildTableRow(
  cells: Array<{ text: string; opts: any }>,
  isHeader = false
) {
  return cells.map(({ text, opts }) => ({
    text,
    options: {
      fontSize: 11,
      color: P.NAVY,
      fill: { color: isHeader ? P.NAVY : P.WHITE },
      bold: isHeader,
      ...opts,
    },
  }));
}

// ============================================================================
// 📊 MAIN PRESENTATION GENERATOR
// ============================================================================
export async function generatePptxWithProgress(
  sprintData: any,
  ai: any,
  onProgress?: (stage: string, percent: number) => void,
  includeBlockerNotes: boolean = true
): Promise<Buffer> {
  const prs = new pptxgen();
  
  // ✅ FIXED: Proper layout and theme setup
  prs.layout = "LAYOUT_WIDE"; // 13.33" x 7.5"
  prs.author = "Sprint Reporter";
  prs.company = "Engineering Team";
  prs.title = sprintData.sprintName || "Sprint Report";
  prs.subject = "Weekly Engineering Update";

  // ✅ FIXED: Better progress tracking
  const projectCount = sprintData.projects?.length || 0;
  const totalSteps = 7 + projectCount; // 6 base slides + projects + final
  let currentStep = 0;

  const reportProgress = (stage: string) => {
    currentStep++;
    const percent = Math.min(100, Math.round((currentStep / totalSteps) * 100));
    onProgress?.(stage, percent);
  };

  // ==========================================================================
  // SLIDE 1 — Cover Slide
  // ==========================================================================
  {
    const s = prs.addSlide();
    
    // Background first (z-order: back to front)
    s.background = { color: P.NAVY };
    s.addShape(prs.ShapeType.ellipse, {
      x: 7.5, y: -2.0, w: 8.5, h: 8.5,
      fill: { color: P.INDIGO, transparency: 20 },
      line: { color: P.INDIGO, transparency: 20 },
    });
    s.addShape(prs.ShapeType.ellipse, {
      x: 9.2, y: 3.5, w: 6.0, h: 6.0,
      fill: { color: P.STEEL, transparency: 60 },
      line: { color: P.STEEL, transparency: 60 },
    });
    s.addShape(prs.ShapeType.rect, {
      x: 0, y: 2.0, w: 0.12, h: 2.8,
      fill: { color: P.MINT },
      line: { color: P.MINT },
    });

    // Text on top
    s.addText("SPRINT REPORT", {
      x: 0.45, y: 1.5, w: 8, h: 0.55,
      fontSize: 13, bold: true, color: P.ICE,
      charSpacing: 6,
    });
    s.addText(sprintData.sprintName || "Untitled Sprint", {
      x: 0.45, y: 2.05, w: 9, h: 1.5,
      fontSize: 52, bold: true, color: P.WHITE,
      wrap: true, valign: "top",
    });
    s.addText("Weekly Engineering Update", {
      x: 0.45, y: 3.65, w: 8, h: 0.5,
      fontSize: 16, color: P.ICE, italic: true,
    });
    s.addShape(prs.ShapeType.line, {
      x: 0.45, y: 4.25, w: 4, h: 0,
      line: { color: P.STEEL, width: 1 },
    });
    s.addText(`${sprintData.startDate || ""}  —  ${sprintData.endDate || ""}`, {
      x: 0.45, y: 4.35, w: 6, h: 0.45,
      fontSize: 13, color: P.MUTED,
    });

    // Bottom stats
    const bottomStats = [
      { v: String(sprintData.totalTasks || 0), l: "Total Tasks" },
      { v: String(sprintData.completedTasks || 0), l: "Completed" },
      { v: String(projectCount), l: "Projects" },
    ];
    bottomStats.forEach(({ v, l }, i) => {
      const x = 0.45 + i * 2.2;
      s.addText(v, {
        x, y: 5.6, w: 2, h: 0.7,
        fontSize: 30, bold: true, color: P.WHITE,
      });
      s.addText(l, {
        x, y: 6.3, w: 2, h: 0.4,
        fontSize: 10, color: P.ICE,
      });
    });
  }
  reportProgress("Creating cover slide");

  // ==========================================================================
  // SLIDE 2 — Executive Summary
  // ==========================================================================
  {
    const s = prs.addSlide();
    s.background = { color: P.OFF };
    slideHeader(prs, s, "Executive Summary", `${sprintData.startDate} – ${sprintData.endDate}`);

    // Summary card
    s.addShape(prs.ShapeType.roundRect, {
      x: 0.4, y: 1.2, w: 7.8, h: 3.5,
      fill: { color: P.WHITE },
      line: { color: P.BORDER, width: 1 },
      shadow: makeShadow(),
      rectRadius: 0.05,
    });
    s.addShape(prs.ShapeType.rect, {
      x: 0.4, y: 1.2, w: 0.07, h: 3.5,
      fill: { color: P.STEEL },
      line: { color: P.STEEL },
    });
    s.addText("Summary", {
      x: 0.7, y: 1.35, w: 7, h: 0.45,
      fontSize: 13, bold: true, color: P.STEEL,
    });
    s.addText(ai.sprintSummary || "No summary available.", {
      x: 0.7, y: 1.85, w: 7.3, h: 2.5,
      fontSize: 14, color: P.NAVY,
      wrap: true, valign: "top",
    });

    // Velocity note card
    s.addShape(prs.ShapeType.roundRect, {
      x: 8.5, y: 1.2, w: 4.4, h: 1.5,
      fill: { color: P.NAVY },
      line: { color: P.NAVY },
      shadow: makeShadow(),
      rectRadius: 0.08,
    });
    s.addText("VELOCITY", {
      x: 8.7, y: 1.3, w: 4, h: 0.35,
      fontSize: 10, bold: true, color: P.ICE,
      charSpacing: 4,
    });
    s.addText(ai.velocityNote || "—", {
      x: 8.7, y: 1.65, w: 4.0, h: 0.9,
      fontSize: 13, color: P.WHITE,
      wrap: true, italic: true,
    });

    // Completion rate circle
    const rate = sprintData.totalTasks > 0
      ? Math.round((sprintData.completedTasks / sprintData.totalTasks) * 100)
      : 0;
    s.addShape(prs.ShapeType.ellipse, {
      x: 9.1, y: 2.95, w: 2.8, h: 2.8,
      fill: { color: P.INDIGO },
      line: { color: P.STEEL, width: 3 },
      shadow: makeShadow(),
    });
    s.addText(`${rate}%`, {
      x: 9.1, y: 3.35, w: 2.8, h: 0.9,
      fontSize: 36, bold: true, color: P.MINT,
      align: "center",
    });
    s.addText("Completion\nRate", {
      x: 9.1, y: 4.25, w: 2.8, h: 0.6,
      fontSize: 11, color: P.ICE,
      align: "center",
    });
  }
  reportProgress("Creating executive summary");

  // ==========================================================================
  // SLIDE 3 — Sprint Metrics
  // ==========================================================================
  {
    const s = prs.addSlide();
    s.background = { color: P.OFF };
    slideHeader(prs, s, "Sprint Metrics");

    const total = sprintData.totalTasks || 0;
    const done = sprintData.completedTasks || 0;
    const inprog = sprintData.inProgressTasks || 0;
    const todo = Math.max(0, total - done - inprog);
    const rate = total > 0 ? Math.round((done / total) * 100) : 0;

    // Metric cards
    const cards = [
      { v: String(total), l: "Total Tasks", a: P.STEEL },
      { v: String(done), l: "Completed", a: P.MINT },
      { v: String(inprog), l: "In Progress", a: P.AMBER },
      { v: `${rate}%`, l: "Completion Rate", a: P.STEEL },
    ];
    cards.forEach(({ v, l, a }, i) => {
      metricCard(prs, s, 0.4 + i * 3.1, 1.2, v, l, a);
    });

    // Bar chart - ✅ FIXED: Proper chart options typing
    const chartOpts = buildChartOptions({
      x: 0.4, y: 2.9, w: 7.8, h: 4.2,
      barDir: "col",
      chartColors: [P.MINT, P.AMBER, P.BORDER],
      showLegend: false,
      title: "Task Distribution",
      showTitle: true,
    });
    s.addChart(prs.ChartType.bar, [
      {
        name: "Tasks",
        labels: ["Completed", "In Progress", "To Do"],
        values: [done, inprog, todo],
      },
    ], chartOpts);

    // Summary info cards
    const summaryItems = [
      { label: "Sprint Duration", value: `${sprintData.startDate || ""} → ${sprintData.endDate || ""}` },
      { label: "Projects Active", value: String(projectCount) },
      { label: "Team Members", value: String(sprintData.memberWorkload?.length || 0) },
    ];
    summaryItems.forEach(({ label, value }, i) => {
      const y = 2.9 + i * 1.42;
      s.addShape(prs.ShapeType.roundRect, {
        x: 8.5, y, w: 4.4, h: 1.2,
        fill: { color: P.WHITE },
        line: { color: P.BORDER, width: 1 },
        shadow: makeShadow(),
        rectRadius: 0.08,
      });
      s.addText(label, {
        x: 8.7, y: y + 0.1, w: 4.0, h: 0.35,
        fontSize: 10, color: P.MUTED,
      });
      s.addText(value, {
        x: 8.7, y: y + 0.45, w: 4.0, h: 0.55,
        fontSize: 16, bold: true, color: P.NAVY,
      });
    });
  }
  reportProgress("Creating sprint metrics");

  // ==========================================================================
  // SLIDE 4 — Highlights & Risks
  // ==========================================================================
  {
    const s = prs.addSlide();
    s.background = { color: P.OFF };
    slideHeader(prs, s, "Highlights & Risks");

    // Highlights panel
    s.addShape(prs.ShapeType.roundRect, {
      x: 0.4, y: 1.2, w: 6.1, h: 5.9,
      fill: { color: P.WHITE },
      line: { color: P.BORDER, width: 1 },
      shadow: makeShadow(),
      rectRadius: 0.05,
    });
    s.addShape(prs.ShapeType.rect, {
      x: 0.4, y: 1.2, w: 6.1, h: 0.55,
      fill: { color: P.MINT },
      line: { color: P.MINT },
    });
    s.addText("✓  HIGHLIGHTS", {
      x: 0.55, y: 1.2, w: 5.8, h: 0.55,
      fontSize: 13, bold: true, color: P.WHITE,
      valign: "middle", margin: 0,
    });

    (ai.highlights || []).slice(0, 6).forEach((h: string, i: number) => {
      const y = 1.95 + i * 0.8;
      // Bullet dot
      s.addShape(prs.ShapeType.ellipse, {
        x: 0.65, y: y + 0.05, w: 0.28, h: 0.28,
        fill: { color: P.MINT, transparency: 80 },
        line: { color: P.MINT },
      });
      // Text
      s.addText(h || "—", {
        x: 1.1, y, w: 5.2, h: 0.7,
        fontSize: 13, color: P.NAVY,
        wrap: true, valign: "middle",
      });
    });

    // Risks panel (conditional)
    if (includeBlockerNotes) {
      s.addShape(prs.ShapeType.roundRect, {
        x: 6.8, y: 1.2, w: 6.1, h: 5.9,
        fill: { color: P.WHITE },
        line: { color: P.BORDER, width: 1 },
        shadow: makeShadow(),
        rectRadius: 0.05,
      });
      s.addShape(prs.ShapeType.rect, {
        x: 6.8, y: 1.2, w: 6.1, h: 0.55,
        fill: { color: P.ROSE },
        line: { color: P.ROSE },
      });
      s.addText("⚠  RISKS & BLOCKERS", {
        x: 6.95, y: 1.2, w: 5.8, h: 0.55,
        fontSize: 13, bold: true, color: P.WHITE,
        valign: "middle", margin: 0,
      });

      (ai.risks || []).slice(0, 6).forEach((r: string, i: number) => {
        const y = 1.95 + i * 0.8;
        s.addShape(prs.ShapeType.ellipse, {
          x: 7.05, y: y + 0.05, w: 0.28, h: 0.28,
          fill: { color: P.ROSE, transparency: 80 },
          line: { color: P.ROSE },
        });
        s.addText(r || "—", {
          x: 7.5, y, w: 5.2, h: 0.7,
          fontSize: 13, color: P.NAVY,
          wrap: true, valign: "middle",
        });
      });
    }
  }
  reportProgress("Creating highlights & risks");

  // ==========================================================================
  // SLIDE 5 — Team Performance
  // ==========================================================================
  {
    const s = prs.addSlide();
    s.background = { color: P.OFF };
    slideHeader(prs, s, "Team Performance");

    const members = sprintData.memberWorkload || [];

    // Dual bar chart - ✅ FIXED: Proper multi-series chart config
    const chartOpts = buildChartOptions({
      x: 0.4, y: 1.2, w: 7.8, h: 5.9,
      barDir: "bar",
      barGrouping: "clustered",
      chartColors: [P.STEEL, P.MINT],
      showLegend: true,
      legendPos: "b",
      legendColor: P.MUTED,
      title: "Hours & Tasks per Member",
      showTitle: true,
    });

    s.addChart(prs.ChartType.bar, [
      {
        name: "Hours",
        labels: members.map((m: any) => m.name || "Unknown"),
        values: members.map((m: any) => m.totalHours || 0),
      },
      {
        name: "Tasks",
        labels: members.map((m: any) => m.name || "Unknown"),
        values: members.map((m: any) => m.taskCount || 0),
      },
    ], chartOpts);

    // Member detail cards (top 5)
    members.slice(0, 5).forEach((m: any, i: number) => {
      const y = 1.2 + i * 1.18;
      const hours = m.totalHours || 0;
      const status = hours > 40 ? "Overloaded" : hours > 32 ? "At Capacity" : hours > 20 ? "Healthy" : "Optimal";
      const statusColor = hours > 40 ? P.ROSE : hours > 32 ? P.AMBER : P.MINT;

      s.addShape(prs.ShapeType.roundRect, {
        x: 8.5, y, w: 4.4, h: 1.0,
        fill: { color: P.WHITE },
        line: { color: P.BORDER, width: 1 },
        shadow: makeShadow(),
        rectRadius: 0.08,
      });
      s.addShape(prs.ShapeType.rect, {
        x: 8.5, y, w: 0.07, h: 1.0,
        fill: { color: statusColor },
        line: { color: statusColor },
      });
      s.addText(m.name || "Unknown", {
        x: 8.7, y: y + 0.08, w: 3.0, h: 0.35,
        fontSize: 13, bold: true, color: P.NAVY,
      });
      s.addText(`${m.taskCount || 0} tasks  •  ${hours}h`, {
        x: 8.7, y: y + 0.45, w: 2.8, h: 0.3,
        fontSize: 10, color: P.MUTED,
      });
      s.addText(status, {
        x: 11.0, y: y + 0.25, w: 1.8, h: 0.45,
        fontSize: 11, bold: true, color: statusColor,
        align: "right",
      });
    });
  }
  reportProgress("Creating team performance");

  // ==========================================================================
  // SLIDE 6 — Project Overview Summary
  // ==========================================================================
  {
    const s = prs.addSlide();
    s.background = { color: P.OFF };
    slideHeader(prs, s, "Projects Overview");

    const projectStats = (sprintData.projects || []).map((p: any) => ({
      name: p.name || "Unnamed",
      status: p.status || "Unknown",
      taskCount: p.tasks?.length || 0,
    }));

    // Doughnut chart - ✅ FIXED: Proper doughnut config
    s.addChart(prs.ChartType.doughnut, [
      {
        name: "Projects",
        labels: projectStats.map((p: any) => p.name),
        values: projectStats.map((p: any) => p.taskCount),
      },
    ], {
      x: 0.5, y: 1.3, w: 6, h: 5.5,
      chartColors: [P.STEEL, P.MINT, P.AMBER, P.ROSE, P.INDIGO, P.ICE],
      showLegend: true,
      legendPos: "b",
      title: "Tasks per Project",
      showTitle: true,
      titleColor: P.NAVY,
      titleFontSize: 13,
      holeSize: 65,
      dataLabelPosition: "bestFit",
    } as any);

    // Project status list
    projectStats.forEach((p: any, i: number) => {
      const y = 1.3 + i * 0.9;
      const statusColor = p.status === "Completed" ? P.MINT : p.status === "Active" ? P.STEEL : P.AMBER;

      s.addShape(prs.ShapeType.roundRect, {
        x: 7.5, y, w: 5.3, h: 0.75,
        fill: { color: P.WHITE },
        line: { color: P.BORDER, width: 1 },
        shadow: makeShadow(),
        rectRadius: 0.08,
      });
      s.addShape(prs.ShapeType.rect, {
        x: 7.5, y, w: 0.06, h: 0.75,
        fill: { color: statusColor },
        line: { color: statusColor },
      });
      s.addText(p.name, {
        x: 7.65, y: y + 0.08, w: 3.5, h: 0.35,
        fontSize: 12, bold: true, color: P.NAVY,
      });
      s.addText(`${p.taskCount} tasks`, {
        x: 7.65, y: y + 0.42, w: 2, h: 0.28,
        fontSize: 10, color: P.MUTED,
      });
      s.addText(p.status, {
        x: 11.5, y: y + 0.25, w: 1.2, h: 0.35,
        fontSize: 10, bold: true, color: statusColor,
        align: "right",
      });
    });
  }
  reportProgress("Creating project overview");

  // ==========================================================================
  // PER-PROJECT SLIDES
  // ==========================================================================
  for (const p of sprintData.projects || []) {
    const s = prs.addSlide();
    s.background = { color: P.OFF };
    slideHeader(prs, s, p.name || "Project", p.status || "Unknown");

    const statusColor = p.status === "Completed" ? P.MINT : p.status === "In Progress" ? P.AMBER : P.ROSE;
    const tasks = p.tasks || [];

    // Status badge
    s.addShape(prs.ShapeType.roundRect, {
      x: 11.5, y: 0.18, w: 1.5, h: 0.42,
      fill: { color: statusColor },
      line: { color: statusColor },
      rectRadius: 0.1,
    });
    s.addText(p.status || "Unknown", {
      x: 11.5, y: 0.18, w: 1.5, h: 0.42,
      fontSize: 10, bold: true, color: P.WHITE,
      align: "center", valign: "middle", margin: 0,
    });

    // ✅ FIXED: Proper table API usage with typed options
    const headerRow = buildTableRow([
      { text: "Task", opts: { bold: true, color: P.WHITE, fontSize: 11 } },
      { text: "Type", opts: { bold: true, color: P.WHITE, fontSize: 11 } },
      { text: "Status", opts: { bold: true, color: P.WHITE, fontSize: 11 } },
      { text: "Time", opts: { bold: true, color: P.WHITE, fontSize: 11 } },
      { text: "Assignees", opts: { bold: true, color: P.WHITE, fontSize: 11 } },
    ], true);

    const dataRows = tasks.map((t: any, ri: number) => {
      const bg = ri % 2 === 0 ? P.WHITE : "F1F5F9";
      const statusC = t.status === "Done" || t.status === "Completed" ? P.MINT : t.status === "In Progress" ? P.AMBER : P.MUTED;
      return buildTableRow([
        { text: t.title || "Untitled", opts: { fill: { color: bg }, fontSize: 11, color: P.NAVY } },
        { text: t.type || "—", opts: { fill: { color: bg }, fontSize: 11, color: P.MUTED } },
        { text: t.status || "—", opts: { fill: { color: bg }, fontSize: 11, bold: true, color: statusC } },
        { text: `${t.timeValue ?? 0}${t.timeUnit || "h"}`, opts: { fill: { color: bg }, fontSize: 11, color: P.MUTED } },
        { text: Array.isArray(t.assignees) ? t.assignees.join(", ") : t.assignees || "—", opts: { fill: { color: bg }, fontSize: 11, color: P.MUTED } },
      ]);
    });

    // ✅ FIXED: Use proper addTable API
    const tableOpts: any = {
      x: 0.4,
      y: 1.15,
      w: 12.5,
      border: { type: "solid", color: P.BORDER, width: 0.5 },
      rowH: 0.48,
      colW: [4.2, 1.6, 1.6, 1.0, 4.1],
      fontSize: 11,
      fontFace: "Calibri",
    };

    s.addTable([headerRow, ...dataRows], tableOpts);
    reportProgress(`Adding project: ${p.name || "Unknown"}`);
  }

  // ==========================================================================
  // FINAL SLIDE — Recommendations + Next Sprint
  // ==========================================================================
  {
    const s = prs.addSlide();
    s.background = { color: P.NAVY };

    // Background decoration (rendered first)
    s.addShape(prs.ShapeType.ellipse, {
      x: 10, y: 4, w: 6, h: 6,
      fill: { color: P.INDIGO },
      line: { color: P.INDIGO },
    });

    // Title section
    s.addText("RECOMMENDATIONS", {
      x: 0.5, y: 0.45, w: 9, h: 0.45,
      fontSize: 11, bold: true, color: P.ICE,
      charSpacing: 5,
    });
    s.addText("& Next Steps", {
      x: 0.5, y: 0.9, w: 9, h: 0.9,
      fontSize: 36, bold: true, color: P.WHITE,
    });
    s.addShape(prs.ShapeType.line, {
      x: 0.5, y: 1.9, w: 3, h: 0,
      line: { color: P.MINT, width: 2 },
    });

    // Recommendations list
    (ai.recommendations || []).slice(0, 5).forEach((r: string, i: number) => {
      const y = 2.1 + i * 0.82;
      s.addShape(prs.ShapeType.rect, {
        x: 0.5, y, w: 0.06, h: 0.6,
        fill: { color: P.MINT },
        line: { color: P.MINT },
      });
      s.addText(r || "—", {
        x: 0.75, y, w: 8.5, h: 0.72,
        fontSize: 14, color: P.ICE,
        wrap: true, valign: "middle",
      });
    });

    // Next Sprint card
    s.addShape(prs.ShapeType.roundRect, {
      x: 9.3, y: 1.4, w: 3.6, h: 3.8,
      fill: { color: P.INDIGO },
      line: { color: P.STEEL, width: 1 },
      shadow: makeShadow(),
      rectRadius: 0.05,
    });
    s.addShape(prs.ShapeType.rect, {
      x: 9.3, y: 1.4, w: 3.6, h: 0.5,
      fill: { color: P.STEEL },
      line: { color: P.STEEL },
    });
    s.addText("NEXT SPRINT", {
      x: 9.4, y: 1.4, w: 3.4, h: 0.5,
      fontSize: 11, bold: true, color: P.WHITE,
      charSpacing: 3, valign: "middle", margin: 0,
    });
    s.addText(ai.nextSprintFocus || "To be determined.", {
      x: 9.4, y: 2.0, w: 3.3, h: 3.0,
      fontSize: 13, color: P.ICE,
      wrap: true, valign: "top",
    });

    // Footer
    s.addText(`${sprintData.sprintName || ""}  |  ${sprintData.endDate || ""}`, {
      x: 0.5, y: 6.9, w: 12.3, h: 0.4,
      fontSize: 10, color: P.MUTED,
      align: "center",
    });
  }
  reportProgress("Finalizing presentation");

  // ✅ FIXED: Proper buffer export with error handling
  try {
    return (await prs.write({ outputType: "nodebuffer" })) as unknown as Buffer;
  } catch (error) {
    console.error("Failed to generate PPTX:", error);
    throw new Error(`Presentation generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}