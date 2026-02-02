# Leaderboard Scoring Algorithm

## Overview

The leaderboard system ranks participants based on their performance across multiple weeks of a cohort. Scores are aggregated from three main components: Group Discussions, Exercises, and Attendance. Each week's scores are scaled to a consistent maximum, ensuring fair comparison across different activities.

## Score Types

### 1. Group Discussion Score
- **Raw Maximum:** 150 points (100 from GD rounds + 50 from bonus round)
- **Scaled Maximum:** 30 points per week

### 2. Exercise Score
- **Raw Maximum:** 60 points
- **Scaled Maximum:** 60 points per week

### 3. Attendance Score
- **Binary:** Present (10 points) or Absent (0 points)
- **Scaled Maximum:** 10 points per week

## Weight Tables

### GD Round Weights (100 points max)

| Metric | Weight |
|--------|--------|
| Communication | 30 |
| Depth of Answer | 30 |
| Technical Bitcoin Fluency | 20 |
| Engagement | 20 |

### Bonus Round Weights (50 points max)

| Metric | Weight |
|--------|--------|
| Attempt | 10 |
| Answer | 30 |
| Followup | 10 |

### Exercise Weights (60 points max)

| Metric | Weight |
|--------|--------|
| Submission | 10 |
| Tests Passed | 50 |

### Scaling Factors (Per Week)

| Score Type | Scaled Max |
|------------|------------|
| Attendance | 10 |
| Group Discussion | 30 |
| Exercise | 60 |
| **Weekly Total** | **100** |

## Formulas

### Raw Score Calculation

**GD Raw Score:**
```
gdRawScore = communication + depth + technical + engagement + attempt + answer + followup
```

**Exercise Raw Score:**
```
exerciseRawScore = submission + testsPassed
```

### Scaling Formula

Scores are scaled to normalize different activities to their respective weights:

```
scaledScore = (rawScore / maxRawScore) * scalingFactor
```

**Example:**
- GD raw score: 120 out of 150
- Scaled GD score: (120 / 150) * 30 = 24 points

### Weekly Total

```
weeklyTotal = GD_scaled + Attendance_scaled + Exercise_scaled
```

Maximum per week: 30 + 10 + 60 = **100 points**

### Cohort Total

```
cohortTotal = sum(weeklyTotals for all weeks)
```

## Ranking Algorithm

Participants are ranked using a two-level sorting mechanism:

1. **Primary Sort:** Exercise total score (descending)
   - Participants with higher exercise scores rank higher

2. **Secondary Sort:** Total score (descending)
   - When exercise scores are equal, the participant with the higher total score ranks higher

This prioritization reflects the emphasis on practical coding skills demonstrated through exercises while still rewarding overall participation and performance.
