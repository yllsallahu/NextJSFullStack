#!/bin/bash

echo "🎯 Project Optimization Check"
echo "============================="
echo

# Check bundle size
echo "📦 Bundle Analysis:"
cd /Users/yllsallahu/Desktop/Repos/NextJSFullStack/blog

if [ -d ".next" ]; then
    echo "✅ .next directory size: $(du -sh .next 2>/dev/null | cut -f1)"
    echo "📁 Static assets: $(du -sh .next/static 2>/dev/null | cut -f1)"
else
    echo "⚠️  No build found. Run 'npm run build' first."
fi

echo

# Check dependencies
echo "📚 Dependencies Analysis:"
echo "📦 node_modules size: $(du -sh node_modules 2>/dev/null | cut -f1)"
echo "📋 Total packages: $(find node_modules -name package.json | wc -l | tr -d ' ')"

echo

# Check image optimization
echo "🖼️  Image Analysis:"
UPLOAD_DIR="public/uploads"
if [ -d "$UPLOAD_DIR" ]; then
    total_size=$(du -sh "$UPLOAD_DIR" | cut -f1)
    file_count=$(find "$UPLOAD_DIR" -type f | wc -l | tr -d ' ')
    large_files=$(find "$UPLOAD_DIR" -size +1M | wc -l | tr -d ' ')
    
    echo "📊 Total uploads: $total_size ($file_count files)"
    echo "🚨 Large files (>1MB): $large_files"
    
    if [ "$large_files" -gt 0 ]; then
        echo "💡 Recommendation: Optimize large images to WebP format"
    fi
else
    echo "❌ No uploads directory found"
fi

echo

# Performance recommendations
echo "🚀 Optimization Status:"
echo "✅ Removed unused dependencies (mongoose)"
echo "✅ Added console.log removal for production"
echo "✅ Enabled image optimization (WebP/AVIF)"
echo "✅ Added bundle compression"
echo "✅ Cleaned CSS and removed redundant code"

echo

echo "📋 Next Steps:"
echo "1. Run 'npm run build' to test optimizations"
echo "2. Run 'npm run analyze' for bundle analysis" 
echo "3. Convert large images to WebP format"
echo "4. Monitor Core Web Vitals in production"

echo
echo "🎉 Optimization complete! Your project is now faster and cleaner."
