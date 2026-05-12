# Smart Scheduling V1

## Goal
Add a lightweight "Suggerisci orario migliore" action inside the scheduling modal, without introducing backend complexity yet.

## V1 behavior
- Triggered manually by the user from the scheduling modal
- Works with the currently selected socials
- Requires a selected date
- If the modal is in unified-time mode:
  - suggests one shared time across the selected socials
- If the modal is in per-social mode:
  - fills one suggested slot per selected platform

## Static slot map
- Instagram: `12:30`, `18:30`, `21:00`
- Facebook: `12:30`, `18:30`
- LinkedIn: `08:00`, `12:00`
- Pinterest: `18:00`, `21:00`
- TikTok: `18:00`, `21:30`

## Selection logic
- Future date:
  - use the first preferred slot for each platform
- Today:
  - skip preferred slots already passed
  - if all preferred slots are in the past, fallback to the next rounded future slot

## Unified suggestion logic
- Build the union of preferred slots for the selected platforms
- Score each candidate using weighted preference order per platform
- Pick the highest-scoring valid candidate
- Tie-breaker:
  - earliest valid time wins

## Why V1 is frontend-only
- No DB changes
- No backend endpoint yet
- Fast to test and iterate
- Gives immediate product value

## V2
- Use project analytics to rank best-performing weekday/time windows
- Suggest the next best free slot per platform
- Persist recommendation metadata for explainability

## V3
- Optional "Auto schedule at best time"
- Never default-on
- Potential plan-gated feature
