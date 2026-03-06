# Stage 1: Build the Rust binary
FROM rust:latest AS builder

WORKDIR /app

# Copy Cargo files first for caching
COPY Cargo.toml Cargo.lock ./

# Dummy src to cache dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

# Copy real source
COPY src ./src

# Build final binary
RUN cargo build --release

# Stage 2: Minimal runtime image
FROM debian:bookworm-slim

WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/target/release/api ./api

# Expose port
EXPOSE 8080

# Run the binary
ENTRYPOINT ["./api"]
