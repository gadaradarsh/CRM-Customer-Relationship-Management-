This directory stores MongoDB dumps or seed data.

- Place your dump files here (e.g. BSON/JSON exports, .gz archives).
- Do not commit sensitive data. The root .gitignore excludes common dump formats.
- Example backup command:
  mongodump --uri="mongodb://localhost:27017/crm_system" --out="./db-backup/"
