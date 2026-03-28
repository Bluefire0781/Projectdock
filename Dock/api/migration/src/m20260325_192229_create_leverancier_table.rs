use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table("leverancier")
                    .if_not_exists()
                    .col(pk_auto("id"))
                    .col(string("leverancier_id").not_null().unique_key())
                    .col(string("leverancier_naam").null())
                    .col(string("transporteur").null())
                    .col(big_integer("ppu").not_null())
                    .col(integer("account_id").not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_leverancier_accout")
                            .from("leverancier", "account_id")
                            .to("account", "id")
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table("leverancier").to_owned())
            .await
    }
}
