# Contributing to AniVerse

Thank you for your interest in contributing to AniVerse!

## Development Workflow

1. Fork and clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```
4. Run development server:
   ```bash
   npm run dev
   ```

## Pull Request Guidelines

Before submitting a pull request, ensure all validation scripts pass:
```bash
npm run typecheck
npm run lint
npm test
```
