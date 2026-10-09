# Skills — BRD, Architecture, Stack, Design

Skill + template untuk menghasilkan dokumen pilar produk. Sumber canonical di root `Agentic/`; salinan Cursor di `.cursor/skills/`.

| Dokumen | Folder skill | Template output default |
|---------|--------------|-------------------------|
| BRD | [invoicing-brd/](invoicing-brd/Skill.md) | `docs/product/BRD.md` |
| Architecture | [invoicing-architecture/](invoicing-architecture/Skill.md) | `docs/architecture/README.md` |
| Stack | [invoicing-stack/](invoicing-stack/Skill.md) | `docs/engineering/TECHNOLOGY-STACK.md` |
| Design | [invoicing-design/](invoicing-design/Skill.md) | `docs/design/DESIGN-GUIDELINES.md` |

## Cara pakai (agent / human)

1. Baca `Skill.md` di folder skill yang sesuai
2. Salin `template.md.tmpl` → path target
3. Ganti placeholder `{{NAMA}}`
4. Turunkan artefak terkait (brd/, alignment, STACK-INTEGRATION)

## Cursor

Project skills: `Agentic/.cursor/skills/invoicing-{brd,architecture,stack,design}/`

Invoke: sebut skill atau minta "gunakan skill invoicing-brd" saat menulis dokumen.
