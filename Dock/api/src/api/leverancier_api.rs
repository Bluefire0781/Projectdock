use crate::models::{CreateLeverancier, leverancier};
use crate::service::leverancier_service;
use crate::state::AppState;
use axum::{Json, extract::State, http::StatusCode};

pub async fn create_leverancier(
    State(state): State<AppState>,
    Json(payload): Json<CreateLeverancier>,
) -> Result<(StatusCode, Json<leverancier::Model>), StatusCode> {
    let leverancier = leverancier_service::create_leverancier(
        &state.db,
        payload.leverancier_nmr,
        payload.username,
        payload.password,
        Some(payload.email),
        payload.ppu,
        Some(payload.role),
    )
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok((StatusCode::CREATED, Json(leverancier)))
}
