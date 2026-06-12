#!/bin/bash
# ===========================================
# WhatsApp AI Replier - Build Script
# For iOS IPA Generation
# ===========================================

set -e

echo "🔨 Starting WhatsApp AI Replier Build..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check for EAS CLI
if ! command -v eas &> /dev/null; then
    echo -e "${YELLOW}Installing EAS CLI...${NC}"
    npm install -g eas-cli
fi

# Login to EAS (interactive)
echo -e "${GREEN}Please login to your EAS account:${NC}"
eas login

# Configure credentials (interactive)
echo -e "${YELLOW}Configuring iOS build credentials...${NC}"
eas credentials --platform ios

# Build for iOS Simulator (Development)
echo -e "${GREEN}Building for iOS Simulator (Development)...${NC}"
eas build --platform ios --profile development --local

# If successful, export IPA
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful!${NC}"
    echo -e "${YELLOW}IPA file is located in the build output directory${NC}"
else
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Build completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Open Xcode and load the project"
echo "2. Select your target device/simulator"
echo "3. Build and run, or archive for App Store"
echo ""
echo "Or use EAS Build for cloud compilation:"
echo "  eas build --platform ios --profile preview"
echo "  eas build --platform ios --profile production"