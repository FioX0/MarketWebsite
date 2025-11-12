# 9CAPI Marketplace

A modern, responsive marketplace website for browsing and purchasing items from the 9CAPI Market Worker. Built with Vue.js and TypeScript, featuring integration with the Chrono wallet extension.

![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)

## Features

- 🔐 **Wallet Integration**: Connect with Chrono wallet extension
- 👀 **Read-Only Mode**: Browse marketplace items without connecting a wallet
- 🔍 **Advanced Filtering**: Filter by category, elemental type, and search by item name
- 📊 **Item Details**: View comprehensive item information including:
  - Combat power and stats
  - Skill descriptions and power
  - Stat quality percentages (min/max roll calculations)
  - Grade and level information
  - Star ratings based on additional stats and skills
- 📈 **Trade History**: View complete transaction history for any item
- 🌐 **Multi-Network Support**: Browse items from both Odin and Heimdall networks
- 📱 **Responsive Design**: Fully optimized for mobile and desktop devices
- 🎨 **Modern UI**: Dark theme with Nine Chronicles like branding

## Prerequisites

- **Node.js**: Version 18 or higher (20 LTS is what was used to develop the application)
- **npm**: Version 8 or higher
- **Chrono Wallet Extension** (optional): Install from [Chrome Web Store](https://chrome.google.com/webstore) or build from [source](https://github.com/planetarium/chrono)

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd MarketWebsite
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   The application will automatically open at `http://localhost:3000`

## Usage

### Connecting Your Wallet

1. **Install Chrono Wallet**: Make sure you have the Chrono wallet extension installed in your browser
2. **Connect**: Click "Login with Chrono" when prompted
3. **Select Account**: Choose an account from your wallet
4. **Start Browsing**: The marketplace will automatically load items from your connected network

### Read-Only Mode

1. **Select Read-Only**: Click "Read Only" when the login modal appears
2. **Choose Network**: Select either Odin or Heimdall network
3. **Browse Items**: Explore the marketplace without connecting a wallet
   - Note: "Buy Now" button will be hidden in read-only mode

### Browsing Items

- **Categories**: Filter by equipment type (Weapons, Armor, Belts, Necklaces, Rings)
- **Elemental Types**: Filter by elemental attribute (None, Fire, Water, Earth, Wind)
- **Search**: Type item names in the search box to find specific items
- **Sorting**: Sort by combat power, price, grade, level, and more
- **Pagination**: Navigate through pages of items

### Viewing Item Details

Each item card displays:
- Item name and icon
- Grade and level badges
- Combat power
- Elemental type
- Base and additional stats with quality percentages
- Skills with descriptions
- Price in NCG and Crystal
- Star rating (yellow for base/additional stats, purple for skills)

### Trade History

1. Click the "History" button on any item card
2. View complete transaction history including:
   - List and buy block numbers
   - Seller and buyer avatar names
   - Transaction prices
   - Item levels at time of sale

### Purchasing Items

1. **Connect Wallet**: Ensure you're connected with Chrono wallet
2. **Select Item**: Browse and find the item you want to purchase
3. **Buy Now**: Click the "Buy Now" button
4. **Sign Transaction**: Approve the transaction in your Chrono wallet
5. **Confirm**: Wait for transaction confirmation

## Project Structure

```
MarketWebsite/
├── public/
│   └── favicon.png          # Application favicon
├── src/
│   ├── components/
│   │   └── AppHeader.vue    # Header component with wallet info
│   ├── router/
│   │   └── index.ts         # Vue Router configuration
│   ├── services/
│   │   └── itemDataService.ts  # Item/skill data loading and stat calculations
│   ├── views/
│   │   └── Market.vue       # Main marketplace view
│   ├── App.vue              # Root component
│   └── main.ts              # Application entry point
├── index.html               # HTML entry point
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── tsconfig.node.json       # TypeScript config for Node files
└── vite.config.ts           # Vite build configuration
```

## Technologies Used

- **Vue.js 3.5**: Progressive JavaScript framework
- **TypeScript 5.9**: Type-safe JavaScript
- **Vite 7.1**: Fast build tool and dev server
- **Vue Router 4.6**: Client-side routing
- **@planetarium/chrono-sdk**: Chrono wallet integration
- **@planetarium/bencodex**: Bencodex encoding for transactions
- **@planetarium/account**: Account management
- **@planetarium/tx**: Transaction handling

## API Endpoints

The application integrates with the following services:

- **9CAPI Marketplace API**: `https://api.9capi.com/`
  - Market data for Odin and Heimdall networks
  - Trade history endpoints
- **Nine Chronicles GraphQL**: 
  - `https://heimdall-rpc-1.nine-chronicles.com/graphql`
  - `https://odin-rpc-1.nine-chronicles.com/graphql`
- **GitHub Raw Content**: 
  - Item and skill data from `planetarium/lib9c`
  - Localization data from `planetarium/NineChronicles`

## Building for Production

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Preview the production build**:
   ```bash
   npm run preview
   ```

3. **Deploy**: The `dist/` folder contains the production-ready files that can be deployed to any static hosting service.

## Development Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm start` - Alias for `npm run dev`

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Edge
- Safari

**Note**: Chrono wallet extension is required for purchasing items. The extension is currently available for Chromium-based browsers.

## Security

This application follows security best practices:

- ✅ All API calls use HTTPS
- ✅ GraphQL queries use parameterized variables (prevents injection)
- ✅ User input is properly sanitized and validated
- ✅ No dangerous JavaScript functions (eval, innerHTML, etc.)
- ✅ Vue.js automatic XSS protection via template escaping
- ✅ Secure wallet integration through Chrono SDK

## Troubleshooting

### Wallet Not Detected
- Ensure the Chrono wallet extension is installed and enabled
- Refresh the page after installing the extension
- Check browser console for error messages

### Connection Failed
- Make sure the wallet extension is unlocked
- Try refreshing the page and reconnecting
- Verify the extension is properly configured

### Purchase Failed
- Ensure you're connected to the wallet
- Check if the wallet has sufficient balance
- Verify the wallet is unlocked
- Make sure you're on the correct network (Odin or Heimdall)

### Items Not Loading
- Check your internet connection
- Verify the API endpoints are accessible
- Check browser console for error messages
- Try switching networks (Odin/Heimdall)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Resources

- [Chrono Wallet Documentation](https://chrono.nine-chronicles.dev)
- [Chrono GitHub Repository](https://github.com/planetarium/chrono)
- [Nine Chronicles](https://nine-chronicles.com)
- [9CAPI Documentation](https://api.9capi.com)
- [Vue.js Documentation](https://vuejs.org)
- [Vite Documentation](https://vitejs.dev)

## Acknowledgments

- Built for the Nine Chronicles community
- Uses data from [planetarium/lib9c](https://github.com/planetarium/lib9c)
- Integrates with [Chrono Wallet](https://github.com/planetarium/chrono)

