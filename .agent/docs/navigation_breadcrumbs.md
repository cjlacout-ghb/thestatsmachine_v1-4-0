# 🧭 Navegación & Breadcrumbs — The Stats Machine v1.4.0

> **Documento vivo** — Actualizar cada vez que haya cambios en la estructura de navegación, rutas, tabs, o el HierarchyStepper.
>
> Última actualización: **2026-03-13**

---

## 1. Arquitectura de Navegación General

La app **no usa un router de URL tradicional** (React Router, etc.). Toda la navegación es **stateful**: se controla por las variables de estado `activeTeam`, `activeTournament` y `activeTab` gestionadas en `App.tsx`.

```
App.tsx
├── Estado: activeTeam (Team | null)
├── Estado: activeTournament (Tournament | null)
└── Estado: activeTab (TabId: 'players' | 'tournaments' | 'team' | 'games' | 'stats')
```

---

## 2. Niveles de Navegación (Jerarquía)

La app tiene **2 niveles de jerarquía** visualizados por el `HierarchyStepper`:

```
NIVEL 1 — Organización
  └── Teams Hub (sin activeTeam)
        ├── Ver equipos existentes → seleccionar → entra al nivel 2
        └── Crear nuevo equipo

NIVEL 2 — Eventos
  └── Dashboard (con activeTeam seleccionado)
        ├── Tab: Resumen (team)
        ├── Tab: Jugadores (players)
        ├── Tab: Todos los Eventos (tournaments)
        └── Evento Activo (con activeTournament)
              ├── Tab: Registro de Partidos (games)
              └── Tab: Estadísticas (stats)
```

---

## 3. Componentes de Navegación

### 3.1 `HierarchyStepper` — Componente principal de breadcrumb

**Archivo:** `src/components/ui/HierarchyStepper.tsx`

Es el **breadcrumb visual** central de la app. Muestra dos pasos interactivos y comunica en qué nivel jerárquico se encuentra el usuario.

| Step | ID | Label | Sublabel | Icono | Estado activo cuando... |
|------|----|-------|----------|-------|------------------------|
| 1 | `1` | Organización | EQUIPOS & JUGADORES | 🏢 | `activeTab === 'players'` o no hay `activeTournament` |
| 2 | `2` | Eventos | TORNEOS & PARTIDOS | 🏆 | `activeTab === 'tournaments'` \| `'games'` \| (`'stats'` con `activeTournament`) \| hay `activeTournament` |

**Lógica de `currentStep` (calculada en `App.tsx`, línea 332):**
```ts
const currentStep: 1 | 2 = (
  activeTab === 'tournaments' ||
  activeTab === 'games' ||
  (activeTab === 'stats' && activeTournament) ||
  activeTournament
) ? 2 : 1;
```

**Comportamiento de click (`handleStepClick` en `App.tsx`):**
- **Click Step 1** → limpia `activeTournament`, va a tab `players`
- **Click Step 2** → si hay `activeTournament`: va a tab `games`; si no: va a tab `tournaments`

**Aparece en:**
- `TeamsHub.tsx` (vista sin equipo activo, nivel 1)
- `App.tsx` render principal (entre el badge de equipo y el badge de torneo)

---

### 3.2 `AppHeader` — Barra superior con contexto global

**Archivo:** `src/components/layout/AppHeader.tsx`

| Elemento | Descripción | Acción |
|----------|-------------|--------|
| Logo + nombre app | "The Stats Machine" siempre visible | Click → `onSwitchTeam()` (vuelve a Teams Hub) |
| Subtítulo contextual | `{activeTeam.name} • v1.4.0` o `Panel Principal • v1.4.0` | Indicador de contexto de equipo |
| 💾 Guardar | Guarda copia de respaldo en disco | `onSaveToDisk()` |
| 📥 Importar Datos | Carga un archivo JSON de respaldo | `onLoadFromDisk()` |
| 🔄 Cambiar Equipo | Solo visible si hay `activeTeam` | `onSwitchTeam()` → vuelve a Teams Hub |
| 📖 Ayuda | Modal de ayuda | `onOpenHelp()` |
| 🗑️ (icono) | Borrar todos los datos | `onOpenErase()` |

> **Nota de breadcrumb:** El subtítulo del logo actúa como indicador de contexto de primer nivel (qué equipo está activo).

---

### 3.3 `Sidebar` — Navegación secundaria (Dashboard)

**Archivo:** `src/components/ui/Sidebar.tsx`

Solo visible cuando hay un `activeTeam`. Organizado en dos secciones con `sidebar-item` activos según `activeTab` y `activeTournament`.

#### Sección EQUIPO
| Item | Tab destino | Activo cuando |
|------|------------|---------------|
| 🏢 Resumen | `team` | `activeTab === 'team'` && !`activeTournament` |
| 👥 Jugadores | `players` | `activeTab === 'players'` && !`activeTournament` |
| 📊 Estadísticas | `stats` | `activeTab === 'stats'` && !`activeTournament` |

#### Sección EVENTOS
| Item | Tab destino | Activo cuando |
|------|------------|---------------|
| 🏆 Todos los Eventos | `tournaments` | `activeTab === 'tournaments'` && !`activeTournament` |
| `{nombre torneo}` *(dinámico)* | selecciona torneo → tab `games` | `activeTournament?.id === t.id` |

