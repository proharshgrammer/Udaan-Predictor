# CSV Data Format Guide for College Predictor

This guide explains the required CSV structure for uploading JOSAA cutoff data to the predictor system. To ensure the system processes your data correctly, follow the column order and data types specified below.

---

## 1. Required CSV Files

For the system to function across different counselling types, you should prepare files using this standard:
* **`josaa_cutoffs.csv`** (IITs and NITs)
* `csab_cutoffs.csv`
* `aktu_cutoffs.csv`

---

## 2. CSV Structure

### Column Mapping
The CSV must contain **10 columns** in the exact order listed below.

| # | Column Name | Data Type | Description | Example |
|---|-------------|-----------|-------------|---------|
| 1 | **college_name** | String | Full name of the institute | Indian Institute of Technology Bhubaneswar |
| 2 | **branch_code** | String | Short branch code | CSE, ECE, ME, CE |
| 3 | **branch_name** | String | Full academic program name | Civil Engineering (4 Years, B.Tech) |
| 4 | **year** | Integer | Academic year | 2025, 2024, 2023 |
| 5 | **round** | Integer | Counselling round number | 1, 2, 3, 4, 5, 6 |
| 6 | **category** | String | Admission category | OPEN, OBC-NCL, SC, ST, EWS |
| 7 | **quota** | String | Seat quota type | AI, HS, OS |
| 8 | **gender_type** | String | Gender category | Gender-Neutral, Female-only |
| 9 | **opening_rank** | Integer | Opening rank | 10063 |
| 10 | **closing_rank** | Integer | Closing rank | 13957 |

---

## 3. Sample CSV Data

```csv
college_name,branch_code,branch_name,year,round,category,quota,gender_type,opening_rank,closing_rank
Indian Institute of Technology Bhubaneswar,CE,Civil Engineering (4 Years, Bachelor of Technology),2025,1,EWS,AI,Gender-Neutral,1912,2069
Indian Institute of Technology Bhubaneswar,CE,Civil Engineering (4 Years, Bachelor of Technology),2025,1,EWS,AI,Female-only,3450,3646
Indian Institute of Technology Bhubaneswar,CSE,Computer Science and Engineering (4 Years, Bachelor of Technology),2025,1,OPEN,AI,Gender-Neutral,2344,3785