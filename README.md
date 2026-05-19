# Intergenerational Equity -- West Asia Population & Nightlight

This project examines patterns of intergenerational equity by assessing demographic access to electricity over a twenty-year horizon, using high-resolution population data alongside satellite-derived nighttime light radiance as empirical metrics.

This repository automates regional-scale data extraction using Google Earth Engine (GEE) and executes a micro-level case study using Python (`arcpy`) in ArcGIS.

---

## Datasets & Architecture

* **Human Population Density (GHSL):** Global human settlement grids at 100-meter resolution.
* **Nighttime Light Radiance (VIIRS):** NOAA cloud-corrected annual median radiance at 500-meter resolution.

### Folder Structure
* `Data/country_list.txt`: Evaluated list of 24 Arab countries and territories.
* `scripts/export_population.js`: GEE java pipeline to batch-export 100m population grids to Cloud Storage.
* `scripts/export_nightlight.js`: GEE java pipeline to process and batch-export 500m annual median NTL grids.
* `scripts/analyze_iraq_disparity.py`: ArcGDB Python script to align grids and format matching arrays into tabular matrices and vector points.

---

## GEE Extraction Pipelines

To bypass GEE server-side loops blocking direct batch exports, the JavaScript tools deploy a client-side `for` loop to generate isolated national export tasks. 
Paste the code into the [GEE Code Editor](https://code.earthengine.google.com/), update the `bucket` path to your Cloud Storage directory, and run the generated tasks.

---

## Iraq Case Study Alignment & Results (2015)

The script `analyze_iraq_disparity.py` processes overlapping raster surfaces in Iraq. It filters out geographic noise by enforcing a population floor threshold of $\ge 1$ person per cell block, isolating inhabited human footprints from unpopulated terrain.

To guarantee error-free matrix arithmetic, the script locks alignment boundaries using runtime environment overrides to match the population raster perfectly to the nightlight pixels:

```python
arcpy.env.extent = ntl_obj.extent
arcpy.env.snapRaster = NTL_RASTER
arcpy.env.cellSize = NTL_RASTER
arcpy.env.overwriteOutput = True

```

### Outputs & Infrastructure Profiling

The pipeline outputs `Cell_by_Cell_NTL_POP_2015.csv` and a Geodatabase point layer `Cell_by_Cell_NTL_POP_2015_Points` to classify data into key wealth proxies:

| Co-Location Signature | Economic Indicator Status | Regional Characterization |
| --- | --- | --- |
| **High Population + Zero/Low Light** | Infrastructure deprivation. | Under-electrified rural centers, informal settlements. |
| **High Population + High Light** | Structural capital investment. | Secure urban cores, primary municipal corridors. |
| **Low Population + High Light** | Industrial capital decoupling. | Specialized oil/gas flare fields, manufacturing zones. |

```

```
