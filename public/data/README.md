# Data Directory

**Note**: SOTA database files (`sota.db`, `sota-data.json`) are **NOT committed to git**. They are automatically generated during the deployment process.

- **Generated files** (in .gitignore):
  - `sota.db` - SQLite database with R*Tree spatial index (~44 MB)
  - `sota.db-shm`, `sota.db-wal` - SQLite temporary files
  - `sota-data.json` - JSON format database (legacy)

- **Committed files**:
  - `location-data.json` - JCC/JCG location reference data
  - `README.md` - This file

---

# JCC/JCG Data Structure

## location-data.json Structure

```json
{
  "version": "1.0.0",
  "lastUpdate": "2024-02-03",
  "locations": [
    {
      "lat": 35.6895,
      "lon": 139.6917,
      "prefecture": "Tokyo",
      "city": "Chiyoda",
      "jcc": "1001",
      "jcg": "10001"
    }
  ]
}
```

## Field Descriptions

- `version`: Data format version
- `lastUpdate`: Last update date (YYYY-MM-DD format)
- `locations`: Array of location data

### Location Object

- `lat`: Latitude (decimal format)
- `lon`: Longitude (decimal format)
- `prefecture`: Prefecture name
- `city`: City/municipality name
- `jcc`: JCC (Japan Century City) code
- `jcg`: JCG (Japan Century Gun) code

## How to Add Data

### Manual Addition

Add a new object to the `locations` array:

```json
{
  "lat": latitude,
  "lon": longitude,
  "prefecture": "Prefecture name",
  "city": "City name",
  "jcc": "JCC code",
  "jcg": "JCG code"
}
```

### Data Sources

JCC/JCG codes can be obtained from:

- JARL (Japan Amateur Radio League) official website
- JCC/JCG lists (published as PDF, etc.)
- Amateur radio-related databases

### Recommended Data Points

To improve accuracy, it's recommended to add representative points for each city/municipality:

1. Location of city/municipal office
2. Major mountain points (convenient for SOTA operations)
3. Boundary points (to improve detection accuracy)

## Data Validation

Please validate data with attention to these points:

1. Latitude must be in range -90 to 90
2. Longitude must be in range -180 to 180
3. JCC/JCG codes must be in correct format (4-5 digit numbers)
4. Prefecture/city names must use official names

## Advanced Data Structure (Future Extension)

Future extensions could include:

```json
{
  "lat": 35.6895,
  "lon": 139.6917,
  "prefecture": "Tokyo",
  "city": "Chiyoda",
  "jcc": "1001",
  "jcg": "10001",
  "elevation": 25,           // Elevation (meters)
  "gl": "PM95",              // Grid locator
  "bounds": {                // Boundary information
    "north": 35.7,
    "south": 35.68,
    "east": 139.7,
    "west": 139.68
  }
}
```

## Data Contributions

If you have more detailed JCC/JCG data, please send a pull request!

It will benefit the entire amateur radio community.

## License

Please follow the regulations of JARL and related organizations regarding the copyright of JCC/JCG codes.
