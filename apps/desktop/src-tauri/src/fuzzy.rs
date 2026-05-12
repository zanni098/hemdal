/// Simple fuzzy string matching.
pub fn fuzzy_score(query: &str, target: &str) -> i32 {
    let query_lower = query.to_lowercase();
    let target_lower = target.to_lowercase();

    // Exact substring match gets highest score
    if target_lower.contains(&query_lower) {
        return 1000 + (query.len() * 10) as i32;
    }

    let mut score = 0i32;
    let mut query_idx = 0usize;
    let mut consecutive = 0i32;
    let mut last_match = None;

    for (i, target_char) in target_lower.chars().enumerate() {
        if let Some(query_char) = query_lower.chars().nth(query_idx) {
            if target_char == query_char {
                score += 10;

                // Bonus for consecutive matches
                if let Some(last) = last_match {
                    if i == last + 1 {
                        consecutive += 1;
                        score += consecutive * 5;
                    } else {
                        consecutive = 0;
                    }
                }

                // Bonus for match at word boundary
                if i == 0 || target_lower.chars().nth(i.saturating_sub(1)).map_or(true, |c| c == ' ' || c == '-' || c == '_' || c == '.') {
                    score += 15;
                }

                last_match = Some(i);
                query_idx += 1;

                if query_idx >= query_lower.len() {
                    break;
                }
            }
        }
    }

    // All characters matched
    if query_idx >= query_lower.len() {
        score += 50;
    } else {
        score = 0; // Not all characters matched
    }

    // Bonus for shorter targets (more precise match)
    if query_lower.len() == target_lower.len() {
        score += 20;
    }

    score
}
