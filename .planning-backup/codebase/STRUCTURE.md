# Codebase Structure

**Analysis Date: 2025-01-13**

## Directory Layout

```
/
├── factory-core/           # Central API and Database logic
├── rankame/                # SEO and Automation product collection
│   ├── puraluce-seotool/   # Next.js frontend/backend SEO app
│   ├── telegram-ranketogram/# Telegram bot integration
│   └── factory-core/       # Secondary backend core (mirrored)
├── tools/                  # Agentic tooling and skill definitions
└── .planning/              # Project management and documentation
```

## Directory Purposes

**`factory-core/`**:
- Purpose: Backend infrastructure for API and data layer.
- Contains: Drizzle migrations, API route definitions, service logic.

**`rankame/`**:
- Purpose: Application workspace for specific business units or tools.
- Contains: Independent project folders like `puraluce-seotool`.

**`tools/`**:
- Purpose: Shared libraries and templates for agents.
- Contains: Skills, agent definitions, project templates.

## Key File Locations

**Entry Points:**
- `factory-core/src/index.ts`: Primary backend API server.
- `rankame/puraluce-seotool/app/`: Next.js application root.

**Configuration:**
- `factory-core/wrangler.toml`: Cloudflare Workers configuration.
- `rankame/puraluce-seotool/next.config.ts`: Next.js configuration.

## Where to Add New Code

**New Backend Service:**
- Use `factory-core/` if it fits existing API structure.
- Add migration to `factory-core/migrations/` if changing schema.

**New SEO Tool/App:**
- Add a new directory under `rankame/`.

**New Agentic Skill:**
- Add to `tools/local-business-builder/skills/`.

---

*Structure analysis: 2025-01-13*
