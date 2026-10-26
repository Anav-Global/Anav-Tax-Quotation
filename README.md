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

## Changing rates

All rates are in `index.html`, in the `DEFAULT_RATES` block near the top of the script. Edit the numbers, then open `sw.js` and change `VERSION` (for example `anav-fees-2027-v2`) so installed copies pick up the new rates. Commit and push; GitHub Pages republishes automatically.

The internal rate card at `.../#rates` changes rates only in the browser where you edit them. It is for testing; clients always see `DEFAULT_RATES`.

## Files

- `index.html` - the app (questionnaire, pricing logic, quote)
- `manifest.webmanifest` - app name, icons and colors for installation
- `sw.js` - service worker for offline use and updates
- `icons/` - logo and app icons
- `.nojekyll` - tells GitHub Pages to serve files as-is
