use crate::errors::LoginError;
use crate::models::account;
use crate::service::hasher_service::{hash_password, verify_password};
use crate::service::jwt_service::create_jwt;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, DeleteResult, EntityTrait, QueryFilter, Set,
};

//login services
pub async fn log_in(
    db: &DatabaseConnection,
    username: String,
    password: String,
    jwt_secret: &str,
) -> Result<String, LoginError> {
    let account_opt = find_by_user(db, &username)
        .await
        .map_err(|_| LoginError::DatabaseError)?;

    let account = account_opt.ok_or(LoginError::InvalidCredentials)?;

    if verify_password(&account.password, &password).await.is_err() {
        return Err(LoginError::InvalidCredentials);
    }

    create_jwt(account.id, &account.username, &account.role, jwt_secret)
}

//account services
pub async fn create_account(
    db: &DatabaseConnection,
    username: String,
    password: String,
    email: Option<String>,
    role: String,
) -> Result<account::Model, sea_orm::DbErr> {
    let hashed_password = hash_password(&password)
        .await
        .map_err(|e| sea_orm::DbErr::Custom(e.to_string()))?;

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

pub async fn seed_admin(db: &DatabaseConnection) -> Result<(), sea_orm::DbErr> {
    // Check if admin already exists
    let exists = account::Entity::find()
        .filter(account::Column::Username.eq("admin"))
        .one(db)
        .await?
        .is_some();

    if exists {
        println!("Admin account already exists, skipping seed.");
        return Ok(());
    }

    let hashed_password = hash_password("bierislekker")
        .await
        .map_err(|e| sea_orm::DbErr::Custom(e.to_string()))?;

    let new_account = account::ActiveModel {
        username: Set("admin".to_owned()),
        password: Set(hashed_password),
        email: Set(Some("admin@email.com".to_owned())),
        role: Set("admin".to_owned()),
        ..Default::default()
    };

    new_account.insert(db).await?;
    println!("Admin account seeded.");
    Ok(())
}
