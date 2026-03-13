use std::net::SocketAddr;

mod api;
mod models;
mod service;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let app = api::router();

    let port: u16 = std::env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse()
        .expect("PORT must be a valid number");

    let addr = SocketAddr::from(([0, 0, 0, 0], port));

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .unwrap_or_else(|e| panic!("failed to bind {}: {}", addr, e));

    if let Err(e) = axum::serve(listener, app).await {
        eprintln!("server error: {e}");
    }
}
