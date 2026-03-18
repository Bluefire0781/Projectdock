use crate::models::{CreateLeverancier, User};
use crate::service::leverancier_service;
use axum::{Json, http::StatusCode};

pub async fn create_user(
    Json(payload): Json<CreateLeverancier>,
) -> (StatusCode, Json<Leverancier>) {
    let user = leverancier_service::create_leverancier(payload.username).await;

    (StatusCode::CREATED, Json(user))
}
