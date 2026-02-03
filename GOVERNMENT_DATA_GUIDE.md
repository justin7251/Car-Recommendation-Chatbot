# Government Data Integration Guide

## 🌍 Real-Time Government Automotive Data

Your car recommendation chatbot now integrates **live government data** from official automotive agencies worldwide!

## ✅ Required URLs & Keys

To enable multi-region live data, set the following environment variables:

```
US_EPA_VEHICLES_ZIP_URL=https://www.fueleconomy.gov/feg/epadata/vehicles.csv.zip
US_EPA_CSV_URL=https://www.fueleconomy.gov/feg/epadata/vehicles.csv
EU_EEA_CO2_ZIP_URL=https://www.eea.europa.eu/ds_resolveuid/O8703K1M2P
EU_EEA_CO2_CSV_URL=<direct CSV download URL (optional)>
UK_VCA_CSV_URL=<direct CSV download URL from VCA>
JP_MLIT_CSV_URL=<direct CSV download URL from MLIT/e-Stat>
KOREA_DATA_API_URL=<data.go.kr API endpoint>
KOREA_DATA_API_KEY=<data.go.kr service key>
GOV_DATA_MAX_VEHICLES=5000
GOV_DATA_TIMEOUT_MS=30000
```

If a region URL is not configured, that region will be skipped and the cache will still refresh for other regions.

## 📊 Data Sources

### United States 🇺🇸
- **EPA (Environmental Protection Agency)**
  - Fuel economy ratings (MPG)
  - CO2 emissions
  - Annual fuel costs
  - Source: https://www.fueleconomy.gov/

- **NHTSA (National Highway Traffic Safety Administration)**
  - Vehicle safety ratings
  - Recall information
  - Source: https://api.nhtsa.gov/

### European Union 🇪🇺
- **EEA (European Environment Agency)**
  - WLTP emissions data
  - Euro emission standards (Euro 6d, etc.)
  - Fuel consumption (L/100km)
  - Source: https://data.europa.eu/

### United Kingdom 🇬🇧
- **VCA (Vehicle Certification Agency)**
  - UK road tax bands
  - CO2 emissions
  - WLTP test results
  - Source: https://www.gov.uk/government/organisations/vehicle-certification-agency

- **DVLA (Driver and Vehicle Licensing Agency)**
  - Vehicle statistics
  - Registration data
  - Source: https://www.gov.uk/government/statistical-data-sets/

### Japan 🇯🇵
- **MLIT (Ministry of Land, Infrastructure, Transport and Tourism)**
  - JC08 fuel economy ratings
  - WLTC mode data
  - Emission standards
  - Source: https://www.mlit.go.jp/

### South Korea 🇰🇷
- **MOLIT (Ministry of Land, Infrastructure and Transport)**
  - Korean certification data
  - Electric vehicle range
  - Efficiency ratings (km/kWh)
  - Source: https://www.molit.go.kr/

## 🔄 Automatic Data Updates

### How It Works

1. **Initial Load**: On server startup, fetches latest government data
2. **Cache System**: Stores data locally for fast access
3. **Auto-Update**: Checks every hour if data is older than 24 hours
4. **Manual Update**: Users can force update via UI button

### Update Schedule
```
├─ Server Startup: Immediate fetch
├─ Every 1 Hour: Check if update needed
├─ Every 24 Hours: Automatic refresh
└─ On Demand: Manual update button
```

### Data Storage
```
project/
└── data/
    ├── government_data_cache.json    # Full dataset
    ├── data_summary.json             # Searchable index
    └── last_update.json              # Update timestamp
```

## 🔍 Search Functionality

### What You Can Search

Users can search for:
- **Make/Brand**: "Toyota", "BMW", "Tesla"
- **Model**: "Camry", "Model 3", "Civic"
- **Fuel Type**: "hybrid", "electric", "diesel"
- **Region**: "us", "eu", "japan"

### Example Searches

```javascript
// Search by make
"Show me Toyota vehicles from government data"

// Search by fuel type
"Find electric cars in US EPA database"

// Search by region
"Japanese certified hybrids"

// Combined search
"European electric vehicles"
```

## 📡 API Endpoints

### Get Data Info
```http
GET /api/government-data/info
```

**Response:**
```json
{
  "dataInfo": {
    "lastUpdated": "2024-02-02T22:00:00.000Z",
    "hoursAgo": 2,
    "needsUpdate": false,
    "cacheExists": true,
    "summaryExists": true
  },
  "summary": {
    "totalVehicles": 15,
    "regions": ["us", "eu", "uk", "japan", "korea"],
    "fuelTypes": ["Hybrid", "Electric", "Gasoline", "Diesel"],
    "lastUpdated": "2024-02-02T22:00:00.000Z"
  }
}
```

### Search Government Data
```http
POST /api/government-data/search
Content-Type: application/json

{
  "query": "Toyota hybrid"
}
```

**Response:**
```json
{
  "query": "Toyota hybrid",
  "count": 2,
  "results": [
    {
      "make": "Toyota",
      "model": "Camry",
      "year": 2024,
      "fuelType": "Hybrid",
      "cityMPG": 51,
      "highwayMPG": 53,
      "combinedMPG": 52,
      "co2Emissions": 171,
      "fuelCostPerYear": 900,
      "region": "us"
    },
    {
      "make": "Toyota",
      "model": "Prius",
      "year": 2024,
      "fuelType": "Hybrid",
      "fuelEconomy": 28.0,
      "region": "japan"
    }
  ],
  "dataInfo": { ... }
}
```

### Force Update
```http
POST /api/government-data/update
```

**Response:**
```json
{
  "success": true,
  "message": "Government data updated successfully",
  "lastUpdated": "2024-02-02T22:30:00.000Z"
}
```

