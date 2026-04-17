import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  Header,
  Footer,
  AlignmentType,
  HeadingLevel,
  WidthType,
  ShadingType,
  BorderStyle,
  VerticalAlign,
  PageNumber,
  LevelFormat,
  TabStopPosition,
  TabStopType,
  PageBreak,
  TableOfContents,
  TableLayoutType,
  ISectionOptions,
} from "docx";

// ============================================================================
// 🎨 COLOR & LAYOUT CONSTANTS
// ============================================================================
const COLOR = {
  NAVY:   "0F1B2D",
  STEEL:  "2563A8",
  MINT:   "02C39A",
  AMBER:  "F59E0B",
  ROSE:   "E11D48",
  MUTED:  "64748B",
  LIGHT:  "F1F5F9",
  BORDER: "CBD5E1",
  WHITE:  "FFFFFF",
  ICE:    "CADCFC",
};

// Page dimensions in DXA (1/20 point): A4 landscape approx
const PAGE_W  = 12240;  // 612pt × 20
const PAGE_H  = 15840;  // 792pt × 20
const MARGIN  = 1440;   // 72pt × 20
const CONTENT = PAGE_W - MARGIN * 2;

// Font size helper: converts pt → half-points (docx uses half-points)
const pt = (points: number) => points * 2;

// ============================================================================
// 🧱 REUSABLE HELPERS
// ============================================================================
const border = (color = COLOR.BORDER, size = 4) => ({
  style: BorderStyle.SINGLE,
  size,
  color,
});

const allBorders = (color?: string, size?: number) => ({
  top: border(color, size),
  bottom: border(color, size),
  left: border(color, size),
  right: border(color, size),
});

// Header cell: navy background, white bold text
function headerCell(text: string, widthDxa: number): TableCell {
  return new TableCell({
    width: { size: widthDxa, type: WidthType.DXA },
    borders: allBorders(COLOR.STEEL, 4),
    shading: { fill: COLOR.NAVY, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 140, right: 140 },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            bold: true,
            color: COLOR.WHITE,
            font: "Calibri",
            size: pt(13),
          }),
        ],
      }),
    ],
  });
}

// Data cell: flexible styling options
function dataCell(
  text: string,
  widthDxa: number,
  opts: {
    bold?: boolean;
    color?: string;
    shade?: string;
    align?: keyof typeof AlignmentType;
    italic?: boolean;
    fontSize?: number; // in points
  } = {}
): TableCell {
  return new TableCell({
    width: { size: widthDxa, type: WidthType.DXA },
    borders: allBorders(COLOR.BORDER, 2),
    shading: {
      fill: opts.shade ?? COLOR.WHITE,
      type: ShadingType.CLEAR,
    },
    margins: { top: 80, bottom: 80, left: 140, right: 140 },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: opts.align ? AlignmentType[opts.align] : AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            bold: opts.bold ?? false,
            color: opts.color ?? COLOR.NAVY,
            font: "Calibri",
            size: pt(opts.fontSize ?? 11),
            italics: opts.italic ?? false,
          }),
        ],
      }),
    ],
  });
}

// Section heading with bottom border
function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 8, color: COLOR.STEEL, space: 4 },
    },
    spacing: { before: 480, after: 120 },
  });
}

// Sub-heading (H2 style)
function subHeading(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 80 },
  });
}

// Body paragraph with flexible options
function body(
  text: string,
  opts: {
    italic?: boolean;
    color?: string;
    spaceBefore?: number;
    spaceAfter?: number;
    bold?: boolean;
    fontSize?: number;
  } = {}
): Paragraph {
  return new Paragraph({
    spacing: {
      before: opts.spaceBefore ?? 0,
      after: opts.spaceAfter ?? 120,
    },
    children: [
      new TextRun({
        text,
        font: "Calibri",
        size: pt(opts.fontSize ?? 18),
        italics: opts.italic ?? false,
        color: opts.color ?? COLOR.MUTED,
        bold: opts.bold ?? false,
      }),
    ],
  });
}

// Spacer paragraph
function spacer(ptBefore = 160): Paragraph {
  return new Paragraph({ spacing: { before: ptBefore, after: 0 }, children: [] });
}

