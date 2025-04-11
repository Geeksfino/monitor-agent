FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash

# Add Bun to PATH
ENV PATH="/root/.bun/bin:${PATH}"

# Copy project files
COPY . .

# Set up environment
RUN bun setup:env

# Build knowledge base (if not already built)
RUN if [ ! -f kb.tar.gz ]; then bun run kb:use-samples && bun run kb:package; fi

# Expose the default port
EXPOSE 3000

# Command to run the application
CMD ["bun", "start"]
