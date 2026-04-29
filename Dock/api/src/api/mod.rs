use crate::state::AppState;
use axum::{
    Router,
    http::{HeaderValue, Method, header},
    routing::{delete, get, patch, post},
};
use tower_http::cors::CorsLayer;

pub mod account_api;
pub mod dock_api;
pub mod leverancier_api;
pub mod rit_api;
pub mod rittype_api;
pub mod toegestanedock_api;

pub fn router() -> Router<AppState> {
    let cors = CorsLayer::new()
        .allow_origin("http://localhost:3000".parse::<HeaderValue>().unwrap())
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
        .route("/login", post(account_api::log_in))
        .route("/me", get(account_api::me))
        .route("/logout", post(account_api::logout))
        .merge(
            Router::new()
                .route("/accounts", get(account_api::find_all))
                .route("/accounts", post(account_api::create_account))
                .route("/accounts/{id}", delete(account_api::delete_account))
                .route("/accounts/{id}", get(account_api::find_account))
                .route("/accounts/{id}", patch(account_api::update_account))
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
                .route("/docks", post(dock_api::create_dock))
                .route("/docks", get(dock_api::find_all))
                .route("/docks/{id}", patch(dock_api::update_dock))
                .route("/docks/{id}", delete(dock_api::delete_dock))
                .route("/rittypes", post(rittype_api::create_rittype))
                .route("/rittypes", get(rittype_api::find_all))
                .route("/rittypes/{id}", patch(rittype_api::update_rittype))
                .route("/rittypes/{id}", delete(rittype_api::delete_rittype))
                .route(
                    "/toegestanedock",
                    post(toegestanedock_api::create_toegestanedock),
                )
                .route("/toegestanedock", get(toegestanedock_api::find_all))
                .route(
                    "/toegestanedock/{dock_nmr}/{rit_type}",
                    delete(toegestanedock_api::delete_toegestanedock),
                )
                .route("/rits", post(rit_api::create_rit))
                .route("/rits", get(rit_api::find_all))
                .route("/rits/{id}", patch(rit_api::update_rit))
                .route("/rits/{id}", delete(rit_api::delete_rit)),
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
