use crate::models::{CreateToegestanedock, ToegestanedockResponse};
use crate::service::{jwt_service, toegestanedock_service};
use crate::state::AppState;
use axum::{
    Json,
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
};

pub async fn create_toegestanedock(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateToegestanedock>,
) -> Result<(StatusCode, Json<ToegestanedockResponse>), StatusCode> {
    jwt_service::require_role(&headers, &state.jwt_secret, &["admin"][..])?;

    let record = toegestanedock_service::assign(&state.db, payload.dock_id, payload.rit_type)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response = ToegestanedockResponse {
        dock_id: record.dock_id,
        rit_type: record.rit_type,
    };

    Ok((StatusCode::CREATED, Json(response)))
}

pub async fn find_all(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<(StatusCode, Json<Vec<ToegestanedockResponse>>), StatusCode> {
    jwt_service::require_role(&headers, &state.jwt_secret, &["admin"][..])?;

    let records = toegestanedock_service::find_all(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response: Vec<ToegestanedockResponse> = records
        .into_iter()
        .map(|r| ToegestanedockResponse {
            dock_id: r.dock_id,
            rit_type: r.rit_type,
        })
        .collect();

    Ok((StatusCode::OK, Json(response)))
}

pub async fn delete_toegestanedock(
    State(state): State<AppState>,
    Path((dock_nmr, rit_type)): Path<(i32, i32)>,
    headers: HeaderMap,
) -> Result<(StatusCode, Json<ToegestanedockResponse>), StatusCode> {
    jwt_service::require_role(&headers, &state.jwt_secret, &["admin"][..])?;

    // You might want to fetch the record before deletion to return the data
    let found = toegestanedock_service::find_all(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .into_iter()
        .find(|item| item.dock_id == dock_nmr && item.rit_type == rit_type);

    if found.is_none() {
        return Err(StatusCode::NOT_FOUND);
    }

    toegestanedock_service::unassign(&state.db, dock_nmr, rit_type)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let found = found.unwrap();
    Ok((
        StatusCode::OK,
        Json(ToegestanedockResponse {
            dock_id: found.dock_id,
            rit_type: found.rit_type,
        }),
    ))
}
