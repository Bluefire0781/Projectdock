use sea_orm::{Database, DatabaseConnection};

//database connect function
pub async fn connect() -> Result<DatabaseConnection, sea_orm::DbErr> {
    //let database_url = std::env::var("").expect("DATABASE_URL environment variable not set");

    //Database::connect("postgres://postgres:postgres@postgres:5432/app_db").await
    Database::connect("postgresql://postgres@localhost:5432/mock_db").await
}
