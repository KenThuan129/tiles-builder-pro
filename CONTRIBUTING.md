# Contributing

Thanks for considering a contribution to Tiles Match Tool. This is a side project — PRs are welcome, but please read the expectations below before opening one.

## Before you start

This project has **no SLA, no roadmap, and no guaranteed support**. It's a base framework released for others to fork and extend, not a maintained product. Please don't open issues asking for an ETA on a fix or feature — there isn't one.

If you need guaranteed stability or a specific feature on a timeline, **fork the repo** and make the changes there.

## How to contribute

### 🐛 Bug reports

Open an issue with:

- A short description of the bug
- Steps to reproduce it (a **minimal repro** — the smallest level/config that triggers it)
- What you expected vs. what happened
- Browser/OS if relevant

Issues without a repro are much less likely to get looked at.

### 🔧 Fixes

- Keep PRs **focused** — one fix per PR, no drive-by refactors bundled in.
- Reference the issue number in the PR description if one exists.
- Briefly explain *why* the change is correct, not just *what* changed.
- Make sure the app still builds and the affected workflow (builder / playtest / export) still works before submitting.

### ✨ Features

Please **open an issue first** to discuss scope before writing code. This avoids wasted effort on a PR that doesn't fit the project's direction. Useful things to include:

- The problem you're trying to solve
- A rough sketch of the approach
- Whether it touches the generator, the difficulty model, or the export formats — these are the most sensitive areas

### ❌ What not to open an issue for

- "When will you fix X?" — no ETA, see above.
- General usage questions better suited to discussion than an issue.
- Feature requests with no willingness to implement them — these may sit indefinitely.

## Code guidelines

- Match the existing code style rather than introducing a new one.
- Prefer small, readable functions over clever one-liners, especially in the difficulty/analytics model — the weights and formulas in [`README.md`](README.md) should stay traceable to the code.
- If you change the JSON or `.bytes` export shape, update the corresponding section of the README in the same PR.
- If you touch the generator (`Suggest Level`), test with a few different parameter combinations — edge cases (very low tile counts, high chain/ice %, max z-layers) are where it tends to break.

## Pull request checklist

- [ ] PR is focused on a single change
- [ ] Linked to a relevant issue (if applicable)
- [ ] README updated if behavior, exports, or workflows changed
- [ ] No unrelated formatting/reformatting noise in the diff

## License

By contributing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
