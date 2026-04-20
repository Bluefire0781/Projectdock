use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table("toegestane_dock")
                    .if_not_exists()
                    .col(integer("dock_id").not_null())
                    .col(integer("rit_type").not_null())
                    .primary_key(
                        Index::create()
                            .name("pk_toegestane_dock")
                            .col("dock_id")
                            .col("rit_type"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_toegestane_dock_dock")
                            .from("toegestane_dock", "dock_id")
                            .to("dock", "dock_id")
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_toegestane_dock_rittype")
                            .from("toegestane_dock", "rit_type")
                            .to("rittype", "rittypeid")
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table("toegestane_dock").to_owned())
            .await
    }
}
