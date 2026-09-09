# Mapeta GitHub Workflows

This directory contains the automated GitHub Actions workflows for Mapeta:

- **`ci.yml`**: Mandatory build and verification gate triggered on every push and pull request targeting `master`. It runs linting, full typechecking (including tests), the test suite (against in-memory SQLite), and production bundling on Node.js 22 LTS (`ubuntu-latest`).
- **`apk.yml`**: On-demand Android APK build triggered manually via `workflow_dispatch`. It prepares Java 17 and Android SDK build tools, compiles `mapeta-debug.apk`, and attaches it as a downloadable artifact without taxing routine code pushes.

Local pre-commit validation is enforced via Husky hooks (`.husky/pre-commit`), while these GitHub Actions serve as the authoritative remote enforcement gate.
