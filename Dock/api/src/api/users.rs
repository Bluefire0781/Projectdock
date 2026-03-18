use crate::models::{CreateUser, User};
use crate::service::user_service;
use axum::{Json, http::StatusCode};

pub async fn create_user(Json(payload): Json<CreateUser>) -> (StatusCode, Json<User>) {
    let user = user_service::create_user(payload.username).await;

    (StatusCode::CREATED, Json(user))
}

