## Plots data moved to per-site spreadsheets (Excel/CSV)

What's changed
- Plots for each site are no longer required to be hard-coded inside `projects.json`.
- When a site is opened the frontend will attempt to load an external file named:
  - `<projectId>_<siteId>.xlsx` or
  - `<projectId>_<siteId>.csv`
  Example: `projA_projA_site1.xlsx` or `projB_projB_site1.csv` (current implementation uses `projectId_siteId` naming: `projA_site1.xlsx`).

Sheet / CSV format
- The first sheet's header row should use these column names (case-sensitive recommended):
  - `plotId`, `plotName`, `area`, `direction`, `keyFeatures`, `status`, `layoutCoordinates`
- `keyFeatures` can be a JSON array (e.g. `["Corner Plot","Park Facing"]`) or a comma/semicolon-separated string.
- `layoutCoordinates` should contain the SVG path (`d` attribute) used to render the plot on the layout image.

Google Sheets
- You can host plot data in a Google Sheet and provide the sheet URL instead of a local file. The app will convert common Google Sheets URLs to a CSV export URL and fetch the data.
- Make sure the sheet is either published to the web or shared so that "Anyone with the link" can view it; otherwise the browser will block access (CORS / permission errors).
- Example site entry in `projects.json`:

```json
{
  "siteId": "projB_site1",
  "siteName": "P1 - Diamond Villas",
  "plots": "https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit#gid=0"
}
```

Or using an explicit object:

```json
"plots": { "googleSheet": "https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit#gid=0" }
```

Notes
- The app loads `projects.json` by default. If it fails to parse, it falls back to `projects.cleaned.json` (a clean example file). Use the `projects.cleaned.json` as a reference if you prefer to keep `projects.json` unchanged while migrating.
- Example CSV files `projA_site1.csv` and `projB_site1.csv` are included as templates.

If you'd like, I can also:
- Convert the existing hard-coded plots into per-site `.csv` files automatically and remove them from `projects.json`.
- Add a small dev script to validate all spreadsheet files and report missing fields.
