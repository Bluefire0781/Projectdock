use sea_orm::entity::prelude::*;
use serde::Serialize;

#[sea_orm::model]
#[derive(Serialize, Debug, Clone, PartialEq, Eq, DeriveEntityModel, Default)]
#[sea_orm(table_name = "rit")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub rit_id: u64, //pk
    pub leverancier_nmr: u64, //fk
    pub pellet_tot: u16,
    pub datum: String,
    #[sea_orm(belongs_to, from = "leverancier_nmr", to = "leverancier_id")]
    pub leverancier: HasOne<super::leverancier::Entity>,
    #[sea_orm(has_one)]
    pub afspraak: HasOne<super::afspraak::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}
