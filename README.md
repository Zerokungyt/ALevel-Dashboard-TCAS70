# A-Level Exam Weight Dashboard — TCAS70

Static academic dashboard built with Vite, React, TypeScript and plain CSS in `C:\ALevelDashboard`. No backend, database, authentication, chart library or animation library. Production dependencies are only React and React DOM. Charts use CSS; Thai and Latin variable fonts are hosted locally with their SIL Open Font License.

## Run and build

Use Node.js 24 LTS (minimum 22.12) and npm.

```powershell
npm ci --no-audit --no-fund
npm run dev
npm test
npm run build
npm run preview
```

Development and preview use the same repository base path. With the configured repository remote, open `http://localhost:5173/ALevel-Dashboard-TCAS70/` for development or `http://localhost:4173/ALevel-Dashboard-TCAS70/` for the production preview. Vite prints the actual URL.

The deployable directory is `dist/`. Serve that directory with any static host. There is no server process required in production. Builds perform data validation, TypeScript checking and Vite compilation sequentially. CI caps the Node.js heap at 2 GB; it does not fetch the official website during builds. The repository includes the npm lockfile.

Delivery checks and browser verification are recorded in [docs/VALIDATION.md](docs/VALIDATION.md).

## What the dashboard shows

- Responsive cards for all eight subjects with official exam totals.
- Subject-family filters and a global Thai/English subject, topic and chapter search.
- Ranked topic tables with expandable official subtopics.
- Horizontal bars on a common 0–100% scale; dark teal is the minimum and pale teal extends to the maximum.
- Official question ranges, derived percentages and potential full-score coverage, clearly labeled.
- Official source links and verification dates for every subject; downloadable JSON.
- Accessible native controls, keyboard focus and explicit empty and unavailable-data states.

## Data and accuracy

The [official TCAS70 blueprint index](https://www.mytcas.com/blueprint/) and all eight subject pages were accessed and verified on **2026-10-10**. The dataset contains **31 topic groups and 129 subtopics**.

| Subject | Official page | Total questions | Full score |
| --- | --- | ---: | ---: |
| Physics | [64 Phy](https://www.mytcas.com/blueprint/a-level-64-phy/) | 30 | 100 |
| Chemistry | [65 Chem](https://www.mytcas.com/blueprint/a-level-65-chem/) | 35 | 100 |
| Biology | [66 Bio](https://www.mytcas.com/blueprint/a-level-66-bio/) | 40 | 100 |
| Mathematics 1 | [61 Math1](https://www.mytcas.com/blueprint/a-level-61-math1/) | 30 | 100 |
| Mathematics 2 | [62 Math2](https://www.mytcas.com/blueprint/a-level-62-math2/) | 30 | 100 |
| Thai Language | [81 Thai](https://www.mytcas.com/blueprint/a-level-81-thai/) | 50 | 100 |
| Social Studies | [70 Soc](https://www.mytcas.com/blueprint/a-level-70-soc/) | 50 | 100 |
| English | [82 Eng](https://www.mytcas.com/blueprint/a-level-82-eng/) | 80 | 100 |

`public/blueprint.json` is the single data source used by the UI and JSON download. `docs/source-snapshots.json` records the relevant source text, original page SHA-256 hashes, URLs and verification dates. Cached HTML in `.cache/` is excluded from Git. The committed source extracts allow reviewing the imported data without accessing the website.

**Official versus calculated:**

- Topic-group question counts and full-exam scoring formats are official. Per-chapter numeric values are `null` because they are not published.
- Percentages are calculated as question-count bounds divided by the official exam total, multiplied by 100. These are question shares, not university admission weights.
- Within a subject, rank groups by the midpoint of their percentage range. Equal weights receive a shared competition rank (1, 1, 3). The midpoint is an ordering device, not a prediction. There is no cross-subject claim about difficulty, study time or return per hour.
- English and Social Studies publish exact group scores; these are labeled official.
- For mixed-format subjects, the official blueprint does not specify how question formats are distributed among groups. Potential score coverage is a mathematical lower/upper bound, **not an official group score or an expected result**. For the lower bound, allocate the group's minimum questions to the lowest-scoring format first; for the upper bound, allocate its maximum to the highest-scoring format first, respecting the available numbers of each format. Scores assume every question in the group earns full credit. Do not add overlapping integrated-topic coverage.
- Thai publishes four topic groups but **no per-group question counts**. Counts, percentages, group scores and ranks stay `null` and are shown as unavailable; no equal distribution is assumed.
- Do not sum all group minima or all maxima into an exam total. Blueprint ranges constrain the distribution; extremes need not occur simultaneously.

## Refresh official data

Fetching and importing are deliberate maintenance operations, separate from the production build:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/fetch-blueprints.ps1
$env:BLUEPRINT_VERIFIED_AT = (Get-Date -Format 'yyyy-MM-dd')
npm run data:import
npm run validate:data
npm test
npm run build
```

Review the diff against the official pages before publishing. The importer stops if the index no longer identifies TCAS70 or if the required page structure is missing. Source or structure changes must be reviewed, not filled with guessed figures. If a source cannot be accessed, preserve the last verified snapshot and report that refresh could not be verified; do not advance its verification date. Independently rechecked control figures live in `scripts/validate-data.mjs` and must be reviewed if official figures change.

## GitHub Pages

The workflow `.github/workflows/deploy.yml` tests and builds pull requests without deploying. A push to `main` or a manual run builds and deploys to Pages with the official GitHub Pages actions and scoped permissions. Actions versions are pinned to the commit SHAs in the [official Vite deployment example](https://vite.dev/guide/static-deploy.html).

Base-path resolution in `vite.config.ts`, in order:

1. `PAGES_BASE_PATH` if explicitly provided (for example `/` for a custom domain).
2. `GITHUB_REPOSITORY` supplied automatically by GitHub Actions.
3. A configured local `origin` Git remote.
4. The local directory name (`ALevelDashboard` here).

Project repositories build under `/<repository-name>/`; user or organization repositories named `*.github.io` build under `/`. Renaming a repository is handled by the next Actions build. There are no path-based client routes, so refreshing the dashboard does not require SPA fallback rules.

### Repository and deployment

The public source repository is [Zerokungyt/ALevel-Dashboard-TCAS70](https://github.com/Zerokungyt/ALevel-Dashboard-TCAS70). GitHub Pages is configured with GitHub Actions as its deployment source. The production base path is `/ALevel-Dashboard-TCAS70/`, resolved automatically from the repository identity.

Live website: [A-Level Exam Weight Dashboard — TCAS70](https://zerokungyt.github.io/ALevel-Dashboard-TCAS70/). Publication was verified with a successful Actions deployment and HTTP 200 responses for the page, JSON data and application assets.

Push changes to `main` to test, build and publish automatically. For a manual deployment, run:

```powershell
gh workflow run deploy.yml --repo Zerokungyt/ALevel-Dashboard-TCAS70 --ref main
gh run list --repo Zerokungyt/ALevel-Dashboard-TCAS70 --workflow deploy.yml
```

Check the workflow result and the actual URL returned by the `github-pages` environment or Settings → Pages before claiming a deployment succeeded. Delivery verification is recorded in [docs/VALIDATION.md](docs/VALIDATION.md).
