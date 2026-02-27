use std::hint::black_box;
use std::time::Instant;

fn main() {
    let start = Instant::now();

    let mut sum: u64 = 0;
    for i in 0..1_000_000_000u64 {
        // Make the value opaque to the optimizer
        sum = sum.wrapping_add(black_box(i));
    }

    // Also keep sum opaque
    black_box(sum);

    println!("sum = {}", sum);
    println!("elapsed = {:?}", start.elapsed());
}

