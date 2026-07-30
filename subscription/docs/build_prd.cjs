const fs = require("fs");
const path = require("path");
const { marked } = require("marked");
const {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  LevelFormat,
  PageBreak,
  PageNumber,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} = require("docx");

const sourcePath = path.join(__dirname, "自动续费管家-产品需求文档.md");
const outputPath = path.join(__dirname, "自动续费管家-产品需求文档.docx");
const markdown = fs.readFileSync(sourcePath, "utf8");
const tokens = marked.lexer(markdown);

const COLORS = {
  ink: "17212B",
  blue: "2E74B5",
  blueDark: "1F4D78",
  teal: "18766E",
  amber: "A66A12",
  muted: "5B6670",
  light: "F2F4F7",
  line: "D9DEE5",
  white: "FFFFFF",
  code: "F6F8FA",
};

const PAGE_WIDTH = 12240;
const PAGE_HEIGHT = 15840;
const MARGIN = 1440;
const CONTENT_WIDTH = 9360;
const FONT = "Calibri";
const CJK_FONT = "PingFang SC";

function textRun(text, options = {}) {
  return new TextRun({
    text,
    font: { ascii: FONT, hAnsi: FONT, eastAsia: CJK_FONT },
    size: options.size || 22,
    bold: options.bold,
    italics: options.italics,
    color: options.color || COLORS.ink,
    break: options.break,
  });
}

function inlineRuns(inlineTokens = [], inherited = {}) {
  const runs = [];
  for (const token of inlineTokens) {
    if (token.type === "text" || token.type === "escape") {
      if (token.tokens) runs.push(...inlineRuns(token.tokens, inherited));
      else runs.push(textRun(token.text, inherited));
    } else if (token.type === "strong") {
      runs.push(...inlineRuns(token.tokens, { ...inherited, bold: true }));
    } else if (token.type === "em") {
      runs.push(...inlineRuns(token.tokens, { ...inherited, italics: true }));
    } else if (token.type === "codespan") {
      runs.push(textRun(token.text, { ...inherited, color: COLORS.blueDark }));
    } else if (token.type === "link") {
      runs.push(...inlineRuns(token.tokens, { ...inherited, color: COLORS.blue, italics: false }));
    } else if (token.type === "br") {
      runs.push(textRun("", { ...inherited, break: 1 }));
    } else if (token.raw) {
      runs.push(textRun(token.raw, inherited));
    }
  }
  return runs;
}

function paragraphFromTokens(inlineTokens, options = {}) {
  return new Paragraph({
    children: inlineRuns(inlineTokens),
    alignment: options.alignment || AlignmentType.LEFT,
    spacing: options.spacing || { after: 120, line: 264, lineRule: "auto" },
    indent: options.indent,
    style: options.style,
    numbering: options.numbering,
    keepNext: options.keepNext,
    shading: options.shading,
    border: options.border,
  });
}

function headingParagraph(token) {
  const levels = {
    1: HeadingLevel.TITLE,
    2: HeadingLevel.HEADING_1,
    3: HeadingLevel.HEADING_2,
    4: HeadingLevel.HEADING_3,
  };
  return new Paragraph({
    heading: levels[token.depth] || HeadingLevel.HEADING_3,
    children: inlineRuns(token.tokens || [{ type: "text", text: token.text }]),
    keepNext: true,
  });
}

function flattenText(token) {
  if (!token) return "";
  if (typeof token === "string") return token;
  if (token.text && !token.tokens) return token.text;
  if (token.tokens) return token.tokens.map(flattenText).join("");
  return token.raw || "";
}

