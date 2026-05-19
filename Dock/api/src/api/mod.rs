use crate::state::AppState;
use axum::{
    Router,
    http::{HeaderValue, Method, header},
    routing::{delete, get, patch, post},
};
use std::env;
use tower_http::cors::CorsLayer;

pub mod account_api;
pub mod dock_api;
pub mod leverancier_api;
pub mod rit_api;
pub mod rittype_api;
pub mod toegestanedock_api;

pub fn router() -> Router<AppState> {
    let frontend_url = env::var("FRONTEND_URL").expect("FRONTEND_URL must be set");
    let cors = CorsLayer::new()
        .allow_origin(frontend_url.parse::<HeaderValue>().unwrap())
        .allow_credentials(true)
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PATCH,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION]);

    Router::new()
        .route("/api/login", post(account_api::log_in))
        .route("/api/me", get(account_api::me))
        .route("/api/logout", post(account_api::logout))
        .merge(
            Router::new()
                .route("/api/accounts", get(account_api::find_all))
                .route("/api/accounts", post(account_api::create_account))
                .route("/api/accounts/{id}", delete(account_api::delete_account))
                .route("/api/accounts/{id}", get(account_api::find_account))
                .route("/api/accounts/{id}", patch(account_api::update_account))
                .route(
                    "/api/leveranciers",
                    post(leverancier_api::create_leverancier),
                )
                .route("/api/leveranciers", get(leverancier_api::find_all))
                .route(
                    "/api/leveranciers/{leverancier_id}",
                    delete(leverancier_api::delete_leverancier),
                )
                .route(
                    "/api/leveranciers/{leverancier_id}",
                    get(leverancier_api::find_leverancier),
                )
                .route(
                    "/api/leveranciers/{leverancier_id}",
                    patch(leverancier_api::update_leverancier),
                )
                .route("/api/docks", post(dock_api::create_dock))
                .route("/api/docks", get(dock_api::find_all))
                .route("/api/docks/{id}", patch(dock_api::update_dock))
                .route("/api/docks/{id}", delete(dock_api::delete_dock))
                .route("/api/rittypes", post(rittype_api::create_rittype))
                .route("/api/rittypes", get(rittype_api::find_all))
                .route("/api/rittypes/{id}", patch(rittype_api::update_rittype))
                .route("/api/rittypes/{id}", delete(rittype_api::delete_rittype))
                .route(
                    "/api/toegestanedock",
                    post(toegestanedock_api::create_toegestanedock),
                )
                .route("/api/toegestanedock", get(toegestanedock_api::find_all))
                .route(
                    "/api/toegestanedock/{dock_nmr}/{rit_type}",
                    delete(toegestanedock_api::delete_toegestanedock),
                )
                .route("/api/rits", post(rit_api::create_rit))
                .route("/api/rits", get(rit_api::find_all))
                .route("/api/rits/{id}", patch(rit_api::update_rit))
                .route("/api/rits/{id}", delete(rit_api::delete_rit)),
        )
        .layer(cors)
}

// async fn add() -> String {
//     (4 + 4).to_string()
// }
//
// #[cfg(test)]
// mod tests {
//     use super::*;
//
//     #[tokio::test]
//     async fn test_add() {
//         let result = add().await;
//         assert_eq!(result, "8");
//     }
// }
