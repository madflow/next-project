# Turborepo Change Detection Action

This GitHub Action is used to detect if a Turborepo workspace has changed between commits, enabling selective deployments.

## Usage

```yaml
- id: has-changed
  uses: ./.github/actions/has-changed
  with:
    workspace_name: web
    from_ref: ${{ github.ref_name }}
    to_ref: HEAD^1
    force: ${{ github.event_name == 'workflow_dispatch' }}
```

## Inputs

| Name | Description | Required | Default |
|------|-------------|----------|---------|
| `workspace_name` | Name of Turborepo workspace | Yes | N/A |
| `from_ref` | Git ref to detect changes from | Yes | N/A |
| `to_ref` | Git ref to detect changes to | Yes | N/A |
| `cache_dir` | Custom cache directory for turborepo | No | `.turbo` |
| `turbo_version` | Turborepo version | No | `2.5.5` |
| `force` | Force the action to return true | No | `false` |

## Outputs

| Name | Description |
|------|-------------|
| `changed` | 'true' or 'false' value indicating whether the workspace changed |

## Example Deployment Workflow

```yaml
name: Continuous Deployment
on:
  push:
    branches: ['main']

jobs:
  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - id: has-changed
        uses: ./.github/actions/has-changed
        with:
          workspace_name: web
          from_ref: ${{ github.ref_name }}
          to_ref: HEAD^1

      - name: Deploy
        if: steps.has-changed.outputs.changed == 'true'
        run: |
          echo "Deploying web app..."
          # Add your deployment commands here
```