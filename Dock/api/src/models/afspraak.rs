use sea_orm::entity::prelude::*;
use serde::Serialize;

#[sea_orm::model]
#[derive(Serialize, Debug, Clone, PartialEq, Eq, DeriveEntityModel, Default)]
#[sea_orm(table_name = "afspraak")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub afspraak_id: i32, //pk
    pub rit_nmr: i32,  //fk
    pub dock_nmr: i32, //fk
    pub starttijd: String,
    pub eindtijd: String,
    pub landing_type: String,
    #[sea_orm(belongs_to, from = "rit_nmr", to = "id")]
    pub rit: HasOne<super::rit::Entity>,
    #[sea_orm(belongs_to, from = "dock_nmr", to = "dock_id")]
    pub dock: HasOne<super::dock::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}
