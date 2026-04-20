use crate::models::toegestanedock;
use sea_orm::prelude::*;
use sea_orm::{ActiveModelTrait, ColumnTrait, DeleteResult, EntityTrait, QueryFilter, Set};

// Create (Assign)
pub async fn assign(
    db: &DatabaseConnection,
    dock_nmr: i32,
    rit_type: i32,
) -> Result<toegestanedock::Model, DbErr> {
    let record = toegestanedock::ActiveModel {
        dock_id: Set(dock_nmr),
        rit_type: Set(rit_type),
    };
    record.insert(db).await
}

// Find all
pub async fn find_all(db: &DatabaseConnection) -> Result<Vec<toegestanedock::Model>, DbErr> {
    toegestanedock::Entity::find().all(db).await
}

// Unassign
pub async fn unassign(
    db: &DatabaseConnection,
    dock_nmr: i32,
    rit_type: i32,
) -> Result<DeleteResult, DbErr> {
    toegestanedock::Entity::delete_many()
        .filter(toegestanedock::Column::DockId.eq(dock_nmr))
        .filter(toegestanedock::Column::RitType.eq(rit_type))
        .exec(db)
        .await
}
