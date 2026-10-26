/**
 * ANAV Tax Fee Estimator 2027 - Google Sheet receiver
 *
 * Paste this whole file into Extensions > Apps Script of the quotes sheet,
 * then Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone).
 *
 * The sheet re-prices every quote here with the fixed 2027 rates below, so the
 * amounts written to the sheet can never be changed from the browser.
 *
 * Columns (row 1): Sr no | Client name | Return | Product | No of Product | Charges | Date | Quote ID | Total
 * One row per line item. Sr no, Client name, Date, Quote ID repeat on every row of a quote;
 * Total is written only on the first row of each quote, so SUM(I:I) = total quoted.
 */

const SHEET_ID = "1folMFXpErjp9vswRVX3Ha91NjLn-mUwfw4l1duz03no"; // ANAV Tax 2027 quotes sheet
const SHEET_NAME = ""; // leave empty to use the first tab, or put the tab name, e.g. "Sheet1"

const RATES = Object.freeze({
  i1040:  { base: 230, inclPer: 1, inclStates: 1, addC: 60, addE: 60, addK1: 60, addF: 60, addState: 55 },
  f1065:  { base: 550, inclK1: 2, inclStates: 1, addK1: 60, addState: 60 },
  f1120s: { base: 560, inclK1: 2, inclStates: 1, addK1: 60, addState: 60 },
  f1120:  { base: 650, inclStates: 1, addState: 70 }
});
const FORMS = { i1040: "Form 1040", f1065: "Form 1065", f1120s: "Form 1120-S", f1120: "Form 1120" };
const FIELDS = { i1040: ["c", "e", "k1", "f", "st"], f1065: ["k1", "st"], f1120s: ["k1", "st"], f1120: ["st"] };

function count_(v) {
  const n = Math.floor(Number(v));
  return isFinite(n) && n >= 0 ? Math.min(n, 99) : 0;
}
function extra_(n, incl) { return Math.max(0, n - incl); }

/** Returns [{product, qty, charges}] for one return, using the fixed RATES. */
function price_(type, v) {
  const R = RATES[type], items = [];
  if (type === "i1040") {
    items.push({ product: "Form 1040 package (1 each of Sch C, E, F, K-1 and 1 state included)", qty: 1, charges: R.base });
    [["c", "Additional Schedule C", R.addC], ["e", "Additional Schedule E", R.addE],
     ["k1", "Additional K-1", R.addK1], ["f", "Additional Schedule F", R.addF]].forEach(function (x) {
      const n = extra_(v[x[0]], R.inclPer);
      if (n) items.push({ product: x[1], qty: n, charges: n * x[2] });
    });
  } else {
    const inc = "inclK1" in R ? " (" + R.inclK1 + " K-1s and " + R.inclStates + " state included)" : " (" + R.inclStates + " state included)";
    items.push({ product: FORMS[type] + " package" + inc, qty: 1, charges: R.base });
    if ("inclK1" in R) {
      const k = extra_(v.k1, R.inclK1);
      if (k) items.push({ product: "Additional K-1", qty: k, charges: k * R.addK1 });
    }
  }
  const s = extra_(v.st, R.inclStates);
  if (s) items.push({ product: "Additional state return", qty: s, charges: s * R.addState });
  return items;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return json_({ ok: true, service: "ANAV fee estimator", rates: RATES });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.website) return json_({ ok: true, quoteId: "", total: 0 });           // spam trap
    const client = String(data.client || "").trim().slice(0, 120);
    if (!client) return json_({ ok: false, error: "Client name is required." });
    const quoteId = String(data.quoteId || "").replace(/[^A-Za-z0-9-]/g, "").slice(0, 30) || ("Q-" + Date.now());
    const returns = Array.isArray(data.returns) ? data.returns.slice(0, 20) : [];
    if (!returns.length) return json_({ ok: false, error: "No returns in the quote." });

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const ss = SpreadsheetApp.openById(SHEET_ID);
      const sh = SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getSheets()[0];
      ensureHeader_(sh);

      // Ignore duplicates (same quote retried from an offline device)
      const last = sh.getLastRow();
      if (last > 1) {
        const ids = sh.getRange(2, 8, last - 1, 1).getValues().map(function (r) { return r[0]; });
        if (ids.indexOf(quoteId) !== -1) return json_({ ok: true, quoteId: quoteId, total: 0, duplicate: true });
      }

      let srNo = 1;
      if (last > 1) {
        const nums = sh.getRange(2, 1, last - 1, 1).getValues().map(function (r) { return Number(r[0]) || 0; });
        srNo = Math.max.apply(null, nums) + 1;
      }

      const date = Utilities.formatDate(new Date(), "America/Chicago", "yyyy-MM-dd HH:mm");
      const rows = [];
      let total = 0;
      returns.forEach(function (r) {
        const type = String(r.type);
        if (!RATES[type]) return;
        const v = {};
        FIELDS[type].forEach(function (k) { v[k] = count_(r.v && r.v[k]); });
        const label = String(r.label || "").trim().slice(0, 80);
        const retName = FORMS[type] + (label ? " - " + label : "");
        price_(type, v).forEach(function (it) {
          total += it.charges;
          rows.push([srNo, client, retName, it.product, it.qty, it.charges, date, quoteId, ""]);
        });
      });
      if (!rows.length) return json_({ ok: false, error: "No valid returns in the quote." });
      rows[0][8] = total;

      const start = sh.getLastRow() + 1;
      sh.getRange(start, 1, rows.length, 9).setValues(rows);
      sh.getRange(start, 6, rows.length, 1).setNumberFormat("$#,##0");
      sh.getRange(start, 9, rows.length, 1).setNumberFormat("$#,##0");
      return json_({ ok: true, quoteId: quoteId, srNo: srNo, total: total });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return json_({ ok: false, error: "Server error: " + err.message });
  }
}

function ensureHeader_(sh) {
  const want = ["Sr no", "Client name", "Return", "Product", "No of Product", "Charges", "Date", "Quote ID", "Total"];
  const cur = sh.getRange(1, 1, 1, 9).getValues()[0];
  let changed = false;
  for (let i = 0; i < want.length; i++) {
    if (String(cur[i]).trim() === "") { cur[i] = want[i]; changed = true; }
  }
  if (changed) sh.getRange(1, 1, 1, 9).setValues([cur]).setFontWeight("bold");
  sh.setFrozenRows(1);
}

/** Run once from the editor to test: adds a sample quote row. Delete the rows afterwards. */
function testSave() {
  const res = doPost({ postData: { contents: JSON.stringify({
    quoteId: "TEST-" + Date.now(), client: "Test Client",
    returns: [{ type: "i1040", label: "", v: { c: 2, e: 0, k1: 3, f: 0, st: 2 } },
              { type: "f1065", label: "Test LLC", v: { k1: 4, st: 1 } }] }) } });
  Logger.log(res.getContent());
}
