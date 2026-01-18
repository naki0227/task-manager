# Contributing to DreamCatcher

First off, thanks for taking the time to contribute! 🎉

DreamCatcher is an AI-powered task management OS designed to help users capture dreams and turn them into reality. We welcome contributions from everyone.

## 🛠️ Development Setup

We use Docker to ensure a consistent development environment.

1.  **Fork and Clone** the repository.
2.  **Create `.env`**:
    ```bash
    cp .env.example .env
    # Fill in your GEMINI_API_KEY (Required)
    ```
3.  **Start the App**:
    ```bash
    docker-compose up --build
    ```
    - Frontend: http://localhost:3000
    - Backend API: http://localhost:8000/docs

## 🐞 Bugs & Issues

If you find a bug, please create an issue with:
- A clear title and description.
- Steps to reproduce.
- Expected vs actual behavior.

## 🌟 Good First Issues

If you're new to the project, look for issues labeled `good first issue`. These are beginner-friendly tasks perfect for getting started. Examples might include:
- Fixing typos in documentation.
- Adding simple unit tests.
- Improving UI components (accessibility, styling).
- Adding new "Quick Launch" commands (Mac only).

## 🔀 Pull Requests

1.  Create a new branch: `git checkout -b feature/my-new-feature`
2.  Commit your changes: `git commit -m 'feat: Add some feature'`
3.  Push to the branch: `git push origin feature/my-new-feature`
4.  Submit a pull request!

## 📜 License

By contributing, you agree that your contributions will be licensed under its MIT License.
