use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table("account")
                    .if_not_exists()
                    .col(pk_auto("id"))
                    .col(string("username").not_null().unique_key())
                    .col(string("password").not_null())
                    .col(string("email").null())
                    .col(string("role").not_null().default("user"))
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table("account").to_owned())
            .await
    }
}
