# Skills — BRD, Architecture, Stack, Design

Skill + template untuk menghasilkan dokumen pilar produk. Sumber canonical di root `Agentic/`; salinan Cursor di `.cursor/skills/`.

| Dokumen | Folder skill | Template output default |
|---------|--------------|-------------------------|
| BRD | [invoicing-brd/](invoicing-brd/SKILL.md) | `docs/product/brd.md` |
| Architecture | [invoicing-architecture/](invoicing-architecture/SKILL.md) | `docs/architecture/README.md` |
| Stack | [invoicing-stack/](invoicing-stack/SKILL.md) | `docs/engineering/technology-stack.md` |
| Design | [invoicing-design/](invoicing-design/SKILL.md) | `docs/design/design-guidelines.md` |

## Cara pakai (agent / human)

1. Baca `SKILL.md` di folder skill yang sesuai
2. Salin `template.md.tmpl` → path target
3. Ganti placeholder `{{NAMA}}`
4. Turunkan artefak terkait (brd/, alignment, STACK-INTEGRATION)

## Cursor

Project skills: `Agentic/.cursor/skills/invoicing-{brd,architecture,stack,design}/`

Invoke: sebut skill atau minta "gunakan skill invoicing-brd" saat menulis dokumen.
