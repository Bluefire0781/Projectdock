use crate::models::{afspraak, dock, leverancier, rit, rittype, toegestanedock};
use chrono::{Duration, NaiveDate, NaiveDateTime, NaiveTime};
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};

// Werkdag: van 06:00 tot 22:00. Er is geen openingstijden-veld op dock,
// dus dit staat hier als één centrale constante.
pub const WERKDAG_START_UUR: u32 = 6;
pub const WERKDAG_EIND_UUR: u32 = 22;
const SLOT_STAP_MINUTEN: i64 = 15;

pub struct DockSlot {
    pub start: NaiveDateTime,
    pub end: NaiveDateTime,
    pub available: bool,
}

pub struct DockBeschikbaarheid {
    pub dock_id: i32,
    pub slots: Vec<DockSlot>,
}

pub struct RitBeschikbaarheid {
    pub datum: NaiveDate,
    pub duration_minutes: i64,
    pub docks: Vec<DockBeschikbaarheid>,
}

// pellet_tot / ppu geeft uren, x60 geeft minuten, rond naar boven af op het
// dichtstbijzijnde kwartier (bv. 32 -> 45).
pub fn bereken_duur_minuten(pellet_tot: i32, ppu: i64) -> i64 {
    if ppu <= 0 {
        return SLOT_STAP_MINUTEN;
    }

    let uren = pellet_tot as f64 / ppu as f64;
    let minuten = uren * 60.0;
    let afgerond = (minuten / SLOT_STAP_MINUTEN as f64).ceil() * SLOT_STAP_MINUTEN as f64;

    afgerond.max(SLOT_STAP_MINUTEN as f64) as i64
}

pub async fn get_beschikbaarheid_voor_rit(
    db: &DatabaseConnection,
    rit_row: &rit::Model,
    leverancier_row: &leverancier::Model,
) -> Result<RitBeschikbaarheid, sea_orm::DbErr> {
    let duration_minutes = bereken_duur_minuten(rit_row.pellet_tot, leverancier_row.ppu);

    // rit.rit_type verwijst naar rittype.id, maar toegestane_dock.rit_type
    // verwijst naar rittype.rittypeid — dus eerst de rittype-rij opzoeken.
    let rittype_row = rittype::Entity::find_by_id(rit_row.rit_type)
        .one(db)
        .await?;

    let toegestane_dock_ids: Vec<i32> = match rittype_row {
        Some(rittype_row) => toegestanedock::Entity::find()
            .filter(toegestanedock::Column::RitType.eq(rittype_row.rittypeid))
            .all(db)
            .await?
            .into_iter()
            .map(|t| t.dock_id)
            .collect(),
        None => vec![],
    };

    let docks = dock::Entity::find()
        .filter(dock::Column::DockId.is_in(toegestane_dock_ids))
        .filter(dock::Column::Status.eq(true))
        .all(db)
        .await?;

    let dock_ids: Vec<i32> = docks.iter().map(|d| d.dock_id).collect();

    let bestaande_afspraken = if dock_ids.is_empty() {
        vec![]
    } else {
        afspraak::Entity::find()
            .filter(afspraak::Column::DockNmr.is_in(dock_ids))
            .all(db)
            .await?
    };

    let dag_start = NaiveDateTime::new(
        rit_row.datum,
        NaiveTime::from_hms_opt(WERKDAG_START_UUR, 0, 0).unwrap(),
    );
    let dag_eind = NaiveDateTime::new(
        rit_row.datum,
        NaiveTime::from_hms_opt(WERKDAG_EIND_UUR, 0, 0).unwrap(),
    );

    let mut dock_resultaten = Vec::with_capacity(docks.len());

    for dock_row in &docks {
        let afspraken_voor_dock: Vec<&afspraak::Model> = bestaande_afspraken
            .iter()
            .filter(|a| a.dock_nmr == dock_row.dock_id && a.starttijd.date() == rit_row.datum)
            .collect();

        let mut slots = Vec::new();
        let mut slot_start = dag_start;

        while slot_start + Duration::minutes(duration_minutes) <= dag_eind {
            let slot_eind = slot_start + Duration::minutes(duration_minutes);

            let overlapt = afspraken_voor_dock
                .iter()
                .any(|a| slot_start < a.eindtijd && slot_eind > a.starttijd);

            slots.push(DockSlot {
                start: slot_start,
                end: slot_eind,
                available: !overlapt,
            });

            slot_start += Duration::minutes(SLOT_STAP_MINUTEN);
        }

        dock_resultaten.push(DockBeschikbaarheid {
            dock_id: dock_row.dock_id,
            slots,
        });
    }

    Ok(RitBeschikbaarheid {
        datum: rit_row.datum,
        duration_minutes,
        docks: dock_resultaten,
    })
}

// Herbevestigt vlak voor het boeken dat een specifiek dock/tijdvak nog vrij is
// (voorkomt een race condition tussen twee mensen die tegelijk dezelfde slot kiezen)
pub async fn is_slot_nog_vrij(
    db: &DatabaseConnection,
    dock_id: i32,
    start: NaiveDateTime,
    eind: NaiveDateTime,
) -> Result<bool, sea_orm::DbErr> {
    let bestaande = afspraak::Entity::find()
        .filter(afspraak::Column::DockNmr.eq(dock_id))
        .all(db)
        .await?;

    let overlapt = bestaande
        .iter()
        .any(|a| start < a.eindtijd && eind > a.starttijd);

    Ok(!overlapt)
}

