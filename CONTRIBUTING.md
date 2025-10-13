# Contributing to Vanilla Verse

Welcome to Open Source! 🎉 This project is part of Hacktoberfest 2025. Here’s how you can contribute:

# How to Contribute Step by Step

Welcome! Follow these steps to contribute to Vanilla Verse:

## 1. Fork the Repository
Click "Fork" at the top right of this repo to create your own copy.

## 2. Clone Your Fork
Copy your fork’s URL and run:
```sh
git clone https://github.com/<your-username>/vanilla-verse.git
```

## 3. Make Changes
Edit files or add new features as needed.

## 4. Stage Your Changes
Add your changes to git:
```sh
git add .
```

## 5. Commit Your Changes
Write a clear commit message:
```sh
git commit -m "Describe your changes"
```

## 6. Push to Your Fork
Send your changes to GitHub:
```sh
git push origin main
```

## 7. Open a Pull Request
Go to your fork on GitHub and click "New Pull Request".

## 8. Reference an Issue
In your PR description, mention the related issue (e.g., `Closes #12`).

## 9. Review and Collaborate
Check other issues/PRs, review, or help if possible.

---

Thank you for contributing! This project is beginner-friendly and follows an Issue → Assign → PR workflow. For more details, see the sections below on code style, reporting issues, and our Code of Conduct.



## Ways to contribute
- Pick a project from the hub (`index.html`) and open its folder in `projects/vanilla-verse`.
- Read the local `README.md` and `main.js` of projects for TODO markers.
- Open an issue to ask questions or propose a change.

## Development setup
1. Use VS Code with the Live Server extension (recommended) or any static HTTP server.
2. Open `index.html` and ensure links to projects work.
3. Make small, focused changes.

## Commit and PR guidelines
- Use meaningful commit messages.
- Title PRs clearly (e.g., "Snake: Add keyboard controls" or "Todo: Persist to localStorage").
- Link related issues, and check the "good first issue" label when appropriate.
- Ensure HTML/JS syntax passes basic validation (no console errors on load).

### Issue → Assign → PR flow (enforced)

To keep work organized and make it simple for maintainers to triage contributions we follow this flow and enforce it via a repository check:

1. Create an issue describing the change you want to make. Use the provided issue templates when appropriate. Alternatively, get alloted in an existing issue. 
2. A maintainer (or you, if given permission) assigns the issue to someone. The assignment signals ownership and helps avoid duplicate work.
3. Open a pull request that references the assigned issue in the PR body (for example: `Closes #12`, `Fixes #12`, or include `#12` somewhere in the PR description).

Our CI includes a check that requires PRs to reference an existing issue that is already assigned. If you open a PR without a referenced assigned issue, the check will fail and a maintainer will ask you to link/assign the issue first.

Why this helps:
- Prevents duplicated effort (two people solving the same item at once).
- Makes it clear who owns the change and who to ask for review.
- Keeps the issue tracker meaningful (issues move to closed automatically when referenced with `Closes #N`).

Examples (PR body):

```
Closes #12

Add keyboard controls to the Snake game. This PR implements arrow keys and prevents reverse-direction input.
```

If you're a new contributor and there are no maintainers available to assign, open the issue and add a comment asking for assignment — maintainers will triage and assign as soon as they can.

## Code style
- Vanilla JS only. No frameworks, no bundlers.
- Keep modules small and focused.
- Favor semantic HTML and accessible markup.
- Use `assets/styles.css` tokens and utility classes where possible to keep visual consistency.

## Reporting issues
Please include:
- What you expected vs what happened
- Steps to reproduce
- Screenshots or code snippets if helpful

## Code of Conduct
By participating, you agree to abide by our `CODE_OF_CONDUCT.md`.
