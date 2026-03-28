use crate::models::{CreateLeverancier, LeverancierResponse, UpdateLeverancier, leverancier};
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
    let leverancier = leverancier_service::create_leverancier(
        &state.db,
        payload.leverancier_id,
        payload.leverancier_naam,
        payload.transporteur,
        payload.ppu,
        payload.account_id,
    )
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response = LeverancierResponse {
        leverancier_id: leverancier.leverancier_id,
        leverancier_naam: leverancier.leverancier_naam,
        transporteur: leverancier.transporteur,
        ppu: leverancier.ppu,
        account_id: leverancier.account_id,
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
            ppu: l.ppu,
            account_id: l.account_id,
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
        ppu: leverancier.ppu,
        account_id: leverancier.account_id,
    }))
}

pub async fn delete_leverancier(
    State(state): State<AppState>,
    Path(leverancier_id): Path<String>,
) -> Result<StatusCode, StatusCode> {
    let result = leverancier_service::delete_leverancier(&state.db, leverancier_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if result.rows_affected == 0 {
        return Err(StatusCode::NOT_FOUND);
    }

    Ok(StatusCode::OK)
}

pub async fn update_leverancier(
    State(state): State<AppState>,
    Path(leverancier_id): Path<String>,
    Json(payload): Json<UpdateLeverancier>,
) -> Result<(StatusCode, Json<LeverancierResponse>), StatusCode> {
    let updated = leverancier_service::update_leverancier(
        &state.db,
        leverancier_id,
        payload.leverancier_naam,
        payload.transporteur,
        payload.ppu,
        payload.account_id,
    )
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response = LeverancierResponse {
        leverancier_id: updated.leverancier_id,
        leverancier_naam: updated.leverancier_naam,
        transporteur: updated.transporteur,
        ppu: updated.ppu,
        account_id: updated.account_id,
    };

    Ok((StatusCode::OK, Json(response)))
}
