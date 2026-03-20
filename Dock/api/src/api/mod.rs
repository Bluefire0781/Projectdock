use crate::state::AppState;
use axum::{Router, routing::get, routing::post};

pub mod leverancier_api;
pub mod users;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(root))
        .route("/users", post(users::create_user))
        .route("/add", get(add))
        .route(
            "/create_leverancier",
            post(leverancier_api::create_leverancier),
        )
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
