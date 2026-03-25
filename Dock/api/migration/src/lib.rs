pub use sea_orm_migration::prelude::*;

mod m20260324_162122_create_leverancier_table;
mod m20260325_090928_create_rit_table;
mod m20260325_091118_create_allowdock_table;
mod m20260325_091209_create_dock_table;
mod m20260325_091406_create_afspraak_table;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20260324_162122_create_leverancier_table::Migration),
            Box::new(m20260325_091209_create_dock_table::Migration),
            Box::new(m20260325_090928_create_rit_table::Migration),
            Box::new(m20260325_091406_create_afspraak_table::Migration),
            Box::new(m20260325_091118_create_allowdock_table::Migration),
        ]
    }
}
