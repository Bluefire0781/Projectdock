use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct UpdateDockStatus {
    pub dock_id: u16,
    pub open: bool,
}

#[sea_orm::model]
#[derive(Serialize, Debug, Clone, PartialEq, Eq, DeriveEntityModel, Default)]
#[sea_orm(table_name = "dock")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub dock_id: u64, //pk
    pub open: bool,
    #[sea_orm(has_many)]
    pub afspraak: HasMany<super::afspraak::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}
