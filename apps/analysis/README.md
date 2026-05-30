# Analysis Application

This directory contains the Python-based analysis application.

## Setup and Installation

This project uses [uv](https://docs.astral.sh/uv/) for dependency management and command execution.

Create a virtual environment and install dependencies:

```bash
uv sync --dev
```

### Using uv (Recommended)

1.  **Navigate to the application directory:**

    ```bash
    cd apps/analysis
    ```

2.  **Install dependencies and create a virtual environment:**

    `uv` will create `.venv` automatically and install all project dependencies.

    ```bash
    uv sync --dev
    ```

3.  **Activate the virtual environment (optional, `uv run` manages it for you):**

    If you need to activate the virtual environment manually, you can do so:

    ```bash
    source .venv/bin/activate
    ```

## Running the Application

To start the analysis application, use the following command:

```bash
uv run python -m analysis
```
