use axum::Router;

pub mod leveranciers;

pub fn router() -> Router {
    Router::new()
        .route("/", axum::routing::get(root))
        .route("/users", axum::routing::post(users::create_user))
        .route("/add", axum::routing::get(add))
}

// basic handler that responds with a static string
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
