#!/usr/bin/env python3
"""
Generate PWA icons from the Myncel logo for all required sizes.
"""
from PIL import Image
import os

# Icon sizes required by manifest.json
ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

def create_pwa_icons():
    # Load the original logo
    logo_path = "public/logo.png"
    output_dir = "public/icons"
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Open the original logo
    with Image.open(logo_path) as logo:
        print(f"Original logo size: {logo.size}")
        print(f"Original logo mode: {logo.mode}")
        
        # Convert to RGBA if not already
        if logo.mode != 'RGBA':
            logo = logo.convert('RGBA')
        
        # Generate icons for each size
        for size in ICON_SIZES:
            output_path = f"{output_dir}/icon-{size}x{size}.png"
            
            # Create a new image with the target size
            icon = Image.new('RGBA', (size, size), (255, 255, 255, 0))
            
            # Calculate the scaling to fit the logo in the icon
            # Add some padding for better appearance
            padding = int(size * 0.1)  # 10% padding
            available_size = size - (padding * 2)
            
            # Resize the logo maintaining aspect ratio
            logo_ratio = logo.width / logo.height
            if logo_ratio > 1:
                # Landscape - fit width
                new_width = available_size
                new_height = int(available_size / logo_ratio)
            else:
                # Portrait or square - fit height
                new_height = available_size
                new_width = int(available_size * logo_ratio)
            
            # Resize the logo
            resized_logo = logo.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Center the logo on the icon
            x = (size - new_width) // 2
            y = (size - new_height) // 2
            
            # Paste the resized logo onto the icon
            icon.paste(resized_logo, (x, y), resized_logo if resized_logo.mode == 'RGBA' else None)
            
            # Save the icon
            icon.save(output_path, 'PNG')
            print(f"✓ Created: {output_path} ({size}x{size})")
    
    print(f"\n✅ Successfully created {len(ICON_SIZES)} PWA icons in {output_dir}/")

if __name__ == "__main__":
    create_pwa_icons()