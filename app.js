const express = require('express');
const bodyParser = require('body-parser');
const compromise = require('compromise');
const path = require('path');
const GovernmentDataFetcher = require('./governmentDataFetcher');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Initialize government data fetcher
const dataFetcher = new GovernmentDataFetcher();

// Fetch government data on startup (async)
dataFetcher.getData().then(data => {
  console.log('Government data loaded successfully!');
}).catch(err => {
  console.error('Error loading government data:', err);
});

// Auto-update check every hour
setInterval(async () => {
  if (dataFetcher.needsUpdate()) {
    console.log('Auto-updating government data...');
    await dataFetcher.fetchAllData();
  }
}, 60 * 60 * 1000); // Check every hour

// Comprehensive car database with total cost of ownership
const carDatabase = [
  // Economy Cars
  { 
    make: 'Toyota', model: 'Corolla', price: 22000, type: 'sedan', fuelType: 'hybrid', seats: 5, 
    features: ['fuel-efficient', 'reliable', 'affordable'],
    costs: { insurance: 1400, maintenance: 400, fuelPerYear: 900, taxRate: 0.065, mpg: 52 }
  },
  { 
    make: 'Honda', model: 'Civic', price: 24000, type: 'sedan', fuelType: 'gasoline', seats: 5, 
    features: ['sporty', 'reliable', 'fuel-efficient'],
    costs: { insurance: 1500, maintenance: 450, fuelPerYear: 1250, taxRate: 0.065, mpg: 36 }
  },
  { 
    make: 'Hyundai', model: 'Elantra', price: 21000, type: 'sedan', fuelType: 'gasoline', seats: 5, 
    features: ['affordable', 'warranty', 'modern'],
    costs: { insurance: 1350, maintenance: 500, fuelPerYear: 1300, taxRate: 0.065, mpg: 35 }
  },
  { 
    make: 'Kia', model: 'Forte', price: 20000, type: 'sedan', fuelType: 'gasoline', seats: 5, 
    features: ['affordable', 'warranty', 'spacious'],
    costs: { insurance: 1300, maintenance: 480, fuelPerYear: 1280, taxRate: 0.065, mpg: 35 }
  },
  { 
    make: 'Nissan', model: 'Sentra', price: 21500, type: 'sedan', fuelType: 'gasoline', seats: 5, 
    features: ['comfortable', 'affordable', 'reliable'],
    costs: { insurance: 1380, maintenance: 520, fuelPerYear: 1350, taxRate: 0.065, mpg: 33 }
  },
  
  // Mid-Range Sedans
  { 
    make: 'Honda', model: 'Accord', price: 28000, type: 'sedan', fuelType: 'hybrid', seats: 5, 
    features: ['spacious', 'reliable', 'comfortable'],
    costs: { insurance: 1600, maintenance: 500, fuelPerYear: 1000, taxRate: 0.065, mpg: 48 }
  },
  { 
    make: 'Toyota', model: 'Camry', price: 27000, type: 'sedan', fuelType: 'hybrid', seats: 5, 
    features: ['reliable', 'comfortable', 'fuel-efficient'],
    costs: { insurance: 1550, maintenance: 480, fuelPerYear: 980, taxRate: 0.065, mpg: 50 }
  },
  { 
    make: 'Mazda', model: 'Mazda6', price: 26000, type: 'sedan', fuelType: 'gasoline', seats: 5, 
    features: ['sporty', 'elegant', 'fun-to-drive'],
    costs: { insurance: 1580, maintenance: 550, fuelPerYear: 1450, taxRate: 0.065, mpg: 30 }
  },
  { 
    make: 'Subaru', model: 'Legacy', price: 25000, type: 'sedan', fuelType: 'gasoline', seats: 5, 
    features: ['awd', 'safe', 'reliable'],
    costs: { insurance: 1520, maintenance: 600, fuelPerYear: 1500, taxRate: 0.065, mpg: 29 }
  },
  { 
    make: 'Volkswagen', model: 'Jetta', price: 23000, type: 'sedan', fuelType: 'gasoline', seats: 5, 
    features: ['european', 'refined', 'efficient'],
    costs: { insurance: 1480, maintenance: 650, fuelPerYear: 1380, taxRate: 0.065, mpg: 33 }
  },
  
  // Compact SUVs
  { 
    make: 'Honda', model: 'CR-V', price: 30000, type: 'suv', fuelType: 'hybrid', seats: 5, 
    features: ['spacious', 'reliable', 'versatile'],
    costs: { insurance: 1700, maintenance: 550, fuelPerYear: 1100, taxRate: 0.065, mpg: 40 }
  },
  { 
    make: 'Toyota', model: 'RAV4', price: 29000, type: 'suv', fuelType: 'hybrid', seats: 5, 
    features: ['reliable', 'awd', 'fuel-efficient'],
    costs: { insurance: 1680, maintenance: 520, fuelPerYear: 1080, taxRate: 0.065, mpg: 41 }
  },
  { 
    make: 'Mazda', model: 'CX-5', price: 28500, type: 'suv', fuelType: 'gasoline', seats: 5, 
    features: ['sporty', 'upscale', 'fun-to-drive'],
    costs: { insurance: 1650, maintenance: 600, fuelPerYear: 1600, taxRate: 0.065, mpg: 27 }
  },
  { 
    make: 'Subaru', model: 'Forester', price: 27500, type: 'suv', fuelType: 'gasoline', seats: 5, 
    features: ['awd', 'safe', 'practical'],
    costs: { insurance: 1620, maintenance: 620, fuelPerYear: 1550, taxRate: 0.065, mpg: 28 }
  },
  { 
    make: 'Nissan', model: 'Rogue', price: 28000, type: 'suv', fuelType: 'gasoline', seats: 5, 
    features: ['comfortable', 'spacious', 'family-friendly'],
    costs: { insurance: 1640, maintenance: 580, fuelPerYear: 1580, taxRate: 0.065, mpg: 28 }
  },
  
  // Mid-Size SUVs
  { 
    make: 'Toyota', model: 'Highlander', price: 38000, type: 'suv', fuelType: 'hybrid', seats: 8, 
    features: ['spacious', 'reliable', 'family-friendly'],
    costs: { insurance: 1900, maintenance: 650, fuelPerYear: 1300, taxRate: 0.065, mpg: 36 }
  },
  { 
    make: 'Honda', model: 'Pilot', price: 40000, type: 'suv', fuelType: 'gasoline', seats: 8, 
    features: ['spacious', 'versatile', 'reliable'],
    costs: { insurance: 1950, maintenance: 680, fuelPerYear: 1900, taxRate: 0.065, mpg: 23 }
  },
  { 
    make: 'Kia', model: 'Sorento', price: 35000, type: 'suv', fuelType: 'hybrid', seats: 7, 
    features: ['warranty', 'modern', 'spacious'],
    costs: { insurance: 1800, maintenance: 620, fuelPerYear: 1350, taxRate: 0.065, mpg: 35 }
  },
  { 
    make: 'Hyundai', model: 'Palisade', price: 37000, type: 'suv', fuelType: 'gasoline', seats: 8, 
    features: ['luxurious', 'spacious', 'warranty'],
    costs: { insurance: 1850, maintenance: 650, fuelPerYear: 1850, taxRate: 0.065, mpg: 24 }
  },
  { 
    make: 'Ford', model: 'Explorer', price: 39000, type: 'suv', fuelType: 'gasoline', seats: 7, 
    features: ['powerful', 'spacious', 'american'],
    costs: { insurance: 1920, maintenance: 720, fuelPerYear: 2000, taxRate: 0.065, mpg: 22 }
  },
  
  // Luxury Sedans
  { 
    make: 'BMW', model: '3 Series', price: 45000, type: 'sedan', fuelType: 'gasoline', seats: 5, 
    features: ['luxury', 'sporty', 'performance'],
    costs: { insurance: 2200, maintenance: 1200, fuelPerYear: 1800, taxRate: 0.065, mpg: 26 }
  },
  { 
    make: 'Mercedes-Benz', model: 'C-Class', price: 46000, type: 'sedan', fuelType: 'gasoline', seats: 5, 
    features: ['luxury', 'elegant', 'prestigious'],
    costs: { insurance: 2300, maintenance: 1250, fuelPerYear: 1850, taxRate: 0.065, mpg: 25 }
  },
  { 
    make: 'Audi', model: 'A4', price: 44000, type: 'sedan', fuelType: 'gasoline', seats: 5, 
    features: ['luxury', 'tech', 'refined'],
    costs: { insurance: 2150, maintenance: 1180, fuelPerYear: 1800, taxRate: 0.065, mpg: 26 }
  },
  { 
    make: 'Lexus', model: 'ES', price: 43000, type: 'sedan', fuelType: 'hybrid', seats: 5, 
    features: ['luxury', 'reliable', 'comfortable'],
    costs: { insurance: 2000, maintenance: 800, fuelPerYear: 1100, taxRate: 0.065, mpg: 44 }
  },
  { 
    make: 'Genesis', model: 'G70', price: 42000, type: 'sedan', fuelType: 'gasoline', seats: 5, 
    features: ['luxury', 'sporty', 'value'],
    costs: { insurance: 2100, maintenance: 950, fuelPerYear: 1750, taxRate: 0.065, mpg: 27 }
  },
  
  // Luxury SUVs
  { 
    make: 'BMW', model: 'X5', price: 65000, type: 'suv', fuelType: 'gasoline', seats: 7, 
    features: ['luxury', 'sporty', 'powerful'],
    costs: { insurance: 2800, maintenance: 1500, fuelPerYear: 2200, taxRate: 0.065, mpg: 21 }
  },
  { 
    make: 'Mercedes-Benz', model: 'GLE', price: 63000, type: 'suv', fuelType: 'gasoline', seats: 5, 
    features: ['luxury', 'elegant', 'advanced'],
    costs: { insurance: 2750, maintenance: 1480, fuelPerYear: 2150, taxRate: 0.065, mpg: 22 }
  },
  { 
    make: 'Audi', model: 'Q5', price: 48000, type: 'suv', fuelType: 'gasoline', seats: 5, 
    features: ['luxury', 'tech', 'versatile'],
    costs: { insurance: 2300, maintenance: 1250, fuelPerYear: 1900, taxRate: 0.065, mpg: 24 }
  },
  { 
    make: 'Lexus', model: 'RX', price: 52000, type: 'suv', fuelType: 'hybrid', seats: 7, 
    features: ['luxury', 'reliable', 'comfortable'],
    costs: { insurance: 2400, maintenance: 900, fuelPerYear: 1250, taxRate: 0.065, mpg: 36 }
  },
  { 
    make: 'Acura', model: 'MDX', price: 50000, type: 'suv', fuelType: 'gasoline', seats: 7, 
    features: ['luxury', 'reliable', 'spacious'],
    costs: { insurance: 2350, maintenance: 1000, fuelPerYear: 1950, taxRate: 0.065, mpg: 23 }
  },
  
  // Electric Vehicles
  { 
    make: 'Tesla', model: 'Model 3', price: 42000, type: 'sedan', fuelType: 'electric', seats: 5, 
    features: ['electric', 'tech', 'performance'],
    costs: { insurance: 2100, maintenance: 300, fuelPerYear: 550, taxRate: 0.065, mpg: 132 }
  },
  { 
    make: 'Tesla', model: 'Model Y', price: 52000, type: 'suv', fuelType: 'electric', seats: 7, 
    features: ['electric', 'tech', 'spacious'],
    costs: { insurance: 2400, maintenance: 350, fuelPerYear: 650, taxRate: 0.065, mpg: 122 }
  },
  { 
    make: 'Chevrolet', model: 'Bolt EV', price: 28000, type: 'hatchback', fuelType: 'electric', seats: 5, 
    features: ['electric', 'affordable', 'efficient'],
    costs: { insurance: 1650, maintenance: 280, fuelPerYear: 500, taxRate: 0.065, mpg: 120 }
  },
  { 
    make: 'Nissan', model: 'Leaf', price: 29000, type: 'hatchback', fuelType: 'electric', seats: 5, 
    features: ['electric', 'practical', 'affordable'],
    costs: { insurance: 1680, maintenance: 300, fuelPerYear: 520, taxRate: 0.065, mpg: 118 }
  },
  { 
    make: 'Hyundai', model: 'Ioniq 5', price: 45000, type: 'suv', fuelType: 'electric', seats: 5, 
    features: ['electric', 'modern', 'fast-charging'],
    costs: { insurance: 2150, maintenance: 320, fuelPerYear: 580, taxRate: 0.065, mpg: 114 }
  },
  
  // Sports Cars
  { 
    make: 'Mazda', model: 'MX-5 Miata', price: 28000, type: 'sports', fuelType: 'gasoline', seats: 2, 
    features: ['sporty', 'fun-to-drive', 'convertible'],
    costs: { insurance: 1800, maintenance: 550, fuelPerYear: 1450, taxRate: 0.065, mpg: 30 }
  },
  { 
    make: 'Toyota', model: 'GR86', price: 30000, type: 'sports', fuelType: 'gasoline', seats: 4, 
    features: ['sporty', 'fun-to-drive', 'affordable'],
    costs: { insurance: 1950, maintenance: 500, fuelPerYear: 1550, taxRate: 0.065, mpg: 28 }
  },
  { 
    make: 'Subaru', model: 'BRZ', price: 30500, type: 'sports', fuelType: 'gasoline', seats: 4, 
    features: ['sporty', 'fun-to-drive', 'performance'],
    costs: { insurance: 1980, maintenance: 580, fuelPerYear: 1550, taxRate: 0.065, mpg: 28 }
  },
  { 
    make: 'Ford', model: 'Mustang', price: 35000, type: 'sports', fuelType: 'gasoline', seats: 4, 
    features: ['sporty', 'powerful', 'iconic'],
    costs: { insurance: 2100, maintenance: 650, fuelPerYear: 1850, taxRate: 0.065, mpg: 24 }
  },
  { 
    make: 'Chevrolet', model: 'Camaro', price: 34000, type: 'sports', fuelType: 'gasoline', seats: 4, 
    features: ['sporty', 'powerful', 'american'],
    costs: { insurance: 2080, maintenance: 640, fuelPerYear: 1900, taxRate: 0.065, mpg: 23 }
  },
  
  // Trucks
  { 
    make: 'Ford', model: 'F-150', price: 38000, type: 'truck', fuelType: 'gasoline', seats: 6, 
    features: ['powerful', 'versatile', 'american'],
    costs: { insurance: 1850, maintenance: 700, fuelPerYear: 2200, taxRate: 0.065, mpg: 20 }
  },
  { 
    make: 'Chevrolet', model: 'Silverado', price: 37000, type: 'truck', fuelType: 'gasoline', seats: 6, 
    features: ['powerful', 'reliable', 'capable'],
    costs: { insurance: 1820, maintenance: 680, fuelPerYear: 2150, taxRate: 0.065, mpg: 21 }
  },
  { 
    make: 'Ram', model: '1500', price: 39000, type: 'truck', fuelType: 'gasoline', seats: 6, 
    features: ['luxurious', 'powerful', 'comfortable'],
    costs: { insurance: 1880, maintenance: 720, fuelPerYear: 2250, taxRate: 0.065, mpg: 20 }
  },
  { 
    make: 'Toyota', model: 'Tacoma', price: 32000, type: 'truck', fuelType: 'gasoline', seats: 5, 
    features: ['reliable', 'capable', 'off-road'],
    costs: { insurance: 1700, maintenance: 550, fuelPerYear: 1950, taxRate: 0.065, mpg: 22 }
  },
  { 
    make: 'GMC', model: 'Sierra', price: 40000, type: 'truck', fuelType: 'gasoline', seats: 6, 
    features: ['upscale', 'powerful', 'refined'],
    costs: { insurance: 1900, maintenance: 730, fuelPerYear: 2200, taxRate: 0.065, mpg: 20 }
  },
  
  // Minivans
  { 
    make: 'Honda', model: 'Odyssey', price: 35000, type: 'minivan', fuelType: 'gasoline', seats: 8, 
    features: ['spacious', 'family-friendly', 'versatile'],
    costs: { insurance: 1750, maintenance: 600, fuelPerYear: 1750, taxRate: 0.065, mpg: 25 }
  },
  { 
    make: 'Toyota', model: 'Sienna', price: 37000, type: 'minivan', fuelType: 'hybrid', seats: 8, 
    features: ['spacious', 'awd', 'reliable'],
    costs: { insurance: 1800, maintenance: 580, fuelPerYear: 1200, taxRate: 0.065, mpg: 36 }
  },
  { 
    make: 'Chrysler', model: 'Pacifica', price: 36000, type: 'minivan', fuelType: 'hybrid', seats: 7, 
    features: ['spacious', 'modern', 'versatile'],
    costs: { insurance: 1780, maintenance: 620, fuelPerYear: 1250, taxRate: 0.065, mpg: 32 }
  },
];

