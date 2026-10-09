# Skill qa — 000001-db-canonical-sqlite-path

| # | Uji | Perintah | Expected |
|---|-----|----------|----------|
| 1 | Satu dev.db | `find . -name dev.db` (exclude node_modules) | Hanya `./packages/database/prisma/dev.db` |
| 2 | Health ready | `curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/health/ready` (API jalan) | `200` |
| 3 | Env examples | grep DATABASE_URL apps/*/.env.example packages/database/.env.example | `file:./dev.db` |
