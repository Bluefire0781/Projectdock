use crate::models::{afspraak, leverancier, rit};
use chrono::NaiveDate;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, DeleteResult, EntityTrait, QueryFilter, Set,
};

// CREATE
pub async fn create_rit(
    db: &DatabaseConnection,
    rit_id: String,
    leverancier_id: i32,
    pellet_tot: i32,
    rit_type: i32,
    datum: NaiveDate,
) -> Result<rit::Model, sea_orm::DbErr> {
    let new_rit = rit::ActiveModel {
        rit_id: Set(rit_id),
        leverancier_nmr: Set(leverancier_id),
        pellet_tot: Set(pellet_tot),
        rit_type: Set(rit_type),
        datum: Set(datum),
        ..Default::default() // id is auto-generated (pk_auto)
    };

    new_rit.insert(db).await
}

// FIND ALL
pub async fn find_all(
    db: &DatabaseConnection,
) -> Result<Vec<(rit::Model, Vec<afspraak::Model>)>, sea_orm::DbErr> {
    rit::Entity::find()
        .find_with_related(afspraak::Entity)
        .all(db)
        .await
}

// FIND ALL for a specific account (via its leverancier(s)) — used for non-admin "user" role
pub async fn find_all_for_account(
    db: &DatabaseConnection,
    account_id: i32,
) -> Result<Vec<(rit::Model, Vec<afspraak::Model>)>, sea_orm::DbErr> {
    let leverancier_ids: Vec<i32> = leverancier::Entity::find()
        .filter(leverancier::Column::AccountId.eq(account_id))
        .all(db)
        .await?
        .into_iter()
        .map(|l| l.id)
        .collect();

    rit::Entity::find()
        .filter(rit::Column::LeverancierNmr.is_in(leverancier_ids))
        .find_with_related(afspraak::Entity)
        .all(db)
        .await
}

// FIND BY ONE (by id)
pub async fn find_by_one(
    db: &DatabaseConnection,
    id: i32,
) -> Result<Option<rit::Model>, sea_orm::DbErr> {
    rit::Entity::find()
        .filter(rit::Column::Id.eq(id))
        .one(db)
        .await
}

// Fetch the leverancier a rit belongs to — used to check a "user" account owns this rit
pub async fn get_leverancier_for_rit(
    db: &DatabaseConnection,
    rit: &rit::Model,
) -> Result<Option<leverancier::Model>, sea_orm::DbErr> {
    leverancier::Entity::find_by_id(rit.leverancier_nmr)
        .one(db)
        .await
}

// UPDATE
pub async fn update_rit(
    db: &DatabaseConnection,
    id: i32,
    rit_id: Option<String>,
    leverancier_id: Option<i32>,
    pellet_tot: Option<i32>,
    rit_type: Option<i32>,
    datum: Option<NaiveDate>,
) -> Result<rit::Model, sea_orm::DbErr> {
    let existing = find_by_one(db, id)
        .await?
        .ok_or(sea_orm::DbErr::RecordNotFound("Rit not found".to_string()))?;

    let mut active_model: rit::ActiveModel = existing.into();

    if let Some(rit_id_val) = rit_id {
        active_model.rit_id = Set(rit_id_val);
    }
    if let Some(leverancier_id_val) = leverancier_id {
        active_model.leverancier_nmr = Set(leverancier_id_val);
    }
    if let Some(pellet_tot_val) = pellet_tot {
        active_model.pellet_tot = Set(pellet_tot_val);
    }
    if let Some(rit_type_val) = rit_type {
        active_model.rit_type = Set(rit_type_val);
    }
    if let Some(datum_val) = datum {
        active_model.datum = Set(datum_val);
    }

    active_model.update(db).await
}

// DELETE
pub async fn delete_rit(db: &DatabaseConnection, id: i32) -> Result<DeleteResult, sea_orm::DbErr> {
    let res = rit::Entity::delete_many()
        .filter(rit::Column::Id.eq(id))
        .exec(db)
        .await?;

    Ok(res)
}

