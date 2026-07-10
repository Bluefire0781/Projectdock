use chrono::{NaiveDate, NaiveDateTime};
use serde::Serialize;

#[derive(Serialize)]
pub struct SlotResponse {
    pub start: NaiveDateTime,
    pub end: NaiveDateTime,
    pub available: bool,
}

#[derive(Serialize)]
pub struct DockAvailabilityResponse {
    pub dock_id: i32,
    pub slots: Vec<SlotResponse>,
}

#[derive(Serialize)]
pub struct BeschikbaarheidResponse {
    pub rit_id: i32,
    pub datum: NaiveDate,
    pub duration_minutes: i64,
    pub docks: Vec<DockAvailabilityResponse>,
}
