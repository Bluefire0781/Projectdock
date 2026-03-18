use crate::models::leverancier;

pub async fn create_leverancier(
    leverancier_nmr: u64,
    username: String,
    password: String,
    email: String,
    ppu: u16,
) -> leverancier {
    leverancier {
        leverancier_nmr,
        username,
        password,
        email,
        ppu,
    }
}
