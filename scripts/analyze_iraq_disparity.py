"""
ArcPy Spatial Data Pipeline: Iraq Case Study
Description: Performs a cell-by-cell spatiotemporal extraction matching 2015 
             VIIRS Nighttime Lights (NTL) against GHSL Population layers. 
             Filters for populated coordinates and outputs matrices and transforms 
             the overlapping spatial maps into a unified data table (a matrix).
"""

import arcpy
import csv
import os


# Upload Files (Modify these for your local environment)
NTL_RASTER = r"Y:\Database_Y\Intergenerational inequality\Population\Iraq_Case_Study\IRQ_Case_Study.gdb\NTL_IRQ_VIIRS_2015_Projected_100"
POP_RASTER = r"Y:\Database_Y\Intergenerational inequality\Population\Iraq_Case_Study\IRQ_Case_Study.gdb\POP_IRQ_GHSL_2015_Projected"
OUTPUT_GDB = r"Y:\Database_Y\Intergenerational inequality\Population\Iraq_Case_Study\IRQ_Case_Study.gdb"

# Derive outputs in the same directory structure
OUTPUT_CSV = os.path.join(os.path.dirname(OUTPUT_GDB), "Cell_by_Cell_NTL_POP_2015.csv")
OUTPUT_FC = os.path.join(OUTPUT_GDB, "Cell_by_Cell_NTL_POP_2015_Points")

def main():
    print("Reading raster properties...")
    ntl_obj = arcpy.Raster(NTL_RASTER)
    spatial_ref = ntl_obj.spatialReference
    cell_size_x = ntl_obj.meanCellWidth
    cell_size_y = ntl_obj.meanCellHeight

    print(f"Cell size: {cell_size_x} x {cell_size_y} | CRSs: {spatial_ref.name}")

    extent = ntl_obj.extent
    lower_left = arcpy.Point(extent.XMin, extent.YMin)

    print("\nLoading NTL raster into NumPy array...")
    ntl_array = arcpy.RasterToNumPyArray(NTL_RASTER, nodata_to_value=-9999)

    print("Loading Population raster into NumPy array...")
    pop_array = arcpy.RasterToNumPyArray(
        POP_RASTER,
        lower_left_corner=lower_left,
        ncols=ntl_obj.width,
        nrows=ntl_obj.height,
        nodata_to_value=-9999
    )

    print("Processing cell-by-cell structural analysis...")
    nrows, ncols = ntl_array.shape
    valid_cells = []

    for row in range(nrows):
        if row % 1000 == 0:
            print(f"Processing matrix row {row}/{nrows}...")
        
        for col in range(ncols):
            ntl_val = ntl_array[row, col]
            pop_val = pop_array[row, col]
            
            # Keep cells only if they are inhabited (POP >= 1) and data is valid
            if ntl_val != -9999 and pop_val != -9999 and pop_val >= 1:
                x_coord = extent.XMin + (col * cell_size_x) + (cell_size_x / 2)
                y_coord = extent.YMax - (row * cell_size_y) - (cell_size_y / 2)
                
                valid_cells.append({
                    'X_Coord': x_coord, 'Y_Coord': y_coord,
                    'Row': row, 'Col': col,
                    'NTL_Value': float(ntl_val), 'POP_Value': float(pop_val)
                })

    print(f"\nTotal valid inhabited cells found: {len(valid_cells)}")

    # 1. Export Tabular Matrix to CSV (For R / Python Pandas / Stata regressions)
    print(f"Writing CSV to: {OUTPUT_CSV}")
    with open(OUTPUT_CSV, 'w', newline='') as csvfile:
        fieldnames = ['X_Coord', 'Y_Coord', 'Row', 'Col', 'NTL_Value', 'POP_Value']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(valid_cells)

    # 2. Export Feature Class Point Layer to Geodatabase (For ArcMap / ArcGIS Pro map layouts)
    print(f"Generating GIS Point Feature Class: {OUTPUT_FC}")
    if arcpy.Exists(OUTPUT_FC):
        arcpy.Delete_management(OUTPUT_FC)

    arcpy.CreateFeatureclass_management(OUTPUT_GDB, os.path.basename(OUTPUT_FC), "POINT", spatial_reference=spatial_ref)
    arcpy.AddField_management(OUTPUT_FC, "Row", "LONG")
    arcpy.AddField_management(OUTPUT_FC, "Col", "LONG")
    arcpy.AddField_management(OUTPUT_FC, "NTL_Value", "DOUBLE")
    arcpy.AddField_management(OUTPUT_FC, "POP_Value", "DOUBLE")

    with arcpy.da.InsertCursor(OUTPUT_FC, ['SHAPE@XY', 'Row', 'Col', 'NTL_Value', 'POP_Value']) as cursor:
        for i, cell in enumerate(valid_cells):
            if i % 10000 == 0:
                print(f"Inserted vector geometry {i}/{len(valid_cells)}...")
            point = (cell['X_Coord'], cell['Y_Coord'])
            cursor.insertRow([point, cell['Row'], cell['Col'], cell['NTL_Value'], cell['POP_Value']])

    print("\nProcessing completed successfully!")

if __name__ == '__main__':
    main()
