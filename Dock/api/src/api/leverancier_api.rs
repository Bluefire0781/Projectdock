use crate::models::{CreateLeverancier, LeverancierResponse};
use crate::service::leverancier_service;
use crate::state::AppState;
use axum::{Json, extract::State, http::StatusCode};

pub async fn create_leverancier(
    State(state): State<AppState>,
    Json(payload): Json<CreateLeverancier>,
) -> Result<(StatusCode, Json<LeverancierResponse>), StatusCode> {
    let role = payload.role.unwrap_or_else(|| "user".to_string());
    let leverancier = leverancier_service::create_leverancier(
        &state.db,
        payload.leverancier_nmr,
        payload.username,
        payload.password,
        payload.email,
        payload.ppu,
        Some(role),
    )
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response = LeverancierResponse {
        leverancier_id: leverancier.leverancier_id,
        username: leverancier.username,
        email: leverancier.email,
        ppu: leverancier.ppu,
        role: leverancier.role,
    };

    Ok((StatusCode::CREATED, Json(response)))
}

pub async fn find_all(
    State(state): State<AppState>,
) -> Result<(StatusCode, Json<Vec<LeverancierResponse>>), StatusCode> {
    let leveranciers = leverancier_service::find_all(&state.db)
        .await
        .map_err(|e| {
            eprintln!("DB ERROR: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let response: Vec<LeverancierResponse> = leveranciers
        .into_iter()
        .map(|l| LeverancierResponse {
            leverancier_id: l.leverancier_id,
            username: l.username,
            email: l.email,
            ppu: l.ppu,
            role: l.role,
        })
        .collect();

    Ok((StatusCode::OK, Json(response)))
}