### Get Full Dataset
```http
GET /api/government-data/full
```

Returns complete cached government data.

## 🎯 Data Integration with Recommendations

### Government Verification Badge

When a car in your database matches government data:
- ✅ **"Gov Verified"** badge appears
- Real-time fuel costs updated
- Accurate MPG from official sources
- Region indicator shown

### Example Integration
```javascript
// Local database car
{
  make: "Toyota",
  model: "Camry",
  price: 27000,
  costs: { fuelPerYear: 980 }  // Estimate
}

// After government data merge
{
  make: "Toyota",
  model: "Camry",
  price: 27000,
  costs: { fuelPerYear: 900 },     // Updated from EPA
  governmentVerified: true,         // Badge shown
  governmentSource: "us",           // EPA data
  costs.mpg: 52                     // Official EPA rating
}
```

## 📈 Data Quality & Accuracy

### Official Sources
- All data from verified government agencies
- Updated regularly by authorities
- Based on standardized testing procedures

### Testing Standards
- **US**: EPA test procedures
- **EU/UK**: WLTP (Worldwide Harmonized Light Vehicles Test Procedure)
- **Japan**: JC08 and WLTP modes
- **Korea**: Korean certification standards

### Data Freshness Indicators

| Status | Description | Color |
|--------|-------------|-------|
| 🟢 Fresh | < 1 hour old | Green |
| 🟢 Current | < 24 hours old | Green |
| 🟡 Aging | 1-7 days old | Yellow |
| 🔴 Stale | > 7 days old | Red |

## 🛠️ Setup & Configuration

### Installation

1. **Install Dependencies**
```bash
npm install
```

2. **Start Server**
```bash
node app.js
```

3. **Data Auto-Fetches**
- Initial load on startup
- Creates `data/` directory automatically
- Begins auto-update schedule

### Configuration Options

Edit `governmentDataFetcher.js`:

```javascript
// Update interval (default: 24 hours)
this.updateInterval = 24 * 60 * 60 * 1000;

// Data directory
this.dataDir = path.join(__dirname, 'data');

// Cache settings
this.cacheFile = 'government_data_cache.json';
this.summaryFile = 'data_summary.json';
```

## 🔐 Data Privacy & Usage

### What's Stored
- Public vehicle specifications
- Fuel economy ratings
- Emissions data
- No personal information

### Data Usage
- Read-only access to government APIs
- Local caching for performance
- No data transmission to third parties

## 🚀 Advanced Features

### Custom Data Sources

Add your own data sources:

```javascript
// In governmentDataFetcher.js
this.dataSources.customCountry = {
  endpoint: 'https://...',
  description: 'Custom data source'
};

async fetchCustomData() {
  // Implement custom fetcher
}
```

### Scheduled Updates

Customize update schedule:

```javascript
// In app.js
setInterval(async () => {
  if (dataFetcher.needsUpdate()) {
    await dataFetcher.fetchAllData();
  }
}, 30 * 60 * 1000); // Every 30 minutes
```

### Data Webhooks

Get notified of updates:

```javascript
dataFetcher.on('update', (data) => {
  console.log('New data available!', data.lastUpdated);
  // Trigger notifications
});
```

## 📊 Sample Data Structure

### US EPA Data
```json
{
  "source": "US EPA Fuel Economy",
  "lastUpdated": "2024-02-02T22:00:00.000Z",
  "vehicles": [
    {
      "make": "Toyota",
      "model": "Camry",
      "year": 2024,
      "fuelType": "Hybrid",
      "cityMPG": 51,
      "highwayMPG": 53,
      "combinedMPG": 52,
      "co2Emissions": 171,
      "fuelCostPerYear": 900
    }
  ],
  "notes": "Based on 15,000 miles annually"
}
```

### EU EEA Data
```json
{
  "source": "EU Environmental Agency",
  "lastUpdated": "2024-02-02T22:00:00.000Z",
  "vehicles": [
    {
      "make": "BMW",
      "model": "3 Series",
      "year": 2024,
      "fuelType": "Gasoline",
      "co2Emissions": 142,
      "euroStandard": "Euro 6d",
      "fuelConsumption": 6.1
    }
  ],
  "notes": "WLTP testing procedure"
}
```

## ❓ Troubleshooting

### Data Not Updating

1. Check network connection
2. Verify API endpoints are accessible
3. Check `data/last_update.json` timestamp
4. Try manual update via UI button

### Cache Issues

Clear cache and force refresh:
```bash
rm -rf data/
# Restart server - will fetch fresh data
```

### API Rate Limits

If hitting rate limits:
- Increase `updateInterval`
- Cache data longer
- Implement exponential backoff

## 📝 API Response Examples

### Successful Search
✅ Found government-verified data:
```
"✓ Gov Verified" badge shown
Updated fuel costs from EPA
Official MPG ratings displayed
Data source: US EPA
```

### No Government Data
⚠️ Using local estimates:
```
No verification badge
Local cost estimates used
Standard database values
```

## 🎓 Best Practices

1. **Always check data freshness** before making decisions
2. **Use government-verified data** when available
3. **Update regularly** to get latest ratings
4. **Cross-reference** multiple sources when possible
5. **Note regional differences** in testing standards

## 📞 Support & Resources

### Official Government Sites
- US EPA: https://www.fueleconomy.gov/
- EU EEA: https://www.eea.europa.eu/
- UK VCA: https://www.vehicle-certification-agency.gov.uk/
- Japan MLIT: https://www.mlit.go.jp/
- Korea MOLIT: https://www.molit.go.kr/

### Getting Help
- Check console logs for errors
- Verify data file permissions
- Ensure network access to APIs
- Review data summary for accuracy

---

**Your chatbot now provides real, verified government data instead of static estimates! 🎉**
