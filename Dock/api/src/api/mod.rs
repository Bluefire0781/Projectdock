use crate::state::AppState;
use axum::{Router, routing::get, routing::post};
use tower_http::cors::{Any, CorsLayer};

pub mod leverancier_api;
pub mod users;

pub fn router() -> Router<AppState> {
    let cors = CorsLayer::new()
        .allow_origin(Any) // allow localhost:3000
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .route("/", get(root))
        .route("/users", post(users::create_user))
        .route("/add", get(add))
        .route("/leveranciers", post(leverancier_api::create_leverancier))
        .route("/leveranciers", get(leverancier_api::find_all))
        .layer(cors)
}

async fn root() -> &'static str {
    "Hello, World!"
}

async fn add() -> String {
    (4 + 4).to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_add() {
        let result = add().await;
        assert_eq!(result, "8");
    }
}
