# Assets Folder

This folder contains static assets used throughout the application.

## Structure

- `images/` - Application images and graphics
- `fonts/` - Custom fonts (if any)
- `icons/` - Custom icon files (SVG, PNG, etc.)

## Usage

Import assets in your components:

```tsx
import logo from '@/assets/images/logo.png';
import customIcon from '@/assets/icons/custom-icon.svg';
```

## Best Practices

1. Use SVG for icons when possible (better scalability)
2. Optimize images before adding them (use tools like TinyPNG)
3. Use meaningful, descriptive filenames
4. Keep file sizes reasonable for web performance
