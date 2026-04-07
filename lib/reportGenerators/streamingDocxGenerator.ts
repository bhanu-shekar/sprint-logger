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
  TabStopType,
  TabStopPosition,
  PageBreak,
} from "docx";

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

const PAGE_W  = 12240;
const PAGE_H  = 15840;
const MARGIN  = 1440;
const CONTENT = PAGE_W - MARGIN * 2;

const border = (color = COLOR.BORDER, sz = 4) => ({
  style: BorderStyle.SINGLE,
  size: sz,
  color,
});

const allBorders = (color?: string, sz?: number) => ({
  top: border(color, sz),
  bottom: border(color, sz),
  left: border(color, sz),
  right: border(color, sz),
});

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
          new TextRun({ text, bold: true, color: COLOR.WHITE, font: "Calibri", size: 20 }),
        ],
      }),
    ],
  });
}

function dataCell(
  text: string,
  widthDxa: number,
  opts: { bold?: boolean; color?: string; shade?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}
): TableCell {
  return new TableCell({
    width: { size: widthDxa, type: WidthType.DXA },
    borders: allBorders(COLOR.BORDER, 2),
    shading: { fill: opts.shade ?? COLOR.WHITE, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 140, right: 140 },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: opts.align ?? AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            bold: opts.bold ?? false,
            color: opts.color ?? COLOR.NAVY,
            font: "Calibri",
            size: 18,
          }),
        ],
      }),
    ],
  });
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 8, color: COLOR.STEEL, space: 4 },
    },
    children: [
      new TextRun({ text, bold: true, font: "Calibri", size: 28, color: COLOR.NAVY }),
    ],
  });
}

function subHeading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 80 },
    children: [
      new TextRun({ text, bold: true, font: "Calibri", size: 24, color: COLOR.STEEL }),
    ],
  });
}

function body(text: string, opts: { italic?: boolean; color?: string; spaceBefore?: number; spaceAfter?: number } = {}): Paragraph {
  return new Paragraph({
    spacing: { before: opts.spaceBefore ?? 0, after: opts.spaceAfter ?? 120 },
    children: [
      new TextRun({
        text,
        font: "Calibri",
        size: 20,
        italics: opts.italic ?? false,
        color: opts.color ?? COLOR.MUTED,
      }),
    ],
  });
}

function spacer(pt = 160): Paragraph {
  return new Paragraph({ spacing: { before: pt, after: 0 }, children: [] });
}

