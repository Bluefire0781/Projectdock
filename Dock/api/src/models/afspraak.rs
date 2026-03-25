use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct CreateAfspraak {
    pub rit_nmr: u64,
    pub dock_nmr: u64,
    pub starttijd: String,
    pub eindtijd: String,
    pub lading_type: String,
}

#[sea_orm::model]
#[derive(Serialize, Debug, Clone, PartialEq, Eq, DeriveEntityModel, Default)]
#[sea_orm(table_name = "afspraak")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub afspraak_id: u64, //pk
    pub rit_nmr: u64,  //fk
    pub dock_nmr: u16, //fk
    pub starttijd: String,
    pub eindtijd: String,
    pub laning_type: String,
    #[sea_orm(belongs_to, from = "rit_nmr", to = "rit_id")]
    pub rit: HasOne<super::rit::Entity>,
    #[sea_orm(belongs_to, from = "dock_nmr", to = "dock_id")]
    pub dock: HasOne<super::dock::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}