function makeTable(token) {
  const rowsData = [token.header, ...token.rows];
  const colCount = token.header.length;
  const base = Math.floor(CONTENT_WIDTH / colCount);
  const widths = Array(colCount).fill(base);
  widths[widths.length - 1] += CONTENT_WIDTH - base * colCount;

  const rows = rowsData.map((row, rowIndex) => new TableRow({
    tableHeader: rowIndex === 0,
    children: row.map((cell, colIndex) => {
      const cellTokens = cell.tokens || [{ type: "text", text: cell.text || flattenText(cell) }];
      return new TableCell({
        width: { size: widths[colIndex], type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        shading: rowIndex === 0 ? { fill: COLORS.light, type: ShadingType.CLEAR } : undefined,
        margins: { top: 100, bottom: 100, left: 120, right: 120 },
        children: [new Paragraph({
          children: inlineRuns(cellTokens, { size: 20, bold: rowIndex === 0 }),
          spacing: { before: 0, after: 0, line: 250, lineRule: "auto" },
          alignment: colCount > 2 && colIndex > 0 ? AlignmentType.LEFT : AlignmentType.LEFT,
        })],
      });
    }),
  }));

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    indent: { size: 120, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: widths,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.line },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.line },
      left: { style: BorderStyle.SINGLE, size: 4, color: COLORS.line },
      right: { style: BorderStyle.SINGLE, size: 4, color: COLORS.line },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 3, color: COLORS.line },
      insideVertical: { style: BorderStyle.SINGLE, size: 3, color: COLORS.line },
    },
    rows,
  });
}

function renderList(token, depth = 0) {
  const paragraphs = [];
  for (const item of token.items) {
    const first = item.tokens.find((t) => t.type === "text" || t.type === "paragraph");
    const nested = item.tokens.filter((t) => t.type === "list");
    if (first) {
      paragraphs.push(paragraphFromTokens(first.tokens || [{ type: "text", text: first.text }], {
        numbering: { reference: token.ordered ? "prd-numbering" : "prd-bullets", level: Math.min(depth, 2) },
        spacing: { after: 80, line: 280, lineRule: "auto" },
      }));
    }
    for (const child of nested) paragraphs.push(...renderList(child, depth + 1));
  }
  return paragraphs;
}

function renderTokens(sourceTokens) {
  const children = [];
  for (const token of sourceTokens) {
    if (token.type === "space") continue;
    if (token.type === "heading") {
      children.push(headingParagraph(token));
    } else if (token.type === "paragraph") {
      children.push(paragraphFromTokens(token.tokens));
    } else if (token.type === "list") {
      children.push(...renderList(token));
    } else if (token.type === "table") {
      children.push(makeTable(token));
      children.push(new Paragraph({ spacing: { after: 100 } }));
    } else if (token.type === "blockquote") {
      const body = token.tokens.find((t) => t.type === "paragraph");
      if (body) children.push(paragraphFromTokens(body.tokens, {
        shading: { fill: "EAF4F3", type: ShadingType.CLEAR },
        border: { left: { style: BorderStyle.SINGLE, size: 16, color: COLORS.teal, space: 8 } },
        indent: { left: 240, right: 180 },
        spacing: { before: 100, after: 160, line: 280, lineRule: "auto" },
      }));
    } else if (token.type === "code") {
      const lines = token.text.split("\n");
      children.push(new Paragraph({
        children: lines.flatMap((line, index) => [
          textRun(line, { size: 19, color: COLORS.blueDark }),
          ...(index < lines.length - 1 ? [textRun("", { break: 1 })] : []),
        ]),
        shading: { fill: COLORS.code, type: ShadingType.CLEAR },
        indent: { left: 240, right: 240 },
        spacing: { before: 80, after: 160, line: 250, lineRule: "auto" },
      }));
    } else if (token.type === "hr") {
      children.push(new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.line, space: 1 } },
        spacing: { after: 120 },
      }));
    }
  }
  return children;
}

const titleToken = tokens.shift();
const metaQuote = tokens.find((t) => t.type === "blockquote");
if (metaQuote) tokens.splice(tokens.indexOf(metaQuote), 1);

