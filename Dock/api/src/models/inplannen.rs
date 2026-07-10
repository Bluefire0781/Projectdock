use chrono::NaiveDateTime;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct InplannenRequest {
    pub dock_id: i32,
    pub start: NaiveDateTime,
    pub landing_type: String,
}
