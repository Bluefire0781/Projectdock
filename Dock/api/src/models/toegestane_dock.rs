use sea_orm::entity::prelude::*;
use serde::Serialize;

#[sea_orm::model]
#[derive(Serialize, Debug, Clone, PartialEq, Eq, DeriveEntityModel, Default)]
#[sea_orm(table_name = "toegestane_dock")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub dock_nmr: u64,
    #[sea_orm(primary_key, auto_increment = false)]
    pub leverancier_nmr: u64,
    #[sea_orm(belongs_to, from = "dock_nmr", to = "dock_id")]
    pub dock: Option<super::dock::Entity>,
    #[sea_orm(belongs_to, from = "leverancier_nmr", to = "leverancier_id")]
    pub leverancier: Option<super::leverancier::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}
