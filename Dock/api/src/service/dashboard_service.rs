use crate::models::dashboard::{RitTypeCount, RittypePiechart};
use crate::models::rit;
use sea_orm::{DatabaseConnection, EntityTrait, ExprTrait, QuerySelect, sea_query::Expr};

pub async fn get_rittype_piechart(
    db: &DatabaseConnection,
) -> Result<Vec<RittypePiechart>, sea_orm::DbErr> {
    let counts: Vec<RitTypeCount> = rit::Entity::find()
        .select_only()
        .column(rit::Column::RitType)
        .expr_as(Expr::col(rit::Column::RitType).count(), "aantal")
        .group_by(rit::Column::RitType)
        .into_model::<RitTypeCount>()
        .all(db)
        .await?;
    let result = to_piechart(&counts);
    Ok(result)
}

pub fn to_piechart(counts: &[RitTypeCount]) -> Vec<RittypePiechart> {
    let totaal: i64 = counts.iter().map(|c| c.aantal).sum();
    counts
        .iter()
        .map(|c| RittypePiechart {
            rit_type: c.rit_type,
            aantal: c.aantal,
            percentage: if totaal > 0 {
                (c.aantal as f64 / totaal as f64) * 100.0
            } else {
                0.0
            },
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn percentages_are_correct() {
        let input = vec![
            RitTypeCount {
                rit_type: 1,
                aantal: 30,
            },
            RitTypeCount {
                rit_type: 2,
                aantal: 70,
            },
        ];
        let result = to_piechart(&input);
        assert_eq!(result.len(), 2);

        // Rit type 1 = 30 out of 100 = 30%
        assert_eq!(result[0].rit_type, 1);
        assert_eq!(result[0].aantal, 30);
        assert!((result[0].percentage - 30.0).abs() < 1e-6);

        // Rit type 2 = 70 out of 100 = 70%
        assert_eq!(result[1].rit_type, 2);
        assert_eq!(result[1].aantal, 70);
        assert!((result[1].percentage - 70.0).abs() < 1e-6);
    }

    #[test]
    fn handles_empty_input() {
        let input: Vec<RitTypeCount> = vec![];
        let result = to_piechart(&input);
        assert_eq!(result.len(), 0);
    }

    #[test]
    fn handles_zero_total() {
        let input = vec![
            RitTypeCount {
                rit_type: 5,
                aantal: 0,
            },
            RitTypeCount {
                rit_type: 6,
                aantal: 0,
            },
        ];
        let result = to_piechart(&input);
        assert_eq!(result.len(), 2);
        for r in result {
            assert_eq!(r.percentage, 0.0);
        }
    }
}