#### Sub-sección EVENTO ACTIVO *(aparece solo con `activeTournament`)*
| Item | Tab destino | Activo cuando |
|------|------------|---------------|
| 📅 Registro de Partidos | `games` | `activeTab === 'games'` |
| 📊 Estadísticas | `stats` | `activeTab === 'stats'` |
| × Salir del Evento | limpia `activeTournament` → tab `tournaments` | — |

> **Nota:** los items de la sección EQUIPO que llaman a `onExitTournament()` también limpian el torneo activo al hacer click, actuando como un "breadcrumb de salida" implícito.

---

### 3.4 Badges Contextuales en el Dashboard

**Archivo:** `App.tsx` (líneas 448–463)

En el área de contenido principal, sobre las tabs, se muestran dos badges interactivos que funcionan como **breadcrumbs de contexto**:

| Badge | Contenido | Acción al click | Visible cuando |
|-------|-----------|-----------------|----------------|
| `pro-team-badge` | `EQUIPO OFICIAL` + `{activeTeam.name}` | Abre modal de edición del equipo | Siempre (en dashboard) |
| `identity-badge` | `🏆 {activeTournament.name}` | Abre modal de edición del torneo | Solo con `activeTournament` |
| *(placeholder)* | `<div style={{ width: '240px' }}>` | — | Cuando no hay torneo activo |

**Entre los dos badges**, aparece el `HierarchyStepper` (ver sección 3.1).

---

### 3.5 Título dinámico de sección (Dashboard)

**Archivo:** `App.tsx` (líneas 467–473)

Un `<h2>` textual que refleja el tab activo:

| `activeTab` | Texto mostrado |
|-------------|---------------|
| `players` | `JUGADORES` |
| `team` | `EQUIPO` |
| `stats` | `ESTADÍSTICAS` |
| `tournaments` | `TORNEOS` |
| `games` | `PARTIDOS` |

Cuando `activeTab === 'tournaments'`, aparece además el botón **"Agregar Evento"** debajo del título.

---

## 4. Flujos de Navegación Completos

### Flujo A — Primera vez (sin equipos)
```
[Teams Hub - Zero State]
  → Click "+ Agregar Equipo"  → Modal "team"
     → Guardar equipo         → setActiveTeam() → [Dashboard / tab: players]
```

### Flujo B — Equipo existente → seleccionar
```
[Teams Hub - Grid de equipos]
  → Click en card de equipo   → setActiveTeam() → setActiveTab('players')
                               → [Dashboard / tab: players]
```

### Flujo C — Dashboard → Crear torneo
```
[Dashboard]
  → Sidebar: "Todos los Eventos" → activeTab: 'tournaments'
  → Click "Agregar Evento"       → Modal "tournament"
     → Guardar torneo            → setActiveTournament() → setActiveTab('games')
                                  → [Dashboard / tab: games + activeTournament]
```

### Flujo D — Navegar a un torneo existente
```
[Dashboard]
  → Sidebar: click en nombre de torneo → setActiveTournament(t) → setActiveTab('games')
  → [Dashboard / tab: games + activeTournament activo]
```

### Flujo E — Salir de un torneo
```
[Dashboard con activeTournament]
  → Sidebar: "× Salir del Evento" → setActiveTournament(null) → setActiveTab('tournaments')
  → [Dashboard / tab: tournaments, sin torneo activo]
```

### Flujo F — Volver a Teams Hub
```
[Dashboard]
  → Header: click en logo ó botón "🔄 Cambiar Equipo" → setActiveTeam(null)
  → [Teams Hub]
```

### Flujo G — HierarchyStepper (breadcrumb de nivel)
```
[Paso activo = 2]
  → Click en "1 Organización" → setActiveTournament(null) → setActiveTab('players')
  → [Dashboard / tab: players, sin torneo activo]

[Paso activo = 1]
  → Click en "2 Eventos"      → setActiveTab('tournaments') ó setActiveTab('games')
  → [Dashboard / tab: tournaments ó games]
```

---

## 5. Mapa de Vistas (Estados posibles)

| `activeTeam` | `activeTournament` | `activeTab` | Vista / Contexto |
|---|---|---|---|
| `null` | `null` | — | **Teams Hub** |
| ✅ | `null` | `team` | Dashboard › Resumen del equipo |
| ✅ | `null` | `players` | Dashboard › Jugadores |
| ✅ | `null` | `stats` | Dashboard › Estadísticas generales del equipo |
| ✅ | `null` | `tournaments` | Dashboard › Todos los Eventos |
| ✅ | ✅ | `games` | Dashboard › Evento: Partidos |
| ✅ | ✅ | `stats` | Dashboard › Evento: Estadísticas del evento |

---

## 6. Componentes Relevantes — Índice de Archivos

| Componente | Archivo | Rol en navegación |
|-----------|---------|------------------|
| `HierarchyStepper` | `src/components/ui/HierarchyStepper.tsx` | Breadcrumb visual de 2 pasos |
| `Sidebar` | `src/components/ui/Sidebar.tsx` | Navegación secundaria (tabs + torneos) |
| `AppHeader` | `src/components/layout/AppHeader.tsx` | Contexto global + acciones |
| `TeamsHub` | `src/components/ui/TeamsHub.tsx` | Punto de entrada (nivel 1) |
| `AppContent` | `src/components/layout/AppContent.tsx` | Router de tabs |
| `App.tsx` | `src/App.tsx` | Estado central de navegación |

---

## 7. Historial de Cambios

| Fecha | Cambio | Afecta a |
|-------|--------|----------|
| 2026-03-13 | Documento creado — análisis inicial de breadcrumbs v1.4.0 | Todo |
