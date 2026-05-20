use dotenvy::dotenv;
use migration::MigratorTrait;
use std::net::SocketAddr;

mod api;
mod db;
mod errors;
mod models;
mod service;
mod state;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    dotenv().ok();

    let db_secret: String = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    // Connect to database at startup
    let db = db::connect(db_secret)
        .await
        .expect("Failed to connect to database");

    //migration up
    let _ = migration::Migrator::up(&db, None).await;

    //seed admin account if not exist
    let _ = crate::service::account_service::seed_admin(&db).await;

    // jwt secret
    let jwt_secret = std::env::var("JWT_SECRET").expect("JWT_SECRET must be set");

    //db state
    let app_state = state::AppState { db, jwt_secret };

    // Create router with state
    let app = api::router().with_state(app_state);

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
