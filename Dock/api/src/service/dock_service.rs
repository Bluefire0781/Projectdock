use crate::models::dock;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, DeleteResult, EntityTrait, QueryFilter, Set,
};

pub async fn create_dock(
    db: &DatabaseConnection,
    status: bool,
) -> Result<dock::Model, sea_orm::DbErr> {
    let new_dock = dock::ActiveModel {
        status: Set(status),
        ..Default::default()
    };

    new_dock.insert(db).await
}

pub async fn find_all(db: &DatabaseConnection) -> Result<Vec<dock::Model>, sea_orm::DbErr> {
    let docks = dock::Entity::find().all(db).await?;
    Ok(docks)
}

pub async fn find_by_one(
    db: &DatabaseConnection,
    dock_id: i32,
) -> Result<Option<dock::Model>, sea_orm::DbErr> {
    dock::Entity::find()
        .filter(dock::Column::DockId.eq(dock_id))
        .one(db)
        .await
}

pub async fn update_dock(
    db: &DatabaseConnection,
    dock_id: i32,
    status: Option<bool>,
) -> Result<dock::Model, sea_orm::DbErr> {
    let existing = find_by_one(db, dock_id)
        .await?
        .ok_or(sea_orm::DbErr::RecordNotFound("Dock not found".to_string()))?;

    let mut active_model: dock::ActiveModel = existing.into();

    if let Some(status_val) = status {
        active_model.status = Set(status_val);
    }

    active_model.update(db).await
}

pub async fn delete_dock(
    db: &DatabaseConnection,
    dock_id: i32,
) -> Result<DeleteResult, sea_orm::DbErr> {
    let res = dock::Entity::delete_many()
        .filter(dock::Column::DockId.eq(dock_id))
        .exec(db)
        .await?;

    Ok(res)
}
