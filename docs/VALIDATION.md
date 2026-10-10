# Delivery verification — 2026-10-10

## Data

All eight official TCAS70 subject pages and the blueprint index were accessed successfully. `public/blueprint.json` contains 31 groups and 129 subtopics, with exact source URLs, verification dates and source-page hashes. Source text is retained in `docs/source-snapshots.json`.

`npm run validate:data` passed. It checks official totals, question-format counts and scores, group bounds, subtopic completeness, percentages, score coverage, shared ranks, source metadata and legitimate missing values against independently reviewed official figures. Thai's unpublished group counts, percentages, scores and ranks remain null. No chapter question counts are invented.

## Automated tests and build

`npm test`: **6 passed, 0 failed**.

- Repository base paths, renamed repositories, user sites, overrides and invalid paths.
- Thai chapter search across subjects.
- Intersection of category filters and chapter search; empty results.
- Case-insensitive English subject search and subject codes.
- Shared rankings and Thai unavailable values.
- Independent enumeration of mixed-format question assignments to verify score bounds.

`npm run build`: **passed**, including data validation, strict TypeScript checking and Vite production compilation. Node.js 24.21.0, Vite 8.3.4. Final Vite compilation took approximately **0.27 seconds** on this workstation; this timing does not include TypeScript or data validation and is not a VPS benchmark. RAM usage was not benchmarked.

Final artifacts include approximately 280.64 kB JS (79.57 kB gzip), 16.41 kB CSS (4.29 kB gzip), and 57.67 kB of locally hosted variable fonts, plus the static JSON download and HTML. Only React and React DOM are production dependencies. No external font or API requests are required while using the dashboard.

## Rendered production verification

The production build was served at `http://127.0.0.1:4173/ALevelDashboard/` during validation. Headless Microsoft Edge, using temporary Playwright tooling outside the production dependency tree, passed functional checks at **1440 × 1100**, **390 × 844**, and **320 × 740**.

Checked: all eight initial subject cards, initial Physics chart/table, English ranking and official scores, expanded subtopics, Thai unavailable-data disclosure, category filtering, Thai chapter search, empty state and reset, all eight source links, JSON download at the repository base path, local font loading, absence of external runtime requests and absence of JavaScript or failed-resource errors. Page width matched the viewport in each size. Wide tables scroll inside their own labeled, keyboard-focusable region.

Desktop and mobile screenshots were visually inspected for typography, chart scale, layout, wrapping, missing-data disclosure and table scrolling. Temporary screenshots and browser results are available in the ignored `test-results/` directory in the delivered workspace. Browser tooling and raw-source caches are under ignored `.cache/` and are not needed to build or deploy.

## Deployment

GitHub CLI authentication is verified for Zerokungyt. The public repository `Zerokungyt/ALevel-Dashboard-TCAS70` was created and Pages was enabled with `build_type: workflow`. All five pinned official Actions manifests were previously checked successfully.

The production build and all six tests passed for the actual repository base path `/ALevel-Dashboard-TCAS70/`. No application rebuild from scratch or changes to other projects were made. Workflow completion and the live site must be verified after the initial push.
