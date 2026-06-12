#!/bin/bash
# ===========================================
# WhatsApp AI Replier - Codemagic Build
# For automated iOS IPA generation
# ===========================================

set -e

echo "🔨 Starting Codemagic Build for WhatsApp AI Replier..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Install dependencies
echo -e "${GREEN}Installing npm dependencies...${NC}"
npm install

# Install EAS CLI
echo -e "${GREEN}Installing EAS CLI...${NC}"
npm install -g eas-cli

# Build using EAS (non-interactive)
echo -e "${GREEN}Starting EAS build...${NC}"

# Build for iOS Preview
eas build --platform ios \
    --profile preview \
    --non-interactive \
    --auto-submit

echo -e "${GREEN}✅ Codemagic build completed!${NC}"