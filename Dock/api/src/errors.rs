use thiserror::Error;

#[derive(Debug, Error)]
pub enum LoginError {
    #[error("database error")]
    DatabaseError,
    #[error("invalid credentials")]
    InvalidCredentials,
    #[error("failed to create token")]
    TokenCreationError,
}
