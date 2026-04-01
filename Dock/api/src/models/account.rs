use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

//=============DTO===============///
#[derive(Deserialize)]
pub struct CreateAccount {
    pub username: String,
    pub password: String,
    pub email: Option<String>,
    pub role: Option<String>,
}

#[derive(Deserialize)]
pub struct UpdateAccount {
    pub username: Option<String>,
    pub email: Option<String>,
}

#[derive(Serialize)]
pub struct AccountResponse {
    pub id: i32,
    pub username: String,
    pub email: Option<String>,
    pub role: Option<String>,
}

#[derive(Deserialize)]
pub struct Login {
    pub username: String,
    pub password: String,
}

//============Model=============//
#[sea_orm::model]
#[derive(DeriveEntityModel, Serialize, Debug, Clone, PartialEq, Eq, Default)]
#[sea_orm(table_name = "account")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    #[sea_orm(unique)]
    pub username: String,
    pub password: String,
    pub email: Option<String>,
    pub role: Option<String>,
    #[sea_orm(has_many)]
    pub leverancier: HasMany<super::leverancier::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}
