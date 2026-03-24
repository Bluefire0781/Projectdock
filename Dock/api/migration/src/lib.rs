pub use sea_orm_migration::prelude::*;

mod m20260324_162122_create_leverancier_table;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![Box::new(
            m20260324_162122_create_leverancier_table::Migration,
        )]
    }
}
