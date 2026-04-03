use crate::models::account;
use argon2::{
    Argon2,
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString, rand_core::OsRng},
};
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, DeleteResult, EntityTrait, QueryFilter, Set,
};

// login errors
pub enum LoginError {
    InvalidCredentials,
    DatabaseError,
}

// Helper function to hash password
fn hash_password(password: &str) -> Result<String, argon2::password_hash::Error> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();

    Ok(argon2
        .hash_password(password.as_bytes(), &salt)?
        .to_string())
}

pub async fn verify_password(
    stored_hash: &str,
    password: &str,
) -> Result<(), argon2::password_hash::Error> {
    let parsed_hash = PasswordHash::new(stored_hash)?;
    Argon2::default().verify_password(password.as_bytes(), &parsed_hash)
}

//login services
pub async fn log_in(
    db: &DatabaseConnection,
    username: String,
    password: String,
) -> Result<(), LoginError> {
    let account_opt = find_by_user(db, &username)
        .await
        .map_err(|_| LoginError::DatabaseError)?;

    let account = account_opt.ok_or(LoginError::InvalidCredentials)?;

    if verify_password(&account.password, &password).await.is_ok() {
        Ok(())
    } else {
        Err(LoginError::InvalidCredentials)
    }
}

//account services
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

pub async fn find_by_user(
    db: &DatabaseConnection,
    name: &str,
) -> Result<Option<account::Model>, sea_orm::DbErr> {
    account::Entity::find()
        .filter(account::Column::Username.eq(name))
        .one(db)
        .await
}

pub async fn update_account(
    db: &DatabaseConnection,
    id: i32,
    username: Option<String>,
    email: Option<String>,
) -> Result<account::Model, sea_orm::DbErr> {
    let existing = find_one_account(db, id)
        .await?
        .ok_or(sea_orm::DbErr::RecordNotFound(
            "account not found".to_string(),
        ))?;

    let mut active_model: account::ActiveModel = existing.into();

    if let Some(name) = username {
        active_model.username = Set(name);
    }

    if let Some(email) = email {
        active_model.email = Set(Some(email));
    }

    active_model.update(db).await
}
