# Paint Mixer

A tool for natural media painters to help them build virtual palettes and experiment with "color recipes" using an accurate paint mixing engine. Combine paint colors to create new ones, and build the palette you need with the colors you already have. Created with React, TypeScript, Mixbox, tinycolor2, color-name-list, and Jest.

## Table of Contents

- [Paint Mixer](#paint-mixer)
  - [Table of Contents](#table-of-contents)
  - [Live Demo](#live-demo)
  - [Installation](#installation)
  - [Usage](#usage)
  - [How It Works](#how-it-works)
  - [Components Overview](#components-overview)
    - [Mixer](#mixer)
    - [AddColorUIComponent](#addcoloruicomponent)
    - [ColorBoxUI](#colorboxui)
    - [ColorPicker](#colorpicker)
    - [ColorSwatches](#colorswatches)
    - [MixedColorContainer](#mixedcolorcontainer)
    - [TargetColorContainer](#targetcolorcontainer)
  - [Hooks Overview](#hooks-overview)
    - [useColorMatching](#usecolormatching)
    - [useColorName](#usecolorname)
    - [useLocalStorage](#uselocalstorage)
    - [usePaletteManager](#usepalettemanager)
    - [useSwatchAdder](#useswatchadder)
  - [Utilities](#utilities)
    - [colorConversion](#colorconversion)
    - [isDark](#isdark)
    - [defaultPalette](#defaultpalette)
  - [Contributing](#contributing)
  - [License](#license)
  - [Credits](#credits)

## Live Demo

You can try out Paint Mixer without installing anything by visiting [paint-mixer.netlify.app](https://paint-mixer.netlify.app).

## Installation

Before you can install Paint Mixer, ensure you have [Node.js](https://nodejs.org/) installed on your machine. Then follow these steps:

1. Clone the repository to your local machine using:

    ```bash
    git clone https://github.com/your-username/paint-mixer.git
    ```

2. Navigate to the project directory:

    ```bash
    cd paint-mixer
    ```

3. Install the necessary dependencies:

    ```bash
    npm install
    ```

4. Start the development server:

    ```bash
    npm start
    ```

Now, you should be able to access the Paint Mixer application at `http://localhost:3000` in your web browser.

## Usage

1. **Adding Colors to the Palette**:
   - Click on the `+` icon in the palette section to open the color picker.
   - Select the color you want to add to your palette and click `Confirm`.
   - The selected color will appear as a swatch in the palette section.
   - You can lookup RGB and hex values for commercial paints at [Art Paints](http://www.art-paints.com/). This will help you find the closest match to the paint you're using.
   - You can rename the automatically named color by clicking on the swatch's name and editing it.

2. **Mixing Colors**:
   - Click on the swatches in the palette to increment the parts of each color you want to mix.
   - The mixed color will be displayed at the top of the screen.
   - You can adjust the parts of each color in the mix by clicking on the `+` or `-` icons on each swatch.

3. **Saving Mixed Colors**:
   - Once you've created a mix you like, click the `Save` button to add the mixed color to your palette.
   - The recipe of colors used to create the mixed color will be saved along with it. You can view the recipe by clicking on the swatch's info button.

4. **Setting a Target Color**:
   - Click the `Target` button to set a target color.
   - Select your target color using the color picker that appears.
   - The match percentage between the mixed color and the target color will be displayed.

5. **Resetting the Mix**:
   - Click the `Reset` button to reset the parts of each color in the mix to zero.

6. **Removing Colors from the Palette**:
   - Click the `x` icon on a swatch to remove that color from your palette.

## How It Works

Paint Mixer utilizes a combination of hooks, libraries, and custom utility functions to simulate paint mixing. Here's a brief overview of how it works:

1. **Color Selection and Conversion**:
   - Colors are selected using a color picker, which returns colors in HSVa format.
   - These colors are then converted to RGBa format using the `hsvaToRgba` and `hsvaToRgbaString` functions from the `@uiw/color-convert` library.

2. **Color Mixing**:
   - The mixing engine uses the `mixbox` library to simulate the way paint mixes in the real world. Unlike a simple subtractive color model, the mixbox library uses the Kubelka–Munk model, predicting the behavior of paints based on pigments.
   - The `useColorMixing` hook abstracts the process where each color in the mix is converted to a latent color space, mixed according to the specified parts, and then converted back to RGBa format.

3. **Color Matching**:
   - The `useColorMatching` hook utilizes the `deltaE94` function from the `colorConversion` utility to determine the color difference between the mixed color and the target color.
   - This difference is then converted to a match percentage, which is displayed to the user.

4. **Palette Management**:
   - The `usePalette` hook manages the palette using the React state. Each color in the palette is represented as an object containing its RGBa string, label, parts in the mix, and optionally a recipe of colors used to create it.

5. **Color Naming**:
   - The `useColorName` hook fetches a name for a color based on its hex value, leveraging the `color-name-list` library.

6. **Local Storage**:
   - The `useLocalStorage` hook ensures the palette is saved to and loaded from local storage, allowing it to persist across browser sessions.

## Components Overview

### Mixer

The core component where users can mix multiple colors. It provides an interface to add, adjust, or remove colors.

### AddColorUIComponent

Allows users to add a color to the mixer. It provides an interface for color input and addition.

### ColorBoxUI

Displays a color box with the chosen color. It also provides options to remove or adjust the color.

### ColorPicker

A component that lets users pick a color. It provides a color wheel interface for color selection.

### ColorSwatches

Displays a collection of color swatches. Users can select a color from these swatches to add to the mixer.

### MixedColorContainer

Displays the mixed color result. It shows the outcome of the mixed colors and provides options to save or reset the mix.

### TargetColorContainer

Displays the target color that users aim to match with their mix. It provides options to set or reset the target color.

## Hooks Overview

### useColorMatching

A custom hook that provides functionality to match the mixed color with the target color. It returns a boolean indicating if the colors match.

### useColorName

Fetches the name of a color based on its RGB value. It uses an external API to get the color name.

### useLocalStorage

Manages the storage of color palettes in the browser's local storage. It provides functions to save, retrieve, and delete palettes.

### usePaletteManager

Manages the color palettes in the application. It provides functions to add, remove, and update palettes.

### useSwatchAdder

A custom hook that provides functionality to add a color swatch to the mixer. It returns functions to add and remove swatches.

## Utilities

### colorConversion

Provides utility functions for color conversions, such as RGB to HEX and vice versa.

### isDark

Determines if a color is dark based on its RGB value.

### defaultPalette

Provides a default color palette for the application. I will be adding other palettes to choose as a new base.

## Contributing

Feel free to fork the repository and submit pull requests. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](./LICENSE)

## Credits

This project is a fork of [paint-mixer](https://github.com/Palette-Pickers/paint-mixer) by **Beekman** / Palette-Pickers.