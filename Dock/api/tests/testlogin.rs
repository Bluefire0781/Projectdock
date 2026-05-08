use argon2::{
    Argon2,
    password_hash::{PasswordHasher, SaltString, rand_core::OsRng},
};
use axum::{
    body::Body,
    http::{Request, StatusCode, header},
};
use http_body_util::BodyExt;
use sea_orm::{ActiveModelTrait, Set};
use sea_orm::{ConnectionTrait, Database, DatabaseConnection};
use tower::ServiceExt; // oneshot

use migration::MigratorTrait;

use api as app;
use app::models::account;
use app::state::AppState;

async fn setup_test_db() -> DatabaseConnection {
    dotenvy::dotenv().ok();

    let url = std::env::var("TESTDB_URL").expect("TESTDB_URL must be set for integration tests");

    // Guard rail so you don’t accidentally run against prod/dev data
    assert!(
        url.contains("test") || url.contains("_test"),
        "Refusing to run tests: DATABASE_URL does not look like a test database: {url}"
    );

    let db = Database::connect(&url).await.expect("connect db");

    migration::Migrator::up(&db, None)
        .await
        .expect("run migrations");

    db
}

/// Cleanup between tests so they’re repeatable.
/// Replace table names with YOUR tables.
/// If you don't know the exact names, paste your migration that creates accounts.

async fn reset_db(db: &DatabaseConnection) {
    let sql = r#"
        TRUNCATE TABLE account RESTART IDENTITY CASCADE;
    "#;

    db.execute_unprepared(sql).await.expect("truncate");
}

/// Insert a user row that `account_service::log_in` will authenticate.
/// You MUST implement this to match your schema + hashing.
///
/// I can write this precisely if you paste:
/// - account_service::log_in
/// - your SeaORM Account entity (models)
async fn seed_user(db: &DatabaseConnection, username: &str, password: &str) {
    // 1) hash password (argon2)
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .expect("hash password")
        .to_string();

    // 2) insert account row
    let mut am = account::ActiveModel {
        ..Default::default()
    };

    // Adjust these setters to match your column names:
    am.username = Set(username.to_string());
    am.password = Set(password_hash); // OR am.password_hash = Set(password_hash);

    am.insert(db).await.expect("insert account");
}

#[tokio::test]
async fn login_success_sets_cookie_and_returns_token() {
    // Arrange
    let db = setup_test_db().await;
    reset_db(&db).await;
    seed_user(&db, "alice", "password123").await;

    let state = AppState {
        db: db.clone(),
        jwt_secret: "test_jwt_secret".to_string(),
    };

    let router = app::api::router().with_state(state);

    // Act
    let req = Request::builder()
        .method("POST")
        .uri("/login")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(
            r#"{"username":"alice","password":"password123"}"#,
        ))
        .unwrap();

    let res = router.oneshot(req).await.unwrap();

    // Assert
    assert_eq!(res.status(), StatusCode::OK);

    let set_cookie = res
        .headers()
        .get(header::SET_COOKIE)
        .expect("missing Set-Cookie")
        .to_str()
        .unwrap();

    assert!(set_cookie.starts_with("token="));
    assert!(set_cookie.contains("HttpOnly"));
    assert!(set_cookie.contains("Path=/"));
    assert!(set_cookie.contains("Max-Age="));
    assert!(set_cookie.contains("SameSite=Lax"));

    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();

    let token = v
        .get("token")
        .and_then(|t| t.as_str())
        .expect("missing token");
    assert!(!token.is_empty());
}

#[tokio::test]
async fn login_wrong_password_returns_401() {
    // Arrange
    let db = setup_test_db().await;

    reset_db(&db).await;

    seed_user(&db, "alice", "password123").await;

    let state = AppState {
        db: db.clone(),
        jwt_secret: "test_jwt_secret".to_string(),
    };

    let router = app::api::router().with_state(state);

    // Act
    let req = Request::builder()
        .method("POST")
        .uri("/login")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(r#"{"username":"alice","password":"wrong"}"#))
        .unwrap();

    let res = router.oneshot(req).await.unwrap();

    // Assert
    assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
}
