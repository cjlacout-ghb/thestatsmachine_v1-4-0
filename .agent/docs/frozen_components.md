# FROZEN COMPONENTS REGISTER
**The Stats Machine — v1.4.0**
*Last updated: 2026-03-13*

---

> [!CAUTION]
> **MASTER RULE — SECTION 9**
> The components listed below are **verified and working**. They MUST NEVER be modified unless the user explicitly requests it. Any AI assistant that touches a frozen component without explicit user instruction is in **direct violation of the Master Rule**.

---

## SECTION 9 — FROZEN COMPONENTS

### Protocol for Frozen Components

When a fix or feature requires modifying a frozen component, the AI assistant MUST:

1. **Declare the conflict** — State explicitly that a frozen component is involved.
2. **Describe the impact** — Describe *exactly* what will change and, equally important, what will NOT change.
3. **Wait for confirmation** — Do NOT proceed until the user explicitly approves the modification.
4. **Document the change** — After the modification, update the `Status` and `Notes` columns in this register.

---

## Component Registry

| Component | File(s) | Status | What Must Be Preserved | Frozen Since | Notes |
|---|---|---|---|---|---|
| **Header** | `src/components/ui/Header.tsx` | ✅ FROZEN | Must always display the **name of the team currently being edited** in the page title/header area. Tournament name must NOT replace the team name. | 2026-03-13 | Restored in conv. `41624bf6`. Header previously broke when tournament data was present. |
| **Sidebar** | `src/components/ui/Sidebar.tsx` | ✅ FROZEN | Team navigation list, active team highlight state, and all navigation links. | 2026-03-13 | Active file in current session. Do not modify navigation or selection logic. |

---

## How to Add a New Frozen Component

When a component is verified and stable, add a new row to the registry above with:

- **Component**: Human-readable name
- **File(s)**: Relative path(s) from project root
- **Status**: `✅ FROZEN`
- **What Must Be Preserved**: Plain-language description of the invariants that must hold
- **Frozen Since**: Date the component was verified (`YYYY-MM-DD`)
- **Notes**: Context, related conversation IDs, or known edge cases

---

## Unfreezing a Component

If the user explicitly requests changes to a frozen component:

1. The AI states: *"This component is currently FROZEN (`frozen_components.md`). Proceeding will modify [X]. Here is exactly what will change: [...] and what will not change: [...]. Do you confirm?"*
2. User confirms.
3. After the change, the AI updates this document:
   - If the component remains stable → Keep `✅ FROZEN`, update `Notes`.
   - If the change introduces risk → Mark as `⚠️ UNDER REVIEW` until re-verified.
   - If the component is intentionally retired → Mark as `🗄️ ARCHIVED`.

---

## Status Legend

| Icon | Meaning |
|---|---|
| ✅ FROZEN | Verified and stable. No modifications without explicit user approval. |
| ⚠️ UNDER REVIEW | Recently modified. Not yet re-verified. Handle with care. |
| 🛠️ IN PROGRESS | Actively being worked on. Not frozen. |
| 🗄️ ARCHIVED | Component removed or replaced. Kept for historical reference. |
