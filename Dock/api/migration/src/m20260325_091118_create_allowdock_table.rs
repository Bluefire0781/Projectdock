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
                    .col(big_unsigned("leverancier_id").not_null())
                    .col(big_unsigned("dock_id").not_null())
                    .col(string("description"))
                    .primary_key(
                        Index::create()
                            .name("pk_toegestane_dock")
                            .col("leverancier_id")
                            .col("dock_id"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_toegestane_dock_leverancier")
                            .from("toegestane_dock", "leverancier_id")
                            .to("leverancier", "leverancier_id")
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_toegestane_dock_dock")
                            .from("toegestane_dock", "dock_id")
                            .to("dock", "dock_id")
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

