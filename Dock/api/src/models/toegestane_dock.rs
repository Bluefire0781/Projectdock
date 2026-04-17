use sea_orm::entity::prelude::*;
use serde::Serialize;

#[sea_orm::model]
#[derive(Serialize, Debug, Clone, PartialEq, Eq, DeriveEntityModel, Default)]
#[sea_orm(table_name = "toegestane_dock")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub dock_nmr: i16,
    #[sea_orm(primary_key, auto_increment = false)]
    pub rit_type: i16,
    #[sea_orm(belongs_to, from = "dock_nmr", to = "dock_id")]
    pub dock: Option<super::dock::Entity>,
    #[sea_orm(belongs_to, from = "rit_type", to = "id")]
    pub rittype: Option<super::rittype::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}
