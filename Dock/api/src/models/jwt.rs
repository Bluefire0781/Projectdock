use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: i32,         // account.id
    pub username: String, // account.username
    pub role: String,     // account.role
    pub exp: usize,       // expiration
    pub iat: usize,       // issued at
}

#[derive(Serialize, Deserialize)]
pub struct JWT {
    pub token: String,
}

#[derive(Serialize)]
pub struct MeResponse {
    pub id: i32,
    pub username: String,
    pub role: String,
}
