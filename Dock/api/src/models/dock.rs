use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct CreateDock {
    pub status: bool,
}

#[derive(Deserialize)]
pub struct UpdateDock {
    pub status: Option<bool>,
}

#[derive(Serialize)]
pub struct DockResponse {
    pub id: i32,
    pub status: bool,
}

#[sea_orm::model]
#[derive(Serialize, Debug, Clone, PartialEq, Eq, DeriveEntityModel, Default)]
#[sea_orm(table_name = "dock")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub dock_id: i32, //pk
    pub status: bool,
    #[sea_orm(has_many)]
    pub afspraak: HasMany<super::afspraak::Entity>,
    #[sea_orm(has_many, via = "toegestane_dock")]
    pub rittype: HasMany<super::rittype::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}
