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

pub async fn update_leverancier(
    db: &DatabaseConnection,
    leverancier_id: String,
    leverancier_naam: Option<String>,
    transporteur: Option<String>,
    email: Option<String>,
    ppu: Option<i64>,
) -> Result<leverancier::Model, sea_orm::DbErr> {
    let existing =
        find_by_one(db, &leverancier_id)
            .await?
            .ok_or(sea_orm::DbErr::RecordNotFound(
                "Leverancier not found".to_string(),
            ))?;

    // Convert to ActiveModel
    let mut active_model: leverancier::ActiveModel = existing.into();

    if let Some(naam) = leverancier_naam {
        active_model.leverancier_naam = Set(Some(naam));
    }

    if let Some(transporteur_val) = transporteur {
        active_model.transporteur = Set(Some(transporteur_val));
    }

    if let Some(email_val) = email {
        active_model.email = Set(Some(email_val));
    }

    if let Some(ppu_val) = ppu {
        active_model.ppu = Set(ppu_val);
    }

    // Update and return
    active_model.update(db).await
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

pub async fn find_by_one(
    db: &DatabaseConnection,
    leverancier: &str,
) -> Result<Option<leverancier::Model>, sea_orm::DbErr> {
    leverancier::Entity::find()
        .filter(leverancier::Column::LeverancierId.eq(leverancier))
        .one(db)
        .await
}
