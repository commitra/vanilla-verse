# Contributing to Vanilla Verse

Welcome! This guide will help you make your first contribution. No experience needed—just follow the steps below.

## How to contribute (Step-by-step)

### 1. Fork the repository
- Click the **Fork** button at the top right of the GitHub page. This creates your own copy of the project.

### 2. Clone your fork
- On your forked repo, click **Code** and copy the URL.
- Open your terminal and run:
    ```bash
    git clone https://github.com/your-username/vanilla-verse.git
    cd vanilla-verse
    ```

### 3. Pick a project to work on
- Open `index.html` and look at the projects listed.
- Go to the folder in `projects/vanilla-verse` for the project you want.

### 4. Read the local files
- Check the `README.md` and `main.js` in the project folder for TODOs or ideas.
- If you have questions or want to suggest something, open an issue on GitHub.

### 5. Make your changes
- Use [VS Code](https://code.visualstudio.com/) with the Live Server extension (recommended) or any static HTTP server.
- Edit the code. Make small, focused changes.

### 6. Commit your changes
- Save your work and run:
    ```bash
    git add .
    git commit -m "Describe your change here"
    git push
    ```

### 7. Open a Pull Request (PR)
- Go to your fork on GitHub. Click **Compare & pull request**.
- In the PR description, reference the issue you worked on (e.g., `Closes #12`).
- Title your PR clearly (e.g., "Snake: Add keyboard controls").

### 8. Wait for review
- A maintainer will review your PR and may suggest changes.
- If needed, update your PR by pushing more commits.

## Issue → Assign → PR flow

To keep things organized:
1. **Create an issue** describing your change or pick an existing one.
2. **Get assigned** to the issue (ask in a comment if needed).
3. **Open a PR** that references the assigned issue.

PRs must reference an assigned issue, or checks will fail.

## Code style tips
- Use plain JavaScript (no frameworks).
- Keep files small and focused.
- Write semantic HTML and accessible markup.
- Use styles from `assets/styles.css` for consistency.

## Reporting issues
Include:
- What you expected vs. what happened
- Steps to reproduce
- Screenshots or code snippets if possible

## Code of Conduct
By contributing, you agree to follow our [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

---

**You got this!** If you get stuck, ask questions in issues. Maintainers are here to help.
