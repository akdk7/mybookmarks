#!/bin/bash

# MyBookmarks Extension Builder Script
# Creates dated packages for Firefox and Chrome extensions

# Get current date in ISO format (YYYY-MM-DD)
DATE=$(date +%Y-%m-%d)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
FIREFOX_DIR="$SCRIPT_DIR/firefox"
CHROME_DIR="$SCRIPT_DIR/chrome"
OUTPUT_DIR="$SCRIPT_DIR/builds"

# Create builds directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  MyBookmarks Extension Builder         ║${NC}"
echo -e "${BLUE}║  Date: ${DATE}                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if directories exist
if [ ! -d "$FIREFOX_DIR" ]; then
    echo -e "${RED}❌ Error: Firefox extension directory not found at $FIREFOX_DIR${NC}"
    exit 1
fi

if [ ! -d "$CHROME_DIR" ]; then
    echo -e "${YELLOW}⚠️  Warning: Chrome extension directory not found at $CHROME_DIR${NC}"
    echo -e "${YELLOW}   Creating Chrome version from Firefox...${NC}"
    mkdir -p "$CHROME_DIR"
    cp -r "$FIREFOX_DIR"/* "$CHROME_DIR/"
    # Remove Firefox-specific settings from manifest
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' '/"browser_specific_settings"/,/}/d' "$CHROME_DIR/manifest.json"
    else
        sed -i '/"browser_specific_settings"/,/}/d' "$CHROME_DIR/manifest.json"
    fi
fi

# Function to create Firefox extension
build_firefox() {
    echo -e "${YELLOW}🦊 Building Firefox Extension...${NC}"

    FIREFOX_FILE="$OUTPUT_DIR/mybookmarks-firefox-${DATE}.xpi"

    # Remove old file if exists
    [ -f "$FIREFOX_FILE" ] && rm "$FIREFOX_FILE"

    # Create XPI (which is just a ZIP file)
    cd "$FIREFOX_DIR"
    zip -r "$FIREFOX_FILE" * \
        -x "*.DS_Store" \
        -x "*/.DS_Store" \
        -x "*/.*" \
        >/dev/null 2>&1

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Firefox extension created: $(basename "$FIREFOX_FILE")${NC}"
        echo -e "   Path: $FIREFOX_FILE"
        echo -e "   Size: $(du -h "$FIREFOX_FILE" | cut -f1)"
    else
        echo -e "${RED}❌ Failed to create Firefox extension${NC}"
        return 1
    fi

    cd "$SCRIPT_DIR"
}

# Function to create Chrome extension
build_chrome() {
    echo -e "${YELLOW}🔷 Building Chrome Extension...${NC}"

    CHROME_FILE="$OUTPUT_DIR/mybookmarks-chrome-${DATE}.zip"

    # Remove old file if exists
    [ -f "$CHROME_FILE" ] && rm "$CHROME_FILE"

    # Create ZIP for Chrome
    cd "$CHROME_DIR"
    zip -r "$CHROME_FILE" * \
        -x "*.DS_Store" \
        -x "*/.DS_Store" \
        -x "*/.*" \
        -x "README.md" \
        >/dev/null 2>&1

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Chrome extension created: $(basename "$CHROME_FILE")${NC}"
        echo -e "   Path: $CHROME_FILE"
        echo -e "   Size: $(du -h "$CHROME_FILE" | cut -f1)"
    else
        echo -e "${RED}❌ Failed to create Chrome extension${NC}"
        return 1
    fi

    cd "$SCRIPT_DIR"
}

# Function to create a version info file
create_version_info() {
    VERSION_FILE="$OUTPUT_DIR/version-${DATE}.txt"

    echo "MyBookmarks Extension Build Information" > "$VERSION_FILE"
    echo "=======================================" >> "$VERSION_FILE"
    echo "" >> "$VERSION_FILE"
    echo "Build Date: ${DATE}" >> "$VERSION_FILE"
    echo "Build Time: $(date +%H:%M:%S)" >> "$VERSION_FILE"
    echo "Build User: $(whoami)" >> "$VERSION_FILE"
    echo "Build Host: $(hostname)" >> "$VERSION_FILE"
    echo "" >> "$VERSION_FILE"

    # Get version from manifest.json
    if [ -f "$FIREFOX_DIR/manifest.json" ]; then
        VERSION=$(grep '"version"' "$FIREFOX_DIR/manifest.json" | sed 's/.*"version".*:.*"\(.*\)".*/\1/')
        echo "Extension Version: $VERSION" >> "$VERSION_FILE"
    fi

    echo "" >> "$VERSION_FILE"
    echo "Files Created:" >> "$VERSION_FILE"
    echo "- mybookmarks-firefox-${DATE}.xpi" >> "$VERSION_FILE"
    echo "- mybookmarks-chrome-${DATE}.zip" >> "$VERSION_FILE"

    echo -e "${GREEN}📄 Version info saved to: $(basename "$VERSION_FILE")${NC}"
}

# Main build process
main() {
    echo -e "${BLUE}Starting build process...${NC}"
    echo ""

    # Build Firefox extension
    build_firefox
    echo ""

    # Build Chrome extension
    build_chrome
    echo ""

    # Create version info
    create_version_info
    echo ""

    # Summary
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  Build Complete!                       ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}📦 Packages created in: $OUTPUT_DIR${NC}"
    echo ""
    echo -e "${YELLOW}Installation Instructions:${NC}"
    echo ""
    echo "Firefox:"
    echo "  1. Open about:debugging"
    echo "  2. Click 'Load Temporary Add-on'"
    echo "  3. Select: mybookmarks-firefox-${DATE}.xpi"
    echo ""
    echo "Chrome:"
    echo "  1. Open chrome://extensions/"
    echo "  2. Enable 'Developer mode'"
    echo "  3. Drag and drop: mybookmarks-chrome-${DATE}.zip"
    echo "     OR click 'Load unpacked' and select the firefox/ folder"
    echo ""

    # List all created files
    echo -e "${BLUE}Files in builds directory:${NC}"
    ls -lh "$OUTPUT_DIR"/*.{xpi,zip,txt} 2>/dev/null | tail -n +1 | while read line; do
        echo "  $line"
    done
}

# Run main function
main

# Make script exit with success
exit 0