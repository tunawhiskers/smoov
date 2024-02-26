from paraview.simple import *
import sys


args = sys.argv

vtk_path = sys.argv[1]
output_path = sys.argv[2]


paraview.simple._DisableFirstRenderCameraReset()

vtk_name = vtk_path.split("/")[-1]

vtk = LegacyVTKReader(registrationName=vtk_name, FileNames=[vtk_path])
renderView1 = GetActiveViewOrCreate('RenderView')
vtkDisplay = Show(vtk, renderView1, 'GeometryRepresentation')


vtkDisplay.Representation = 'Surface'


renderView1.ResetCamera(False)
renderView1.Update()


# create a new 'Calculator'
calculator1 = Calculator(registrationName='Calculator1', Input=vtk)

calculator1.Function = ''
calculator1.ResultArrayName = 'Cg'
calculator1.Function = '(p+0.5*dot(U,U))/(0.5*20*20)'


# show data in view
calculator1Display = Show(calculator1, renderView1, 'GeometryRepresentation')
cgLUT = GetColorTransferFunction('Cg')


# reset view to fit data
renderView1.ResetCamera(False)
renderView1.CameraParallelProjection = 1


# rescale color and/or opacity maps used to include current data range
vtkDisplay.RescaleTransferFunctionToDataRange(True, False)
vtkDisplay.SetScalarBarVisibility(renderView1, True)


cgLUT = GetColorTransferFunction('Cg')
cgPWF = GetOpacityTransferFunction('Cg')
cgLUT.RescaleTransferFunction(-1.0, 1.0)
#cgLUT.ApplyPreset('BLUE-WHITE', True)
cgLUT.ApplyPreset('BuPu', True)
cgLUT.NumberOfTableValues = 16
#vtkDisplay = GetColorTransferFunction('Cg', vtk, separate=True)
#vtkDisplay.NumberOfTableValues = 10


renderView1.OrientationAxesVisibility = 0
vtkDisplay.SetScalarBarVisibility(renderView1, False)

# get layout
layout1 = GetLayout()

# layout/tab size in pixels
layout1.SetSize(1050, 860)

# current camera placement for renderView1
renderView1.CameraPosition = [5.0, 0, 0.0]
renderView1.CameraFocalPoint = [5.0, 0, 4.0]
renderView1.CameraViewUp = [0.0, 1.0, 0.0]
renderView1.CameraParallelScale = 6


# save screenshot
foo = SaveScreenshot(output_path, renderView1, ImageResolution=[3840, 2160],
    OverrideColorPalette='WhiteBackground')


ResetSession()












