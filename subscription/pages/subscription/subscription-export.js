import { strToU8, zipSync } from "fflate";

const spreadsheetType =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const xml = (value) =>
  String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

// Explicit text cells preserve names, leading zeros and formula-like notes.
const textCell = (ref, value, style = 0) =>
  `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;

export function createSubscriptionWorkbook(records, { cycleText, statusText }) {
  const headers = [
    "服务名称",
    "套餐",
    "分类",
    "金额",
    "币种",
    "计费周期",
    "下次扣费日",
    "状态",
    "付款渠道",
    "备注",
  ];
  const live = records.filter((item) => !item.deletedAt);
  if (live.length > 1048575) throw new Error("订阅数量超出 Excel 单表上限");
  const rows = [
    `<row r="1" ht="28" customHeight="1">${headers.map((value, index) => textCell(`${String.fromCharCode(65 + index)}1`, value, 1)).join("")}</row>`,
  ];
  live.forEach((item, index) => {
    const row = index + 2;
    const values = [
      item.name,
      item.plan,
      item.category,
      item.amount,
      item.currency,
      cycleText(item),
      item.nextBillingDate,
      statusText(item),
      item.payment,
      item.note,
    ];
    rows.push(
      `<row r="${row}">${values
        .map((value, column) => {
          const ref = `${String.fromCharCode(65 + column)}${row}`;
          if (
            column === 3 &&
            value !== "" &&
            value != null &&
            Number.isFinite(Number(value))
          )
            return `<c r="${ref}" s="2"><v>${Number(value)}</v></c>`;
          return textCell(ref, value);
        })
        .join("")}</row>`,
    );
  });
  const lastRow = live.length + 1;
  const files = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="订阅清单" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    "xl/styles.xml": `<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="微软雅黑"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="微软雅黑"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2F5BEA"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf><xf numFmtId="2" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment vertical="top"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
    "xl/worksheets/sheet1.xml": `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:J${lastRow}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="20"/><cols>${[24, 22, 14, 14, 10, 18, 18, 14, 18, 48].map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`).join("")}</cols><sheetData>${rows.join("")}</sheetData><autoFilter ref="A1:J${lastRow}"/></worksheet>`,
  };
  return zipSync(
    Object.fromEntries(
      Object.entries(files).map(([name, contents]) => [
        name,
        strToU8(contents),
      ]),
    ),
    { level: 6 },
  );
}

const call = (fn, options) =>
  new Promise((resolve, reject) =>
    fn({ ...options, success: resolve, fail: reject }),
  );

export async function previewWechatWorkbook(data, runtime) {
  // Reuse one app-owned file so repeated exports do not fill local storage.
  const filePath = `${runtime.userPath}/续订清单.xlsx`;
  const buffer = data.buffer.slice(
    data.byteOffset,
    data.byteOffset + data.byteLength,
  );
  await call((options) => runtime.fs.writeFile(options), {
    filePath,
    data: buffer,
  });
  try {
    await call(runtime.openDocument, {
      filePath,
      fileType: "xlsx",
      showMenu: true,
    });
  } catch {
    const result = await call(runtime.showModal, {
      title: "表格已生成",
      content: runtime.shareFile
        ? "暂时无法预览，可发送到微信聊天后用 Excel 或 WPS 打开。"
        : "当前微信无法预览表格，请更新微信后重试。",
      confirmText: runtime.shareFile ? "发送文件" : "知道了",
      showCancel: Boolean(runtime.shareFile),
    });
    if (result.confirm && runtime.shareFile) {
      try {
        await call(runtime.shareFile, { filePath, fileName: runtime.fileName });
      } catch (error) {
        if (!/cancel/i.test(error?.errMsg || ""))
          throw new Error("文件发送失败，请重新导出后重试");
      }
    }
  }
  return filePath;
}

export async function exportSubscriptionFile(records, options) {
  const data = createSubscriptionWorkbook(records, options);
  const fileName = `续订清单-${options.date}.xlsx`;
  // #ifdef H5
  const blob = new Blob([data], { type: spreadsheetType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  try {
    link.href = url;
    link.download = fileName;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return;
  // #endif
  // #ifdef MP-WEIXIN
  return previewWechatWorkbook(data, {
    fs: wx.getFileSystemManager(),
    userPath: wx.env.USER_DATA_PATH,
    fileName,
    openDocument: (options) => uni.openDocument(options),
    showModal: (options) => uni.showModal(options),
    shareFile:
      typeof wx.shareFileMessage === "function"
        ? (options) => wx.shareFileMessage(options)
        : null,
  });
  // #endif
  // #ifndef H5
  // #ifndef MP-WEIXIN
  throw new Error("当前平台暂不支持导出 Excel 文件");
  // #endif
  // #endif
}
