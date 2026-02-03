const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const AdmZip = require('adm-zip');

/**
 * Government Data Sources for Automotive Information
 * This module fetches real data from official government sources
 */

class GovernmentDataFetcher {
  constructor() {
    this.dataDir = path.join(__dirname, 'data');
    this.cacheFile = path.join(this.dataDir, 'government_data_cache.json');
    this.summaryFile = path.join(this.dataDir, 'data_summary.json');
    this.lastUpdateFile = path.join(this.dataDir, 'last_update.json');
    
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    // Government data source URLs
    this.dataSources = {
      us: {
        fuelEconomyCsvZip: 'https://www.fueleconomy.gov/feg/epadata/vehicles.csv.zip',
        nhtsa: 'https://api.nhtsa.gov/products/vehicle/makes',
        epaWebServices: 'https://www.fueleconomy.gov/feg/ws/index.shtml',
        description: 'US EPA Fuel Economy Data & NHTSA Vehicle Safety'
      },
      eu: {
        co2CsvZip: 'https://www.eea.europa.eu/ds_resolveuid/O8703K1M2P',
        eea: 'https://www.eea.europa.eu/data-and-maps/data/',
        description: 'EU Emissions & Environmental Agency Data'
      },
      uk: {
        vca: 'https://www.gov.uk/government/organisations/vehicle-certification-agency',
        dvla: 'https://www.gov.uk/government/statistical-data-sets/all-vehicles-veh01',
        vcaFuelData: 'https://www.vehicle-certification-agency.gov.uk/fuel-consumption-co2/new-car-fuel-consumption/',
        description: 'UK Vehicle Certification Agency & DVLA Statistics'
      },
      japan: {
        mlit: 'https://www.mlit.go.jp/k-toukei/nenryousyouhiryou.html',
        description: 'Japan Ministry of Land, Infrastructure, Transport and Tourism'
      },
      korea: {
        molit: 'https://www.molit.go.kr/english/intro.jsp',
        dataGoKr: 'https://www.data.go.kr/en/',
        description: 'Korea Ministry of Land, Infrastructure and Transport'
      }
    };

    this.updateInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.requestTimeoutMs = parseInt(process.env.GOV_DATA_TIMEOUT_MS || '30000', 10);
    this.maxVehiclesPerRegion = parseInt(process.env.GOV_DATA_MAX_VEHICLES || '5000', 10);
  }

  /**
   * Check if data needs updating
   */
  needsUpdate() {
    try {
      if (!fs.existsSync(this.lastUpdateFile)) {
        return true;
      }
      const lastUpdate = JSON.parse(fs.readFileSync(this.lastUpdateFile, 'utf8'));
      const timeSinceUpdate = Date.now() - lastUpdate.timestamp;
      return timeSinceUpdate > this.updateInterval;
    } catch (error) {
      console.error('Error checking update status:', error);
      return true;
    }
  }

  /**
   * Fetch data from a URL
   */
  async fetchText(url) {
    const buffer = await this.fetchBuffer(url);
    return buffer.toString('utf8');
  }

  async fetchBuffer(url) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;

