use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct CreateToegestanedock {
    pub dock_id: i32,
    pub rit_type: i32,
}

#[derive(Serialize)]
pub struct ToegestanedockResponse {
    pub dock_id: i32,
    pub rit_type: i32,
}

#[sea_orm::model]
#[derive(Serialize, Debug, Clone, PartialEq, Eq, DeriveEntityModel, Default)]
#[sea_orm(table_name = "toegestane_dock")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub dock_id: i32,
    #[sea_orm(primary_key, auto_increment = false)]
    pub rit_type: i32,
    #[sea_orm(belongs_to, from = "dock_id", to = "dock_id")]
    pub dock: Option<super::dock::Entity>,
    #[sea_orm(belongs_to, from = "rit_type", to = "rittypeid")]
    pub rittype: Option<super::rittype::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}
