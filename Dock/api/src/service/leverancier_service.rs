use crate::models::leverancier;
use sea_orm::{ActiveModelTrait, DatabaseConnection, Set};

pub async fn create_leverancier(
    db: &DatabaseConnection, // Accept connection as parameter
    leverancier_nmr: u64,
    username: String,
    password: String,
    email: String,
    ppu: u16,
) -> Result<leverancier::Model, sea_orm::DbErr> {
    let new_leverancier = leverancier::ActiveModel {
        leverancier_id: Set(leverancier_nmr),
        username: Set(username),
        password: Set(password),
        email: Set(email),
        ppu: Set(ppu),
        ..Default::default()
    };

    new_leverancier.insert(db).await // Use the passed connection
}

