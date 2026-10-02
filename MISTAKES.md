# Mistakes

## 2026-10-02 — Optional file assumed present during inspection

- What happened: rg reported a missing .env.example during the dependency inventory.
- Root cause: Included an optional path before checking existence.
- Consequence: Partial search output; repeated the relevant search against existing files successfully.
- Prevention rule: Check optional paths exist before passing them as explicit search inputs.
