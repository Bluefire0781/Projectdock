use crate::models::dock::{CreateDock, DockResponse, UpdateDock};
use crate::service::{dock_service, jwt_service};
use crate::state::AppState;
use axum::{
    Json,
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
};

pub async fn create_dock(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateDock>,
) -> Result<(StatusCode, Json<DockResponse>), StatusCode> {
    jwt_service::require_role(&headers, &state.jwt_secret, &["admin"][..])?;

    let dock = dock_service::create_dock(&state.db, payload.status)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response = DockResponse {
        id: dock.dock_id,
        status: dock.status,
    };

    Ok((StatusCode::CREATED, Json(response)))
}

pub async fn find_all(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<(StatusCode, Json<Vec<DockResponse>>), StatusCode> {
    jwt_service::require_role(&headers, &state.jwt_secret, &["admin"][..])?;

    let docks = dock_service::find_all(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response: Vec<DockResponse> = docks
        .into_iter()
        .map(|d| DockResponse {
            id: d.dock_id,
            status: d.status,
        })
        .collect();

    Ok((StatusCode::OK, Json(response)))
}

pub async fn update_dock(
    State(state): State<AppState>,
    Path(id): Path<i32>,
    headers: HeaderMap,
    Json(payload): Json<UpdateDock>,
) -> Result<(StatusCode, Json<DockResponse>), StatusCode> {
    jwt_service::require_role(&headers, &state.jwt_secret, &["admin"][..])?;

    let updated = dock_service::update_dock(&state.db, id, payload.status)
        .await
        .map_err(|e| match e {
            sea_orm::DbErr::RecordNotFound(_) => StatusCode::NOT_FOUND,
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        })?;

    let response = DockResponse {
        id: updated.dock_id,
        status: updated.status,
    };

    Ok((StatusCode::OK, Json(response)))
}

pub async fn delete_dock(
    State(state): State<AppState>,
    Path(id): Path<i32>,
    headers: HeaderMap,
) -> Result<(StatusCode, Json<DockResponse>), StatusCode> {
    jwt_service::require_role(&headers, &state.jwt_secret, &["admin"][..])?;

    let dock = dock_service::find_by_one(&state.db, id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    dock_service::delete_dock(&state.db, id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok((
        StatusCode::OK,
        Json(DockResponse {
            id: dock.dock_id,
            status: dock.status,
        }),
    ))
}
