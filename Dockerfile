# Use a minimal Debian base image
FROM debian:12-slim

# Set working directory
WORKDIR /app

# Install system dependencies needed for Bun, Prisma, and potential native modules
RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    git \
    build-essential \
    gcc \
    g++ \
    cmake \
    openssl \
    libssl-dev \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Create directory for supervisor logs
RUN mkdir -p /var/log/supervisor

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash

# Add Bun to PATH
ENV PATH="/root/.bun/bin:${PATH}"

# Copy dependency definition files and prisma schema
COPY package.json bun.lockb* tsconfig.json ./
COPY prisma ./prisma/

# Install project dependencies using the lockfile for consistency
RUN bun install --frozen-lockfile

# Generate Prisma Client
RUN bunx prisma generate

# Apply migrations (production-safe, versioned)
RUN bunx prisma migrate deploy

# Copy the rest of the application code
COPY . .

# Copy supervisor configuration
COPY conf/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Run supervisord as the main command
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
