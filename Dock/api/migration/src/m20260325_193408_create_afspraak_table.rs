use sea_orm_migration::{prelude::*, schema::*};
#[derive(DeriveMigrationName)]
pub struct Migration;
#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table("afspraak")
                    .if_not_exists()
                    .col(pk_auto("afspraak_id"))
                    .col(integer("rit_nmr").not_null().unique_key())
                    .col(integer("dock_nmr").not_null())
                    .col(date_time("starttijd").not_null())
                    .col(date_time("eindtijd").not_null())
                    .col(string("landing_type").not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_afspraak_rit")
                            .from("afspraak", "rit_nmr")
                            .to("rit", "id")
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_afspraak_dock")
                            .from("afspraak", "dock_nmr")
                            .to("dock", "dock_id")
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await
    }
    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table("afspraak").to_owned())
            .await
    }
}

