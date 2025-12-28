# Google Apps Script: Appointments receiver

This folder contains a Google Apps Script (`apps-script.gs`) that accepts POST requests and appends appointment rows to a Google Sheet, then sorts all rows by date + time.

## Setup steps (quick)
1. Create a new Google Sheet and note its **Sheet ID** (from the URL: `https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit`).
2. Open [script.google.com](https://script.google.com/) and create a new project.
3. Copy the contents of `apps-script.gs` into the new project.
4. Replace `SHEET_ID` with your sheet's ID and optionally set `API_KEY` to a secret token.
5. Deploy the script:
   - Click **Deploy** → **New deployment**
   - Choose **Web app**
   - **Execute as:** Me
   - **Who has access:** Anyone (or Anyone with link)
   - Click **Deploy** and copy the **Web app URL** (it looks like `https://script.google.com/macros/s/AKfycb.../exec`).
6. In `contact.html`, set `API_ENDPOINT` to the Web app URL. If you've set `API_KEY`, set `API_KEY` (client-side) as well (note: publishing API key client-side is not fully secret; for extra security set up a server-side proxy).

Note: The form now includes a required **Appointment Type** field ("In Person" or "Phone Call"). The script will add an **Appointment Type** column to your sheet. **Email** is now optional.

## Notes & Security
- The script uses a simple optional `API_KEY` that must be sent in the request body as `apiKey` when enabled. This is a lightweight check, not a replacement for a secure backend.
- If you need stricter security, consider:
  - Hosting a small server (Firebase Functions, Cloud Run, etc.) that forwards to Sheets API with proper auth.
  - Using OAuth and service accounts (more complex) to write directly via Google Sheets API.

## Testing
- After deploying, open `contact.html` locally and submit the appointment form. The Apps Script web app will append the row and then re-sort all rows by date/time.

### Troubleshooting: "Could not connect to the server" or CORS errors
- If the browser shows **"Could not connect to the server"** when submitting the form, open DevTools → Console and Network tabs to inspect the request. Common causes:
  - **CORS Preflight blocked**: Sending JSON (`Content-Type: application/json`) triggers a browser preflight (OPTIONS). If the Apps Script web app does not respond to OPTIONS or lacks CORS headers, the browser will block the request. The code in `contact.html` now uses `FormData` (no custom Content-Type) to avoid preflight.
  - **Web app deployment & access**: Ensure you deployed the script as a **Web app**, **Execute as:** Me, and **Who has access:** **Anyone** (or **Anyone with the link**). If the app requires sign-in, a browser request from a non-signed-in user will fail.
  - **Incorrect Web app URL**: Double-check `API_ENDPOINT` in `contact.html` — it must be the final `.../exec` URL from Deploy → Manage deployments.
  - **Sheet ID incorrect**: If `SHEET_ID` is wrong, the script may error. Check the **Executions** log in Apps Script to see runtime errors.

- If you still see issues, check the Apps Script Editor → **Executions** for stack traces, then adjust script settings or share the error log and I can help troubleshoot.

If you want, I can also:
- Add client-side UI changes (loading spinner, inline success message), or
- Provide a small Node.js Cloud Function example for a more secure server-side integration.
