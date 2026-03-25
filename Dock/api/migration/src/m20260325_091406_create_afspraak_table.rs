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
                    .col(big_unsigned("afspraak_id").not_null().primary_key())
                    .col(big_unsigned("rit_nmr").not_null())
                    .col(unsigned("dock_nmr").not_null())
                    .col(string("starttijd").not_null())
                    .col(string("eindtijd").not_null())
                    .col(string("laning_type").not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_afspraak_rit")
                            .from("afspraak", "rit_nmr")
                            .to("rit", "rit_id")
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
