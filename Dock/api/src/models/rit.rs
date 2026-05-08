use chrono::NaiveDate;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct CreateRit {
    pub rit_id: String,
    pub leverancier_nmr: i32,
    pub pellet_tot: i32,
    pub rit_type: i32,
    pub datum: NaiveDate,
}

#[derive(Deserialize)]
pub struct UpdateRit {
    pub rit_id: Option<String>,
    pub leverancier_nmr: Option<i32>,
    pub pellet_tot: Option<i32>,
    pub rit_type: Option<i32>,
    pub datum: Option<NaiveDate>,
}

#[derive(Serialize)]
pub struct RitResponse {
    pub id: i32,
    pub rit_id: String,
    pub leverancier_nmr: i32,
    pub pellet_tot: i32,
    pub rit_type: i32,
    pub datum: NaiveDate,
}

#[derive(Serialize)]
pub struct RitResponsewithaf {
    pub id: i32,
    pub rit_id: String,
    pub leverancier_nmr: i32,
    pub pellet_tot: i32,
    pub rit_type: i32,
    pub datum: NaiveDate,
    pub afspraak_starttijd: Option<DateTime>,
}

#[sea_orm::model]
#[derive(Serialize, Debug, Clone, PartialEq, Eq, DeriveEntityModel, Default)]
#[sea_orm(table_name = "rit")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32, //pk
    #[sea_orm(unique)]
    pub rit_id: String,
    pub leverancier_nmr: i32, //fk
    pub pellet_tot: i32,
    pub rit_type: i32,
    pub datum: NaiveDate,
    #[sea_orm(belongs_to, from = "leverancier_nmr", to = "id")]
    pub leverancier: HasOne<super::leverancier::Entity>,
    #[sea_orm(has_one)]
    pub afspraak: HasOne<super::afspraak::Entity>,
    #[sea_orm(belongs_to, from = "rit_type", to = "id")]
    pub rittype: HasOne<super::rittype::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}
