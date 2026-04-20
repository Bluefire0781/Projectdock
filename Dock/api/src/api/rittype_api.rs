use crate::models::{CreateRitType, RitTypeResponse, UpdateRitType};
use crate::service::{jwt_service, rittype_service};
use crate::state::AppState;
use axum::{
    Json,
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
};

pub async fn create_rittype(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateRitType>,
) -> Result<(StatusCode, Json<RitTypeResponse>), StatusCode> {
    jwt_service::require_role(&headers, &state.jwt_secret, &["admin"][..])?;

    let rittype =
        rittype_service::create_rittype(&state.db, payload.rittypeid, payload.description)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response = RitTypeResponse {
        id: rittype.id,
        rittypeid: rittype.rittypeid,
        description: rittype.description,
    };

    Ok((StatusCode::CREATED, Json(response)))
}

pub async fn find_all(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<(StatusCode, Json<Vec<RitTypeResponse>>), StatusCode> {
    jwt_service::require_role(&headers, &state.jwt_secret, &["admin"][..])?;

    let rittypes = rittype_service::find_all(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response: Vec<RitTypeResponse> = rittypes
        .into_iter()
        .map(|r| RitTypeResponse {
            id: r.id,
            rittypeid: r.rittypeid,
            description: r.description,
        })
        .collect();

    Ok((StatusCode::OK, Json(response)))
}

pub async fn update_rittype(
    State(state): State<AppState>,
    Path(id): Path<i32>,
    headers: HeaderMap,
    Json(payload): Json<UpdateRitType>,
) -> Result<(StatusCode, Json<RitTypeResponse>), StatusCode> {
    jwt_service::require_role(&headers, &state.jwt_secret, &["admin"][..])?;

    let updated = rittype_service::update_rittype(&state.db, id, payload.description)
        .await
        .map_err(|e| match e {
            sea_orm::DbErr::RecordNotFound(_) => StatusCode::NOT_FOUND,
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        })?;

    let response = RitTypeResponse {
        id: updated.id,
        rittypeid: updated.rittypeid,
        description: updated.description,
    };

    Ok((StatusCode::OK, Json(response)))
}

pub async fn delete_rittype(
    State(state): State<AppState>,
    Path(id): Path<i32>,
    headers: HeaderMap,
) -> Result<(StatusCode, Json<RitTypeResponse>), StatusCode> {
    jwt_service::require_role(&headers, &state.jwt_secret, &["admin"][..])?;

    let rittype = rittype_service::find_by_one(&state.db, id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    rittype_service::delete_rittype(&state.db, id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok((
        StatusCode::OK,
        Json(RitTypeResponse {
            id: rittype.id,
            rittypeid: rittype.rittypeid,
            description: rittype.description,
        }),
    ))
}
