# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within AniVerse, please responsibly disclose it to the repository maintainers rather than opening a public issue.

### Security Architecture

- **Row Level Security (RLS)**: Enforced directly at the PostgreSQL layer for all tables. Users cannot read, modify, or delete data belonging to other users.
- **SSR Authentication**: Cookies are managed securely via Supabase SSR with `httpOnly`, `secure`, and `sameSite` flags.
- **Rate Limiting**: Distributed rate limiting guards write endpoints against spam and brute-force attempts.
- **CSRF & Origin Verification**: All state-modifying requests verify origin integrity.
- **Safe JSON-LD**: Escaped against XSS injection vectors.