const title = new Paragraph({
  children: [textRun(titleToken.text, { size: 46, bold: true, color: COLORS.ink })],
  spacing: { before: 160, after: 120 },
  keepNext: true,
});
const subtitle = new Paragraph({
  children: [textRun("微信小程序 MVP | 产品需求文档", { size: 28, color: COLORS.teal })],
  spacing: { after: 280 },
  keepNext: true,
});
const metadata = (metaQuote?.text || "产品代号：续费清单（暂定）\n文档版本：V1.0\n文档日期：2026-07-29\n目标平台：微信小程序\n文档状态：MVP 评审稿")
  .split(/\n/)
  .filter(Boolean)
  .map((line) => new Paragraph({
    children: [textRun(line.replace(/  $/, ""), { size: 21, color: COLORS.muted })],
    spacing: { after: 45 },
  }));
const lead = new Paragraph({
  children: [textRun("评审重点", { size: 20, bold: true, color: COLORS.amber }), textRun("  验证“录入 - 提醒 - 处理”的最短闭环，并确认微信订阅消息的实际能力边界。", { size: 20 })],
  shading: { fill: "FFF6E8", type: ShadingType.CLEAR },
  border: { left: { style: BorderStyle.SINGLE, size: 16, color: COLORS.amber, space: 8 } },
  indent: { left: 220, right: 160 },
  spacing: { before: 260, after: 220, line: 280, lineRule: "auto" },
});

const header = new Header({
  children: [new Paragraph({
    children: [textRun("续费清单", { size: 18, bold: true, color: COLORS.muted }), textRun("  |  产品需求文档 V1.0", { size: 18, color: COLORS.muted })],
    spacing: { after: 0 },
  })],
});
const footer = new Footer({
  children: [new Paragraph({
    alignment: AlignmentType.RIGHT,
    children: [textRun("内部评审稿  |  ", { size: 18, color: COLORS.muted }), new TextRun({ children: [PageNumber.CURRENT], size: 18, color: COLORS.muted, font: { ascii: FONT, eastAsia: CJK_FONT } })],
  })],
});

const doc = new Document({
  creator: "Product Team",
  title: "自动续费管家 - 产品需求文档",
  description: "微信小程序 MVP 产品需求文档",
  styles: {
    default: {
      document: {
        run: { font: { ascii: FONT, hAnsi: FONT, eastAsia: CJK_FONT }, size: 22, color: COLORS.ink },
        paragraph: { spacing: { after: 120, line: 264, lineRule: "auto" } },
      },
    },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 46, bold: true, color: COLORS.ink, font: { ascii: FONT, eastAsia: CJK_FONT } }, paragraph: { spacing: { before: 0, after: 120 }, keepNext: true } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, color: COLORS.blue, font: { ascii: FONT, eastAsia: CJK_FONT } }, paragraph: { spacing: { before: 320, after: 160 }, keepNext: true, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, color: COLORS.blue, font: { ascii: FONT, eastAsia: CJK_FONT } }, paragraph: { spacing: { before: 240, after: 120 }, keepNext: true, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, color: COLORS.blueDark, font: { ascii: FONT, eastAsia: CJK_FONT } }, paragraph: { spacing: { before: 160, after: 80 }, keepNext: true, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      {
        reference: "prd-bullets",
        levels: [0, 1, 2].map((level) => ({
          level,
          format: LevelFormat.BULLET,
          text: ["•", "◦", "▪"][level],
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720 + level * 360, hanging: 360 }, spacing: { after: 80, line: 280, lineRule: "auto" } } },
        })),
      },
      {
        reference: "prd-numbering",
        levels: [0, 1, 2].map((level) => ({
          level,
          format: LevelFormat.DECIMAL,
          text: `%${level + 1}.`,
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720 + level * 360, hanging: 360 }, spacing: { after: 80, line: 280, lineRule: "auto" } } },
        })),
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
        margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN, header: 708, footer: 708 },
      },
    },
    headers: { default: header },
    footers: { default: footer },
    children: [title, subtitle, ...metadata, lead, new Paragraph({ children: [new PageBreak()] }), ...renderTokens(tokens)],
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputPath, buffer);
  process.stdout.write(`${outputPath}\n`);
});
