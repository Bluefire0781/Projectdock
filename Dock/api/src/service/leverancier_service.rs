use crate::models::leverancier;
use argon2::{
    Argon2,
    password_hash::{PasswordHasher, SaltString, rand_core::OsRng},
};
use sea_orm::{ActiveModelTrait, DatabaseConnection, Set};

// function to hash password
fn hash_password(password: &str) -> Result<String, argon2::password_hash::Error> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();

    Ok(argon2
        .hash_password(password.as_bytes(), &salt)?
        .to_string())
}

// function to create leverancier
pub async fn create_leverancier(
    db: &DatabaseConnection, // DB
    leverancier_nmr: u64,
    username: String,
    password: String,
    email: Option<String>,
    ppu: u16,
    role: Option<String>,
) -> Result<leverancier::Model, sea_orm::DbErr> {
    // creating hashed password
    let hashed_password =
        hash_password(&password).map_err(|e| sea_orm::DbErr::Custom(e.to_string()))?;

    // creating leverancier class
    let new_leverancier = leverancier::ActiveModel {
        leverancier_id: Set(leverancier_nmr),
        username: Set(username),
        password: Set(hashed_password),
        email: Set(email),
        ppu: Set(ppu),
        role: Set(role),
        ..Default::default()
    };

    // inserting into db
    new_leverancier.insert(db).await // Use the passed connection
}