// Calculate total cost of ownership
function calculateTotalCost(car, years = 5) {
  const purchasePrice = car.price;
  const salesTax = purchasePrice * car.costs.taxRate;
  const insuranceTotal = car.costs.insurance * years;
  const maintenanceTotal = car.costs.maintenance * years;
  const fuelTotal = car.costs.fuelPerYear * years;
  
  const totalCost = purchasePrice + salesTax + insuranceTotal + maintenanceTotal + fuelTotal;
  
  return {
    purchasePrice,
    salesTax,
    insurancePerYear: car.costs.insurance,
    insuranceTotal,
    maintenancePerYear: car.costs.maintenance,
    maintenanceTotal,
    fuelPerYear: car.costs.fuelPerYear,
    fuelTotal,
    totalCost,
    years
  };
}

// NLP processing and recommendation logic
function processUserInput(userInput) {
  const doc = compromise(userInput.toLowerCase());
  
  let filters = {
    maxPrice: null,
    minPrice: null,
    type: null,
    fuelType: null,
    features: [],
    make: null,
    seats: null,
    includeTotalCost: false
  };

  // Check if user wants to see total cost of ownership
  if (userInput.toLowerCase().includes('total cost') || 
      userInput.toLowerCase().includes('ownership') ||
      userInput.toLowerCase().includes('insurance') ||
      userInput.toLowerCase().includes('maintenance') ||
      userInput.toLowerCase().includes('gas cost') ||
      userInput.toLowerCase().includes('fuel cost')) {
    filters.includeTotalCost = true;
  }

  // Extract budget/price information
  const pricePatterns = [
    /under (\d+)k?/i,
    /below (\d+)k?/i,
    /less than (\d+)k?/i,
    /around (\d+)k?/i,
    /about (\d+)k?/i,
    /(\d+)k? or less/i,
    /budget of (\d+)k?/i,
    /up to (\d+)k?/i,
    /\$(\d+)k?/i,
  ];

  for (let pattern of pricePatterns) {
    const match = userInput.match(pattern);
    if (match) {
      let price = parseInt(match[1]);
      if (userInput.includes('k') || price < 200) {
        price = price * 1000;
      }
      filters.maxPrice = price;
      break;
    }
  }

  // Extract car type
  if (doc.has('suv') || userInput.includes('suv')) filters.type = 'suv';
  else if (doc.has('sedan')) filters.type = 'sedan';
  else if (doc.has('truck')) filters.type = 'truck';
  else if (doc.has('sports car') || doc.has('sports')) filters.type = 'sports';
  else if (doc.has('minivan')) filters.type = 'minivan';
  else if (doc.has('hatchback')) filters.type = 'hatchback';

  // Extract fuel type
  if (doc.has('electric') || doc.has('ev')) filters.fuelType = 'electric';
  else if (doc.has('hybrid')) filters.fuelType = 'hybrid';
  else if (doc.has('gas') || doc.has('gasoline')) filters.fuelType = 'gasoline';

  // Extract features and preferences
  if (doc.has('reliable') || doc.has('reliability')) filters.features.push('reliable');
  if (doc.has('fuel efficient') || doc.has('good mpg') || doc.has('economical')) filters.features.push('fuel-efficient');
  if (doc.has('spacious') || doc.has('room') || doc.has('space')) filters.features.push('spacious');
  if (doc.has('luxury') || doc.has('luxurious') || doc.has('premium')) filters.features.push('luxury');
  if (doc.has('sporty') || doc.has('fun to drive') || doc.has('performance')) filters.features.push('sporty');
  if (doc.has('family') || doc.has('kids')) filters.features.push('family-friendly');
  if (doc.has('awd') || doc.has('all wheel drive') || doc.has('4wd')) filters.features.push('awd');
  if (doc.has('affordable') || doc.has('cheap') || doc.has('budget')) filters.features.push('affordable');
  if (doc.has('safe') || doc.has('safety')) filters.features.push('safe');

  // Extract make
  const makes = ['toyota', 'honda', 'ford', 'chevrolet', 'nissan', 'mazda', 'subaru', 'hyundai', 'kia', 
                 'bmw', 'mercedes', 'audi', 'lexus', 'tesla', 'acura', 'genesis', 'volkswagen', 'ram', 'gmc', 'chrysler'];
  for (let make of makes) {
    if (userInput.toLowerCase().includes(make)) {
      filters.make = make.charAt(0).toUpperCase() + make.slice(1);
      break;
    }
  }

  // Extract seat requirements
  const seatMatch = userInput.match(/(\d+)\s*seat/i);
  if (seatMatch) {
    filters.seats = parseInt(seatMatch[1]);
  }

  return filters;
}

