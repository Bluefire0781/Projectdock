use crate::models::rittype;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, DeleteResult, EntityTrait, QueryFilter, Set,
};

pub async fn create_rittype(
    db: &DatabaseConnection,
    rittypeid: i32
    desc: String,
) -> Result<rittype::Model, sea_orm::DbErr> {
    let new_rittype = rittype::ActiveModel {
        rittypeid: Set(rittypeid),
        description: Set(desc),
        ..Default::default() // id is auto-generated (pk_auto)
    };

    new_rittype.insert(db).await
}

pub async fn find_all(db: &DatabaseConnection) -> Result<Vec<rittype::Model>, sea_orm::DbErr> {
    let rittypes = rittype::Entity::find().all(db).await?;
    Ok(rittypes)
}

pub async fn find_by_one(
    db: &DatabaseConnection,
    id: i32,
) -> Result<Option<rittype::Model>, sea_orm::DbErr> {
    rittype::Entity::find()
        .filter(rittype::Column::Id.eq(id))
        .one(db)
        .await
}

pub async fn update_rittype(
    db: &DatabaseConnection,
    id: i32,
    desc: Option<String>,
) -> Result<rittype::Model, sea_orm::DbErr> {
    let existing = find_by_one(db, id)
        .await?
        .ok_or(sea_orm::DbErr::RecordNotFound(
            "RitType not found".to_string(),
        ))?;

    let mut active_model: rittype::ActiveModel = existing.into();

    if let Some(desc_val) = desc {
        active_model.description = Set(desc_val);
    }

    active_model.update(db).await
}

pub async fn delete_rittype(
    db: &DatabaseConnection,
    id: i32,
) -> Result<DeleteResult, sea_orm::DbErr> {
    let res = rittype::Entity::delete_many()
        .filter(rittype::Column::Id.eq(id))
        .exec(db)
        .await?;

    Ok(res)
}
