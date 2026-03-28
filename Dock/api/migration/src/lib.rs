pub use sea_orm_migration::prelude::*;

mod m20260325_192130_create_account_table;
mod m20260325_192229_create_leverancier_table;
mod m20260325_192604_create_dock_table;
mod m20260325_193309_create_rit_table;
mod m20260325_193408_create_afspraak_table;
mod m20260325_193811_create_toedock_table;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20260325_192130_create_account_table::Migration),
            Box::new(m20260325_192229_create_leverancier_table::Migration),
            Box::new(m20260325_192604_create_dock_table::Migration),
            Box::new(m20260325_193309_create_rit_table::Migration),
            Box::new(m20260325_193408_create_afspraak_table::Migration),
            Box::new(m20260325_193811_create_toedock_table::Migration),
        ]
    }
}
