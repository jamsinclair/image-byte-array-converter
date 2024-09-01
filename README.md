# image2bytearray

This tool converts an image into an Arduino compatible C++ array of 16-bit RGB pixel values. The output array can be used to render the image to displays with the <a href="https://github.com/Bodmer/TFT_eSPI">TFT_eSPI</a> library or similar. Transparent pixels will be replaced with the selected background colour.

This tool was inspired for and to support the <a href="https://github.com/witnessmenow/ESP32-Cheap-Yellow-Display">CYD (Cheap Yellow Display)</a> community.

For more complex images or other displays consider using [image2cpp](https://javl.github.io/image2cpp/).

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.