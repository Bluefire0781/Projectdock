use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct CreateRitType {
    pub rittypeid: i32,
    pub desc: String,
}

#[derive(Deserialize)]
pub struct UpdateRitType {
    pub rittypeid: Option<i32>,
    pub desc: Option<String>,
}

#[derive(Serialize)]
pub struct RitTypeResponse {
    pub id: i32,
    pub rittypeid: i32,
    pub desc: String,
}

#[sea_orm::model]
#[derive(Serialize, Debug, Clone, PartialEq, Eq, DeriveEntityModel, Default)]
#[sea_orm(table_name = "rittype")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32, // pk
    pub rittypeid: i32,
    pub description: String,
    #[sea_orm(has_many)]
    pub rit: HasMany<super::rit::Entity>,
    #[sea_orm(has_many, via = "toegestane_dock")]
    pub dock: HasMany<super::dock::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}
