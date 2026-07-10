use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct CreateAfspraak {
    pub rit_nmr: i32,
    pub dock_nmr: i32,
    pub starttijd: DateTime,
    pub eindtijd: DateTime,
    pub landing_type: String,
}

#[derive(Deserialize)]
pub struct UpdateAfspraak {
    pub rit_nmr: Option<i32>,
    pub dock_nmr: Option<i32>,
    pub starttijd: Option<DateTime>,
    pub eindtijd: Option<DateTime>,
    pub landing_type: Option<String>,
}

#[derive(Serialize)]
pub struct AfspraakResponse {
    pub afspraak_id: i32,
    pub rit_nmr: i32,
    pub dock_nmr: i32,
    pub starttijd: DateTime,
    pub eindtijd: DateTime,
    pub landing_type: String,
}

#[sea_orm::model]
#[derive(Serialize, Debug, Clone, PartialEq, Eq, DeriveEntityModel, Default)]
#[sea_orm(table_name = "afspraak")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub afspraak_id: i32, //pk
    #[sea_orm(unique)]
    pub rit_nmr: i32,
    pub dock_nmr: i32, //fk
    pub starttijd: DateTime,
    pub eindtijd: DateTime,
    pub landing_type: String,
    #[sea_orm(belongs_to, from = "rit_nmr", to = "id")]
    pub rit: HasOne<super::rit::Entity>,
    #[sea_orm(belongs_to, from = "dock_nmr", to = "dock_id")]
    pub dock: HasOne<super::dock::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}

