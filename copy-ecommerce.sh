#!/bin/bash

echo "Instructions to copy your e-commerce site:"
echo ""
echo "1. If you're using WSL, run this command from Windows:"
echo "   xcopy \"D:\\xampp\\htdocs\\my-ecommerce-site\" \"$(wslpath -w $(pwd))\\my-ecommerce-site\" /E /I /H"
echo ""
echo "2. Or manually copy the files to: $(pwd)/my-ecommerce-site/"
echo ""
echo "3. Once copied, I can help you make changes to your e-commerce site."
echo ""
echo "What specific changes do you want to make to your e-commerce site?"