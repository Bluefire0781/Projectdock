use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct CreateLeverancier {
    pub leverancier_nmr: u64,
    pub username: String,
    pub password: String,
    pub email: String,
    pub ppu: u16,
}

#[sea_orm::model]
#[derive(DeriveEntityModel, Serialize, Debug, Clone, PartialEq, Eq, Default)]
#[sea_orm(table_name = "leverancier")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub leverancier_id: u64,
    pub username: String,
    pub password: String,
    pub email: String,
    pub ppu: u16,
    #[sea_orm(has_many)]
    pub rit: HasMany<super::rit::Entity>,
    #[sea_orm(has_many, via = "toegestane_dock")]
    pub dock: HasMany<super::dock::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}
