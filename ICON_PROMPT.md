# Icon Generation Prompt for nanobanana

## App Icon for "Offline QTH" - Amateur Radio Location Finder

### Primary Prompt (Recommended)

```
Create a modern, minimalist app icon for an amateur radio QTH (location) finder application.
The icon should feature:
- A location pin/marker as the central element
- Radio waves or signal lines emanating from the pin
- A subtle grid pattern in the background representing the Maidenhead Grid Locator system
- Mountain silhouette in the background (suggesting portable/field operations)
- Color scheme: Blue gradient (#2196F3 to #764ba2)
- Clean, flat design style suitable for PWA
- Square format with rounded corners (512x512px)
- High contrast for visibility at small sizes
- Professional and technical aesthetic
```

### Alternative Prompt 1 (Simplified)

```
Design a simple, bold app icon for a GPS location tool for amateur radio operators.
Features:
- Large blue location pin symbol in the center
- Radio antenna or waves icon overlay
- White background or blue gradient
- Minimalist flat design
- 512x512px, rounded corners
- Easy to recognize at 192x192px size
```

### Alternative Prompt 2 (Grid Focus)

```
Create an app icon representing the Maidenhead Grid Locator system for ham radio.
Elements:
- Grid overlay pattern (like latitude/longitude lines)
- GPS pin marker at grid intersection
- Radio tower or antenna silhouette
- Blue and white color scheme (#2196F3)
- Modern, geometric design
- 512x512px square format
- Clear visibility when scaled down
```

### Alternative Prompt 3 (Mountain Theme)

```
Design an app icon for a portable amateur radio location finder.
Include:
- Mountain peak silhouette
- Radio antenna on the summit
- Location pin marker
- Blue gradient sky background
- Clean, modern illustration style
- 512x512px with rounded corners
- Simple enough to work at small sizes (48px)
```

### Detailed Specifications

**Size Requirements:**
- Primary: 512x512px (for app stores and high-res displays)
- Secondary: 192x192px (for PWA home screen)
- Format: PNG with transparency
- Style: Flat design, iOS/Material Design compatible

**Color Palette:**
- Primary Blue: #2196F3
- Secondary Purple: #764ba2
- Accent: White (#FFFFFF)
- Optional: Orange for highlights (#FF5722)

**Design Guidelines:**
- Use simple, recognizable shapes
- Ensure good contrast for accessibility
- Avoid fine details that blur at small sizes
- Consider both light and dark backgrounds
- Rounded corners (radius: 64px for 512px icon)

### Usage Instructions for nanobanana

1. Copy one of the prompts above
2. Paste into nanobanana's prompt field
3. Generate the image
4. Download as PNG
5. Save as:
   - `icon-512.png` (512x512px)
   - `icon-192.png` (192x192px - resize if needed)
6. Place in project root directory

### Post-Generation Steps

After generating the icons:

```bash
# Place the generated icons in the project root
cp ~/Downloads/generated-icon.png icon-512.png

# Resize for 192px version (using ImageMagick)
magick icon-512.png -resize 192x192 icon-192.png

# Or use online tools like:
# - https://www.iloveimg.com/resize-image
# - https://imageresizer.com/
```

### Alternative: Use the HTML Generator

If you prefer to create placeholder icons without AI:

```bash
# Open the icon generator in browser
open http://localhost:8000/create-icons.html

# Or use the SVG file
# icon.svg is already in the project
```

### Current Theme Reference

The app uses these colors:
- Primary: Blue (#2196F3)
- Gradient: Blue to Purple (#667eea to #764ba2)
- Highlight: Orange (#FF5722)

The icon should complement this color scheme.
