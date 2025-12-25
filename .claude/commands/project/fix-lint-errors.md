# Fix lint errors for this project

When this command is run:

1. Detect the correct package manager by checking for lock files:
   - Prefer `pnpm` if `pnpm-lock.yaml` exists.
   - Else prefer `bun` if `bun.lock` exists.
   - Else use `npm` if `package-lock.json` exists (default for this project).

2. Run the lint command for the root project:
   - With npm: `npm run lint`
   - With pnpm: `pnpm lint`
   - With bun: `bun run lint`
   Capture all lint errors and group them by rule and by file.

3. For each group of lint errors:
   - Propose a minimal, safe fix that respects the rules in `CLAUDE.md`.
   - Apply fixes in small batches, at most 10 files per batch.
   - After each batch:
     - Show a diff of all changes.
     - Ask for confirmation before applying if the changes look risky.

4. After each confirmed batch:
   - Re-run the lint command.
   - Stop and ask for clarification if new unexpected errors appear.

5. At the end:
   - Ensure the lint command passes with no errors.
   - Summarize what rules were fixed and which files were touched.
