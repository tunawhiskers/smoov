from PIL import Image, ImageOps
import glob
import os
import subprocess
import shutil
import numpy as np


def ResetSession():
    pxm = servermanager.ProxyManager()
    pxm.UnRegisterProxies()
    del pxm
    Disconnect()
    Connect()


def trim_whitespace(img_name):
    image = Image.open(img_name)
    image.load()
    imageSize = image.size
    invert_im = image.convert("RGB")
    invert_im = ImageOps.invert(invert_im)
    imageBox = invert_im.getbbox()
    cropped = image.crop(imageBox)
    cropped.save(img_name)


def output_image(vtk_path, output_path):
    subprocess.call('pvpython render_image.py %s %s' % (vtk_path, output_path), shell=True)





cwd = os.getcwd()
vtk_path = "/home/paul/Desktop/motorbike3/motorBike/motorBikeLES/postProcessing/my_surfaces/0.1/y_0.0.vtk"
img_path = "/home/paul/Desktop/motorbike3/motorBike/motorBikeLES/images/test.png"

t0 = "0.1"
y_slices = glob.glob("/home/paul/Desktop/motorbike3/motorBike/motorBikeLES/postProcessing/my_surfaces/%s/z_*.vtk" % t0)
y_slices = [y_slices[5]]
slice_vtks = []
for ys in y_slices:
    y_ar = ys.split("/")
    y_ar[-2] = "*"
    glob_str = "/".join(y_ar)
    slice_vtk = glob.glob(glob_str)
    slice_vtk.sort()
    slice_vtks.append(slice_vtk)

if not os.path.exists("images"):
    os.mkdir("images")

for s in slice_vtks:
    loc = s[0].split("/")[-1].replace(".vtk", "")
    slice_dir = "images/%s" % loc
    if not os.path.exists(slice_dir):
        os.mkdir(slice_dir)
    for i, t in enumerate(s):
        vtk_time = t.split("/")[-2]
        img_name = slice_dir + "/%4.4d.png" % i
        output_image(t, img_name)
        trim_whitespace(img_name)
    movie_name = loc + ".mp4"
    ffmpeg_cmd = "ffmpeg -r 30 -vb 20M -f image2 -i %04d.png -vcodec libx264 -crf 5 -pix_fmt yuv420p " + movie_name
    os.chdir(os.path.join(cwd, slice_dir))
    subprocess.call(ffmpeg_cmd, shell=True)
    subprocess.call("rm *.png", shell=True)
    shutil.move(movie_name, "..")
    os.chdir(cwd)
    subprocess.call("rm %s" % slice_dir, shell=True)









