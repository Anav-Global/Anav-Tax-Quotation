# ANAV Tax Fee Estimator 2027

Client-facing fee estimator for ANAV Global LLC (Tax Season 2027). Clients answer a short questionnaire and the fee is calculated instantly for Form 1040, 1065, 1120-S and 1120.

It is an installable web app (PWA): one codebase that runs in any browser and installs like an app on Android, iPhone/iPad, Windows and Mac. It works offline after the first visit.

## Current rates

| Return | Package | Included | Extras |
|---|---|---|---|
| Form 1040 | $230 | 1 each of Sch C, E, F, K-1; 1 state | $60 per extra schedule/K-1, $55 per extra state |
| Form 1065 | $550 | 2 partner K-1s; 1 state | $60 per K-1, $60 per state |
| Form 1120-S | $560 | 2 shareholder K-1s; 1 state | $60 per K-1, $60 per state |
| Form 1120 | $650 | 1 state | $70 per state |

## Deploy on GitHub Pages

1. Create a new repository on GitHub (for example `anav-fee-estimator`). It must be **public** for free GitHub Pages.
2. Upload every file in this folder to the repository root (drag and drop on the GitHub website works). Keep the `icons` folder and the `.nojekyll` file.
3. Open **Settings → Pages**. Under *Build and deployment*, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, and save.
4. After a minute or two the app is live at `https://<your-username>.github.io/anav-fee-estimator/`.

Optional: add a custom domain such as `fees.anavglobal.com` in the same Pages settings, then add a CNAME record at your domain provider.

## Install as an app

| Device | How |
|---|---|
| Android (Chrome) | Open the link, tap **Install app** in the header (or menu → *Install app*). |
| iPhone / iPad (Safari) | Open the link, tap **Share → Add to Home Screen**. |
| Windows (Chrome / Edge) | Open the link, click **Install app** in the header or the install icon in the address bar. |
| Mac (Chrome / Edge) | Same as Windows. |
| Mac (Safari 17+) | **File → Add to Dock**. |

## Connect Google Sheet (saves every quote)

When a client taps **Save my quote**, the quote is written to your Google Sheet, one row per line item:

`Sr no | Client name | Return | Product | No of Product | Charges | Date | Quote ID | Total`

Total appears only on the first row of each quote, so `=SUM(I:I)` gives the total quoted. The empty G and H headers are filled with Date and Quote ID automatically.

1. Open the quotes sheet. Go to **Extensions → Apps Script**.
2. Delete any code there and paste the full contents of `google-apps-script/Code.gs`. Click **Save**.
3. Optional test: select `testSave` in the toolbar and click **Run**. Approve the permission prompt (Advanced → Go to project). A sample quote appears in the sheet; delete those rows.
4. Click **Deploy → New deployment**. Select type **Web app**. Set *Execute as* = **Me**, *Who has access* = **Anyone**. Click **Deploy** and copy the **Web app URL** (ends in `/exec`).
5. In `index.html`, find `const SHEET_ENDPOINT = "PASTE_YOUR_APPS_SCRIPT_URL_HERE";` and paste the URL between the quotes.
6. In `sw.js`, change `VERSION` (for example `anav-fees-2027-v3`). Commit and push to GitHub.

If you later edit `Code.gs`, use **Deploy → Manage deployments → Edit → Version: New version**. This keeps the same URL. A *New deployment* creates a new URL and you would have to update `index.html` again.

If a client is offline, the quote is stored on their device and sent automatically when they are back online. Retries never create duplicate rows (the Quote ID is checked).

## Rates are locked

Rates are fixed in two places and cannot be changed from the browser:

- `index.html` → `DEFAULT_RATES` (what the client sees)
- `google-apps-script/Code.gs` → `RATES` (what is written to the sheet)

The sheet re-calculates every quote with its own rates, so even an edited copy of the page cannot write a different price. To change rates in future, change **both** files, bump `VERSION` in `sw.js`, and deploy a new version of the Apps Script.

## Files

- `index.html` - the app (questionnaire, pricing logic, quote)
- `manifest.webmanifest` - app name, icons and colors for installation
- `sw.js` - service worker for offline use and updates
- `icons/` - logo and app icons
- `google-apps-script/Code.gs` - paste into the sheet's Apps Script to receive and save quotes
- `.nojekyll` - tells GitHub Pages to serve files as-is
