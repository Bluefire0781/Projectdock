use crate::models::{CreateLeverancier, LeverancierResponse, UpdateLeverancier};
use crate::service::leverancier_service;
use crate::state::AppState;
use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
};

pub async fn create_leverancier(
    State(state): State<AppState>,
    Json(payload): Json<CreateLeverancier>,
) -> Result<(StatusCode, Json<LeverancierResponse>), StatusCode> {
    let role = payload.role.unwrap_or_else(|| "user".to_string());
    let leverancier = leverancier_service::create_leverancier(
        &state.db,
        payload.leverancier_id,
        payload.leverancier_naam,
        payload.transporteur,
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
        leverancier_naam: leverancier.leverancier_naam,
        transporteur: leverancier.transporteur,
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
            leverancier_naam: l.leverancier_naam,
            transporteur: l.transporteur,
            username: l.username,
            email: l.email,
            ppu: l.ppu,
            role: l.role,
        })
        .collect();

    Ok((StatusCode::OK, Json(response)))
}

pub async fn find_leverancier(
    State(state): State<AppState>,
    Path(leverancier_id): Path<String>,
) -> Result<Json<LeverancierResponse>, StatusCode> {
    let leverancier = leverancier_service::find_by_one(&state.db, &leverancier_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(LeverancierResponse {
        leverancier_id: leverancier.leverancier_id,
        leverancier_naam: leverancier.leverancier_naam,
        transporteur: leverancier.transporteur,
        username: leverancier.username,
        email: leverancier.email,
        ppu: leverancier.ppu,
        role: leverancier.role,
    }))
}

pub async fn delete_leverancier(
    State(state): State<AppState>,
    Path(leverancier_id): Path<String>,
) -> Result<(StatusCode, Json<LeverancierResponse>), StatusCode> {
    // First, fetch the leverancier before deleting (so we can return it)
    let leverancier = leverancier_service::find_by_one(&state.db, &leverancier_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    // Then delete it
    leverancier_service::delete_leverancier(&state.db, leverancier_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Return the deleted leverancier as response
    Ok((
        StatusCode::OK,
        Json(LeverancierResponse {
            leverancier_id: leverancier.leverancier_id,
            leverancier_naam: leverancier.leverancier_naam,
            transporteur: leverancier.transporteur,
            username: leverancier.username,
            email: leverancier.email,
            ppu: leverancier.ppu,
            role: leverancier.role,
        }),
    ))
}

pub async fn update_leverancier(
    State(state): State<AppState>,
    Path(leverancier_id): Path<String>,
    Json(payload): Json<UpdateLeverancier>,
) -> Result<(StatusCode, Json<LeverancierResponse>), StatusCode> {
    // Check if leverancier exists
    leverancier_service::find_by_one(&state.db, &leverancier_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    // Update the leverancier
    let updated = leverancier_service::update_leverancier(
        &state.db,
        leverancier_id,
        payload.leverancier_naam,
        payload.transporteur,
        payload.email,
        payload.ppu,
    )
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response = LeverancierResponse {
        leverancier_id: updated.leverancier_id,
        leverancier_naam: updated.leverancier_naam,
        transporteur: updated.transporteur,
        username: updated.username,
        email: updated.email,
        ppu: updated.ppu,
        role: updated.role,
    };

    Ok((StatusCode::OK, Json(response)))
}
