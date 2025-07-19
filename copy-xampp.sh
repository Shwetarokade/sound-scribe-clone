#!/bin/bash

echo "Attempting to find and copy XAMPP files..."

# Try different possible mount points
POSSIBLE_PATHS=(
    "/mnt/d/xampp"
    "/mnt/d/lampp"
    "/d/xampp"
    "/d/lampp"
    "/media/d/xampp"
    "/media/d/lampp"
    "/run/media/*/d/xampp"
    "/run/media/*/d/lampp"
)

for path in "${POSSIBLE_PATHS[@]}"; do
    if [ -d "$path" ]; then
        echo "Found XAMPP at: $path"
        echo "Copying to /workspace/xampp-files/..."
        cp -r "$path" /workspace/xampp-files/
        echo "Copy completed!"
        exit 0
    fi
done

echo "XAMPP not found in common locations."
echo "Please provide the correct path to your XAMPP installation."