// ======================================================================
// VIIRS Nighttime Lights - One Map Per Country Per Year (2015 & 2025)
// ======================================================================

// 1. Define list of countries
var arabCountries = [
  'Algeria', 'Bahrain', 'Comoros', 'Djibouti', 'Egypt', 'Iraq', 'Jordan',
  'Kuwait', 'Lebanon', 'Libya', 'Mauritania', 'Morocco', 'Oman', 'Qatar',
  'Saudi Arabia', 'Somalia', 'Gaza Strip', 'West Bank', 'Sudan',
  'Syria', 'Tunisia', 'United Arab Emirates', 'Yemen', 'Western Sahara'
];

// Filter the global feature collection to get the geometry for each country
var countries = ee.FeatureCollection("USDOS/LSIB_SIMPLE/2017")
  .filter(ee.Filter.inList('country_na', arabCountries));

Map.centerObject(countries, 4);

// 2. Prepare nighttime light data
var viirsCol = ee.ImageCollection('NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG')
  .select('avg_rad');

// Function to calculate annual median to filter out transient lighting outliers
function getAnnualViirs(yearStr) {
  var year = ee.Number.parse(yearStr);
  var startDate = ee.Date.fromYMD(year, 1, 1);
  var endDate = ee.Date.fromYMD(year, 12, 31);

  var annualMedian = viirsCol
    .filter(ee.Filter.date(startDate, endDate))
    .median(); 
  return annualMedian;
}

// 3. Loop through each country & create export tasks
var listOfCountries = countries.toList(countries.size());
var numCountries = listOfCountries.size().getInfo(); // Get total count for client-side loop

for (var i = 0; i < numCountries; i++) {
  var country = ee.Feature(listOfCountries.get(i));

  // Extract and clean metadata for naming conventions
  var countryName = country.get('country_na').getInfo(); 
  var countryNameClean = countryName.replace(/ /g, '_'); 
  var countryGeom = country.geometry();

  // --- Process and Export for 2015 ---
  var ntl2015 = getAnnualViirs('2015').clip(countryGeom);
  Export.image.toCloudStorage({
    image: ntl2015,
    description: 'NTL_2015_' + countryNameClean,
    bucket: 'iari_syr', // CHANGE THIS to your Google Cloud storage bucket name
    fileNamePrefix: 'NTL/2015/NTL_' + countryNameClean,
    region: countryGeom,
    scale: 500, // VIIRS native resolution is ~500m
    maxPixels: 1e13
  });

  // --- Process and Export for 2025 ---
  var ntl2025 = getAnnualViirs('2025').clip(countryGeom);
  Export.image.toCloudStorage({
    image: ntl2025,
    description: 'NTL_2025_' + countryNameClean,
    bucket: 'iari_syr', // CHANGE THIS to your Google Cloud storage bucket name
    fileNamePrefix: 'NTL/2025/NTL_' + countryNameClean,
    region: countryGeom,
    scale: 500, // VIIRS native resolution is ~500m
    maxPixels: 1e13
  });
}

// 4. OPTIONAL: VISUALIZE A SINGLE COUNTRY FOR TESTING
var testCountry = ee.Feature(countries.filter(ee.Filter.eq('country_na', 'Lebanon')).first());
Map.centerObject(testCountry, 7);

var ntlVisParams = {
  min: 0.5, 
  max: 60, 
  palette: ['#0d1435', '#ff9900', '#ffffff']
};

Map.addLayer(getAnnualViirs('2025').clip(testCountry), ntlVisParams, 'NTL 2025 (Lebanon)');