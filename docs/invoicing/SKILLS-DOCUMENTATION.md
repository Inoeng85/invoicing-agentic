# Skills — BRD, Architecture, Stack, Design

Skill + template untuk menghasilkan dokumen pilar produk. Sumber canonical di root `Agentic/`; salinan Cursor di `.cursor/skills/`.

| Dokumen | Folder skill | Template output default |
|---------|--------------|-------------------------|
| BRD | [invoicing-brd/](../skills/invoicing-brd/Skill.md) | `docs/invoicing/BRD.md` |
| Architecture | [invoicing-architecture/](../skills/invoicing-architecture/Skill.md) | `docs/invoicing/ARCHITECTURE.md` |
| Stack | [invoicing-stack/](../skills/invoicing-stack/Skill.md) | `docs/invoicing/engineering/TECHNOLOGY-STACK.md` |
| Design | [invoicing-design/](../skills/invoicing-design/Skill.md) | `docs/invoicing/design/DESIGN-GUIDELINES.md` |

## Cara pakai (agent / human)

1. Baca `Skill.md` di folder skill yang sesuai
2. Salin `template.md.tmpl` → path target
3. Ganti placeholder `{{NAMA}}`
4. Turunkan artefak terkait (brd/, alignment, STACK-INTEGRATION)

## Cursor

Project skills: `Agentic/.cursor/skills/invoicing-{brd,architecture,stack,design}/`

Invoke: sebut skill atau minta "gunakan skill invoicing-brd" saat menulis dokumen.
