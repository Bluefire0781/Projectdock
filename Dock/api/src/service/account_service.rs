use crate::models::account;
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

pub async fn create_account(
    db: &DatabaseConnection,
    username: String,
    password: String,
    email: Option<String>,
    role: Option<String>,
) -> Result<account::Model, sea_orm::DbErr> {
    let hashed_password =
        hash_password(&password).map_err(|e| sea_orm::DbErr::Custom(e.to_string()))?;

    let new_account = account::ActiveModel {
        username: Set(username),
        password: Set(hashed_password),
        email: Set(email),
        role: Set(role),
        ..Default::default()
    };

    new_account.insert(db).await
}

pub async fn find_all(db: &DatabaseConnection) -> Result<Vec<account::Model>, sea_orm::DbErr> {
    let accounts = account::Entity::find().all(db).await?;

    Ok(accounts)
}

pub async fn delete_account(
    db: &DatabaseConnection,
    id: i32,
) -> Result<sea_orm::DeleteResult, sea_orm::DbErr> {
    let res: DeleteResult = account::Entity::delete_many()
        .filter(account::Column::Id.eq(id))
        .exec(db)
        .await?;

    Ok(res)
}

pub async fn find_one_account(
    db: &DatabaseConnection,
    id: i32,
) -> Result<Option<account::Model>, sea_orm::DbErr> {
    account::Entity::find()
        .filter(account::Column::Id.eq(id))
        .one(db)
        .await
}