// ============================================================================
// 📄 MAIN DOCUMENT GENERATOR
// ============================================================================
export async function generateDocxWithProgress(
  sprintData: any,
  ai: any,
  onProgress?: (stage: string, percent: number) => void,
  includeBlockerNotes: boolean = true
): Promise<Buffer> {
  const rate = Math.round((sprintData.completedTasks / sprintData.totalTasks) * 100) || 0;
  const totalStages = 8;
  let currentStage = 0;

  const reportProgress = (stage: string) => {
    currentStage++;
    const percent = Math.min(100, Math.round((currentStage / totalStages) * 100));
    onProgress?.(stage, percent);
  };

  // ==========================================================================
  // STAGE 1: Metrics Table
  // ==========================================================================
  const metricsRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        headerCell("Metric", 5580),
        headerCell("Value", 3780),
      ],
    }),
    ...([
      ["Total Tasks", String(sprintData.totalTasks)],
      ["Completed", String(sprintData.completedTasks)],
      ["In Progress", String(sprintData.inProgressTasks)],
      ["Completion Rate", `${rate}%`],
      ["Projects", String(sprintData.projects?.length || 0)],
      ["Team Members", String(sprintData.memberWorkload?.length || 0)],
    ] as [string, string][]).map(([label, value], i) =>
      new TableRow({
        children: [
          dataCell(label, 5580, { shade: i % 2 === 0 ? COLOR.WHITE : COLOR.LIGHT }),
          dataCell(value, 3780, {
            bold: true,
            color: COLOR.STEEL,
            shade: i % 2 === 0 ? COLOR.WHITE : COLOR.LIGHT,
          }),
        ],
      })
    ),
  ];
  reportProgress("Building metrics table");

  // ==========================================================================
  // STAGE 2: Team Performance Table
  // ==========================================================================
  const COL_TEAM = [2340, 2160, 1080, 1080, 2700];
  const teamRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: ["Member", "Role", "Tasks", "Hours", "AI Insight"].map((h, i) =>
        headerCell(h, COL_TEAM[i])
      ),
    }),
    ...(sprintData.memberWorkload || []).map((m: any, i: number) => {
      const insight = ai.memberInsights?.find((mi: any) => mi.name === m.name)?.insight ?? "—";
      const shade = i % 2 === 0 ? COLOR.WHITE : COLOR.LIGHT;
      const hours = m.totalHours || 0;
      const statusColor = hours > 40 ? COLOR.ROSE : hours > 32 ? COLOR.AMBER : COLOR.MINT;
      return new TableRow({
        children: [
          dataCell(m.name || "Unknown", COL_TEAM[0], { bold: true, shade }),
          dataCell(m.role ?? "—", COL_TEAM[1], { shade }),
          dataCell(String(m.taskCount || 0), COL_TEAM[2], { shade, align: "CENTER" }),
          dataCell(`${hours}h`, COL_TEAM[3], {
            bold: true,
            color: COLOR.WHITE,
            shade: statusColor,
            align: "CENTER",
          }),
          dataCell(insight, COL_TEAM[4], { shade, color: COLOR.MUTED, fontSize: 10 }),
        ],
      });
    }),
  ];
  reportProgress("Building team table");

  // ==========================================================================
  // STAGE 3: Project Breakdown Sections
  // ==========================================================================
  const projectSections: (Paragraph | Table)[] = [];
  const COL_TASK = [3240, 1260, 1260, 780, 2820];

  for (const p of sprintData.projects || []) {
    projectSections.push(subHeading(`${p.name || "Unnamed Project"} (${p.status || "Unknown"})`));

    const taskRows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: ["Task", "Type", "Status", "Time", "Assignees"].map((h, i) =>
          headerCell(h, COL_TASK[i])
        ),
      }),
      ...(p.tasks || []).map((t: any, i: number) => {
        const shade = i % 2 === 0 ? COLOR.WHITE : COLOR.LIGHT;
        const done = t.status === "Done" || t.status === "Completed";
        const statusColor = done
          ? COLOR.MINT
          : t.status === "In Progress"
          ? COLOR.AMBER
          : COLOR.MUTED;
        return new TableRow({
          children: [
            dataCell(t.title || "Untitled", COL_TASK[0], { shade }),
            dataCell(t.type || "—", COL_TASK[1], { shade, color: COLOR.MUTED }),
            dataCell(t.status || "—", COL_TASK[2], {
              bold: true,
              color: COLOR.WHITE,
              shade: statusColor,
              align: "CENTER",
            }),
            dataCell(`${t.timeValue ?? 0}${t.timeUnit || "h"}`, COL_TASK[3], {
              shade,
              align: "CENTER",
            }),
            dataCell(
              Array.isArray(t.assignees) ? t.assignees.join(", ") : t.assignees || "—",
              COL_TASK[4],
              { shade }
            ),
          ],
        });
      }),
    ];

    projectSections.push(
      new Table({
        width: { size: CONTENT, type: WidthType.DXA },
        layout: TableLayoutType.FIXED,
        columnWidths: COL_TASK,
        rows: taskRows,
      }),
      spacer(120)
    );
  }
  reportProgress("Building project tables");

  // ==========================================================================
  // STAGE 4: Recommendations List
  // ==========================================================================
  const recoParas = (ai.recommendations || []).map((r: string) =>
    new Paragraph({
      spacing: { before: 100, after: 100 },
      numbering: { reference: "numbers", level: 0 },
      children: [
        new TextRun({
          text: r || "—",
          font: "Calibri",
          size: pt(11),
          color: COLOR.NAVY,
        }),
      ],
    })
  );
  reportProgress("Building recommendations");

  // ==========================================================================
  // STAGE 5: Highlights & Risks
  // ==========================================================================
  const highlightParas = (ai.highlights || []).map((h: string) =>
    new Paragraph({
      spacing: { before: 60, after: 60 },
      numbering: { reference: "bullets", level: 0 },
      children: [
        new TextRun({
          text: h || "—",
          font: "Calibri",
          size: pt(11),
          color: COLOR.NAVY,
        }),
      ],
    })
  );
  reportProgress("Building highlights");

  const riskParas = (ai.risks || []).map((r: string) =>
    new Paragraph({
      spacing: { before: 60, after: 60 },
      numbering: { reference: "bullets-rose", level: 0 },
      children: [
        new TextRun({
          text: r || "—",
          font: "Calibri",
          size: pt(11),
          color: COLOR.NAVY,
        }),
      ],
    })
  );
  reportProgress("Building risks");

  // ==========================================================================
  // STAGE 6: Build Document Structure
  // ==========================================================================
  const section: ISectionOptions = {
    properties: {
      page: {
        size: { width: PAGE_W, height: PAGE_H },
        margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
      },
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR.STEEL, space: 6 },
            },
            spacing: { after: 0 },
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            children: [
              new TextRun({
                text: sprintData.sprintName || "Sprint Report",
                font: "Calibri",
                size: pt(11),
                bold: true,
                color: COLOR.NAVY,
              }),
              new TextRun({ text: "\t", font: "Calibri", size: pt(11) }),
              new TextRun({
                text: `${sprintData.startDate || ""} – ${sprintData.endDate || ""}`,
                font: "Calibri",
                size: pt(11),
                color: COLOR.MUTED,
              }),
            ],
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            border: {
              top: { style: BorderStyle.SINGLE, size: 6, color: COLOR.STEEL, space: 6 },
            },
            spacing: { before: 0 },
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            children: [
              new TextRun({
                text: "Confidential — Internal Use Only",
                font: "Calibri",
                size: pt(10),
                color: COLOR.MUTED,
              }),
              new TextRun({ text: "\tPage ", font: "Calibri", size: pt(10), color: COLOR.MUTED }),
              new TextRun({
                children: [PageNumber.CURRENT],
                font: "Calibri",
                size: pt(10),
                color: COLOR.MUTED,
              }),
            ],
          }),
        ],
      }),
    },
    children: [
      // Title Block
      new Paragraph({
        spacing: { before: 0, after: 60 },
        children: [
          new TextRun({
            text: "SPRINT REPORT",
            font: "Calibri",
            size: pt(14),
            bold: true,
            color: COLOR.STEEL,
            characterSpacing: 150,
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 0, after: 80 },
        children: [
          new TextRun({
            text: sprintData.sprintName || "Untitled Sprint",
            font: "Calibri",
            size: pt(36),
            bold: true,
            color: COLOR.NAVY,
          }),
        ],
      }),
      new Paragraph({
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 12, color: COLOR.MINT, space: 4 },
        },
        spacing: { before: 0, after: 320 },
        children: [
          new TextRun({
            text: `${sprintData.startDate || ""}  —  ${sprintData.endDate || ""}`,
            font: "Calibri",
            size: pt(14),
            color: COLOR.MUTED,
          }),
        ],
      }),

      // KPI Summary Cards
      new Table({
        width: { size: CONTENT, type: WidthType.DXA },
        layout: TableLayoutType.FIXED,
        columnWidths: [2340, 2340, 2340, 2340],
        rows: [
          new TableRow({
            children: [
              [String(sprintData.totalTasks), "Total Tasks", COLOR.STEEL],
              [String(sprintData.completedTasks), "Completed", COLOR.MINT],
              [String(sprintData.inProgressTasks), "In Progress", COLOR.AMBER],
              [`${rate}%`, "Completion Rate", COLOR.STEEL],
            ].map(([v, l, c]) =>
              new TableCell({
                width: { size: 2340, type: WidthType.DXA },
                borders: allBorders(COLOR.BORDER, 2),
                shading: { fill: COLOR.LIGHT, type: ShadingType.CLEAR },
                margins: { top: 140, bottom: 140, left: 180, right: 180 },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: v,
                        font: "Calibri",
                        size: pt(32),
                        bold: true,
                        color: c,
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 40 },
                    children: [
                      new TextRun({
                        text: l,
                        font: "Calibri",
                        size: pt(11),
                        color: COLOR.MUTED,
                      }),
                    ],
                  }),
                ],
              })
            ),
          }),
        ],
      }),
      spacer(400),
      new Paragraph({ children: [new PageBreak()] }),

      // Table of Contents (requires updateFields feature)
      new TableOfContents("Table of Contents", {
        hyperlink: true,
        headingStyleRange: "1-2",
      }),
      new Paragraph({ children: [new PageBreak()] }),

      // Executive Summary
      sectionHeading("Executive Summary"),
      body(ai.sprintSummary || "No summary available.", { spaceAfter: 160 }),
      ...(ai.velocityNote
        ? [body(ai.velocityNote, { italic: true, color: COLOR.STEEL, spaceAfter: 200 })]
        : []),

      // Sprint Metrics
      sectionHeading("Sprint Metrics"),
      new Table({
        width: { size: CONTENT, type: WidthType.DXA },
        layout: TableLayoutType.FIXED,
        columnWidths: [5580, 3780],
        rows: metricsRows,
      }),
      spacer(320),
      new Paragraph({ children: [new PageBreak()] }),

      // Highlights
      sectionHeading("Highlights"),
      ...(highlightParas.length > 0 ? highlightParas : [body("No highlights recorded.")]),

      // Risks & Blockers (conditional)
      ...(includeBlockerNotes
        ? [spacer(200), sectionHeading("Risks & Blockers"), ...(riskParas.length > 0 ? riskParas : [body("No risks identified.")])]
        : []),

      spacer(200),
      new Paragraph({ children: [new PageBreak()] }),

      // Team Performance
      sectionHeading("Team Performance"),
      new Table({
        width: { size: CONTENT, type: WidthType.DXA },
        layout: TableLayoutType.FIXED,
        columnWidths: COL_TEAM,
        rows: teamRows,
      }),
      spacer(320),
      new Paragraph({ children: [new PageBreak()] }),

      // Project Breakdown
      sectionHeading("Project Breakdown"),
      ...projectSections,

      // Recommendations
      sectionHeading("Recommendations"),
      ...(recoParas.length > 0 ? recoParas : [body("No recommendations at this time.")]),

      spacer(200),

      // Next Sprint Focus
      sectionHeading("Next Sprint Focus"),
      body(ai.nextSprintFocus || "To be determined.", { spaceAfter: 240 }),
    ],
  };

  reportProgress("Assembling document");

  // ==========================================================================
  // STAGE 7: Create & Pack Document
  // ==========================================================================
  const doc = new Document({
    features: { updateFields: true }, // ✅ Required for TOC to work
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "●",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 720, hanging: 360 } },
              },
            },
          ],
        },
        {
          reference: "bullets-rose",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "▸",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 720, hanging: 360 } },
              },
            },
          ],
        },
        {
          reference: "numbers",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 720, hanging: 360 } },
              },
            },
          ],
        },
      ],
    },
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: pt(11), color: COLOR.MUTED },
        },
      },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: pt(24), bold: true, font: "Arial", color: COLOR.NAVY },
          paragraph: { spacing: { before: 480, after: 120 }, outlineLevel: 0 },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: pt(18), bold: true, font: "Arial", color: COLOR.STEEL },
          paragraph: { spacing: { before: 320, after: 80 }, outlineLevel: 1 },
        },
      ],
    },
    sections: [section],
  });

  reportProgress("Generating final file");
  return await Packer.toBuffer(doc);
}