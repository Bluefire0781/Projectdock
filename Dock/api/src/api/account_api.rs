use crate::models::{AccountResponse, CreateAccount, Jwt, Login, MeResponse, UpdateAccount};
use crate::service::{account_service, jwt_service};
use crate::state::AppState;
use axum::{
    Json,
    extract::{Path, State},
    http::{HeaderMap, HeaderValue, StatusCode, header},
    response::IntoResponse,
};

//==============Admin===========//
//admin create account func
pub async fn create_account(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateAccount>,
) -> Result<(StatusCode, Json<AccountResponse>), StatusCode> {
    jwt_service::require_role(&headers, &state.jwt_secret, &["admin"][..])?;
    let role: String = payload.role.unwrap_or_else(|| "user".to_string());
    let account = account_service::create_account(
        &state.db,
        payload.username,
        payload.password,
        payload.email,
        role,
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

//admin find all func
pub async fn find_all(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<(StatusCode, Json<Vec<AccountResponse>>), StatusCode> {
    jwt_service::require_role(&headers, &state.jwt_secret, &["admin"][..])?;
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

//admin find account func
pub async fn find_account(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<i32>,
) -> Result<Json<AccountResponse>, StatusCode> {
    jwt_service::require_role(&headers, &state.jwt_secret, &["admin"][..])?;
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

//admin account delete func
pub async fn delete_account(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<i32>,
) -> Result<(StatusCode, Json<AccountResponse>), StatusCode> {
    jwt_service::require_role(&headers, &state.jwt_secret, &["admin"][..])?;

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

//admin account update func
pub async fn update_account(
    State(state): State<AppState>,
    Path(id): Path<i32>,
    headers: HeaderMap,
    Json(payload): Json<UpdateAccount>,
) -> Result<(StatusCode, Json<AccountResponse>), StatusCode> {
    jwt_service::require_role(&headers, &state.jwt_secret, &["admin"][..])?;
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

//=============ANY===========//
// Login functionaliteit
pub async fn log_in(
    State(state): State<AppState>,
    Json(payload): Json<Login>,
) -> Result<impl IntoResponse, StatusCode> {
    let result = account_service::log_in(
        &state.db,
        payload.username,
        payload.password,
        &state.jwt_secret,
    )
    .await;

    match result {
        Ok(token) => {
            // add Secure when using HTTPS in production
            let cookie = format!(
                "token={}; HttpOnly; Path=/; Max-Age={}; SameSite=Lax",
                token,
                60 * 60 * 24
            );

            let set_cookie =
                HeaderValue::from_str(&cookie).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            Ok((
                StatusCode::OK,
                [(header::SET_COOKIE, set_cookie)],
                Json(Jwt { token }),
            ))
        }
        Err(_) => Err(StatusCode::UNAUTHORIZED),
    }
}

//log out functionaliteit
pub async fn logout() -> impl IntoResponse {
    let mut headers = HeaderMap::new();

    // Expire cookie immediately
    headers.insert(
        header::SET_COOKIE,
        HeaderValue::from_static("token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax"),
    );

    (StatusCode::OK, headers)
}

// any account standard me func
pub async fn me(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<(StatusCode, Json<MeResponse>), StatusCode> {
    let claims = jwt_service::me(&headers, &state.jwt_secret)?;

    Ok((
        StatusCode::OK,
        Json(MeResponse {
            id: claims.sub,
            username: claims.username,
            role: claims.role,
        }),
    ))
}
