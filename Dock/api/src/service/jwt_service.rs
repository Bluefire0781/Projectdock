use axum::http::{HeaderMap, StatusCode, header};
use chrono::{Duration, Utc};
use jsonwebtoken::{DecodingKey, EncodingKey, Header, Validation, decode, encode};

use crate::errors::LoginError;
use crate::models::jwt::Claims;

pub fn create_jwt(
    account_id: i32,
    username: &str,
    role: &str,
    jwt_secret: &str,
) -> Result<String, LoginError> {
    let now = Utc::now();

    let claims = Claims {
        sub: account_id,
        username: username.to_string(),
        role: role.to_string(),
        iat: now.timestamp() as usize,
        exp: (now + Duration::hours(1)).timestamp() as usize,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(jwt_secret.as_bytes()),
    )
    .map_err(|_| LoginError::TokenCreationError)
}

pub fn me(headers: &HeaderMap, jwt_secret: &str) -> Result<Claims, StatusCode> {
    // Read Cookie header: "token=...; other=..."
    let cookie_header = headers
        .get(header::COOKIE)
        .and_then(|h| h.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    // Extract token cookie
    let token = cookie_header
        .split(';')
        .map(|c| c.trim())
        .find_map(|c| c.strip_prefix("token="))
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(jwt_secret.as_bytes()),
        &Validation::default(),
    )
    .map_err(|_| StatusCode::UNAUTHORIZED)?;

    Ok(token_data.claims)
}

pub fn require_role(
    headers: &HeaderMap,
    jwt_secret: &str,
    allowed: &[&str],
) -> Result<crate::models::jwt::Claims, StatusCode> {
    let claims = me(headers, jwt_secret)?;

    if allowed.contains(&claims.role.as_str()) {
        Ok(claims)
    } else {
        Err(StatusCode::FORBIDDEN)
    }
}