export async function generateDocxWithProgress(
  sprintData: any,
  ai: any,
  onProgress?: (stage: string, percent: number) => void,
  includeBlockerNotes: boolean = true
): Promise<Buffer> {
  const rate = Math.round((sprintData.completedTasks / sprintData.totalTasks) * 100);
  const totalStages = 8;
  let currentStage = 0;

  const reportProgress = (stage: string) => {
    currentStage++;
    const percent = Math.round((currentStage / totalStages) * 100);
    onProgress?.(stage, percent);
  };

  // Stage 1: Metrics table
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
      ["Projects", String(sprintData.projects.length)],
      ["Team Members", String(sprintData.memberWorkload.length)],
    ] as [string, string][]).map(([label, value], i) =>
      new TableRow({
        children: [
          dataCell(label, 5580, { shade: i % 2 === 0 ? COLOR.WHITE : COLOR.LIGHT }),
          dataCell(value, 3780, { bold: true, color: COLOR.STEEL, shade: i % 2 === 0 ? COLOR.WHITE : COLOR.LIGHT }),
        ],
      })
    ),
  ];
  reportProgress("Building metrics table");

  // Stage 2: Team performance table
  const COL_TEAM = [2340, 2160, 1080, 1080, 2700];
  const teamRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: ["Member", "Role", "Tasks", "Hours", "AI Insight"].map((h, i) =>
        headerCell(h, COL_TEAM[i])
      ),
    }),
    ...sprintData.memberWorkload.map((m: any, i: number) => {
      const insight = ai.memberInsights?.find((mi: any) => mi.name === m.name)?.insight ?? "";
      const shade = i % 2 === 0 ? COLOR.WHITE : COLOR.LIGHT;
      const hours = m.totalHours;
      const statusColor = hours > 40 ? COLOR.ROSE : hours > 32 ? COLOR.AMBER : COLOR.MINT;
      return new TableRow({
        children: [
          dataCell(m.name, COL_TEAM[0], { bold: true, shade }),
          dataCell(m.role ?? "", COL_TEAM[1], { shade }),
          dataCell(String(m.taskCount), COL_TEAM[2], { shade, align: AlignmentType.CENTER }),
          dataCell(`${hours}h`, COL_TEAM[3], { bold: true, color: statusColor, shade, align: AlignmentType.CENTER }),
          dataCell(insight, COL_TEAM[4], { shade, color: COLOR.MUTED }),
        ],
      });
    }),
  ];
  reportProgress("Building team table");

  // Stage 3: Project breakdown sections
  const projectSections: (Paragraph | Table)[] = [];
  const COL_TASK = [3240, 1260, 1260, 780, 2820];

  for (const p of sprintData.projects) {
    projectSections.push(subHeading(`${p.name}  (${p.status})`));
    const taskRows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: ["Task", "Type", "Status", "Time", "Assignees"].map((h, i) =>
          headerCell(h, COL_TASK[i])
        ),
      }),
      ...(p.tasks as any[]).map((t: any, i: number) => {
        const shade = i % 2 === 0 ? COLOR.WHITE : COLOR.LIGHT;
        const done = t.status === "Done" || t.status === "Completed";
        const statusColor = done ? COLOR.MINT : t.status === "In Progress" ? COLOR.AMBER : COLOR.MUTED;
        return new TableRow({
          children: [
            dataCell(t.title, COL_TASK[0], { shade }),
            dataCell(t.type, COL_TASK[1], { shade, color: COLOR.MUTED }),
            dataCell(t.status, COL_TASK[2], { bold: true, color: statusColor, shade }),
            dataCell(`${t.timeValue}${t.timeUnit}`, COL_TASK[3], { shade, align: AlignmentType.CENTER }),
            dataCell(t.assignees.join(", "), COL_TASK[4], { shade }),
          ],
        });
      }),
    ];
    projectSections.push(
      new Table({
        width: { size: CONTENT, type: WidthType.DXA },
        columnWidths: COL_TASK,
        rows: taskRows,
      }),
      spacer(120)
    );
  }
  reportProgress("Building project tables");

  // Stage 4: Recommendations list
  const recoParas = (ai.recommendations || []).map((r: string, i: number) =>
    new Paragraph({
      spacing: { before: 100, after: 100 },
      numbering: { reference: "numbers", level: 0 },
      children: [new TextRun({ text: r, font: "Calibri", size: 20, color: COLOR.NAVY })],
    })
  );
  reportProgress("Building recommendations");

  // Stage 5: Highlight and risk paragraphs
  const highlightParas = (ai.highlights || []).map((h: string) =>
    new Paragraph({
      spacing: { before: 60, after: 60 },
      numbering: { reference: "bullets", level: 0 },
      children: [new TextRun({ text: h, font: "Calibri", size: 20, color: COLOR.NAVY })],
    })
  );
  reportProgress("Building highlights");

  const riskParas = (ai.risks || []).map((r: string) =>
    new Paragraph({
      spacing: { before: 60, after: 60 },
      numbering: { reference: "bullets-rose", level: 0 },
      children: [new TextRun({ text: r, font: "Calibri", size: 20, color: COLOR.NAVY })],
    })
  );
  reportProgress("Building risks");

  // Stage 6: Build document structure
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [{
            level: 0,
            format: LevelFormat.BULLET,
            text: "●",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
        {
          reference: "bullets-rose",
          levels: [{
            level: 0,
            format: LevelFormat.BULLET,
            text: "▸",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
        {
          reference: "numbers",
          levels: [{
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
      ],
    },
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 20, color: COLOR.MUTED } },
      },
      paragraphStyles: [
        {
          id: "Heading1", name: "Heading 1",
          basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 28, bold: true, font: "Calibri", color: COLOR.NAVY },
          paragraph: { spacing: { before: 480, after: 120 }, outlineLevel: 0 },
        },
        {
          id: "Heading2", name: "Heading 2",
          basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 24, bold: true, font: "Calibri", color: COLOR.STEEL },
          paragraph: { spacing: { before: 320, after: 80 }, outlineLevel: 1 },
        },
      ],
    },
    sections: [{
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
              border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR.STEEL, space: 6 } },
              spacing: { after: 0 },
              tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
              children: [
                new TextRun({ text: sprintData.sprintName, font: "Calibri", size: 18, bold: true, color: COLOR.NAVY }),
                new TextRun({ text: "\t", font: "Calibri", size: 18 }),
                new TextRun({ text: `${sprintData.startDate} – ${sprintData.endDate}`, font: "Calibri", size: 18, color: COLOR.MUTED }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              border: { top: { style: BorderStyle.SINGLE, size: 6, color: COLOR.STEEL, space: 6 } },
              spacing: { before: 0 },
              tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
              children: [
                new TextRun({ text: "Confidential — Internal Use Only", font: "Calibri", size: 16, color: COLOR.MUTED }),
                new TextRun({ text: "\tPage ", font: "Calibri", size: 16, color: COLOR.MUTED }),
                new TextRun({ children: [PageNumber.CURRENT], font: "Calibri", size: 16, color: COLOR.MUTED }),
              ],
            }),
          ],
        }),
      },
      children: [
        new Paragraph({
          spacing: { before: 0, after: 60 },
          children: [new TextRun({ text: "SPRINT REPORT", font: "Calibri", size: 18, bold: true, color: COLOR.STEEL, characterSpacing: 150 })],
        }),
        new Paragraph({
          spacing: { before: 0, after: 80 },
          children: [new TextRun({ text: sprintData.sprintName, font: "Calibri", size: 52, bold: true, color: COLOR.NAVY })],
        }),
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: COLOR.MINT, space: 4 } },
          spacing: { before: 0, after: 320 },
          children: [new TextRun({ text: `${sprintData.startDate}  —  ${sprintData.endDate}`, font: "Calibri", size: 22, color: COLOR.MUTED })],
        }),
        new Table({
          width: { size: CONTENT, type: WidthType.DXA },
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
                      children: [new TextRun({ text: v, font: "Calibri", size: 44, bold: true, color: c })],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 40 },
                      children: [new TextRun({ text: l, font: "Calibri", size: 18, color: COLOR.MUTED })],
                    }),
                  ],
                })
              ),
            }),
          ],
        }),
        spacer(400),
        sectionHeading("Executive Summary"),
        body(ai.sprintSummary || "", { spaceAfter: 160 }),
        ...(ai.velocityNote ? [body(ai.velocityNote, { italic: true, color: COLOR.STEEL, spaceAfter: 200 })] : []),
        sectionHeading("Sprint Metrics"),
        new Table({
          width: { size: CONTENT, type: WidthType.DXA },
          columnWidths: [5580, 3780],
          rows: metricsRows,
        }),
        spacer(320),
        new Paragraph({ children: [new PageBreak()] }),
        sectionHeading("Highlights"),
        ...highlightParas,
        ...(includeBlockerNotes ? [
          spacer(200),
          sectionHeading("Risks & Blockers"),
          ...riskParas,
        ] : []),
        spacer(200),
        new Paragraph({ children: [new PageBreak()] }),
        sectionHeading("Team Performance"),
        new Table({
          width: { size: CONTENT, type: WidthType.DXA },
          columnWidths: COL_TEAM,
          rows: teamRows,
        }),
        spacer(320),
        new Paragraph({ children: [new PageBreak()] }),
        sectionHeading("Project Breakdown"),
        ...projectSections,
        sectionHeading("Recommendations"),
        ...recoParas,
        spacer(200),
        sectionHeading("Next Sprint Focus"),
        body(ai.nextSprintFocus || "", { spaceAfter: 240 }),
      ],
    }],
  });
  reportProgress("Assembling document");

  // Stage 7: Pack to buffer
  reportProgress("Generating final file");
  return await Packer.toBuffer(doc);
}
