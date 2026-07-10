use crate::models::afspraak;
use sea_orm::entity::prelude::DateTime;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, DeleteResult, EntityTrait, QueryFilter, Set,
};

// CREATE
pub async fn create_afspraak(
    db: &DatabaseConnection,
    rit_nmr: i32,
    dock_nmr: i32,
    starttijd: DateTime,
    eindtijd: DateTime,
    landing_type: String,
) -> Result<afspraak::Model, sea_orm::DbErr> {
    let new_afspraak = afspraak::ActiveModel {
        rit_nmr: Set(rit_nmr),
        dock_nmr: Set(dock_nmr),
        starttijd: Set(starttijd),
        eindtijd: Set(eindtijd),
        landing_type: Set(landing_type),
        ..Default::default() // afspraak_id is auto-generated (pk_auto)
    };

    new_afspraak.insert(db).await
}

// FIND ALL
pub async fn find_all(db: &DatabaseConnection) -> Result<Vec<afspraak::Model>, sea_orm::DbErr> {
    afspraak::Entity::find().all(db).await
}

// Check of een rit al een afspraak heeft (rit_nmr is uniek op afspraak)
pub async fn find_by_rit(
    db: &DatabaseConnection,
    rit_nmr: i32,
) -> Result<Option<afspraak::Model>, sea_orm::DbErr> {
    afspraak::Entity::find()
        .filter(afspraak::Column::RitNmr.eq(rit_nmr))
        .one(db)
        .await
}

// FIND BY ONE (by id)
pub async fn find_by_one(
    db: &DatabaseConnection,
    id: i32,
) -> Result<Option<afspraak::Model>, sea_orm::DbErr> {
    afspraak::Entity::find()
        .filter(afspraak::Column::AfspraakId.eq(id))
        .one(db)
        .await
}

// UPDATE
pub async fn update_afspraak(
    db: &DatabaseConnection,
    id: i32,
    rit_nmr: Option<i32>,
    dock_nmr: Option<i32>,
    starttijd: Option<DateTime>,
    eindtijd: Option<DateTime>,
    landing_type: Option<String>,
) -> Result<afspraak::Model, sea_orm::DbErr> {
    let existing = find_by_one(db, id)
        .await?
        .ok_or(sea_orm::DbErr::RecordNotFound(
            "Afspraak not found".to_string(),
        ))?;

    let mut active_model: afspraak::ActiveModel = existing.into();

    if let Some(rit_nmr_val) = rit_nmr {
        active_model.rit_nmr = Set(rit_nmr_val);
    }
    if let Some(dock_nmr_val) = dock_nmr {
        active_model.dock_nmr = Set(dock_nmr_val);
    }
    if let Some(starttijd_val) = starttijd {
        active_model.starttijd = Set(starttijd_val);
    }
    if let Some(eindtijd_val) = eindtijd {
        active_model.eindtijd = Set(eindtijd_val);
    }
    if let Some(landing_type_val) = landing_type {
        active_model.landing_type = Set(landing_type_val);
    }

    active_model.update(db).await
}

// DELETE
pub async fn delete_afspraak(
    db: &DatabaseConnection,
    id: i32,
) -> Result<DeleteResult, sea_orm::DbErr> {
    let res = afspraak::Entity::delete_many()
        .filter(afspraak::Column::AfspraakId.eq(id))
        .exec(db)
        .await?;

    Ok(res)
}

