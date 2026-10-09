---
name: feature-qa
description: Skill verifikasi QA — rencana uji dari Agent Plan; dieksekusi Agent QA di kolom Test.
---

# Skill QA (feature)

Plan agent menulis `skills/qa.md`: perintah persis, data uji, expected, link acceptance PRD.

Agent QA menjalankan perintah; hasil di `docs/workflow/results/.../qa/{task-id}.md`. Jika gagal dan perbaikan jelas, **boleh fix kode** dalam boundary feature doc (session yang sama), lalu uji ulang.
