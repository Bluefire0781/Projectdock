use crate::models::leverancier;
use argon2::{
    Argon2,
    password_hash::{PasswordHasher, SaltString, rand_core::OsRng},
};
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, DeleteResult, EntityTrait, QueryFilter, Set,
};

// Helper function to hash password
fn hash_password(password: &str) -> Result<String, argon2::password_hash::Error> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();

    Ok(argon2
        .hash_password(password.as_bytes(), &salt)? // ← Same as docs
        .to_string()) // ← Same as docs
}

pub async fn create_leverancier(
    db: &DatabaseConnection, // Accept connection as parameter
    leverancier_id: String,
    leverancier_naam: Option<String>,
    transporteur: Option<String>,
    username: String,
    password: String,
    email: Option<String>,
    ppu: i64,
    role: Option<String>,
) -> Result<leverancier::Model, sea_orm::DbErr> {
    let hashed_password =
        hash_password(&password).map_err(|e| sea_orm::DbErr::Custom(e.to_string()))?;

    let new_leverancier = leverancier::ActiveModel {
        leverancier_id: Set(leverancier_id),
        leverancier_naam: Set(leverancier_naam),
        transporteur: Set(transporteur),
        username: Set(username),
        password: Set(hashed_password),
        email: Set(email),
        ppu: Set(ppu),
        role: Set(role),
        ..Default::default()
    };

    new_leverancier.insert(db).await // Use the passed connection
}

pub async fn find_all(db: &DatabaseConnection) -> Result<Vec<leverancier::Model>, sea_orm::DbErr> {
    let leveranciers = leverancier::Entity::find().all(db).await?;

    Ok(leveranciers)
}

pub async fn find_by_one(
    db: &DatabaseConnection,
    code: &str,
) -> Result<Option<leverancier::Model>, sea_orm::DbErr> {
    leverancier::Entity::find()
        .filter(leverancier::Column::LeverancierId.eq(code))
        .one(db)
        .await
}

pub async fn delete_leverancier(
    db: &DatabaseConnection,
    leverancier_id: String,
) -> Result<sea_orm::DeleteResult, sea_orm::DbErr> {
    let res: DeleteResult = leverancier::Entity::delete_many()
        .filter(leverancier::Column::LeverancierId.eq(leverancier_id))
        .exec(db)
        .await?;

    Ok(res)
}
