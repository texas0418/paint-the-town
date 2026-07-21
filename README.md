# Paint the Town - Local Development Setup

This project has been converted from a Rork AI app to a standard Expo React Native project that you can edit locally and run in Xcode.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or later) - [Download](https://nodejs.org/)
- **Xcode** (latest version) - Install from Mac App Store
- **Xcode Command Line Tools**: Run `xcode-select --install`
- **CocoaPods**: Run `sudo gem install cocoapods`
- **Watchman** (recommended): `brew install watchman`

## Quick Start

### 1. Install Dependencies

```bash
# Navigate to the project directory
cd Paint the Town-Xcode

# Install Node.js dependencies
npm install
```

### 2. Generate Native iOS Project

```bash
# Generate the ios folder with native code
npx expo prebuild --platform ios
```

This creates an `ios/` folder containing the Xcode project.

### 3. Install iOS Dependencies

```bash
cd ios
pod install
cd ..
```

### 4. Open in Xcode

```bash
# Option 1: Open from terminal
open ios/Paint the Town.xcworkspace

# Option 2: Open Xcode, then File > Open > select ios/TravelGenie.xcworkspace
```

**Important:** Always open the `.xcworkspace` file, not the `.xcodeproj` file.

### 5. Run the App

In Xcode:

1. Select your target device/simulator from the dropdown
2. Click the Play button (▶) or press `Cmd + R`

Or from terminal:

```bash
npx expo run:ios
```

## Development Workflow

### Running in Development Mode

```bash
# Start the Metro bundler
npm start

# In another terminal, run on iOS
npx expo run:ios

# Or run on Android
npx expo run:android
```

### Making Changes

1. Edit the source files in the `app/` directory
2. Changes will hot-reload automatically in the simulator
3. For native code changes, rebuild with `npx expo run:ios`

### Rebuilding Native Code

If you modify `app.json` or add new native dependencies:

```bash
# Clean rebuild
npx expo prebuild --clean --platform ios

# Reinstall pods
cd ios && pod install && cd ..

# Run again
npx expo run:ios
```

## Project Structure

```
Paint the Town-Xcode/
├── app/                    # App screens (file-based routing)
│   ├── (tabs)/            # Tab navigation screens
│   ├── _layout.tsx        # Root layout
│   └── *.tsx              # Individual screens
├── assets/                # Images and static files
├── constants/             # Theme colors and constants
├── contexts/              # React contexts
├── mocks/                 # Mock data for development
├── types/                 # TypeScript type definitions
├── ios/                   # Generated iOS native code (after prebuild)
├── app.json              # Expo configuration
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Customization

### Changing the App Name

Edit `app.json`:

```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-slug"
  }
}
```

### Changing the Bundle Identifier

Edit `app.json`:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourapp"
    }
  }
}
```

After changes, run `npx expo prebuild --clean`.

### Adding Your App Icon

1. Replace `assets/images/icon.png` (1024x1024px)
2. Replace `assets/images/adaptive-icon.png` for Android
3. Run `npx expo prebuild --clean`

## AI Assistant Integration

The AI Assistant feature (`app/ai-assistant.tsx`) has been modified to work without the Rork SDK.

To add your own AI service:

### Option 1: OpenAI

```bash
npm install openai
```

Then edit `app/ai-assistant.tsx`:

```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "YOUR_API_KEY", // Use environment variables in production!
});

async function sendMessageToAI(message, history, userContext) {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: `You are a travel assistant.` },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ],
  });
  return response.choices[0].message.content;
}
```

### Option 2: Anthropic Claude

```bash
npm install @anthropic-ai/sdk
```

### Option 3: Custom Backend

Create an API endpoint and update `sendMessageToAI` to call it.

## Troubleshooting

### "No bundle URL present" error

```bash
# Clear Metro cache
npx expo start --clear
```

### Pod install fails

```bash
cd ios
pod repo update
pod install --repo-update
cd ..
```

### Build fails after dependency changes

```bash
# Clean everything and rebuild
rm -rf ios
rm -rf node_modules
npm install
npx expo prebuild --platform ios
cd ios && pod install && cd ..
npx expo run:ios
```

### Xcode signing issues

1. Open `ios/TravelGenie.xcworkspace` in Xcode
2. Select the project in the navigator
3. Go to "Signing & Capabilities"
4. Select your Team
5. Enable "Automatically manage signing"

## Scripts Reference

| Command                     | Description                      |
| --------------------------- | -------------------------------- |
| `npm start`                 | Start Metro bundler              |
| `npx expo run:ios`          | Build and run on iOS             |
| `npx expo run:android`      | Build and run on Android         |
| `npx expo prebuild`         | Generate native projects         |
| `npx expo prebuild --clean` | Clean regenerate native projects |
| `npm run lint`              | Run ESLint                       |

## Building for Production

### iOS App Store

1. Configure your Apple Developer account in Xcode
2. Update version in `app.json`
3. In Xcode: Product > Archive
4. Upload to App Store Connect

### Using EAS Build (Recommended)

```bash
npm install -g eas-cli
eas login
eas build --platform ios
```

## Support

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router Documentation](https://expo.github.io/router/)

---

Happy coding! 🚀
