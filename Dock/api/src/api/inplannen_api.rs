use crate::models::afspraak::AfspraakResponse;
use crate::models::inplannen::InplannenRequest;
use crate::service::{afspraak_service, beschikbaarheid_service, jwt_service, rit_service};
use crate::state::AppState;
use axum::{
    Json,
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
};
use chrono::Duration;

pub async fn plan_rit_in(
    State(state): State<AppState>,
    Path(id): Path<i32>,
    headers: HeaderMap,
    Json(payload): Json<InplannenRequest>,
) -> Result<(StatusCode, Json<AfspraakResponse>), StatusCode> {
    let claims = jwt_service::require_role(&headers, &state.jwt_secret, &["admin", "user"][..])?;

    let rit = rit_service::find_by_one(&state.db, id)
        .await
        .map_err(|e| {
            eprintln!("plan_rit_in: find_by_one error: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .ok_or(StatusCode::NOT_FOUND)?;

    let leverancier_row = rit_service::get_leverancier_for_rit(&state.db, &rit)
        .await
        .map_err(|e| {
            eprintln!("plan_rit_in: get_leverancier_for_rit error: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .ok_or_else(|| {
            eprintln!(
                "plan_rit_in: no leverancier found for rit {} (leverancier_nmr {})",
                rit.id, rit.leverancier_nmr
            );
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    if claims.role != "admin" && leverancier_row.account_id != claims.sub {
        return Err(StatusCode::FORBIDDEN);
    }

    // Een rit kan maar 1 afspraak hebben (rit_nmr is uniek op afspraak)
    if afspraak_service::find_by_rit(&state.db, rit.id)
        .await
        .map_err(|e| {
            eprintln!("plan_rit_in: find_by_rit error: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .is_some()
    {
        return Err(StatusCode::CONFLICT);
    }

    let duration_minutes =
        beschikbaarheid_service::bereken_duur_minuten(rit.pellet_tot, leverancier_row.ppu);
    let eindtijd = payload.start + Duration::minutes(duration_minutes);

    let nog_vrij = beschikbaarheid_service::is_slot_nog_vrij(
        &state.db,
        payload.dock_id,
        payload.start,
        eindtijd,
    )
    .await
    .map_err(|e| {
        eprintln!("plan_rit_in: is_slot_nog_vrij error: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    if !nog_vrij {
        return Err(StatusCode::CONFLICT);
    }

    let afspraak = afspraak_service::create_afspraak(
        &state.db,
        rit.id,
        payload.dock_id,
        payload.start,
        eindtijd,
        payload.landing_type,
    )
    .await
    .map_err(|e| {
        eprintln!("plan_rit_in: create_afspraak error: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

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

