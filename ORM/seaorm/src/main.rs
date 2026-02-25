use migration::{Migrator, MigratorTrait};
use sea_orm::{ConnectOptions, Database, DatabaseBackend, Statement};
use std::time::Duration;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut opt = ConnectOptions::new("protocol://username:password@host/database");
    opt.max_connections(100)
        .min_connections(5)
        .connect_timeout(Duration::from_secs(8))
        .acquire_timeout(Duration::from_secs(8))
        .idle_timeout(Duration::from_secs(8))
        .max_lifetime(Duration::from_secs(8))
        .sqlx_logging(false) // disable SQLx logging
        //.sqlx_logging_level(log::LevelFilter::Info)
        .set_schema_search_path("my_schema"); // set default Postgres schema

    let db = Database::connect(opt).await?;

    db.execute(Statement::from_string(
        DatabaseBackend::Postgres,
        "INSERT INTO my_schema.persons (name, job) VALUES ('Alice', 'Engineer')".to_owned(),
    ))
    .await?;

    let rows = db
        .query_all(Statement::from_string(
            DatabaseBackend::Postgres,
            "SELECT id, name, job FROM my_schema.persons".to_owned(),
        ))
        .await?;

    println!("rows in persons: {}", rows.len());
    Ok(())
}
