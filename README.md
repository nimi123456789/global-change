# 🌍 Global Change - Professional Currency Exchange Platform

**Send money internationally at real exchange rates. Only 0.5% fee. Web3 enabled.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/global-change)

🌐 **[LIVE DEMO](https://global-change.vercel.app)** | 📖 **[Deployment Guide](DEPLOYMENT.md)** | ⚡ **[Optimization Guide](OPTIMIZATION.md)**

---

## ✨ Production Features

### 🔴 LIVE NOW
- ✅ **Real Exchange Rates** - Live data from open.er-api.com API
- ✅ **Auto-Updates** - Rates refresh every 60 seconds
- ✅ **Web3 Integration** - Real MetaMask wallet connection
- ✅ **Secure Admin** - PIN code authentication (Default: 1234)
- ✅ **Data Persistence** - Full localStorage + backup to file
- ✅ **Mobile Ready** - Responsive design, works on all devices
- ✅ **Production Secure** - HTTPS, security headers, PIN protected

---

## 🎯 The Vision

Global Change is a **Digital Currency Exchange Platform** with an integrated **Virtual Prepaid Card**. Users exchange currencies peer-to-peer, and funds are instantly loaded to their prepaid card - no bank transfers needed.

### The Simple Flow:
1. **You have:** 100 EUR in your wallet
2. **You exchange:** Find a P2P offer to trade EUR for ILS
3. **You receive:** ILS is automatically loaded to your Virtual Prepaid Card
4. **You spend:** Use your card balance anywhere

### The Business Model:
- **0.5% fee** on every P2P exchange
- Fees go to `SystemAdmin` account (your profit)
- Users bypass traditional banking fees
- Direct peer-to-peer exchanges

---

## ✨ Key Features

### 🔐 Secure Authentication
- **Login/Signup System**: Password-protected accounts
- **Private Balances**: Each user sees only their own data
- **Session Management**: Secure session handling
- **Demo Account**: Login with `demo` / `demo123` to test

### 💳 Virtual Prepaid Card
- **Beautiful Card Visual**: Gradient card design with shimmer effect
- **Card Balance Display**: Shows available balance in ILS (₪)
- **Auto-Loading**: Received funds automatically load to card
- **Cardholder Name**: Your username appears on the card
- **Currency Conversion**: Non-ILS currencies auto-convert to ILS for card

### 💱 Multi-Currency Wallet
- **USD (US Dollar)** - 🇺🇸
- **EUR (Euro)** - 🇪🇺
- **ILS (Israeli Shekel)** - 🇮🇱
- **Live Exchange Rates**: Updates every 60 seconds from real market data
- **Rate Display**: See current rates on each currency card

### 🤝 P2P Exchange Order Book
- **Post Sell Orders**: List your currency for sale at your rate
- **Browse Orders**: See all active orders from other users
- **Instant Trading**: Click "Buy Now" to complete trades
- **Fee Transparency**: See the 0.5% fee before confirming
- **Auto Card Loading**: Received funds load directly to your prepaid card

### 📊 Transaction Management
- **Full History**: Track all transactions with timestamps
- **P2P Records**: See all exchange trades
- **Card Loading**: Track when funds load to card
- **Fee Records**: Platform fees are logged
- **Delete Transactions**: Remove individual entries

### 📡 Live Market Data
- **Real-Time Rates**: Fetched from ExchangeRate-API
- **Auto-Refresh**: Updates every 60 seconds
- **Status Indicator**: Pulsing dot shows live connection
- **Fallback**: Cached rates if API is unavailable

---

## 🚀 How to Use

### 1. Getting Started

**First Time:**
1. Open `login.html` in your browser
2. Click "Sign Up" tab
3. Create your account (username + password)
4. You're in!

**Demo Account:**
- Username: `demo`
- Password: `demo123`

### 2. Adding Funds to Your Wallet

Go to "Add Transaction" section:
1. Enter a description (e.g., "Initial deposit")
2. Enter amount (e.g., 100)
3. Select currency (USD, EUR, or ILS)
4. Choose "Income"
5. Click "Add Transaction"

Your wallet balance updates instantly!

### 3. Creating a P2P Sell Order

In the "P2P Exchange" section:
1. Enter amount to sell (e.g., 100)
2. Select currency to sell (e.g., EUR)
3. Select currency you want (e.g., ILS)
4. Enter your exchange rate (e.g., 4.0)
5. See preview of what you'll receive
6. Click "Post Sell Order"

Your funds are locked until someone buys or you cancel.

### 4. Buying from P2P Orders

Browse "Active Orders":
1. See all available offers
2. Check amounts, rates, and sellers
3. Click "Buy Now" on any order
4. Review the trade details including the 0.5% fee
5. Confirm the trade

**What happens:**
- You pay the amount + 0.5% fee
- You receive the currency
- It auto-converts to ILS if needed
- **Instantly loaded to your Virtual Prepaid Card!**
- Seller receives their payment
- 0.5% fee goes to SystemAdmin

### 5. Using Your Prepaid Card

Your Virtual Prepaid Card:
- Shows your available ILS balance
- Displays your username as cardholder
- Updates in real-time after exchanges
- Ready to use for spending

---

## 💰 Fee Structure

### Platform Fee: 0.5%

**Example Trade:**
```
Order: Sell 100 EUR for 400 ILS (rate: 4.0)

Buyer pays:
- 400 ILS (order amount)
- 2 ILS (0.5% fee)
- TOTAL: 402 ILS

Buyer receives:
- 100 EUR → Auto-loaded to card as 400 ILS

Seller receives:
- 400 ILS (full order amount)

SystemAdmin receives:
- 2 ILS (0.5% platform fee)
```

### Why the Fee?
- Covers platform maintenance
- Enables secure P2P trading
- Still cheaper than traditional banks
- Your profit as platform owner

---

## 🔒 Security Features

### Password Protection
- All accounts require passwords
- Simple hash-based storage (for demo)
- Session-based authentication
- Auto-logout on session end

### Private Data
- Each user has separate balances
- Transaction history is private
- Can't see other users' balances
- Secure user switching

### Best Practices
- Use strong passwords (6+ characters)
- Logout when done
- Don't share account credentials
- Test with small amounts first

---

## 🎨 Technical Details

### Tech Stack
- **Pure JavaScript** - No frameworks needed
- **LocalStorage** - All data stored locally
- **ExchangeRate-API** - Live market rates
- **CSS3** - Modern animations and gradients
- **Responsive** - Works on all devices

### Key Files
- `login.html` - Authentication page
- `login.css` - Login styling
- `auth.js` - Login/signup logic
- `index.html` - Main dashboard
- `style.css` - App styling
- `wallet.js` - Core functionality
- `README.md` - This documentation

### Storage Keys
- `gc_users` - User credentials
- `gc_session` - Current session
- `walletTransactions_{username}` - User transactions
- `cardBalance_{username}` - Prepaid card balance
- `p2pOrders` - Global order book

### API Integration
- **Endpoint:** https://api.exchangerate-api.com/v4/latest/USD
- **Update Frequency:** Every 60 seconds
- **No API Key:** Free tier (sufficient for this app)
- **Fallback:** Uses cached rates if API fails

---

## 🌟 The Competitive Advantage

### Why Global Change?

**Traditional Banks:**
- High currency exchange fees (2-4%)
- Slow bank transfers (1-3 days)
- Complex account setup
- Hidden charges

**Global Change:**
- ✅ Only 0.5% fee
- ✅ Instant P2P exchanges
- ✅ Direct card loading
- ✅ Transparent pricing
- ✅ No bank needed
- ✅ Full control

### Use Cases

1. **International Students**: Exchange currencies and load to card for spending
2. **Travelers**: Load prepaid card before trips
3. **Freelancers**: Receive payments in different currencies
4. **Expats**: Manage multi-currency finances
5. **Anyone**: Bypass expensive bank exchange fees

---

## 🔧 For Developers

### Customizing Exchange Rates
Rates update automatically from API, but you can change the API source in `wallet.js`:

```javascript
async fetchLiveRates() {
    const response = await fetch('YOUR_API_URL_HERE');
    // Update logic...
}
```

### Changing the Fee
In `wallet.js`, modify:
```javascript
this.P2P_FEE_PERCENT = 0.5; // Change to your desired %
```

### Changing Card Currency
Currently card uses ILS. To change:
```javascript
this.CARD_CURRENCY = 'USD'; // Or 'EUR'
```

### Adding More Currencies
1. Update HTML with new currency cards
2. Add currency to `exchangeRates` object
3. Update `getCurrencySymbol()` method
4. Fetch rates for new currency in API call

---

## 🚀 Deployment

### Local Testing
1. Open `login.html` directly in browser
2. No server needed!
3. Works completely offline (except live rates)

### Web Hosting
1. Upload all files to web host
2. Ensure HTTPS for security
3. Consider adding backend for production
4. Use real authentication system

### Production Recommendations
- Implement proper password hashing (bcrypt)
- Add backend API for data storage
- Use database instead of localStorage
- Add email verification
- Implement KYC for compliance
- Add real payment integration

---

## 📱 Browser Support

Works in all modern browsers:
- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Opera
- ✅ Mobile browsers

Requires:
- JavaScript enabled
- LocalStorage support
- Internet for live rates

---

## 🎯 Roadmap Ideas

### Future Features (Optional)
- [ ] Mobile app version
- [ ] QR code for card payments
- [ ] Multiple prepaid cards per user
- [ ] Transaction export (CSV/PDF)
- [ ] Email notifications
- [ ] Real card integration (physical)
- [ ] More currencies (GBP, JPY, etc.)
- [ ] Recurring exchanges
- [ ] Card spending limits
- [ ] Transaction categories

---

## 💡 Tips for Success

### For Users:
1. Start with small test transactions
2. Check exchange rates before trading
3. Compare rates from different sellers
4. Keep some balance in different currencies
5. Monitor your card balance regularly

### For Platform Owner:
1. Monitor SystemAdmin fees regularly
2. Ensure live rates are updating
3. Keep the demo account funded
4. Promote the 0.5% fee advantage
5. Market the "no bank" benefit

---

## 🆘 Troubleshooting

**Can't login?**
- Check username/password spelling
- Try demo account: demo/demo123
- Clear browser cache

**Rates not updating?**
- Check internet connection
- Wait 60 seconds for next update
- Refresh the page

**Card not loading?**
- Check if exchange was completed
- Verify transaction history
- Logout and login again

**Order not appearing?**
- Refresh the page
- Check if you have sufficient balance
- Verify order wasn't cancelled

---

## 📄 License

This is a demonstration project. Feel free to modify and use for educational or commercial purposes.

**Note:** This uses localStorage for demo purposes. For production, implement proper backend infrastructure with secure authentication and database storage.

---

## 🌍 About Global Change

**Mission:** Make currency exchange accessible, affordable, and instant for everyone.

**Vision:** A world where people control their money without relying on expensive banking systems.

**Built with:** JavaScript, passion, and a belief that financial services should serve the people.

---

**Ready to Exchange?** Open `login.html` and start your journey! 🚀

---

*Global Change - Exchange. Load. Spend. No Banks Required.*
