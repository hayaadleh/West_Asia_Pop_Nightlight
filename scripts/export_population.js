// ======================================================================
// GHSL Population - One Map Per Country Per Year (2015 & 2025)
// ======================================================================

// 1. Define List of Countries
var arabCountries = [
  'Algeria', 'Bahrain', 'Comoros', 'Djibouti', 'Egypt', 'Iraq', 'Jordan',
  'Kuwait', 'Lebanon', 'Libya', 'Mauritania', 'Morocco', 'Oman', 'Qatar',
  'Saudi Arabia', 'Somalia', 'Gaza Strip', 'West Bank', 'Sudan',
  'Syria', 'Tunisia', 'United Arab Emirates', 'Yemen', 'Western Sahara'
];

// Filter the global feature collection to get the geometry for each country
var countries = ee.FeatureCollection("USDOS/LSIB_SIMPLE/2017")
  .filter(ee.Filter.inList('country_na', arabCountries));

Map.centerObject(countries, 4); // Center the map on the general region

// 2. Load GHSL Population Images
var pop2015 = ee.Image('JRC/GHSL/P2023A/GHS_POP/2015');
var pop2025 = ee.Image('JRC/GHSL/P2023A/GHS_POP/2025');

// 3. Loop through each country & create export tasks
var listOfCountries = countries.toList(countries.size());
var numCountries = listOfCountries.size().getInfo(); // Get total count for client-side loop

for (var i = 0; i < numCountries; i++) {
  var country = ee.Feature(listOfCountries.get(i));

  // Extract and clean metadata for naming conventions
  var countryName = country.get('country_na').getInfo(); 
  var countryNameClean = countryName.replace(/ /g, '_'); 
  var countryGeom = country.geometry();

  // --- Create Export Task for 2015 ---
  var pop2015_clipped = pop2015.clip(countryGeom);
  Export.image.toCloudStorage({
    image: pop2015_clipped,
    description: 'POP_2015_' + countryNameClean,
    bucket: 'iari_syr', // CHANGE THIS to your Google Cloud storage bucket name
    fileNamePrefix: 'GHSL/2015/POP_' + countryNameClean,
    region: countryGeom,
    scale: 100, // Native 100m resolution
    maxPixels: 1e13
  });

  // --- Create Export Task for 2025 ---
  var pop2025_clipped = pop2025.clip(countryGeom);
  Export.image.toCloudStorage({
    image: pop2025_clipped,
    description: 'POP_2025_' + countryNameClean,
    bucket: 'iari_syr', // CHANGE THIS to your Google Cloud storage bucket name
    fileNamePrefix: 'GHSL/2025/POP_' + countryNameClean,
    region: countryGeom,
    scale: 100, // Native 100m resolution
    maxPixels: 1e13
  });
}

// 4. OPTIONAL: VISUALIZE A SINGLE COUNTRY FOR TESTING
var testCountry = ee.Feature(countries.filter(ee.Filter.eq('country_na', 'Syria')).first());
Map.centerObject(testCountry, 6);

var popVisParams = {
  min: 1,
  max: 200, // People per 100m pixel
  palette: ['#ffffd4', '#fed98e', '#fe9929', '#d95f0e', '#993404']
};

Map.addLayer(pop2025.clip(testCountry), popVisParams, 'Population 2025 (Syria)');