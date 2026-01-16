# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/devcontainers/javascript-node:24-bookworm

# Install Python and dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm@10.27.0

# Switch to node user
USER node

# Install Poetry for node user
RUN curl -sSL https://install.python-poetry.org | python3 - \
    && echo 'export PATH="/home/node/.local/bin:$PATH"' >> /home/node/.bashrc

# Set up pnpm store directory
ENV PNPM_HOME="/home/node/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN mkdir -p $PNPM_HOME

# Set working directory
WORKDIR /workspace

# Configure git to trust the workspace directory
RUN git config --global --add safe.directory /workspace
