# Stage 1: Build the Rust binary
FROM rust:latest AS builder

WORKDIR /app

# Copy entire workspace structure (including migration/)
COPY Cargo.toml Cargo.lock ./
COPY migration ./migration
COPY src ./src

# Build final binary
RUN cargo build --release

# Stage 2: Minimal runtime image
FROM debian:bookworm-slim

WORKDIR /app

# Install required runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libssl3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy the binary from the builder stage
COPY --from=builder /app/target/release/api ./api

# Expose port
EXPOSE 8080

# Run the binary
ENTRYPOINT ["./api"]
