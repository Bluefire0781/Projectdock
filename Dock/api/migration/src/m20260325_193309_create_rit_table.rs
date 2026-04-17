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
                    .col(pk_auto("id"))
                    .col(string("rit_id").not_null().unique_key())
                    .col(big_integer("leverancier_id").not_null())
                    .col(tiny_integer("pellet_tot").not_null())
                    .col(tiny_integer("rit_type").not_null())
                    .col(date("datum").not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_rit_leverancier")
                            .from("rit", "leverancier_id")
                            .to("leverancier", "id")
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_rittype")
                            .from("rit", "rit_type")
                            .to("rittype", "id")
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
