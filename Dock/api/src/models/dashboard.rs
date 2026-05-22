use serde::Serialize;

#[derive(Serialize, Debug)]
pub struct RittypePiechart {
    pub rit_type: i32,
    pub aantal: i64,
    pub percentage: f64,
}

#[derive(Debug, Clone, sea_orm::FromQueryResult)]
pub struct RitTypeCount {
    pub rit_type: i32,
    pub aantal: i64,
}
