# GitHub Workflow Guide

## How Pull Requests Work

When using GitHub Copilot or working with Git/GitHub, changes are made following this standard workflow:

### The Standard Process

1. **Create a Feature Branch**
   - Changes are made on a new branch (not directly on `main`)
   - This keeps the `main` branch stable and allows for review

2. **Make Changes**
   - Files are created, modified, or deleted on the feature branch
   - Commits are made to track the changes

3. **Create a Pull Request (PR)**
   - A PR is opened to propose merging changes from the feature branch into `main`
   - This allows for code review and discussion

4. **Review and Approve**
   - Team members review the changes
   - Comments and suggestions can be made
   - Changes can be requested or approved

5. **Merge to Main**
   - After approval, the PR is merged into `main`
   - The changes are now part of the main branch
   - The feature branch can be deleted

### Why Files Aren't Immediately in Main

When you see a file in a PR but not in `main`, it's because:
- The file exists on the feature branch
- The PR hasn't been merged yet
- **You need to merge the PR** to get the file into `main`

### How to Merge a PR

1. Go to the Pull Request page on GitHub
2. Review the changes one final time
3. Click the "Merge pull request" button
4. Confirm the merge
5. Optionally delete the feature branch

### For This Repository

- **PR #1** created `AI_CONTRIBUTIONS.md` on branch `copilot/add-ai-contributions-log`
- To get this file into `main`, you need to merge PR #1
- **PR #2** (this PR) provides this guide and clarification

## Quick Actions

- **To get AI_CONTRIBUTIONS.md in main**: Merge PR #1
- **To get this guide in main**: Merge PR #2 (after reviewing)

## Questions?

If you prefer a different workflow or have specific requirements, please let us know in the PR comments!
