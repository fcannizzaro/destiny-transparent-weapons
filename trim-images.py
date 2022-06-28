#!/usr/bin/env python

import sys
from PIL import Image
from os import listdir
from os.path import join

# from https://gist.github.com/odyniec/3470977
def autocrop_image(image, border = 0):
    # Get the bounding box
    bbox = image.getbbox()

    # Crop the image to the contents of the bounding box
    image = image.crop(bbox)

    # Determine the width and height of the cropped image
    (width, height) = image.size

    # Add border
    width += border * 2
    height += border * 2
    
    # Create a new image object for the output image
    cropped_image = Image.new("RGBA", (width, height), (0,0,0,0))

    # Paste the cropped image onto the new image
    cropped_image.paste(image, (border, border))

    # Done!
    return cropped_image
    
directory = sys.argv[1]
images = [f for f in listdir(directory)]

for image in images:
    file = join(directory, image)
    img = Image.open(file)
    img = autocrop_image(img, 0)
    img.save(file)