      const request = protocol.get(url, (res) => {
        const chunks = [];

        res.on('data', (chunk) => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(Buffer.concat(chunks));
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          }
        });
      });

      request.on('error', (err) => {
        reject(err);
      });

      request.setTimeout(this.requestTimeoutMs, () => {
        request.destroy(new Error(`Request timed out after ${this.requestTimeoutMs}ms`));
      });
    });
  }

  /**
   * Parse CSV data (for EPA fuel economy data)
   */
  parseCSV(csvText) {
    return parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
      trim: true
    });
  }

  extractCsvFromZip(zipBuffer, preferredName) {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries().filter(entry =>
      entry.entryName.toLowerCase().endsWith('.csv')
    );

    if (entries.length === 0) {
      throw new Error('No CSV file found in zip archive');
    }

    let entry = entries[0];
    if (preferredName) {
      const preferred = entries.find(e =>
        e.entryName.toLowerCase().includes(preferredName.toLowerCase())
      );
      if (preferred) entry = preferred;
    }

    return entry.getData().toString('utf8');
  }

  normalizeNumber(value) {
    if (value === undefined || value === null || value === '') return null;
    const num = Number(String(value).replace(/,/g, '').trim());
    return Number.isFinite(num) ? num : null;
  }

  pickFirst(row, keys) {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
        return row[key];
      }
      const altKey = Object.keys(row).find(k => k.toLowerCase() === key.toLowerCase());
      if (altKey && row[altKey] !== undefined && row[altKey] !== null && row[altKey] !== '') {
        return row[altKey];
      }
    }
    return null;
  }

  buildUrlWithServiceKey(url, serviceKey) {
    if (!serviceKey) return url;
    if (/serviceKey=/i.test(url)) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}serviceKey=${encodeURIComponent(serviceKey)}`;
  }

  extractItemsFromJson(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.results)) return data.results;
    if (data.response?.body?.items?.item) {
      const items = data.response.body.items.item;
      return Array.isArray(items) ? items : [items];
    }
    if (data.result && Array.isArray(data.result)) return data.result;
    return [];
  }

  normalizeCsvVehicles(rows, region) {
    const vehicles = [];
    const makeKeys = ['make', 'Make', 'manufacturer', 'Manufacturer', 'ManufacturerName', 'Brand'];
    const modelKeys = ['model', 'Model', 'ModelName', 'CommercialName', 'VehicleName', 'Variant', 'Type'];
    const yearKeys = ['year', 'Year', 'ModelYear', 'model_year'];
    const fuelKeys = ['fuelType', 'FuelType', 'Fuel Type', 'fuel', 'Fuel'];
    const co2Keys = ['co2', 'CO2', 'CO2g/km', 'CO2 (g/km)', 'co2Emissions', 'CO2 emissions g/km'];
    const consumptionKeys = ['fuelConsumption', 'Fuel consumption', 'Fuel Consumption', 'FC', 'FC (l/100km)', 'FuelConsumption'];

    for (const row of rows) {
      const make = this.pickFirst(row, makeKeys);
      const model = this.pickFirst(row, modelKeys);
      const year = this.normalizeNumber(this.pickFirst(row, yearKeys));
      const fuelType = this.pickFirst(row, fuelKeys);
      const co2Emissions = this.normalizeNumber(this.pickFirst(row, co2Keys));
      const fuelConsumption = this.normalizeNumber(this.pickFirst(row, consumptionKeys));

      if (!make || !model) continue;

      vehicles.push({
        make,
        model,
        year,
        fuelType,
        co2Emissions,
        fuelConsumption,
        region
      });

      if (vehicles.length >= this.maxVehiclesPerRegion) break;
    }

    return vehicles;
  }

  isZipUrl(url) {
    return typeof url === 'string' && url.toLowerCase().endsWith('.zip');
  }

  isCsvUrl(url) {
    return typeof url === 'string' && url.toLowerCase().endsWith('.csv');
  }

  /**
   * Fetch US EPA Fuel Economy Data
   * Real endpoint for vehicle fuel economy
   */
  async fetchUSData() {
    try {
      console.log('Fetching US EPA data...');

      const csvZipUrl = process.env.US_EPA_VEHICLES_ZIP_URL || this.dataSources.us.fuelEconomyCsvZip;
      const csvUrl = process.env.US_EPA_CSV_URL;
      const sourceUrl = csvUrl || csvZipUrl;
      let csvText = '';

      if (this.isZipUrl(sourceUrl)) {
        const zipBuffer = await this.fetchBuffer(sourceUrl);
        csvText = this.extractCsvFromZip(zipBuffer, 'vehicles.csv');
      } else if (this.isCsvUrl(sourceUrl)) {
        csvText = await this.fetchText(sourceUrl);
      } else {
        console.warn('US EPA URL must be a .csv or .zip. Skipping US data fetch.');
        return {
          source: 'US EPA Fuel Economy',
          lastUpdated: new Date().toISOString(),
          vehicles: [],
          apiEndpoint: sourceUrl,
          notes: 'Invalid URL (expected .csv or .zip)'
        };
      }

      const rows = this.parseCSV(csvText);

      const vehicles = [];
      for (const row of rows) {
        const make = row.make || row.Make;
        const model = row.model || row.Model;
        const year = this.normalizeNumber(row.year || row.Year);
        if (!make || !model || !year) continue;

        const combinedMPG = this.normalizeNumber(row.comb08 || row.combE);
        const cityMPG = this.normalizeNumber(row.city08 || row.cityE);
        const highwayMPG = this.normalizeNumber(row.highway08 || row.highwayE);
        const fuelCostPerYear = this.normalizeNumber(row.fuelCost08 || row.fuelCostA08);
        const co2Emissions = this.normalizeNumber(row.co2TailpipeGpm);
        const fuelType = row.fuelType1 || row.FuelType1 || row.fuelType;

        vehicles.push({
          make,
          model,
          year,
          fuelType,
          cityMPG,
          highwayMPG,
          combinedMPG,
          co2Emissions,
          fuelCostPerYear,
          region: 'us'
        });

        if (vehicles.length >= this.maxVehiclesPerRegion) break;
      }

      const usData = {
        source: 'US EPA Fuel Economy',
        lastUpdated: new Date().toISOString(),
        vehicles,
        apiEndpoint: sourceUrl,
        notes: 'FuelEconomy.gov vehicles.csv.zip (city/highway/combined MPG and annual fuel costs)'
      };
      
      return usData;
    } catch (error) {
      console.error('Error fetching US data:', error);
      return null;
    }
  }

  /**
   * Fetch EU Emissions Data
   */
  async fetchEUData() {
    try {
      console.log('Fetching EU emissions data...');

      const co2ZipUrl = process.env.EU_EEA_CO2_ZIP_URL || this.dataSources.eu.co2CsvZip;
      const co2CsvUrl = process.env.EU_EEA_CO2_CSV_URL;
      const sourceUrl = co2CsvUrl || co2ZipUrl;
      let csvText = '';

      if (this.isZipUrl(sourceUrl)) {
        const zipBuffer = await this.fetchBuffer(sourceUrl);
        csvText = this.extractCsvFromZip(zipBuffer);
      } else if (this.isCsvUrl(sourceUrl)) {
        csvText = await this.fetchText(sourceUrl);
      } else {
        console.warn('EU EEA URL must be a .csv or .zip. Skipping EU data fetch.');
        return {
          source: 'EU Environmental Agency',
          lastUpdated: new Date().toISOString(),
          vehicles: [],
          apiEndpoint: sourceUrl,
          notes: 'Invalid URL (expected .csv or .zip)'
        };
      }

      const rows = this.parseCSV(csvText);
      const vehicles = this.normalizeCsvVehicles(rows, 'eu');

      const euData = {
        source: 'EU Environmental Agency',
        lastUpdated: new Date().toISOString(),
        vehicles,
        apiEndpoint: sourceUrl,
        notes: 'EEA CO2 passenger cars dataset (CSV in zip, WLTP data)'
      };
      
      return euData;
    } catch (error) {
      console.error('Error fetching EU data:', error);
      return null;
    }
  }

  /**
   * Fetch UK VCA Data
   */
  async fetchUKData() {
    try {
      console.log('Fetching UK VCA data...');

      const ukCsvUrl = process.env.UK_VCA_CSV_URL;
      let vehicles = [];
      if (ukCsvUrl) {
        if (this.isZipUrl(ukCsvUrl)) {
          const zipBuffer = await this.fetchBuffer(ukCsvUrl);
          const csvText = this.extractCsvFromZip(zipBuffer);
          const rows = this.parseCSV(csvText);
          vehicles = this.normalizeCsvVehicles(rows, 'uk');
        } else if (this.isCsvUrl(ukCsvUrl)) {
          const csvText = await this.fetchText(ukCsvUrl);
          const rows = this.parseCSV(csvText);
          vehicles = this.normalizeCsvVehicles(rows, 'uk');
        } else {
          console.warn('UK_VCA_CSV_URL must be a direct .csv or .zip download. Skipping UK data fetch.');
        }
      } else {
        console.warn('UK_VCA_CSV_URL not set. Skipping UK data fetch.');
      }

      const ukData = {
        source: 'UK Vehicle Certification Agency',
        lastUpdated: new Date().toISOString(),
        vehicles,
        apiEndpoint: ukCsvUrl || this.dataSources.uk.vcaFuelData,
        notes: ukCsvUrl ? 'VCA fuel consumption CSV download' : 'No CSV URL configured'
      };
      
      return ukData;
    } catch (error) {
      console.error('Error fetching UK data:', error);
      return null;
    }
  }

  /**
   * Fetch Japan MLIT Data
   */
  async fetchJapanData() {
    try {
      console.log('Fetching Japan MLIT data...');

      const jpCsvUrl = process.env.JP_MLIT_CSV_URL;
      let vehicles = [];
      if (jpCsvUrl) {
        if (this.isZipUrl(jpCsvUrl)) {
          const zipBuffer = await this.fetchBuffer(jpCsvUrl);
          const csvText = this.extractCsvFromZip(zipBuffer);
          const rows = this.parseCSV(csvText);
          vehicles = this.normalizeCsvVehicles(rows, 'japan');
        } else if (this.isCsvUrl(jpCsvUrl)) {
          const csvText = await this.fetchText(jpCsvUrl);
          const rows = this.parseCSV(csvText);
          vehicles = this.normalizeCsvVehicles(rows, 'japan');
        } else {
          console.warn('JP_MLIT_CSV_URL must be a direct .csv or .zip download. Skipping Japan data fetch.');
        }
      } else {
        console.warn('JP_MLIT_CSV_URL not set. Skipping Japan data fetch.');
      }

      const japanData = {
        source: 'Japan Ministry of Land, Infrastructure, Transport',
        lastUpdated: new Date().toISOString(),
        vehicles,
        apiEndpoint: jpCsvUrl || this.dataSources.japan.mlit,
        notes: jpCsvUrl ? 'MLIT fuel economy CSV download' : 'No CSV URL configured'
      };
      
      return japanData;
    } catch (error) {
      console.error('Error fetching Japan data:', error);
      return null;
    }
  }

  /**
   * Fetch Korea MOLIT Data
   */
  async fetchKoreaData() {
    try {
      console.log('Fetching Korea MOLIT data...');

      const apiUrl = process.env.KOREA_DATA_API_URL;
      const apiKey = process.env.KOREA_DATA_API_KEY;
      let vehicles = [];

      if (apiUrl) {
        if (!apiKey) {
          console.warn('KOREA_DATA_API_KEY is not set. API may reject requests.');
        }
        const urlWithKey = this.buildUrlWithServiceKey(apiUrl, apiKey);
        const responseBuffer = await this.fetchBuffer(urlWithKey);
        let data = null;
        try {
          data = JSON.parse(responseBuffer.toString('utf8'));
        } catch (error) {
          console.error('Error parsing Korea API JSON:', error);
        }

        if (data) {
          const items = this.extractItemsFromJson(data);
          vehicles = this.normalizeCsvVehicles(items, 'korea');
        }
      } else {
        console.warn('KOREA_DATA_API_URL not set. Skipping Korea data fetch.');
      }

      const koreaData = {
        source: 'Korea Ministry of Land, Infrastructure and Transport',
        lastUpdated: new Date().toISOString(),
        vehicles,
        apiEndpoint: apiUrl || this.dataSources.korea.dataGoKr,
        notes: apiUrl ? 'data.go.kr vehicle efficiency API' : 'No API URL configured'
      };
      
      return koreaData;
    } catch (error) {
      console.error('Error fetching Korea data:', error);
      return null;
    }
  }

  /**
   * Fetch all government data
   */
  async fetchAllData() {
    console.log('Starting government data fetch...');
    
    const allData = {
      us: await this.fetchUSData(),
      eu: await this.fetchEUData(),
      uk: await this.fetchUKData(),
      japan: await this.fetchJapanData(),
      korea: await this.fetchKoreaData(),
      lastUpdated: new Date().toISOString(),
      sources: this.dataSources
    };

    // Save to cache
    this.saveCache(allData);
    
    // Update last update timestamp
    fs.writeFileSync(this.lastUpdateFile, JSON.stringify({
      timestamp: Date.now(),
      date: new Date().toISOString()
    }));

    // Generate summary
    this.generateSummary(allData);

    console.log('Government data fetch completed!');
    return allData;
  }

  /**
   * Save data to cache file
   */
  saveCache(data) {
    try {
      fs.writeFileSync(this.cacheFile, JSON.stringify(data, null, 2));
      console.log('Cache saved successfully');
    } catch (error) {
      console.error('Error saving cache:', error);
    }
  }

  /**
   * Load data from cache
   */
  loadCache() {
    try {
      if (fs.existsSync(this.cacheFile)) {
        const data = fs.readFileSync(this.cacheFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading cache:', error);
    }
    return null;
  }

  /**
   * Generate searchable summary
   */
  generateSummary(data) {
    const summary = {
      lastUpdated: data.lastUpdated,
      totalVehicles: 0,
      byRegion: {},
      byFuelType: {},
      averages: {},
      searchIndex: []
    };

    // Process each region
    Object.keys(data).forEach(region => {
      if (region === 'lastUpdated' || region === 'sources') return;
      
      const regionData = data[region];
      if (!regionData || !regionData.vehicles) return;

      summary.byRegion[region] = {
        source: regionData.source,
        vehicleCount: regionData.vehicles.length,
        lastUpdated: regionData.lastUpdated
      };

      // Process vehicles
      regionData.vehicles.forEach(vehicle => {
        summary.totalVehicles++;

        // Build search index
        summary.searchIndex.push({
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          fuelType: vehicle.fuelType,
          region: region,
          ...vehicle
        });

        // Count by fuel type
        const fuelType = vehicle.fuelType || 'Unknown';
        summary.byFuelType[fuelType] = (summary.byFuelType[fuelType] || 0) + 1;
      });
    });

    // Save summary
    fs.writeFileSync(this.summaryFile, JSON.stringify(summary, null, 2));
    console.log('Summary generated successfully');
    
    return summary;
  }

  /**
   * Get data (from cache or fetch new)
   */
  async getData() {
    if (this.needsUpdate()) {
      console.log('Data needs update, fetching fresh data...');
      return await this.fetchAllData();
    } else {
      console.log('Using cached data...');
      return this.loadCache();
    }
  }

  /**
   * Get summary
   */
  getSummary() {
    try {
      if (fs.existsSync(this.summaryFile)) {
        return JSON.parse(fs.readFileSync(this.summaryFile, 'utf8'));
      }
    } catch (error) {
      console.error('Error loading summary:', error);
    }
    return null;
  }

  /**
   * Search in government data
   */
  search(query) {
    if (!query || !query.trim()) return [];
    const summary = this.getSummary();
    if (!summary || !summary.searchIndex) return [];

    const queryLower = query.toLowerCase();
    
    return summary.searchIndex.filter(vehicle => {
      return (
        vehicle.make?.toLowerCase().includes(queryLower) ||
        vehicle.model?.toLowerCase().includes(queryLower) ||
        vehicle.fuelType?.toLowerCase().includes(queryLower) ||
        vehicle.region?.toLowerCase().includes(queryLower)
      );
    });
  }

  /**
   * Force update data
   */
  async forceUpdate() {
    console.log('Forcing data update...');
    return await this.fetchAllData();
  }

  /**
   * Get data freshness info
   */
  getDataInfo() {
    try {
      const lastUpdate = JSON.parse(fs.readFileSync(this.lastUpdateFile, 'utf8'));
      const timeSinceUpdate = Date.now() - lastUpdate.timestamp;
      const hoursAgo = Math.floor(timeSinceUpdate / (1000 * 60 * 60));
      
      return {
        lastUpdated: lastUpdate.date,
        hoursAgo: hoursAgo,
        needsUpdate: this.needsUpdate(),
        cacheExists: fs.existsSync(this.cacheFile),
        summaryExists: fs.existsSync(this.summaryFile)
      };
    } catch (error) {
      return {
        lastUpdated: 'Never',
        hoursAgo: Infinity,
        needsUpdate: true,
        cacheExists: false,
        summaryExists: false
      };
    }
  }
}

module.exports = GovernmentDataFetcher;
