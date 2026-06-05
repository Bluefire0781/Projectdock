use axum::response::sse::{Event, KeepAlive, Sse};
use chrono::Utc;
use chrono_tz::Europe::Amsterdam;
use std::{convert::Infallible, time::Duration};
use tokio_stream::{StreamExt, wrappers::IntervalStream};

pub async fn sse_handler() -> Sse<impl tokio_stream::Stream<Item = Result<Event, Infallible>>> {
    let stream = IntervalStream::new(tokio::time::interval(Duration::from_secs(5)))
        .map(|_| Ok(Event::default().data(get_data())));

    Sse::new(stream).keep_alive(KeepAlive::new().interval(Duration::from_secs(15)))
}

fn get_data() -> String {
    let dutch_time = Utc::now().with_timezone(&Amsterdam);
    format!(
        "Nieuwe data van server om: {}",
        dutch_time.format("%d-%m-%Y %H:%M:%S")
    )
}
