use crate::models::beschikbaarheid::{
    BeschikbaarheidResponse, DockAvailabilityResponse, SlotResponse,
};
use crate::service::{beschikbaarheid_service, jwt_service, rit_service};
use crate::state::AppState;
use axum::{
    Json,
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
};

pub async fn get_beschikbaarheid(
    State(state): State<AppState>,
    Path(id): Path<i32>,
    headers: HeaderMap,
) -> Result<(StatusCode, Json<BeschikbaarheidResponse>), StatusCode> {
    let claims = jwt_service::require_role(&headers, &state.jwt_secret, &["admin", "user"][..])?;

    let rit = rit_service::find_by_one(&state.db, id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    let leverancier_row = rit_service::get_leverancier_for_rit(&state.db, &rit)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;

    if claims.role != "admin" && leverancier_row.account_id != claims.sub {
        return Err(StatusCode::FORBIDDEN);
    }

    let beschikbaarheid =
        beschikbaarheid_service::get_beschikbaarheid_voor_rit(&state.db, &rit, &leverancier_row)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response = BeschikbaarheidResponse {
        rit_id: rit.id,
        datum: beschikbaarheid.datum,
        duration_minutes: beschikbaarheid.duration_minutes,
        docks: beschikbaarheid
            .docks
            .into_iter()
            .map(|d| DockAvailabilityResponse {
                dock_id: d.dock_id,
                slots: d
                    .slots
                    .into_iter()
                    .map(|s| SlotResponse {
                        start: s.start,
                        end: s.end,
                        available: s.available,
                    })
                    .collect(),
            })
            .collect(),
    };

    Ok((StatusCode::OK, Json(response)))
}
