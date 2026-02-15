# Commit Message Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/).

## Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style (formatting, semicolons, etc)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **build**: Build system or dependencies
- **ci**: CI/CD changes
- **chore**: Maintenance tasks
- **revert**: Revert previous commit

## Examples

### Simple commit

```bash
git commit -m "feat: add user authentication module"
```

### With scope

```bash
git commit -m "fix(api): resolve database connection timeout"
```

### With body

```bash
git commit -m "feat: add vendor performance tracking

- Add vendor_performance_metrics table
- Calculate on-time completion rate
- Track quality ratings per project"
```

### Breaking change

```bash
git commit -m "feat!: change API authentication to JWT

BREAKING CHANGE: Session-based auth removed. All clients must use JWT tokens."
```

## Rules

- Subject line max 100 characters
- Use imperative mood ("add" not "added" or "adds")
- No period at the end of subject
- Separate subject from body with blank line
- Wrap body at 72 characters

## Scope Examples

- `api`: Backend API changes
- `web`: Frontend web app changes
- `db`: Database changes
- `docker`: Docker/infrastructure changes
- `docs`: Documentation
- `deps`: Dependency updates

## Invalid Examples ❌

```bash
git commit -m "fixed bug"              # Missing type
git commit -m "Add new feature."       # Period at end
git commit -m "FEAT: new feature"      # Wrong case
git commit -m "updated files"          # Not imperative mood
```

## Valid Examples ✅

```bash
git commit -m "feat: add project dashboard"
git commit -m "fix(api): resolve transaction calculation error"
git commit -m "docs: update API documentation"
git commit -m "chore(deps): upgrade nestjs to v11"
git commit -m "refactor: simplify vendor query logic"
```
