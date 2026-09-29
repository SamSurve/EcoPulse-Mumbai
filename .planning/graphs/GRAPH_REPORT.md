# Graph Report - EcoPulse-Mumbai  (2026-09-29)

## Corpus Check
- 45 files · ~142,457 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: .example 2, (none) 1, .css 1)

## Summary
- 282 nodes · 455 edges · 16 communities (13 shown, 3 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bffb9815`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- Dashboard.tsx
- api.ts
- package.json
- Communities (31 total, 3 thin omitted)
- DataProvenance
- EcoPulseApiClient
- compilerOptions
- Location
- dependencies
- devDependencies
- RiskData
- EcoPulse Mumbai — Frontend Application
- next-env.d.ts

## God Nodes (most connected - your core abstractions)
1. `react` - 32 edges
2. `Communities (31 total, 3 thin omitted)` - 29 edges
3. `EcoPulseApiClient` - 18 edges
4. `Location` - 17 edges
5. `AirData` - 17 edges
6. `lucide-react` - 16 edges
7. `compilerOptions` - 16 edges
8. `DataProvenance` - 13 edges
9. `WeatherData` - 12 edges
10. `Graph Report - EcoPulse-Mumbai  (2026-09-29)` - 11 edges

## Surprising Connections (you probably didn't know these)
- `God Nodes (most connected - your core abstractions)` --references--> `EcoPulseApiClient`  [INFERRED]
  .planning/graphs/GRAPH_REPORT.md → src/services/apiClient.ts
- `God Nodes (most connected - your core abstractions)` --references--> `Location`  [INFERRED]
  .planning/graphs/GRAPH_REPORT.md → src/types/api.ts
- `Suggested Questions` --references--> `Location`  [INFERRED]
  .planning/graphs/GRAPH_REPORT.md → src/types/api.ts
- `Surprising Connections (you probably didn't know these)` --references--> `Location`  [INFERRED]
  .planning/graphs/GRAPH_REPORT.md → src/types/api.ts
- `God Nodes (most connected - your core abstractions)` --references--> `AirData`  [INFERRED]
  .planning/graphs/GRAPH_REPORT.md → src/types/api.ts

## Import Cycles
- None detected.

## Communities (16 total, 3 thin omitted)

### Community 0 - "react"
Cohesion: 0.08
Nodes (24): react, AboutUs(), AboutUsProps, CinematicHeroProps, Dashboard(), DocSection, DocumentationModal(), DocumentationModalProps (+16 more)

### Community 1 - "Dashboard.tsx"
Cohesion: 0.11
Nodes (20): lucide-react, DashboardHeader(), DashboardHeaderProps, DashboardProps, DashboardSidebar(), DashboardSidebarProps, DEFAULT_MUMBAI_LOCATIONS, ForecastChart() (+12 more)

### Community 2 - "api.ts"
Cohesion: 0.09
Nodes (20): AlertsBannerProps, AQIOverview(), AQIOverviewProps, CPCB_BUCKETS, POLLUTANT_CONFIGS, PollutantDisplayConfig, PollutantGrid(), PollutantGridProps (+12 more)

### Community 3 - "package.json"
Cohesion: 0.07
Nodes (26): name, private, scripts, build, dev, lint, start, version (+18 more)

### Community 4 - "Communities (31 total, 3 thin omitted)"
Cohesion: 0.07
Nodes (29): Communities (31 total, 3 thin omitted), Community 0 - "package.json", Community 10 - "EcoPulse Mumbai — Backend Architecture, Reliability & Concurrency Hardening Report", Community 11 - "ECOPULSE MUMBAI — SYSTEM BLUEPRINT & PHASED ROADMAP", Community 12 - "Dashboard.tsx", Community 13 - "apiClient.ts", Community 14 - "compilerOptions", Community 15 - "AirData" (+21 more)

### Community 5 - "DataProvenance"
Cohesion: 0.08
Nodes (23): Community Hubs (Navigation), Corpus Check, God Nodes (most connected - your core abstractions), Graph Freshness, Graph Report - EcoPulse-Mumbai  (2026-09-29), Import Cycles, Knowledge Gaps, Suggested Questions (+15 more)

### Community 6 - "EcoPulseApiClient"
Cohesion: 0.11
Nodes (8): MumbaiMapProps, apiClient, EcoPulseApiClient, AreaComparisonResponse, LocationMapFeature, MumbaiMapDataResponse, RiskSummaryResponse, UnifiedEnvironmentResponse

### Community 7 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 8 - "Location"
Cohesion: 0.16
Nodes (10): leaflet, AreaComparisonProps, DEFAULT_MUMBAI_LOCATIONS, EnvironmentalMap(), EnvironmentalMapProps, LOCATION_TELEMETRY, EnvironmentalMap, HeaderProps (+2 more)

### Community 9 - "dependencies"
Cohesion: 0.17
Nodes (12): dependencies, chart.js, globe.gl, leaflet, lucide-react, next, react, react-chartjs-2 (+4 more)

### Community 10 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, autoprefixer, postcss, tailwindcss, @types/leaflet, @types/node, @types/react, @types/react-dom (+1 more)

### Community 11 - "RiskData"
Cohesion: 0.32
Nodes (4): EnvironmentalRisk(), EnvironmentalRiskProps, RiskSectionProps, RiskData

### Community 12 - "EcoPulse Mumbai — Frontend Application"
Cohesion: 0.33
Nodes (5): Architecture & Data Flow, EcoPulse Mumbai — Frontend Application, Option 1: Direct Browser Access (FastAPI Integrated UI), Option 2: Standalone Next.js Development Server, Running the Frontend

## Knowledge Gaps
- **132 isolated node(s):** `name`, `version`, `private`, `dev`, `build` (+127 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 159 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `Dashboard.tsx`, `api.ts`, `package.json`, `DataProvenance`, `EcoPulseApiClient`, `Location`, `RiskData`?**
  _High betweenness centrality (0.332) - this node is a cross-community bridge._
- **Why does `Graph Report - EcoPulse-Mumbai  (2026-09-29)` connect `DataProvenance` to `Communities (31 total, 3 thin omitted)`?**
  _High betweenness centrality (0.203) - this node is a cross-community bridge._
- **Why does `Communities (31 total, 3 thin omitted)` connect `Communities (31 total, 3 thin omitted)` to `DataProvenance`?**
  _High betweenness centrality (0.168) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Location` (e.g. with `God Nodes (most connected - your core abstractions)` and `Suggested Questions`) actually correct?**
  _`Location` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `AirData` (e.g. with `God Nodes (most connected - your core abstractions)` and `Suggested Questions`) actually correct?**
  _`AirData` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _132 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.07823613086770982 - nodes in this community are weakly interconnected._