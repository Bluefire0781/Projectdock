use crate::models::{AccountResponse, CreateAccount, UpdateAccount};
use crate::service::account_service;
use crate::state::AppState;
use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
};

pub async fn create_account(
    State(state): State<AppState>,
    Json(payload): Json<CreateAccount>,
) -> Result<(StatusCode, Json<AccountResponse>), StatusCode> {
    let role = payload.role.unwrap_or_else(|| "user".to_string());
    let account = account_service::create_account(
        &state.db,
        payload.username,
        payload.password,
        payload.email,
        Some(role),
    )
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response = AccountResponse {
        id: account.id,
        username: account.username,
        email: account.email,
        role: account.role,
    };

    Ok((StatusCode::CREATED, Json(response)))
}

pub async fn find_all(
    State(state): State<AppState>,
) -> Result<(StatusCode, Json<Vec<AccountResponse>>), StatusCode> {
    let accounts = account_service::find_all(&state.db).await.map_err(|e| {
        eprintln!("DB ERROR: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let response: Vec<AccountResponse> = accounts
        .into_iter()
        .map(|a| AccountResponse {
            id: a.id,
            username: a.username,
            email: a.email,
            role: a.role,
        })
        .collect();

    Ok((StatusCode::OK, Json(response)))
}

pub async fn find_account(
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> Result<Json<AccountResponse>, StatusCode> {
    let account = account_service::find_one_account(&state.db, id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(AccountResponse {
        id: account.id,
        username: account.username,
        email: account.email,
        role: account.role,
    }))
}

pub async fn delete_account(
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> Result<(StatusCode, Json<AccountResponse>), StatusCode> {
    let account = account_service::find_one_account(&state.db, id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    account_service::delete_account(&state.db, id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok((
        StatusCode::OK,
        Json(AccountResponse {
            id: account.id,
            username: account.username,
            email: account.email,
            role: account.role,
        }),
    ))
}

pub async fn update_account(
    State(state): State<AppState>,
    Path(id): Path<i32>,
    Json(payload): Json<UpdateAccount>,
) -> Result<(StatusCode, Json<AccountResponse>), StatusCode> {
    let updated = account_service::update_account(&state.db, id, payload.username, payload.email)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response = AccountResponse {
        id: updated.id,
        username: updated.username,
        email: updated.email,
        role: updated.role,
    };

    Ok((StatusCode::OK, Json(response)))
}
