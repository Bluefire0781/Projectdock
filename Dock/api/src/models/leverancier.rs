use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct CreateLeverancier {
    pub leverancier_id: String,
    pub leverancier_naam: Option<String>,
    pub transporteur: Option<String>,
    pub username: String,
    pub password: String,
    pub email: Option<String>,
    pub ppu: i64,
    pub role: Option<String>,
}

#[derive(Serialize)]
pub struct LeverancierResponse {
    pub leverancier_id: String,
    pub leverancier_naam: Option<String>,
    pub transporteur: Option<String>,
    pub username: String,
    pub email: Option<String>,
    pub ppu: i64,
    pub role: Option<String>,
}

#[sea_orm::model]
#[derive(DeriveEntityModel, Serialize, Debug, Clone, PartialEq, Eq, Default)]
#[sea_orm(table_name = "leverancier")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    #[sea_orm(unique)]
    pub leverancier_id: String,
    pub leverancier_naam: Option<String>,
    pub transporteur: Option<String>,
    pub username: String,
    pub password: String,
    pub email: Option<String>,
    pub ppu: i64,
    pub role: Option<String>,
    #[sea_orm(has_many)]
    pub rit: HasMany<super::rit::Entity>,
    #[sea_orm(has_many, via = "toegestane_dock")]
    pub dock: HasMany<super::dock::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}
