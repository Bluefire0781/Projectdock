use crate::models::leverancier;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, DeleteResult, EntityTrait, QueryFilter, Set,
};

pub async fn create_leverancier(
    db: &DatabaseConnection,
    leverancier_id: String,
    leverancier_naam: Option<String>,
    transporteur: Option<String>,
    ppu: i64,
    account_id: i32,
) -> Result<leverancier::Model, sea_orm::DbErr> {
    let new_leverancier = leverancier::ActiveModel {
        leverancier_id: Set(leverancier_id),
        leverancier_naam: Set(leverancier_naam),
        transporteur: Set(transporteur),
        ppu: Set(ppu),
        account_id: Set(account_id),
        ..Default::default()
    };

    new_leverancier.insert(db).await
}

pub async fn find_all(db: &DatabaseConnection) -> Result<Vec<leverancier::Model>, sea_orm::DbErr> {
    let leveranciers = leverancier::Entity::find().all(db).await?;

    Ok(leveranciers)
}

pub async fn update_leverancier(
    db: &DatabaseConnection,
    leverancier_id: String,
    leverancier_naam: Option<String>,
    transporteur: Option<String>,
    ppu: Option<i64>,
    account_id: Option<i32>,
) -> Result<leverancier::Model, sea_orm::DbErr> {
    let existing =
        find_by_one(db, &leverancier_id)
            .await?
            .ok_or(sea_orm::DbErr::RecordNotFound(
                "Leverancier not found".to_string(),
            ))?;

    let mut active_model: leverancier::ActiveModel = existing.into();

    if let Some(naam) = leverancier_naam {
        active_model.leverancier_naam = Set(Some(naam));
    }

    if let Some(transporteur_val) = transporteur {
        active_model.transporteur = Set(Some(transporteur_val));
    }

    if let Some(ppu_val) = ppu {
        active_model.ppu = Set(ppu_val);
    }

    if let Some(id) = account_id {
        active_model.account_id = Set(id);
    }

    active_model.update(db).await
}

pub async fn delete_leverancier(
    db: &DatabaseConnection,
    leverancier_id: String,
) -> Result<sea_orm::DeleteResult, sea_orm::DbErr> {
    let res: DeleteResult = leverancier::Entity::delete_many()
        .filter(leverancier::Column::LeverancierId.eq(leverancier_id))
        .exec(db)
        .await?;

    Ok(res)
}

pub async fn find_by_one(
    db: &DatabaseConnection,
    leverancier: &str,
) -> Result<Option<leverancier::Model>, sea_orm::DbErr> {
    leverancier::Entity::find()
        .filter(leverancier::Column::LeverancierId.eq(leverancier))
        .one(db)
        .await
}
