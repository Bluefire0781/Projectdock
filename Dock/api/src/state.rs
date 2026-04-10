use sea_orm::DatabaseConnection;

//database state, to share to all stages.
#[derive(Clone)]
pub struct AppState {
    pub db: DatabaseConnection,
    pub jwt_secret: String,
}