function getRecommendations(filters) {
  let recommendations = [...carDatabase];

  // Also search government data if available
  const govResults = dataFetcher.search(filters.make || filters.type || '');
  
  // Merge government data with local database
  if (govResults && govResults.length > 0) {
    govResults.forEach(govCar => {
      // Check if this car exists in our database
      const existingCar = recommendations.find(car => 
        car.make.toLowerCase() === govCar.make?.toLowerCase() &&
        car.model.toLowerCase() === govCar.model?.toLowerCase()
      );

      // Update with government data if found
      if (existingCar && govCar.fuelCostPerYear) {
        existingCar.costs.fuelPerYear = govCar.fuelCostPerYear;
        existingCar.costs.mpg = govCar.combinedMPG || govCar.cityMPG || existingCar.costs.mpg;
        existingCar.governmentVerified = true;
        existingCar.governmentSource = govCar.region;
      }
    });
  }

  // Apply filters
  if (filters.maxPrice) {
    recommendations = recommendations.filter(car => car.price <= filters.maxPrice);
  }

  if (filters.minPrice) {
    recommendations = recommendations.filter(car => car.price >= filters.minPrice);
  }

  if (filters.type) {
    recommendations = recommendations.filter(car => car.type === filters.type);
  }

  if (filters.fuelType) {
    recommendations = recommendations.filter(car => car.fuelType === filters.fuelType);
  }

  if (filters.make) {
    recommendations = recommendations.filter(car => 
      car.make.toLowerCase() === filters.make.toLowerCase()
    );
  }

  if (filters.seats) {
    recommendations = recommendations.filter(car => car.seats >= filters.seats);
  }

  // Score based on features
  if (filters.features.length > 0) {
    recommendations = recommendations.map(car => {
      let score = 0;
      filters.features.forEach(feature => {
        if (car.features.includes(feature)) {
          score += 1;
        }
      });
      return { ...car, score };
    });

    // Sort by score (descending) and then by price (ascending)
    recommendations.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.price - b.price;
    });
  } else {
    // If no features specified, sort by price
    recommendations.sort((a, b) => a.price - b.price);
  }

  // Return top 5 recommendations
  return recommendations.slice(0, 5);
}

