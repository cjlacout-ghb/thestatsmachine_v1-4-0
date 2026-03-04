# 🥎 The Stats Machine — Project Roadmap
**Version 1.3.0** | Last updated: 2026-03-04

---

## ✅ Accomplished

### 🏷️ Branding & Foundation
- [x] Renamed and versioned app to **"The Stats Machine v1.3.0"** (browser tab, UI)
- [x] Custom `SoftballLogo` component created
- [x] Vite + React + TypeScript + ESLint scaffold in place

### 🗃️ Data Model
- [x] Full hierarchical type system: `Team → Players`, `Team → Tournaments → Games`
- [x] `PlayerGameStats` with full batting, pitching, and fielding fields (including catcher-specific: `cCS`, `cSB`, `pk`, `pb`)
- [x] Derived stat interfaces: `BattingStats`, `PitchingStats`, `FieldingStats`
- [x] `participatingTeamIds[]` on `Tournament` (supports multi-team events)
- [x] Cascading deletes: deleting a team removes tournaments, players, and games; deleting a tournament removes its games but **preserves players** (team-level)

### 💾 Storage System
- [x] **Dual-driver architecture**: `LocalStorageDriver` + `FileSystemDriver` (File System Access API)
- [x] `StorageManager` with driver switching, preference persistence, and `localStorage` mirroring for safety
- [x] IndexedDB (`db.ts`) used to persist the `FileSystemFileHandle` across page reloads
- [x] Data **import/export** flow: import JSON file → validate → switch to LocalStorage driver → save → reload
- [x] Legacy data migration: `teamId → participatingTeamIds`, auto-creation of default team
- [x] **Migration banner** prompting users to move from browser cache to local file
- [x] **CSV/TXT bulk player import** parser (`parsePlayerImport`)
- [x] Bug fixes: import persistence (Step 2 forced LocalStorage before saving), local file save bug resolved

### 🧭 Navigation & Layout
- [x] **Teams Hub** as the primary landing/entry page with team cards, summary badges, and search
- [x] **Session persistence**: active team and tournament survive page reload (via `localStorage` keys)
- [x] **Sidebar** with two sections — **TEAM** (Overview, Roster) and **EVENTS** (All Events + active event sub-nav)
- [x] Active event sub-nav in sidebar: Game Log + Stats tabs appear only when an event is selected
- [x] **HierarchyStepper** simplified to 2-step context indicator (Organization vs Events)
- [x] **AppHeader** extracted with global search, save status indicator, storage button, and help
- [x] **AppModals** extracted (manages all modal types: team, tournament, player, game, storage, help)
- [x] **AppContent** extracted to handle tab routing
- [x] Header width CSS bug fixed; modal CSS animations added
- [x] Active team card highlighted (subtle tint + border) in game form — regardless of home/away

### 📋 Forms & Data Entry
- [x] **TeamForm**, **TournamentForm**, **PlayerForm** fully implemented
- [x] **GameForm**: two-tab modal:
  - `Details` tab: date, opponent, game type, home/away toggle, visual score entry with innings
  - `Player Stats` tab *(edit mode only)*: inline table for batting (AB, H, 2B, 3B, HR, BB, HBP, SF, RBI, R) + pitching (IP, ER) with live computed AVG/OBP
- [x] Innings validation using `X.1/X.2` format with `normalizeInnings()` (prevents `.3` remainder)
- [x] Date display bug fixed — `dateUtils.ts` parses `YYYY-MM-DD` as **local date** (prevents UTC timezone shift)
- [x] All "add" buttons open their form directly with no intermediate step

### 📊 Stats Engine & Reporting
- [x] `calculations.ts`: `calcBatting()`, `calcPitching()`, `calcFielding()` — all aggregate across arrays of `PlayerGameStats`
- [x] `sportsUtils.ts`: `inningsToOuts()`, `outsToInnings()`, `normalizeInnings()`, `formatInnings()`, `isValidInnings()`
- [x] Softball-specific ERA formula: `(ER × 7) / IP` (7-inning standard)
- [x] Performance color coding: `good / average / poor` thresholds for AVG, ERA, OBP, SLG, OPS, FLD%
- [x] **StatsTab**: sortable batting leaderboard (G, AB, R, H, 2B, 3B, HR, RBI, BB, SO, AVG, OBP, SLG, OPS)
- [x] **PDF Report export** (`pdfGenerator.ts` using jsPDF + jspdf-autotable): Batting, Pitching, Fielding tables + Game Log, sorted by AVG

---

## 🔜 Next Steps

### 🔴 High Priority
- [x] **Complete the Player Stats Tab in GameForm**: Added input fields for full pitching (SO, BB, H, Pitch Count) and fielding (PO, A, E, CS, SB, PB).
- [x] **Expand StatsTab: Pitching & Fielding Leaderboards**: Implemented Pitching and Fielding leaderboards with tabbed navigation and performance color-coding.
- [x] **Team Overview Tab (TeamTab)**: Polished the Team Overview with real W/L/T records, streaks, data-driven batting trend charts, and season leaders.

### 🟡 Medium Priority

- [x] **Tournament Stats Scoping**: Added a "Season Stats" navigation link under the TEAM sidebar section to view cumulative stats across all tournaments.
- [x] **Global Search Improvements**: Added `Cmd/Ctrl+K` shortcut, improved navigation to scroll/highlight items contextually instead of opening modals.
- [x] **Data Validation & UX Guards**: Added validation for H <= AB, preventing saves with 0 Innings Played, and added visual cues for errors and tooltips for SF/SAC columns.
- [x] **PDF Report Polish**: Removed `#` jersey column redundancy, replaced `PA` with `AB`, and added team Win-Loss-Tie record to the PDF header.

### 🟢 Low Priority / Future

#### 8. Pitching Rotation / Lineup Card
Pre-game lineup builder: set batting order, designated pitcher, and fielding positions before logging game stats.

#### 9. Multi-Team Tournament Support
`participatingTeamIds` already supports multiple teams per tournament. The UI should allow selecting **which team's stats** to view when a tournament has multiple registered teams.

#### 10. Mobile / Tablet Responsiveness
The sidebar layout and game form stats table are not optimized for smaller screens. A collapsible sidebar and stacked stat-entry rows would improve usability on tablets commonly used in dugouts.

#### 11. README Update
The project `README.md` is still the Vite boilerplate. Replace it with actual app documentation, setup instructions, and a feature overview.

---

## 🏗️ Architecture Summary (Current)

```
src/
├── App.tsx               # Root state machine (team, tournament, tab, modals)
├── types/index.ts        # All domain types
├── lib/
│   ├── storage.ts        # Dual-driver (LocalStorage / FileSystem) + CRUD ops
│   ├── db.ts             # IndexedDB for FileSystemFileHandle persistence
│   ├── calculations.ts   # Stat engine (batting, pitching, fielding)
│   ├── sportsUtils.ts    # Innings format utilities
│   ├── dateUtils.ts      # Timezone-safe local date formatting
│   └── pdfGenerator.ts   # PDF export via jsPDF
├── components/
│   ├── layout/           # AppHeader, AppModals, AppContent
│   ├── ui/               # TeamsHub, Sidebar, HierarchyStepper, StatTable, etc.
│   ├── tabs/             # PlayersTab, TournamentsTab, GamesTab, StatsTab, TeamTab
│   └── forms/            # TeamForm, TournamentForm, PlayerForm, GameForm
└── data/mockData.ts      # Demo data for onboarding
```
