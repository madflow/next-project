# Analysis Application

This directory contains the Python-based analysis application.

## Setup and Installation

This project primarily uses [Poetry](https://python-poetry.org/) for dependency management. If you don't have Poetry installed, you can install it by following the instructions on their official website.

Create a virtual environment and install dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
poetry install
```

### Using Poetry (Recommended)

1.  **Navigate to the application directory:**

    ```bash
    cd apps/analysis
    ```

2.  **Install dependencies and create a virtual environment:**

    Poetry will automatically create a virtual environment and install all the project dependencies.

    ```bash
    poetry install
    ```

3.  **Activate the virtual environment (optional, Poetry manages it for you when running commands):**

    If you need to activate the virtual environment manually (e.g., for running scripts directly), you can do so:

    ```bash
    poetry shell
    ```

## Running the Application

To start the analysis application, use the following command:

```bash
poetry run python -m analysis
```
