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
                    .col(big_integer("leverancier_id").not_null().primary_key())
                    .col(string("username").not_null())
                    .col(string("password").not_null())
                    .col(string("email").null())
                    .col(tiny_integer("ppu").not_null())
                    .col(string("role").not_null().default("user"))
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
