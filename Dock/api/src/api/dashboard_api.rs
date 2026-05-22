use crate::models::dashboard::RittypePiechart;
use crate::service::dashboard_service;
use crate::state::AppState;
use axum::{Json, extract::State, http::StatusCode};

pub async fn rittype_piechart_handler(
    State(state): State<AppState>,
) -> Result<(StatusCode, Json<Vec<RittypePiechart>>), StatusCode> {
    let result = dashboard_service::get_rittype_piechart(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok((StatusCode::OK, Json(result)))
}
