use crate::state::AppState;
use axum::{
    Router,
    routing::{delete, get, patch, post},
};
use tower_http::cors::{Any, CorsLayer};

pub mod account_api;
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
        //account
        .route("/accounts", get(account_api::find_all))
        .route("/accounts", post(account_api::create_account))
        .route("/accounts/{id}", delete(account_api::delete_account))
        .route("/accounts/{id}", get(account_api::find_account))
        .route("/accounts/{id}", patch(account_api::update_account))
        //leverancier
        .route("/leveranciers", post(leverancier_api::create_leverancier))
        .route("/leveranciers", get(leverancier_api::find_all))
        .route(
            "/leveranciers/{leverancier_id}",
            delete(leverancier_api::delete_leverancier),
        )
        .route(
            "/leveranciers/{leverancier_id}",
            get(leverancier_api::find_leverancier),
        )
        .route(
            "/leveranciers/{leverancier_id}",
            patch(leverancier_api::update_leverancier),
        )
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
