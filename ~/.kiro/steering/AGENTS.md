# Global AI Agent Guidelines

## Skills System

This file documents all available skills across your Kiro environment. Skills are organized by location and automatically discovered.

### How to Use Skills

```bash
# Invoke a single skill
npx openskills read <skill-name>

# Invoke multiple skills
npx openskills read skill-one,skill-two,skill-three

# Skills are stateless - each invocation is independent
```

### Skill Locations

- **Workspace Skills**: Stored in `.claude/skills/` (project-specific)
- **Global Skills**: Stored in `~/.kiro/skills/` (available across all workspaces)

---

## Available Skills

### Workspace Skills (Project-Specific)

These skills are specific to individual projects and stored in `.claude/skills/`:

| Skill | Description | Use Case |
|-------|-------------|----------|
| `frontend-design` | Create distinctive, production-grade frontend interfaces with high design quality | Building web components, pages, landing pages, dashboards, React components, HTML/CSS layouts, styling/beautifying web UI |
| `webapp-testing` | Toolkit for interacting with and testing local web applications using Playwright | Verifying frontend functionality, debugging UI behavior, capturing browser screenshots, viewing browser logs |

### Global Skills (Cross-Workspace)

These skills are available across all workspaces and stored in `~/.kiro/skills/`:

| Skill | Description | Use Case |
|-------|-------------|----------|
| `agent-browser` | Browser automation & interaction capabilities | Web testing, automation tasks, browser interaction |
| `audit-website` | Website auditing & analysis | Performance, accessibility, quality assessment |
| `brainstorming` | Creative ideation & brainstorming | Feature design, content strategy, problem-solving |
| `copywriting` | Content writing & copywriting | Marketing, documentation, user-facing text |
| `programmatic-seo` | SEO optimization & strategy | Programmatic content generation, search visibility |
| `remotion-best-practices` | Remotion video library best practices | Creating programmatic videos and animations |
| `security-review` | Security code review & auditing | Identifying vulnerabilities, security best practices |
| `seo-audit` | SEO audit & analysis | On-page optimization, technical SEO, content strategy |
| `supabase-postgres-best-practices` | Supabase & PostgreSQL optimization | Database design, queries, performance tuning |

---

## Discovering New Skills

### Automatic Discovery

When new skills are added to `~/.kiro/skills/`, they are automatically available via:

```bash
npx openskills read <new-skill-name>
```

### Manual Discovery

To see all available skills in your system:

```bash
# List workspace skills
Get-ChildItem -Path ".\.claude\skills" -Directory

# List global skills
Get-ChildItem -Path "$env:USERPROFILE\.kiro\skills" -Directory
```

### Adding New Skills

1. **Workspace Skills**: Add to `.claude/skills/<skill-name>/`
2. **Global Skills**: Add to `~/.kiro/skills/<skill-name>/`

Each skill directory should contain:
- `SKILL.md` - Skill documentation and instructions
- Supporting files (references/, scripts/, assets/ as needed)

---

## Best Practices

- **Check available skills first** before implementing a task manually
- **Use workspace skills** for project-specific capabilities
- **Use global skills** for cross-cutting concerns (security, SEO, copywriting, etc.)
- **Combine skills** when a task requires multiple specialized capabilities
- **Keep skills updated** - new skills added to `~/.kiro/skills/` are immediately available

---

## Notes

- Skills are discovered dynamically from the filesystem
- No manual registration needed - just add a new directory to `~/.kiro/skills/`
- Each skill invocation is stateless and independent
- Skills can be used in any workspace without modification
