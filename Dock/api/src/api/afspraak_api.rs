use crate::models::afspraak::{AfspraakResponse, CreateAfspraak, UpdateAfspraak};
use crate::service::{afspraak_service, jwt_service};
use crate::state::AppState;
use axum::{
    Json,
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
};

pub async fn create_afspraak(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateAfspraak>,
) -> Result<(StatusCode, Json<AfspraakResponse>), StatusCode> {
    jwt_service::require_role(&headers, &state.jwt_secret, &["admin"][..])?;

    let afspraak = afspraak_service::create_afspraak(
        &state.db,
        payload.rit_nmr,
        payload.dock_nmr,
        payload.starttijd,
        payload.eindtijd,
        payload.landing_type,
    )
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response = AfspraakResponse {
        afspraak_id: afspraak.afspraak_id,
        rit_nmr: afspraak.rit_nmr,
        dock_nmr: afspraak.dock_nmr,
        starttijd: afspraak.starttijd,
        eindtijd: afspraak.eindtijd,
        landing_type: afspraak.landing_type,
    };

    Ok((StatusCode::CREATED, Json(response)))
}

pub async fn find_all(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<(StatusCode, Json<Vec<AfspraakResponse>>), StatusCode> {
    jwt_service::require_role(&headers, &state.jwt_secret, &["admin"][..])?;

    let rows = afspraak_service::find_all(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response: Vec<AfspraakResponse> = rows
        .into_iter()
        .map(|a| AfspraakResponse {
            afspraak_id: a.afspraak_id,
            rit_nmr: a.rit_nmr,
            dock_nmr: a.dock_nmr,
            starttijd: a.starttijd,
            eindtijd: a.eindtijd,
            landing_type: a.landing_type,
        })
        .collect();

    Ok((StatusCode::OK, Json(response)))
}

pub async fn update_afspraak(
    State(state): State<AppState>,
    Path(id): Path<i32>,
    headers: HeaderMap,
    Json(payload): Json<UpdateAfspraak>,
) -> Result<(StatusCode, Json<AfspraakResponse>), StatusCode> {
    jwt_service::require_role(&headers, &state.jwt_secret, &["admin"][..])?;

    let updated = afspraak_service::update_afspraak(
        &state.db,
        id,
        payload.rit_nmr,
        payload.dock_nmr,
        payload.starttijd,
        payload.eindtijd,
        payload.landing_type,
    )
    .await
    .map_err(|e| match e {
        sea_orm::DbErr::RecordNotFound(_) => StatusCode::NOT_FOUND,
        _ => StatusCode::INTERNAL_SERVER_ERROR,
    })?;

    let response = AfspraakResponse {
        afspraak_id: updated.afspraak_id,
        rit_nmr: updated.rit_nmr,
        dock_nmr: updated.dock_nmr,
        starttijd: updated.starttijd,
        eindtijd: updated.eindtijd,
        landing_type: updated.landing_type,
    };

    Ok((StatusCode::OK, Json(response)))
}

pub async fn delete_afspraak(
    State(state): State<AppState>,
    Path(id): Path<i32>,
    headers: HeaderMap,
) -> Result<(StatusCode, Json<AfspraakResponse>), StatusCode> {
    jwt_service::require_role(&headers, &state.jwt_secret, &["admin"][..])?;

    let afspraak = afspraak_service::find_by_one(&state.db, id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    afspraak_service::delete_afspraak(&state.db, id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok((
        StatusCode::OK,
        Json(AfspraakResponse {
            afspraak_id: afspraak.afspraak_id,
            rit_nmr: afspraak.rit_nmr,
            dock_nmr: afspraak.dock_nmr,
            starttijd: afspraak.starttijd,
            eindtijd: afspraak.eindtijd,
            landing_type: afspraak.landing_type,
        }),
    ))
}
