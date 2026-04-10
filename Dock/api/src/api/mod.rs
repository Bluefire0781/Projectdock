use crate::state::AppState;
use axum::{
    Router,
    http::{HeaderMap, HeaderValue, Method, StatusCode, header},
    response::IntoResponse,
    routing::{delete, get, patch, post},
};
use tower_http::cors::CorsLayer;

pub mod account_api;
pub mod leverancier_api;
pub mod users;

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
        .route("/", get(root))
        .route("/users", post(users::create_user))
        .route("/add", get(add))
        //login
        .route("/login", post(account_api::log_in))
        .route("/me", get(account_api::me))
        .route("/logout", post(logout))
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

pub async fn logout() -> impl IntoResponse {
    let mut headers = HeaderMap::new();

    // Expire cookie immediately
    headers.insert(
        header::SET_COOKIE,
        HeaderValue::from_static("token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax"),
    );

    (StatusCode::OK, headers)
}