app.post('/recommend', (req, res) => {
  const userInput = req.body.text;
  
  if (!userInput) {
    return res.json({ 
      error: 'Please provide your preferences',
      recommendations: [] 
    });
  }

  const filters = processUserInput(userInput);
  const recommendations = getRecommendations(filters);

  if (recommendations.length === 0) {
    return res.json({
      message: "Sorry, I couldn't find any cars matching your criteria. Try broadening your search!",
      recommendations: [],
      filters: filters
    });
  }

  const formattedRecommendations = recommendations.map(car => {
    const totalCostData = calculateTotalCost(car);
    
    return {
      make: car.make,
      model: car.model,
      price: car.price,
      priceFormatted: `$${car.price.toLocaleString()}`,
      type: car.type,
      fuelType: car.fuelType,
      seats: car.seats,
      features: car.features.join(', '),
      mpg: car.costs.mpg,
      costs: {
        insurance: car.costs.insurance,
        maintenance: car.costs.maintenance,
        fuelPerYear: car.costs.fuelPerYear,
        salesTax: totalCostData.salesTax
      },
      totalCost: filters.includeTotalCost ? totalCostData : null
    };
  });

  res.json({
    recommendations: formattedRecommendations,
    filters: filters,
    count: recommendations.length,
    showTotalCost: filters.includeTotalCost
  });
});

// Government data search endpoint
app.get('/api/government-data/info', (req, res) => {
  const info = dataFetcher.getDataInfo();
  const summary = dataFetcher.getSummary();
  
  res.json({
    dataInfo: info,
    summary: summary ? {
      totalVehicles: summary.totalVehicles,
      regions: Object.keys(summary.byRegion || {}),
      fuelTypes: Object.keys(summary.byFuelType || {}),
      lastUpdated: summary.lastUpdated
    } : null
  });
});

// Search government data
app.post('/api/government-data/search', (req, res) => {
  const { query } = req.body;
  
  if (!query) {
    return res.json({ error: 'Query required', results: [] });
  }

  const results = dataFetcher.search(query);
  
  res.json({
    query: query,
    count: results.length,
    results: results,
    dataInfo: dataFetcher.getDataInfo()
  });
});

// Force update government data
app.post('/api/government-data/update', async (req, res) => {
  try {
    console.log('Manual update triggered...');
    const data = await dataFetcher.forceUpdate();
    
    res.json({
      success: true,
      message: 'Government data updated successfully',
      lastUpdated: data.lastUpdated
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Get full government dataset
app.get('/api/government-data/full', async (req, res) => {
  try {
    const data = await dataFetcher.getData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
