use axum::Router;

pub mod users;

pub fn router() -> Router {
    Router::new()
        .route("/", axum::routing::get(root))
        .route("/users", axum::routing::post(users::create_user))
}

// basic handler that responds with a static string
async fn root() -> &'static str {
    "Hello, World!"
}
