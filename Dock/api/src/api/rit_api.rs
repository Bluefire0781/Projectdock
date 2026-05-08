use crate::models::rit::{CreateRit, RitResponse, RitResponsewithaf, UpdateRit};
use crate::service::{jwt_service, rit_service};
use crate::state::AppState;
use axum::{
    Json,
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
};

pub async fn create_rit(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateRit>,
) -> Result<(StatusCode, Json<RitResponse>), StatusCode> {
    jwt_service::require_role(&headers, &state.jwt_secret, &["admin"][..])?;

    let rit = rit_service::create_rit(
        &state.db,
        payload.rit_id,
        payload.leverancier_nmr,
        payload.pellet_tot,
        payload.rit_type,
        payload.datum,
    )
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response = RitResponse {
        id: rit.id,
        rit_id: rit.rit_id,
        leverancier_nmr: rit.leverancier_nmr,
        pellet_tot: rit.pellet_tot,
        rit_type: rit.rit_type,
        datum: rit.datum,
    };

    Ok((StatusCode::CREATED, Json(response)))
}

pub async fn find_all(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<(StatusCode, Json<Vec<RitResponsewithaf>>), StatusCode> {
    jwt_service::require_role(&headers, &state.jwt_secret, &["admin"][..])?;

    let rows = rit_service::find_all(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response: Vec<RitResponsewithaf> = rows
        .into_iter()
        .map(|(r, afspraken)| {
            let afspraak_starttijd = afspraken.get(0).map(|a| a.starttijd.clone()); // clone because it's a String

            RitResponsewithaf {
                id: r.id,
                rit_id: r.rit_id,
                leverancier_nmr: r.leverancier_nmr,
                pellet_tot: r.pellet_tot,
                rit_type: r.rit_type,
                datum: r.datum,
                afspraak_starttijd,
            }
        })
        .collect();

    Ok((StatusCode::OK, Json(response)))
}

pub async fn update_rit(
    State(state): State<AppState>,
    Path(id): Path<i32>,
    headers: HeaderMap,
    Json(payload): Json<UpdateRit>,
) -> Result<(StatusCode, Json<RitResponse>), StatusCode> {
    jwt_service::require_role(&headers, &state.jwt_secret, &["admin"][..])?;

    let updated = rit_service::update_rit(
        &state.db,
        id,
        payload.rit_id,
        payload.leverancier_nmr,
        payload.pellet_tot,
        payload.rit_type,
        payload.datum,
    )
    .await
    .map_err(|e| match e {
        sea_orm::DbErr::RecordNotFound(_) => StatusCode::NOT_FOUND,
        _ => StatusCode::INTERNAL_SERVER_ERROR,
    })?;

    let response = RitResponse {
        id: updated.id,
        rit_id: updated.rit_id,
        leverancier_nmr: updated.leverancier_nmr,
        pellet_tot: updated.pellet_tot,
        rit_type: updated.rit_type,
        datum: updated.datum,
    };

    Ok((StatusCode::OK, Json(response)))
}

pub async fn delete_rit(
    State(state): State<AppState>,
    Path(id): Path<i32>,
    headers: HeaderMap,
) -> Result<(StatusCode, Json<RitResponse>), StatusCode> {
    jwt_service::require_role(&headers, &state.jwt_secret, &["admin"][..])?;

    let rit = rit_service::find_by_one(&state.db, id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    rit_service::delete_rit(&state.db, id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok((
        StatusCode::OK,
        Json(RitResponse {
            id: rit.id,
            rit_id: rit.rit_id,
            leverancier_nmr: rit.leverancier_nmr,
            pellet_tot: rit.pellet_tot,
            rit_type: rit.rit_type,
            datum: rit.datum,
        }),
    ))
}
