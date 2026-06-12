#!/bin/bash
# ===========================================
# WhatsApp AI Replier - Local Build
# For generating IPA locally using Xcode
# ===========================================

set -e

echo "🔨 Starting Local Build for WhatsApp AI Replier..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Install dependencies
echo -e "${GREEN}Installing npm dependencies...${NC}"
npm install

# Install CocoaPods
echo -e "${GREEN}Installing CocoaPods dependencies...${NC}"
cd ios
pod install
cd ..

# Prebuild Expo
echo -e "${GREEN}Prebuilding Expo native project...${NC}"
npx expo prebuild --platform ios

# Build with Xcode
echo -e "${GREEN}Building with Xcode...${NC}"
cd ios

# Get available simulators
SIMULATORS=$(xcrun simctl list devices available | grep -E "iPhone (1[4-9]|SE)" | head -1)
SIMULATOR_ID=$(echo $SIMULATORS | grep -oE "[A-F0-9-]{36}")

if [ -z "$SIMULATOR_ID" ]; then
    SIMULATOR_ID=$(xcrun simctl list devices available | grep "iPhone" | head -1 | awk '{print $NF}')
fi

echo -e "${YELLOW}Using simulator: $SIMULATORS${NC}"

# Build using xcodebuild
xcodebuild -workspace WhatsAppAIReplier.xcworkspace \
    -scheme WhatsAppAIReplier \
    -configuration Release \
    -destination "platform=iOS Simulator,id=$SIMULATOR_ID" \
    -archivePath ../build/WhatsAppAIReplier.xcarchive \
    archive

# Check if archive succeeded
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Archive created successfully!${NC}"

    # Export IPA
    echo -e "${GREEN}Exporting IPA...${NC}"

    mkdir -p ../build

    xcodebuild -exportArchive \
        -archivePath ../build/WhatsAppAIReplier.xcarchive \
        -exportPath ../build \
        -exportOptionsPlist ExportOptions.plist

    echo -e "${GREEN}✅ IPA exported to build/WhatsAppAIReplier.ipa${NC}"
else
    echo -e "${RED}❌ Archive failed!${NC}"
    exit 1
fi

cd ..

echo -e "${GREEN}🎉 Build completed!${NC}"
echo ""
echo "IPA file location: build/WhatsAppAIReplier.ipa"
echo ""
echo "To install on device:"
echo "  - Open Xcode"
echo "  - Open the workspace"
echo "  - Select your team in Signing & Capabilities"
echo "  - Archive and export as IPA"