use crate::models::User;

pub async fn create_user(username: String) -> User {
    User { id: 1337, username }
}
