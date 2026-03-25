use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table("rit")
                    .if_not_exists()
                    .col(big_unsigned("rit_id").not_null().primary_key())
                    .col(big_unsigned("leverancier_id").not_null())
                    .col(string("name").not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_rit_leverancier")
                            .from("rit", "leverancier_id")
                            .to("leverancier", "leverancier_id")
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table("rit").to_owned())
            .await
    }
}

