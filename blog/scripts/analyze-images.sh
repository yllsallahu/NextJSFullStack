#!/bin/bash

# Image optimization script for the uploads directory
# This script helps identify large images that could be optimized

echo "🖼️  Image Analysis for /public/uploads"
echo "======================================"

UPLOAD_DIR="/Users/yllsallahu/Desktop/Repos/NextJSFullStack/blog/public/uploads"

if [ -d "$UPLOAD_DIR" ]; then
    echo "📁 Directory: $UPLOAD_DIR"
    echo
    
    # Show total size
    total_size=$(du -sh "$UPLOAD_DIR" | cut -f1)
    echo "📊 Total size: $total_size"
    echo
    
    # List files with sizes
    echo "📋 File listing:"
    ls -lah "$UPLOAD_DIR" | grep -v "^total" | awk '{print $5 "\t" $9}' | sort -hr
    echo
    
    # Count files by type
    echo "📈 File types:"
    find "$UPLOAD_DIR" -type f | sed 's/.*\.//' | sort | uniq -c | sort -nr
    echo
    
    # Find large files (>1MB)
    echo "🚨 Large files (>1MB):"
    find "$UPLOAD_DIR" -type f -size +1M -exec ls -lah {} \; | awk '{print $5 "\t" $9}'
    
else
    echo "❌ Upload directory not found: $UPLOAD_DIR"
fi
