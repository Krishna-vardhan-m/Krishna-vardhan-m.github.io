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

Notes
- The app loads `projects.json` by default. If it fails to parse, it falls back to `projects.cleaned.json` (a clean example file). Use the `projects.cleaned.json` as a reference if you prefer to keep `projects.json` unchanged while migrating.
- Example CSV files `projA_site1.csv` and `projB_site1.csv` are included as templates.

If you'd like, I can also:
- Convert the existing hard-coded plots into per-site `.csv` files automatically and remove them from `projects.json`.
- Add a small dev script to validate all spreadsheet files and report missing fields.
