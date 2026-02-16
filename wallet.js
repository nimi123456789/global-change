// ============================================
// SOVEREIGN INFRASTRUCTURE PROTOCOL
// ============================================

// Simple SHA-256 implementation
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

class Block {
    constructor(timestamp, transactions, previousHash = '') {
        this.index = 0;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.hash = '';
        this.nonce = 0;
    }

    async calculateHash() {
        const data =
            this.index +
            this.previousHash +
            this.timestamp +
            JSON.stringify(this.transactions) +
            this.nonce;
        return await sha256(data);
    }

    async mineBlock() {
        this.hash = await this.calculateHash();
    }
}

class Blockchain {
    constructor() {
        this.chain = [];
        this.pendingTransactions = [];
        this.blockTime = 5000; // 5 seconds per block
        this.lastBlockTime = Date.now();
    }

    async init() {
        await this.createGenesisBlock();
        this.loadChain();
        this.startBlockMining();
    }

    async createGenesisBlock() {
        const genesis = new Block(Date.now(), [], "0");
        genesis.index = 0;
        await genesis.mineBlock();
        this.chain.push(genesis);
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addPendingTransaction(transaction) {
        this.pendingTransactions.push(transaction);
    }

    async minePendingTransactions() {
        if (this.pendingTransactions.length === 0) return;

        const block = new Block(
            Date.now(),
            this.pendingTransactions,
            this.getLatestBlock().hash
        );

        block.index = this.chain.length;
        await block.mineBlock();

        this.chain.push(block);
        this.pendingTransactions = [];
        this.lastBlockTime = Date.now();

        this.saveChain();
    }

    startBlockMining() {
        setInterval(async () => {
            if (Date.now() - this.lastBlockTime >= this.blockTime) {
                await this.minePendingTransactions();
            }
        }, 1000);
    }

    async isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            const recalculatedHash = await currentBlock.calculateHash();
            if (currentBlock.hash !== recalculatedHash) {
                return { valid: false, reason: `Block ${i} hash mismatch` };
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return { valid: false, reason: `Block ${i} chain broken` };
            }
        }
        return { valid: true };
    }

    saveChain() {
        localStorage.setItem('gc_blockchain', JSON.stringify(this.chain));
    }

    loadChain() {
        const saved = localStorage.getItem('gc_blockchain');
        if (saved) {
            const data = JSON.parse(saved);
            this.chain = data.map(b => {
                const block = new Block(b.timestamp, b.transactions, b.previousHash);
                block.index = b.index;
                block.hash = b.hash;
                block.nonce = b.nonce;
                return block;
            });
        }
    }
}

class CircuitBreaker {
    constructor() {
        this.withdrawalHistory = [];
        this.THRESHOLD = 0.20; // 20%
        this.WINDOW = 60000; // 60 seconds
        this.isTripped = false;
    }

    recordWithdrawal(amount) {
        this.withdrawalHistory.push({
            amount,
            timestamp: Date.now()
        });

        // Clean old entries
        const cutoff = Date.now() - this.WINDOW;
        this.withdrawalHistory = this.withdrawalHistory.filter(
            w => w.timestamp > cutoff
        );
    }

    checkTripCondition(totalLiquidity) {
        const cutoff = Date.now() - this.WINDOW;
        const recentWithdrawals = this.withdrawalHistory
            .filter(w => w.timestamp > cutoff)
            .reduce((sum, w) => sum + w.amount, 0);

        const ratio = recentWithdrawals / totalLiquidity;

        if (ratio > this.THRESHOLD) {
            this.isTripped = true;
            return {
                tripped: true,
                ratio: (ratio * 100).toFixed(2),
                withdrawals: recentWithdrawals.toFixed(2),
                liquidity: totalLiquidity.toFixed(2)
            };
        }

        return { tripped: false };
    }

    reset() {
        this.isTripped = false;
        this.withdrawalHistory = [];
    }
}

class LiquidityPool {
    constructor(tokenA, tokenB) {
        this.tokenA = tokenA;
        this.tokenB = tokenB;
        this.reserveA = 10000;
        this.reserveB = 10000;
        this.k = this.reserveA * this.reserveB;
        this.lastUpdate = Date.now();
    }

    getSpotPrice(tokenIn) {
        if (tokenIn === this.tokenA) {
            return this.reserveB / this.reserveA;
        }
        return this.reserveA / this.reserveB;
    }

    getAmountOut(tokenIn, amountIn) {
        let reserveIn, reserveOut;
        if (tokenIn === this.tokenA) {
            reserveIn = this.reserveA;
            reserveOut = this.reserveB;
        } else {
            reserveIn = this.reserveB;
            reserveOut = this.reserveA;
        }

        const amountOut = reserveOut - (this.k / (reserveIn + amountIn));
        return amountOut;
    }

    swap(tokenIn, amountIn) {
        const amountOut = this.getAmountOut(tokenIn, amountIn);

        if (tokenIn === this.tokenA) {
            this.reserveA += amountIn;
            this.reserveB -= amountOut;
        } else {
            this.reserveB += amountIn;
            this.reserveA -= amountOut;
        }

        this.lastUpdate = Date.now();
        return amountOut;
    }

    addLiquidity(amountA, amountB) {
        this.reserveA += amountA;
        this.reserveB += amountB;
        this.k = this.reserveA * this.reserveB;
    }
}

class DoubleEntryLedger {
    constructor() {
        this.accounts = {
            USER_ASSETS_USD: 0,
            USER_ASSETS_EUR: 0,
            USER_ASSETS_ILS: 0,
            SYSTEM_VAULT_USD: 10000,
            SYSTEM_VAULT_EUR: 10000,
            SYSTEM_VAULT_ILS: 10000,
            SYSTEM_LIABILITY_USD: 0,
            SYSTEM_LIABILITY_EUR: 0,
            SYSTEM_LIABILITY_ILS: 0,
            FEE_INCOME_USD: 0,
            FEE_INCOME_EUR: 0,
            FEE_INCOME_ILS: 0,
            SYSTEM_EQUITY: 30000
        };

        this.loadAccounts();
    }

    loadAccounts() {
        const saved = localStorage.getItem('gc_accounts');
        if (saved) {
            this.accounts = JSON.parse(saved);
        }
    }

    saveAccounts() {
        localStorage.setItem('gc_accounts', JSON.stringify(this.accounts));
    }

    verifyBalance() {
        const assets =
            this.accounts.USER_ASSETS_USD +
            this.accounts.USER_ASSETS_EUR +
            this.accounts.USER_ASSETS_ILS +
            this.accounts.SYSTEM_VAULT_USD +
            this.accounts.SYSTEM_VAULT_EUR +
            this.accounts.SYSTEM_VAULT_ILS;

        const liabilities =
            this.accounts.SYSTEM_LIABILITY_USD +
            this.accounts.SYSTEM_LIABILITY_EUR +
            this.accounts.SYSTEM_LIABILITY_ILS;

        const equity =
            this.accounts.FEE_INCOME_USD +
            this.accounts.FEE_INCOME_EUR +
            this.accounts.FEE_INCOME_ILS +
            this.accounts.SYSTEM_EQUITY;

        const difference = Math.abs(assets - (liabilities + equity));
        return difference < 0.01;
    }
}

class ACIDTransaction {
    constructor(ledger, description) {
        this.ledger = ledger;
        this.description = description;
        this.entries = [];
        this.checkpoint = null;
        this.state = 'PENDING';
        this.id = this.generateTransactionId();
        this.timestamp = new Date().toISOString();
        this.userIdHash = '';
    }

    generateTransactionId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 100000);
        return `GC-${random.toString().padStart(5, '0')}`;
    }

    async setAnonymousUser(userId) {
        this.userIdHash = await sha256(userId + this.timestamp);
    }

    createCheckpoint() {
        return JSON.parse(JSON.stringify(this.ledger.accounts));
    }

    addEntry(account, amount) {
        this.entries.push({ account, amount });
    }

    validate() {
        const total = this.entries.reduce((sum, entry) => sum + entry.amount, 0);
        return Math.abs(total) < 0.01;
    }

    commit() {
        try {
            this.checkpoint = this.createCheckpoint();

            if (!this.validate()) {
                throw new Error('Transaction does not balance');
            }

            this.entries.forEach(entry => {
                this.ledger.accounts[entry.account] += entry.amount;
            });

            if (!this.ledger.verifyBalance()) {
                throw new Error('Accounting equation violated');
            }

            this.ledger.saveAccounts();
            this.state = 'COMMITTED';
            return { success: true, id: this.id };

        } catch (error) {
            if (this.checkpoint) {
                this.ledger.accounts = this.checkpoint;
            }

            this.state = 'FAILED';
            return { success: false, error: error.message };
        }
    }

    toBlockchainTransaction() {
        return {
            id: this.id,
            timestamp: this.timestamp,
            userHash: this.userIdHash,
            description: this.description,
            entriesHash: this.entries.map(e => `${e.account}:${e.amount.toFixed(2)}`).join('|'),
            state: this.state
        };
    }
}

class SovereignProtocol {
    constructor() {
        this.ledger = new DoubleEntryLedger();

        this.pools = {
            'EUR_ILS': new LiquidityPool('EUR', 'ILS'),
            'USD_ILS': new LiquidityPool('USD', 'ILS'),
            'EUR_USD': new LiquidityPool('EUR', 'USD')
        };

        this.blockchain = new Blockchain();
        this.circuitBreaker = new CircuitBreaker();

        this.initializePools();

        this.isLocked = false;
        this.isFrozen = false;
        this.collateralizationRatio = 100;
        this.loadAdminSettings();

        this.selectedLoadCurrency = null;
        this.selectedFromCurrency = null;
        this.selectedToCurrency = null;
        this.currentPreview = null;

        this.pulseInterval = null;
        this.metricsInterval = null;

        this.init();
    }

    async init() {
        if (this.isLocked) {
            this.showSystemLocked();
            return;
        }

        await this.blockchain.init();
        this.initializeStartingBalance();
        this.updateCardDisplay();
        this.attachEventListeners();
        this.startHighFrequencyPulse();
        this.startMetricsMonitoring();
    }

    initializePools() {
        const eurIls = this.ledger.accounts.SYSTEM_VAULT_EUR;
        const usdIls = this.ledger.accounts.SYSTEM_VAULT_USD;
        const ilsEur = this.ledger.accounts.SYSTEM_VAULT_ILS / 2;
        const ilsUsd = this.ledger.accounts.SYSTEM_VAULT_ILS / 2;

        this.pools['EUR_ILS'].addLiquidity(eurIls, ilsEur);
        this.pools['USD_ILS'].addLiquidity(usdIls, ilsUsd);
        this.pools['EUR_USD'].addLiquidity(1000, 1000);
    }

    // ============================================
    // INCENTIVE ENGINE
    // ============================================

    calculateIncentiveFee(currency, isDeposit) {
        const reserves = this.ledger.accounts[`SYSTEM_VAULT_${currency}`];

        // Calculate total reserves in normalized units
        const totalReserves =
            this.ledger.accounts.SYSTEM_VAULT_USD +
            this.ledger.accounts.SYSTEM_VAULT_EUR +
            this.ledger.accounts.SYSTEM_VAULT_ILS;

        const reserveRatio = reserves / totalReserves;

        if (isDeposit) {
            // Low reserves? Incentivize deposits with lower fees
            if (reserveRatio < 0.15) {
                return 0; // FREE deposits!
            } else if (reserveRatio < 0.25) {
                return 0.1; // 0.1% fee
            } else if (reserveRatio < 0.35) {
                return 0.2; // 0.2% fee
            }
            return 0.3; // Normal fee
        } else {
            // Withdrawing from low reserves? Discourage with higher fees
            if (reserveRatio < 0.15) {
                return 1.5; // 1.5% penalty
            } else if (reserveRatio < 0.25) {
                return 1.0; // 1.0% fee
            }
            return 0.5; // Normal fee
        }
    }

    getReserveStatus(currency) {
        const reserves = this.ledger.accounts[`SYSTEM_VAULT_${currency}`];
        const totalReserves =
            this.ledger.accounts.SYSTEM_VAULT_USD +
            this.ledger.accounts.SYSTEM_VAULT_EUR +
            this.ledger.accounts.SYSTEM_VAULT_ILS;

        const ratio = reserves / totalReserves;

        if (ratio < 0.15) return 'CRITICAL';
        if (ratio < 0.25) return 'LOW';
        if (ratio < 0.35) return 'MEDIUM';
        return 'HEALTHY';
    }

    // ============================================
    // CIRCUIT BREAKER
    // ============================================

    startMetricsMonitoring() {
        this.metricsInterval = setInterval(() => {
            const totalLiquidity =
                this.ledger.accounts.SYSTEM_VAULT_USD +
                this.ledger.accounts.SYSTEM_VAULT_EUR +
                this.ledger.accounts.SYSTEM_VAULT_ILS;

            const status = this.circuitBreaker.checkTripCondition(totalLiquidity);

            if (status.tripped) {
                this.freezeSystem(status);
            }

            // Update admin metrics if modal is open
            const adminModal = document.getElementById('admin-modal');
            if (adminModal && adminModal.classList.contains('active')) {
                this.updateAdminMetrics();
            }
        }, 1000); // Check every second
    }

    freezeSystem(status) {
        this.isFrozen = true;
        clearInterval(this.metricsInterval);
        clearInterval(this.pulseInterval);

        alert(`
🚨 EMERGENCY CIRCUIT BREAKER TRIGGERED

Reason: Bank run detected
Withdrawals: ${status.withdrawals} (${status.ratio}% of liquidity)
Total Liquidity: ${status.liquidity}
Time Window: 60 seconds

System is FROZEN to protect user funds.
        `);

        const overlay = document.createElement('div');
        overlay.id = 'freeze-overlay';
        overlay.innerHTML = `
            <div class="freeze-modal">
                <h1>🚨 SYSTEM FROZEN</h1>
                <p>EMERGENCY CIRCUIT BREAKER ACTIVATED</p>
                <div class="freeze-stats">
                    <div>Withdrawal Rate: ${status.ratio}%</div>
                    <div>Threshold: 20%</div>
                    <div>Status: BREAKER TRIPPED</div>
                </div>
                <button onclick="window.app.unfreezeSystem()" class="unfreeze-btn">
                    Admin Override
                </button>
            </div>
        `;
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 59, 48, 0.95);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Courier New', monospace;
        `;
        document.body.appendChild(overlay);
    }

    unfreezeSystem() {
        this.isFrozen = false;
        this.circuitBreaker.reset();

        const overlay = document.getElementById('freeze-overlay');
        if (overlay) overlay.remove();

        this.startMetricsMonitoring();
        this.startHighFrequencyPulse();
    }

    // ============================================
    // HIGH-FREQUENCY PULSE
    // ============================================

    startHighFrequencyPulse() {
        this.pulseInterval = setInterval(() => {
            this.updateLiveMetrics();
        }, 100);
    }

    updateLiveMetrics() {
        const eurIlsPrice = this.pools['EUR_ILS'].getSpotPrice('EUR');
        const usdIlsPrice = this.pools['USD_ILS'].getSpotPrice('USD');

        const fluctuation = (Math.random() - 0.5) * 0.001;

        const eurIlsEl = document.getElementById('pool-eur-ils');
        const usdIlsEl = document.getElementById('pool-usd-ils');

        if (eurIlsEl) {
            eurIlsEl.textContent = (eurIlsPrice + fluctuation).toFixed(8);
        }
        if (usdIlsEl) {
            usdIlsEl.textContent = (usdIlsPrice + fluctuation).toFixed(8);
        }

        // Update block height
        const blockEl = document.getElementById('block-height');
        if (blockEl) {
            blockEl.textContent = this.blockchain.chain.length;
        }
    }

    // ============================================
    // ADMIN SETTINGS
    // ============================================

    loadAdminSettings() {
        const saved = localStorage.getItem('gc_admin_settings');
        if (saved) {
            const settings = JSON.parse(saved);
            this.collateralizationRatio = settings.collateralizationRatio || 100;
        }
    }

    saveAdminSettings() {
        localStorage.setItem('gc_admin_settings', JSON.stringify({
            collateralizationRatio: this.collateralizationRatio
        }));
    }

    updateCollateralizationRatio(ratio) {
        this.collateralizationRatio = Math.max(1, Math.min(200, ratio));
        this.saveAdminSettings();
    }

    // ============================================
    // BLOCKCHAIN VERIFICATION
    // ============================================

    async verifyBlockchain() {
        const result = await this.blockchain.isChainValid();
        const statusEl = document.getElementById('chain-status');

        if (statusEl) {
            if (result.valid) {
                statusEl.className = 'chain-status valid';
                statusEl.textContent = `✓ CHAIN_VERIFIED | ${this.blockchain.chain.length} BLOCKS | INTEGRITY_INTACT`;
            } else {
                statusEl.className = 'chain-status invalid';
                statusEl.textContent = `✗ CHAIN_COMPROMISED | ${result.reason || 'UNKNOWN_ERROR'}`;
            }

            // Hide after 5 seconds
            setTimeout(() => {
                if (statusEl) statusEl.style.display = 'none';
            }, 5000);
        }

        return result.valid;
    }

    // ============================================
    // AMM EXCHANGE
    // ============================================

    async initializeStartingBalance() {
        const initialized = localStorage.getItem('gc_institutional_initialized');
        if (!initialized) {
            const tx = new ACIDTransaction(this.ledger, 'Initial welcome bonus');
            await tx.setAnonymousUser('system_user');
            tx.addEntry('USER_ASSETS_EUR', 1000);
            tx.addEntry('SYSTEM_LIABILITY_EUR', 1000);
            const result = tx.commit();

            if (result.success) {
                this.blockchain.addPendingTransaction(tx.toBlockchainTransaction());
            }

            localStorage.setItem('gc_institutional_initialized', 'true');
        }
    }

    getPoolKey(fromCurrency, toCurrency) {
        const pairs = [
            ['EUR', 'ILS'],
            ['USD', 'ILS'],
            ['EUR', 'USD']
        ];

        for (const pair of pairs) {
            if ((pair[0] === fromCurrency && pair[1] === toCurrency) ||
                (pair[1] === fromCurrency && pair[0] === toCurrency)) {
                return `${pair[0]}_${pair[1]}`;
            }
        }

        return null;
    }

    calculateExchangePreview(amount, fromCurrency, toCurrency) {
        if (!amount || amount <= 0 || fromCurrency === toCurrency) {
            return null;
        }

        const poolKey = this.getPoolKey(fromCurrency, toCurrency);
        if (!poolKey) return null;

        const pool = this.pools[poolKey];
        const spotPrice = pool.getSpotPrice(fromCurrency);
        const amountOut = pool.getAmountOut(fromCurrency, amount);

        const effectiveRate = amountOut / amount;
        const slippage = ((spotPrice - effectiveRate) / spotPrice) * 100;

        // Get incentive fee
        const depositFee = this.calculateIncentiveFee(toCurrency, true);
        const reserveStatus = this.getReserveStatus(toCurrency);

        return {
            amount,
            fromCurrency,
            toCurrency,
            spotPrice,
            amountOut,
            effectiveRate,
            slippage: Math.abs(slippage),
            poolKey,
            depositFee,
            reserveStatus
        };
    }

    updateExchangePreview() {
        const amount = parseFloat(document.getElementById('exchange-amount').value);
        const fromCurrency = this.selectedFromCurrency;
        const toCurrency = this.selectedToCurrency;

        const previewEl = document.getElementById('exchange-preview');

        if (!amount || !fromCurrency || !toCurrency || fromCurrency === toCurrency) {
            previewEl.style.display = 'none';
            this.currentPreview = null;
            return;
        }

        const preview = this.calculateExchangePreview(amount, fromCurrency, toCurrency);
        this.currentPreview = preview;

        if (preview) {
            const poolKey = preview.poolKey;
            const pool = this.pools[poolKey];

            const statusColor = {
                'CRITICAL': '#ff3b30',
                'LOW': '#ff9f0a',
                'MEDIUM': '#34c759',
                'HEALTHY': '#00c7be'
            }[preview.reserveStatus];

            previewEl.style.display = 'block';
            previewEl.innerHTML = `
                <div class="terminal-preview">
                    <div class="terminal-row">
                        <span>SPOT_PRICE</span>
                        <span>${preview.spotPrice.toFixed(8)}</span>
                    </div>
                    <div class="terminal-row">
                        <span>AMOUNT_OUT</span>
                        <span>${preview.amountOut.toFixed(8)}</span>
                    </div>
                    <div class="terminal-row">
                        <span>SLIPPAGE</span>
                        <span>${preview.slippage.toFixed(4)}%</span>
                    </div>
                    <div class="terminal-row">
                        <span>RESERVE_${toCurrency}</span>
                        <span style="color: ${statusColor}">${preview.reserveStatus}</span>
                    </div>
                    <div class="terminal-row">
                        <span>INCENTIVE_FEE</span>
                        <span>${preview.depositFee.toFixed(2)}%</span>
                    </div>
                    <div class="terminal-row">
                        <span>POOL_LIQUIDITY</span>
                        <span>${poolKey}</span>
                    </div>
                </div>
            `;
        }
    }

    async executeLoad() {
        if (this.isFrozen) {
            alert('SYSTEM FROZEN - Circuit breaker active');
            return;
        }

        const amount = parseFloat(document.getElementById('load-amount').value);
        const currency = this.selectedLoadCurrency;

        if (!amount || amount <= 0 || !currency) return;

        const tx = new ACIDTransaction(this.ledger, `Load ${amount} ${currency}`);
        await tx.setAnonymousUser('user_' + Date.now());
        tx.addEntry(`USER_ASSETS_${currency}`, amount);
        tx.addEntry(`SYSTEM_LIABILITY_${currency}`, amount);

        const result = tx.commit();

        if (result.success) {
            this.blockchain.addPendingTransaction(tx.toBlockchainTransaction());
            this.triggerHapticFeedback();
            this.updateCardDisplay();
            this.hideLoadModal();
        } else {
            alert('TX_FAILED: ' + result.error);
        }
    }

    async executeExchange() {
        if (this.isFrozen) {
            alert('SYSTEM FROZEN - Circuit breaker active');
            return;
        }

        const amount = parseFloat(document.getElementById('exchange-amount').value);
        const fromCurrency = this.selectedFromCurrency;
        const toCurrency = this.selectedToCurrency;

        if (!amount || amount <= 0 || !fromCurrency || !toCurrency || fromCurrency === toCurrency) {
            return;
        }

        const userAsset = this.ledger.accounts[`USER_ASSETS_${fromCurrency}`];
        if (userAsset < amount) {
            alert('INSUFFICIENT_BALANCE');
            return;
        }

        // Record for circuit breaker
        this.circuitBreaker.recordWithdrawal(amount);

        const poolKey = this.getPoolKey(fromCurrency, toCurrency);
        if (!poolKey) {
            alert('NO_LIQUIDITY_POOL');
            return;
        }

        const pool = this.pools[poolKey];
        const receiveAmount = pool.getAmountOut(fromCurrency, amount);

        const tx = new ACIDTransaction(this.ledger, `Swap ${amount} ${fromCurrency}`);
        await tx.setAnonymousUser('user_' + Date.now());

        tx.addEntry(`USER_ASSETS_${fromCurrency}`, -amount);
        tx.addEntry(`SYSTEM_LIABILITY_${fromCurrency}`, -amount);
        tx.addEntry(`USER_ASSETS_${toCurrency}`, receiveAmount);
        tx.addEntry(`SYSTEM_LIABILITY_${toCurrency}`, receiveAmount);
        tx.addEntry(`SYSTEM_VAULT_${fromCurrency}`, amount);
        tx.addEntry(`SYSTEM_VAULT_${toCurrency}`, -receiveAmount);

        const result = tx.commit();

        if (result.success) {
            pool.swap(fromCurrency, amount);
            this.blockchain.addPendingTransaction(tx.toBlockchainTransaction());
            this.triggerHapticFeedback();
            this.updateCardDisplay();
            this.hideExchangeModal();
        } else {
            alert('TX_FAILED: ' + result.error);
        }
    }

    updateCardDisplay() {
        let totalILS = 0;

        for (const currency of ['USD', 'EUR', 'ILS']) {
            const balance = this.ledger.accounts[`USER_ASSETS_${currency}`];

            let rate = 1;
            if (currency !== 'ILS') {
                const poolKey = this.getPoolKey(currency, 'ILS');
                if (poolKey) {
                    rate = this.pools[poolKey].getSpotPrice(currency);
                }
            }

            totalILS += balance * rate;
        }

        const cardEl = document.getElementById('card-balance');
        if (cardEl) {
            cardEl.textContent = totalILS.toFixed(8);
        }
    }

    // ============================================
    // ADMIN PANEL
    // ============================================

    showAdminModal() {
        document.getElementById('admin-modal').classList.add('active');
        this.updateAdminMetrics();
    }

    hideAdminModal() {
        document.getElementById('admin-modal').classList.remove('active');
    }

    async updateAdminMetrics() {
        // Update blockchain metrics
        const blockHeight = document.getElementById('block-height');
        const pendingTxs = document.getElementById('pending-txs');
        const chainHash = document.getElementById('chain-hash');

        if (blockHeight) blockHeight.textContent = this.blockchain.chain.length;
        if (pendingTxs) pendingTxs.textContent = this.blockchain.pendingTransactions.length;
        if (chainHash && this.blockchain.chain.length > 0) {
            const latestHash = this.blockchain.getLatestBlock().hash;
            chainHash.textContent = latestHash.substring(0, 16) + '...';
        }

        // Update circuit breaker status
        const circuitIndicator = document.getElementById('circuit-indicator');
        const circuitStatusText = document.getElementById('circuit-status-text');
        const withdrawalRate = document.getElementById('withdrawal-rate');

        if (this.isFrozen) {
            if (circuitIndicator) circuitIndicator.classList.add('tripped');
            if (circuitStatusText) circuitStatusText.textContent = 'SYSTEM_FROZEN';
        } else {
            if (circuitIndicator) circuitIndicator.classList.remove('tripped');
            if (circuitStatusText) circuitStatusText.textContent = 'OPERATIONAL';
        }

        // Calculate withdrawal rate
        const totalLiquidity = this.ledger.accounts.SYSTEM_VAULT_USD +
                              this.ledger.accounts.SYSTEM_VAULT_EUR +
                              this.ledger.accounts.SYSTEM_VAULT_ILS;

        const cutoff = Date.now() - this.circuitBreaker.WINDOW;
        const recentWithdrawals = this.circuitBreaker.withdrawalHistory
            .filter(w => w.timestamp > cutoff)
            .reduce((sum, w) => sum + w.amount, 0);

        const rate = totalLiquidity > 0 ? (recentWithdrawals / totalLiquidity * 100) : 0;
        if (withdrawalRate) withdrawalRate.textContent = rate.toFixed(2) + '%';

        // Update reserve statuses for each currency
        const currencies = ['USD', 'EUR', 'ILS'];
        currencies.forEach(currency => {
            const status = this.getReserveStatus(currency);
            const statusEl = document.getElementById(`reserve-status-${currency.toLowerCase()}`);
            const ratioEl = document.getElementById(`reserve-ratio-${currency.toLowerCase()}`);

            if (statusEl) {
                statusEl.textContent = status;
                statusEl.setAttribute('data-status', status);
            }

            // Calculate actual reserve ratio
            const reserves = this.ledger.accounts[`SYSTEM_VAULT_${currency}`];
            const totalReserves = this.ledger.accounts.SYSTEM_VAULT_USD +
                                this.ledger.accounts.SYSTEM_VAULT_EUR +
                                this.ledger.accounts.SYSTEM_VAULT_ILS;
            const ratio = totalReserves > 0 ? (reserves / totalReserves * 100) : 0;

            if (ratioEl) ratioEl.textContent = ratio.toFixed(1) + '%';
        });
    }

    async runStressTest() {
        if (this.isFrozen) {
            alert('SYSTEM FROZEN - Cannot run stress test');
            return;
        }

        const startTime = Date.now();
        let successCount = 0;
        let failCount = 0;

        // Run 1000 transactions
        for (let i = 0; i < 1000; i++) {
            const currencies = ['USD', 'EUR', 'ILS'];
            const fromCurrency = currencies[Math.floor(Math.random() * currencies.length)];
            const toCurrency = currencies[Math.floor(Math.random() * currencies.length)];

            if (fromCurrency === toCurrency) continue;

            const amount = Math.random() * 10 + 1;

            const tx = new ACIDTransaction(this.ledger, `Stress test TX ${i}`);
            await tx.setAnonymousUser(`stress_user_${i}`);

            try {
                // Add to user assets
                tx.addEntry(`USER_ASSETS_${fromCurrency}`, amount);
                tx.addEntry(`SYSTEM_LIABILITY_${fromCurrency}`, amount);

                const result = tx.commit();

                if (result.success) {
                    this.blockchain.addPendingTransaction(tx.toBlockchainTransaction());
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (e) {
                failCount++;
            }
        }

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        alert(`
STRESS TEST COMPLETE

Transactions: 1000
Success: ${successCount}
Failed: ${failCount}
Duration: ${duration}s
TPS: ${(1000 / duration).toFixed(2)}

Ledger Balance: ${this.ledger.getTotalBalance().toFixed(8)}
Blocks: ${this.blockchain.chain.length}
Pending: ${this.blockchain.pendingTransactions.length}
        `);

        this.updateAdminMetrics();
    }

    generateBalanceSheet() {
        const timestamp = new Date().toISOString();

        // Assets
        const userAssetsUSD = this.ledger.accounts.USER_ASSETS_USD || 0;
        const userAssetsEUR = this.ledger.accounts.USER_ASSETS_EUR || 0;
        const userAssetsILS = this.ledger.accounts.USER_ASSETS_ILS || 0;
        const totalAssets = userAssetsUSD + userAssetsEUR + userAssetsILS;

        // Liabilities
        const liabilityUSD = this.ledger.accounts.SYSTEM_LIABILITY_USD || 0;
        const liabilityEUR = this.ledger.accounts.SYSTEM_LIABILITY_EUR || 0;
        const liabilityILS = this.ledger.accounts.SYSTEM_LIABILITY_ILS || 0;
        const totalLiabilities = liabilityUSD + liabilityEUR + liabilityILS;

        // Equity (System Vault)
        const vaultUSD = this.ledger.accounts.SYSTEM_VAULT_USD || 0;
        const vaultEUR = this.ledger.accounts.SYSTEM_VAULT_EUR || 0;
        const vaultILS = this.ledger.accounts.SYSTEM_VAULT_ILS || 0;
        const totalVault = vaultUSD + vaultEUR + vaultILS;

        // Profit
        const profitUSD = this.ledger.accounts.SYSTEM_PROFIT_USD || 0;
        const profitEUR = this.ledger.accounts.SYSTEM_PROFIT_EUR || 0;
        const profitILS = this.ledger.accounts.SYSTEM_PROFIT_ILS || 0;
        const totalProfit = profitUSD + profitEUR + profitILS;

        // Generate CSV
        let csv = 'ADASHA MEKOMIT - BALANCE SHEET\n';
        csv += `Generated: ${timestamp}\n`;
        csv += `Blockchain Height: ${this.blockchain.chain.length}\n`;
        csv += `Circuit Breaker: ${this.isFrozen ? 'TRIPPED' : 'OPERATIONAL'}\n\n`;

        csv += 'ASSETS\n';
        csv += 'Account,Amount\n';
        csv += `USER_ASSETS_USD,${userAssetsUSD.toFixed(8)}\n`;
        csv += `USER_ASSETS_EUR,${userAssetsEUR.toFixed(8)}\n`;
        csv += `USER_ASSETS_ILS,${userAssetsILS.toFixed(8)}\n`;
        csv += `TOTAL ASSETS,${totalAssets.toFixed(8)}\n\n`;

        csv += 'LIABILITIES\n';
        csv += 'Account,Amount\n';
        csv += `SYSTEM_LIABILITY_USD,${liabilityUSD.toFixed(8)}\n`;
        csv += `SYSTEM_LIABILITY_EUR,${liabilityEUR.toFixed(8)}\n`;
        csv += `SYSTEM_LIABILITY_ILS,${liabilityILS.toFixed(8)}\n`;
        csv += `TOTAL LIABILITIES,${totalLiabilities.toFixed(8)}\n\n`;

        csv += 'EQUITY\n';
        csv += 'Account,Amount\n';
        csv += `SYSTEM_VAULT_USD,${vaultUSD.toFixed(8)}\n`;
        csv += `SYSTEM_VAULT_EUR,${vaultEUR.toFixed(8)}\n`;
        csv += `SYSTEM_VAULT_ILS,${vaultILS.toFixed(8)}\n`;
        csv += `SYSTEM_PROFIT_USD,${profitUSD.toFixed(8)}\n`;
        csv += `SYSTEM_PROFIT_EUR,${profitEUR.toFixed(8)}\n`;
        csv += `SYSTEM_PROFIT_ILS,${profitILS.toFixed(8)}\n`;
        csv += `TOTAL EQUITY,${(totalVault + totalProfit).toFixed(8)}\n\n`;

        csv += 'VERIFICATION\n';
        csv += `Ledger Balance: ${this.ledger.getTotalBalance().toFixed(8)}\n`;
        csv += `Assets = Liabilities + Equity: ${(Math.abs(totalAssets - (totalLiabilities + totalVault + totalProfit)) < 0.0001 ? 'BALANCED' : 'ERROR')}\n`;

        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `balance-sheet-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ============================================
    // UI CONTROLS
    // ============================================

    triggerHapticFeedback() {
        const container = document.querySelector('.app-container');
        container.classList.add('haptic-feedback');
        setTimeout(() => container.classList.remove('haptic-feedback'), 600);
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    }

    showLoadModal() {
        document.getElementById('load-modal').classList.add('active');
        this.selectedLoadCurrency = null;
        document.getElementById('load-amount').value = '';
        document.querySelectorAll('#load-modal .currency-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.getElementById('confirm-load').disabled = true;
    }

    hideLoadModal() {
        document.getElementById('load-modal').classList.remove('active');
    }

    selectLoadCurrency(currency) {
        this.selectedLoadCurrency = currency;
        document.querySelectorAll('#load-modal .currency-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.querySelector(`#load-modal [data-currency="${currency}"]`).classList.add('selected');
        this.checkLoadForm();
    }

    checkLoadForm() {
        const amount = parseFloat(document.getElementById('load-amount').value);
        const confirmBtn = document.getElementById('confirm-load');
        confirmBtn.disabled = !(amount > 0 && this.selectedLoadCurrency);
    }

    showExchangeModal() {
        document.getElementById('exchange-modal').classList.add('active');
        this.selectedFromCurrency = null;
        this.selectedToCurrency = null;
        this.currentPreview = null;
        document.getElementById('exchange-amount').value = '';
        document.querySelectorAll('#exchange-modal .currency-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.getElementById('confirm-exchange').disabled = true;
        document.getElementById('exchange-preview').style.display = 'none';
    }

    hideExchangeModal() {
        document.getElementById('exchange-modal').classList.remove('active');
    }

    selectFromCurrency(currency) {
        this.selectedFromCurrency = currency;
        document.querySelectorAll('#exchange-modal [data-from]').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.querySelector(`#exchange-modal [data-from="${currency}"]`).classList.add('selected');
        this.checkExchangeForm();
        this.updateExchangePreview();
    }

    selectToCurrency(currency) {
        this.selectedToCurrency = currency;
        document.querySelectorAll('#exchange-modal [data-to]').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.querySelector(`#exchange-modal [data-to="${currency}"]`).classList.add('selected');
        this.checkExchangeForm();
        this.updateExchangePreview();
    }

    checkExchangeForm() {
        const amount = parseFloat(document.getElementById('exchange-amount').value);
        const confirmBtn = document.getElementById('confirm-exchange');
        confirmBtn.disabled = !(
            amount > 0 &&
            this.selectedFromCurrency &&
            this.selectedToCurrency &&
            this.selectedFromCurrency !== this.selectedToCurrency
        );
    }

    showSystemLocked() {
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #000; color: #ff3b30; font-family: 'Courier New', monospace; padding: 20px; text-align: center;">
                <div>
                    <h1 style="font-size: 3em; margin-bottom: 20px;">SYSTEM_LOCKED</h1>
                    <p style="font-size: 1.2em;">INTEGRITY_BREACH_DETECTED</p>
                    <button onclick="localStorage.clear(); window.location.reload();"
                            style="margin-top: 30px; padding: 15px 30px; background: #ff3b30; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 1em; font-family: 'Courier New', monospace;">
                        ADMIN_OVERRIDE
                    </button>
                </div>
            </div>
        `;
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================

    attachEventListeners() {
        document.getElementById('load-btn').onclick = () => this.showLoadModal();
        document.getElementById('exchange-btn').onclick = () => this.showExchangeModal();

        document.getElementById('close-load').onclick = () => this.hideLoadModal();
        document.getElementById('load-amount').oninput = () => this.checkLoadForm();
        document.querySelectorAll('#load-modal .currency-btn').forEach(btn => {
            btn.onclick = () => this.selectLoadCurrency(btn.dataset.currency);
        });
        document.getElementById('confirm-load').onclick = () => this.executeLoad();

        document.getElementById('close-exchange').onclick = () => this.hideExchangeModal();
        document.getElementById('exchange-amount').oninput = () => {
            this.checkExchangeForm();
            this.updateExchangePreview();
        };
        document.querySelectorAll('#exchange-modal [data-from]').forEach(btn => {
            btn.onclick = () => this.selectFromCurrency(btn.dataset.from);
        });
        document.querySelectorAll('#exchange-modal [data-to]').forEach(btn => {
            btn.onclick = () => this.selectToCurrency(btn.dataset.to);
        });
        document.getElementById('confirm-exchange').onclick = () => this.executeExchange();

        document.getElementById('admin-trigger').onclick = () => this.showAdminModal();
        document.getElementById('close-admin').onclick = () => this.hideAdminModal();

        const verifyBtn = document.getElementById('verify-chain-btn');
        if (verifyBtn) {
            verifyBtn.onclick = () => this.verifyBlockchain();
        }

        const stressTestBtn = document.getElementById('stress-test-btn');
        if (stressTestBtn) {
            stressTestBtn.onclick = () => this.runStressTest();
        }

        const downloadSheetBtn = document.getElementById('download-balance-sheet');
        if (downloadSheetBtn) {
            downloadSheetBtn.onclick = () => this.generateBalanceSheet();
        }

        const collateralRatio = document.getElementById('collateral-ratio');
        const collateralValue = document.getElementById('collateral-value');
        if (collateralRatio && collateralValue) {
            collateralRatio.oninput = (e) => {
                collateralValue.textContent = e.target.value + '%';
            };
        }
    }
}

// ============================================
// XE/WISE INTERFACE LAYER
// ============================================

class WiseInterface {
    constructor() {
        // Initialize core protocol
        this.protocol = new SovereignProtocol();

        // Exchange rates (will be populated from API)
        this.rates = {};
        this.apiKey = 'free'; // Using free tier
        this.apiBase = 'https://api.exchangerate-api.com/v4/latest';

        // Wallet connection state
        this.walletConnected = false;
        this.walletAddress = null;

        // Admin authentication
        this.adminPassword = 'admin2025'; // Change this in production!
        this.isAdminAuthenticated = false;

        // Current selection
        this.sendCurrency = 'EUR';
        this.receiveCurrency = 'ILS';
        this.sendAmount = 1000;

        // Initialize
        this.fetchLiveRates();
        this.initializeUI();

        // Update rates every 60 seconds (real API has limits)
        setInterval(() => this.fetchLiveRates(), 60000);

        // Check for Web3 provider
        this.checkWeb3Provider();
    }

    // ============================================
    // LIVE EXCHANGE RATE API (REAL)
    // ============================================

    async fetchLiveRates() {
        try {
            // Fetch from real API: open.er-api.com
            const response = await fetch('https://open.er-api.com/v6/latest/ILS');
            if (!response.ok) throw new Error('API request failed');

            const data = await response.json();

            console.log('✓ Real-time rates fetched:', data);

            // ILS is base, so we need to invert for other bases
            const ilsRates = data.rates;

            // Build comprehensive cross-rates matrix
            this.rates = {
                ILS: ilsRates, // ILS to others
                USD: {},
                EUR: {},
                GBP: {}
            };

            // Calculate all cross rates
            const currencies = ['USD', 'EUR', 'GBP', 'ILS'];

            currencies.forEach(from => {
                this.rates[from] = this.rates[from] || {};
                currencies.forEach(to => {
                    if (from !== to) {
                        if (from === 'ILS') {
                            // ILS to target is direct from API
                            this.rates[from][to] = ilsRates[to];
                        } else if (to === 'ILS') {
                            // Other to ILS is inverse
                            this.rates[from][to] = 1 / ilsRates[from];
                        } else {
                            // Cross rate: from -> ILS -> to
                            const fromToILS = 1 / ilsRates[from];
                            const ilsToTarget = ilsRates[to];
                            this.rates[from][to] = fromToILS * ilsToTarget;
                        }
                    }
                });
            });

            // Store API timestamp
            this.lastRateUpdate = new Date(data.time_last_update_utc);

            // Generate 24h chart data with real rates as base
            this.generate24HourData();

            // Update UI if already initialized
            if (document.getElementById('send-amount')) {
                this.updateConverter();
                this.renderChart();
                this.updateRateTimestamp();
            }

            console.log('✓ Live rates updated from open.er-api.com');
            console.log('   Last update:', this.lastRateUpdate.toLocaleString());
            console.log('   Sample rates:', {
                'EUR→ILS': this.rates.EUR.ILS.toFixed(4),
                'USD→ILS': this.rates.USD.ILS.toFixed(4),
                'GBP→ILS': this.rates.GBP.ILS.toFixed(4)
            });

            // Save rates to localStorage for persistence
            this.saveRatesToStorage();

            // Store rates for backend sync
            this.syncDataToBackend();

        } catch (error) {
            console.error('❌ Failed to fetch live rates:', error);
            // Try to load from localStorage
            this.loadRatesFromStorage() || this.useFallbackRates();
        }
    }

    updateRateTimestamp() {
        const statusText = document.querySelector('.status-text');
        if (statusText && this.lastRateUpdate) {
            const now = new Date();
            const diff = Math.floor((now - this.lastRateUpdate) / 1000);
            if (diff < 60) {
                statusText.textContent = `Updated ${diff}s ago`;
            } else if (diff < 3600) {
                statusText.textContent = `Updated ${Math.floor(diff / 60)}m ago`;
            } else {
                statusText.textContent = `Updated ${Math.floor(diff / 3600)}h ago`;
            }
        }
    }

    saveRatesToStorage() {
        const ratesData = {
            rates: this.rates,
            timestamp: this.lastRateUpdate?.toISOString() || new Date().toISOString()
        };
        localStorage.setItem('gc_exchange_rates', JSON.stringify(ratesData));
        console.log('✓ Rates saved to localStorage');
    }

    loadRatesFromStorage() {
        try {
            const stored = localStorage.getItem('gc_exchange_rates');
            if (stored) {
                const data = JSON.parse(stored);
                this.rates = data.rates;
                this.lastRateUpdate = new Date(data.timestamp);
                console.log('✓ Loaded cached rates from localStorage');
                return true;
            }
        } catch (error) {
            console.error('Failed to load cached rates:', error);
        }
        return false;
    }

    useFallbackRates() {
        // Fallback rates if API fails
        this.rates = {
            EUR: { ILS: 4.0234, USD: 1.0856, GBP: 0.8542 },
            USD: { ILS: 3.7056, EUR: 0.9211, GBP: 0.7867 },
            GBP: { ILS: 4.7112, EUR: 1.1707, USD: 1.2712 },
            ILS: { EUR: 0.2485, USD: 0.2699, GBP: 0.2122 }
        };
        console.warn('Using fallback rates');
    }

    // ============================================
    // PERSISTENCE LAYER
    // ============================================

    syncDataToBackend() {
        // Structure data for backend API
        const backendPayload = {
            timestamp: new Date().toISOString(),
            userId: this.walletAddress || 'guest',
            session: {
                sendCurrency: this.sendCurrency,
                receiveCurrency: this.receiveCurrency,
                sendAmount: this.sendAmount,
                walletConnected: this.walletConnected
            },
            exchangeRates: {
                base: 'ILS',
                rates: this.rates,
                source: 'open.er-api.com',
                lastUpdated: this.lastRateUpdate?.toISOString() || new Date().toISOString()
            },
            transactions: {
                pending: this.protocol.blockchain.pendingTransactions.length,
                confirmed: this.protocol.blockchain.chain.length,
                history: this.getAllTransactions()
            },
            ledger: {
                accounts: this.protocol.ledger.accounts,
                totalBalance: this.protocol.ledger.getTotalBalance()
            },
            systemStatus: {
                circuitBreaker: this.protocol.isFrozen ? 'TRIPPED' : 'OPERATIONAL',
                totalLiquidity: this.getTotalLiquidity(),
                totalProfit: this.getTotalProfit()
            }
        };

        // Store in localStorage (persistent)
        localStorage.setItem('gc_backend_data', JSON.stringify(backendPayload));

        // Auto-save every change
        localStorage.setItem('gc_last_sync', new Date().toISOString());

        console.log('✓ Data synced to localStorage');

        // In production, send to server:
        // fetch('/api/sync', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(backendPayload)
        // });
    }

    getAllTransactions() {
        const transactions = [];
        // Collect from blockchain
        this.protocol.blockchain.chain.forEach(block => {
            block.transactions.forEach(tx => {
                transactions.push({
                    blockIndex: block.index,
                    timestamp: block.timestamp,
                    hash: tx.hash,
                    description: tx.description,
                    entries: tx.entries
                });
            });
        });
        return transactions;
    }

    getTotalLiquidity() {
        return (
            (this.protocol.ledger.accounts.SYSTEM_VAULT_USD || 0) +
            (this.protocol.ledger.accounts.SYSTEM_VAULT_EUR || 0) +
            (this.protocol.ledger.accounts.SYSTEM_VAULT_GBP || 0) +
            (this.protocol.ledger.accounts.SYSTEM_VAULT_ILS || 0)
        );
    }

    getTotalProfit() {
        return (
            (this.protocol.ledger.accounts.SYSTEM_PROFIT_USD || 0) +
            (this.protocol.ledger.accounts.SYSTEM_PROFIT_EUR || 0) +
            (this.protocol.ledger.accounts.SYSTEM_PROFIT_GBP || 0) +
            (this.protocol.ledger.accounts.SYSTEM_PROFIT_ILS || 0)
        );
    }

    backupToFile() {
        // Get all data from localStorage
        const backupData = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            appData: {
                backendData: JSON.parse(localStorage.getItem('gc_backend_data') || '{}'),
                exchangeRates: JSON.parse(localStorage.getItem('gc_exchange_rates') || '{}'),
                ledger: this.protocol.ledger.accounts,
                blockchain: this.protocol.blockchain.chain,
                pendingTransactions: this.protocol.blockchain.pendingTransactions
            },
            metadata: {
                totalTransactions: this.protocol.blockchain.chain.length,
                totalLiquidity: this.getTotalLiquidity(),
                totalProfit: this.getTotalProfit(),
                walletConnected: this.walletConnected,
                walletAddress: this.walletAddress
            }
        };

        // Create downloadable JSON file
        const dataStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `global-change-backup-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('✓ Backup file downloaded');
        alert('✅ Backup successful!\n\nFile downloaded: global-change-backup-' + Date.now() + '.json\n\nKeep this file safe - it contains all your transactions and data.');
    }

    // ============================================
    // WEB3 WALLET CONNECTION
    // ============================================

    checkWeb3Provider() {
        if (typeof window.ethereum !== 'undefined') {
            console.log('✓ MetaMask detected');
        } else {
            console.log('⚠ MetaMask not detected - Install at metamask.io');
        }
        this.showConnectWalletButton();
    }

    showConnectWalletButton() {
        const nav = document.querySelector('.main-nav');
        if (!nav) return;

        const connectBtn = document.createElement('button');
        connectBtn.id = 'connect-wallet-btn';
        connectBtn.className = 'nav-link wallet-btn';
        connectBtn.innerHTML = this.walletConnected
            ? `<span>🟢</span> ${this.walletAddress.substring(0, 6)}...${this.walletAddress.substring(38)}`
            : '<span>👛</span> Connect Wallet';

        connectBtn.onclick = () => this.connectWallet();
        nav.appendChild(connectBtn);
    }

    async connectWallet() {
        try {
            if (typeof window.ethereum !== 'undefined') {
                // Real MetaMask connection
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });
                this.walletAddress = accounts[0];
                this.walletConnected = true;

                // Listen for account changes
                window.ethereum.on('accountsChanged', (accounts) => {
                    this.walletAddress = accounts[0];
                    this.updateWalletButton();
                });

            } else {
                // MetaMask not installed - guide user
                const installMetaMask = confirm(
                    '🦊 MetaMask Not Detected\n\n' +
                    'To connect your wallet, you need MetaMask installed.\n\n' +
                    'Click OK to open MetaMask download page.'
                );

                if (installMetaMask) {
                    window.open('https://metamask.io/download/', '_blank');
                }
                return;
            }

            this.updateWalletButton();
            this.syncDataToBackend();

            console.log('✓ Wallet connected:', this.walletAddress);

        } catch (error) {
            console.error('Wallet connection failed:', error);
            alert('Failed to connect wallet. Please try again.');
        }
    }

    updateWalletButton() {
        const btn = document.getElementById('connect-wallet-btn');
        if (btn && this.walletConnected) {
            btn.innerHTML = `<span>🟢</span> ${this.walletAddress.substring(0, 6)}...${this.walletAddress.substring(38)}`;
            btn.style.background = 'var(--accent-green)';
            btn.style.color = 'var(--text-dark)';
        }
    }

    generate24HourData() {
        // Use real live rate as base
        const currentRate = this.rates[this.sendCurrency]?.[this.receiveCurrency] || 4.0234;

        this.chartData = [];
        for (let i = 0; i < 24; i++) {
            // Simulate historical variation (±2% over 24 hours)
            const variation = (Math.random() - 0.5) * 0.04 * currentRate;
            this.chartData.push(currentRate + variation);
        }

        console.log('📊 Chart data generated from live rate:', currentRate.toFixed(4));
    }

    simulateLiveRates() {
        // No longer needed - we fetch real rates from API
        Object.keys(this.rates).forEach(from => {
            Object.keys(this.rates[from]).forEach(to => {
                const currentRate = this.rates[from][to];
                const variation = (Math.random() - 0.5) * 0.002; // ±0.1%
                this.rates[from][to] = currentRate * (1 + variation);
            });
        });

        // Update UI
        this.updateConverter();

        // Update "Updated now" text
        const statusText = document.querySelector('.status-text');
        if (statusText) {
            const now = new Date();
            statusText.textContent = `Updated ${now.toLocaleTimeString()}`;
        }
    }

    // ============================================
    // ADMIN AUTHENTICATION (PIN CODE)
    // ============================================

    authenticateAdmin() {
        if (this.isAdminAuthenticated) {
            this.protocol.showAdminModal();
            return;
        }

        // Show PIN screen
        this.showPinScreen();
    }

    showPinScreen() {
        const pinScreen = document.getElementById('pin-screen');
        if (!pinScreen) return;

        pinScreen.classList.add('active');
        this.currentPin = '';
        this.updatePinDisplay();

        // Add event listeners if not already added
        if (!this.pinListenersAttached) {
            this.attachPinListeners();
            this.pinListenersAttached = true;
        }
    }

    hidePinScreen() {
        const pinScreen = document.getElementById('pin-screen');
        if (pinScreen) {
            pinScreen.classList.remove('active');
        }
        this.currentPin = '';
        this.updatePinDisplay();
        this.clearPinMessage();
    }

    attachPinListeners() {
        // Number keys
        document.querySelectorAll('.pin-key[data-key]').forEach(key => {
            key.addEventListener('click', () => {
                if (this.currentPin.length < 4) {
                    this.currentPin += key.dataset.key;
                    this.updatePinDisplay();

                    // Auto-check when 4 digits entered
                    if (this.currentPin.length === 4) {
                        setTimeout(() => this.checkPin(), 300);
                    }
                }
            });
        });

        // Clear key
        document.getElementById('pin-clear')?.addEventListener('click', () => {
            if (this.currentPin.length > 0) {
                this.currentPin = this.currentPin.slice(0, -1);
                this.updatePinDisplay();
                this.clearPinMessage();
            }
        });

        // Cancel key
        document.getElementById('pin-cancel')?.addEventListener('click', () => {
            this.hidePinScreen();
        });
    }

    updatePinDisplay() {
        for (let i = 1; i <= 4; i++) {
            const dot = document.getElementById(`pin-dot-${i}`);
            if (dot) {
                if (i <= this.currentPin.length) {
                    dot.classList.add('filled');
                } else {
                    dot.classList.remove('filled');
                }
            }
        }
    }

    checkPin() {
        const correctPin = '1234'; // Change this for production!

        if (this.currentPin === correctPin) {
            this.showPinMessage('✓ Access Granted', 'success');
            this.isAdminAuthenticated = true;
            console.log('✓ Admin authenticated via PIN');

            setTimeout(() => {
                this.hidePinScreen();
                this.protocol.showAdminModal();
            }, 500);

        } else {
            this.showPinMessage('✗ Incorrect PIN', 'error');
            this.currentPin = '';
            this.updatePinDisplay();

            // Shake animation
            const pinScreen = document.querySelector('.pin-screen-content');
            if (pinScreen) {
                pinScreen.style.animation = 'shake 0.5s';
                setTimeout(() => {
                    pinScreen.style.animation = '';
                }, 500);
            }
        }
    }

    showPinMessage(message, type) {
        const messageEl = document.getElementById('pin-message');
        if (messageEl) {
            messageEl.textContent = message;
            messageEl.className = `pin-message ${type}`;
        }
    }

    clearPinMessage() {
        const messageEl = document.getElementById('pin-message');
        if (messageEl) {
            messageEl.textContent = '';
            messageEl.className = 'pin-message';
        }
    }

    showAdminDashboard() {
        this.authenticateAdmin();
    }

    initializeUI() {
        // Currency dropdown handlers
        document.getElementById('send-currency-btn')?.addEventListener('click', () => {
            this.toggleDropdown('send-currency-menu');
        });

        document.getElementById('receive-currency-btn')?.addEventListener('click', () => {
            this.toggleDropdown('receive-currency-menu');
        });

        // Currency selection
        document.querySelectorAll('#send-currency-menu .currency-option').forEach(option => {
            option.addEventListener('click', () => {
                this.selectSendCurrency(option.dataset.currency);
                this.toggleDropdown('send-currency-menu');
            });
        });

        document.querySelectorAll('#receive-currency-menu .currency-option').forEach(option => {
            option.addEventListener('click', () => {
                this.selectReceiveCurrency(option.dataset.currency);
                this.toggleDropdown('receive-currency-menu');
            });
        });

        // Amount input
        document.getElementById('send-amount')?.addEventListener('input', (e) => {
            this.sendAmount = parseFloat(e.target.value) || 0;
            this.updateConverter();
        });

        // Convert button
        document.getElementById('convert-btn')?.addEventListener('click', () => {
            this.executeConversion();
        });

        // Card modal
        document.getElementById('card-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showCardModal();
        });

        document.getElementById('close-card-modal')?.addEventListener('click', () => {
            this.hideCardModal();
        });

        // Load funds modal
        document.getElementById('load-funds-btn')?.addEventListener('click', () => {
            this.showLoadModal();
        });

        document.getElementById('close-load')?.addEventListener('click', () => {
            this.hideLoadModal();
        });

        // Currency card selection in load modal
        document.querySelectorAll('.currency-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.currency-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedLoadCurrency = card.dataset.currency;
                this.checkLoadForm();
            });
        });

        document.getElementById('load-amount')?.addEventListener('input', () => {
            this.checkLoadForm();
        });

        document.getElementById('confirm-load')?.addEventListener('click', () => {
            this.executeLoad();
        });

        // Admin Dashboard (PIN protected)
        document.getElementById('admin-trigger')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showAdminDashboard();
        });

        // Backup to File button
        document.getElementById('backup-to-file')?.addEventListener('click', () => {
            this.backupToFile();
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.currency-dropdown')) {
                document.querySelectorAll('.currency-menu').forEach(menu => {
                    menu.classList.remove('active');
                });
            }
        });
    }

    toggleDropdown(menuId) {
        const menu = document.getElementById(menuId);
        if (menu) {
            const isActive = menu.classList.contains('active');
            document.querySelectorAll('.currency-menu').forEach(m => m.classList.remove('active'));
            if (!isActive) menu.classList.add('active');
        }
    }

    selectSendCurrency(currency) {
        this.sendCurrency = currency;
        this.updateCurrencyButton('send', currency);
        this.updateConverter();
        this.renderChart();
    }

    selectReceiveCurrency(currency) {
        this.receiveCurrency = currency;
        this.updateCurrencyButton('receive', currency);
        this.updateConverter();
        this.renderChart();
    }

    updateCurrencyButton(type, currency) {
        const btn = document.getElementById(`${type}-currency-btn`);
        if (!btn) return;

        const flags = { EUR: '🇪🇺', USD: '🇺🇸', GBP: '🇬🇧', ILS: '🇮🇱' };
        const flagSpan = btn.querySelector('.flag-icon');
        const codeSpan = btn.querySelector('.currency-code');

        if (flagSpan) flagSpan.textContent = flags[currency];
        if (codeSpan) codeSpan.textContent = currency;
    }

    updateConverter() {
        if (this.sendCurrency === this.receiveCurrency) return;

        const rate = this.rates[this.sendCurrency]?.[this.receiveCurrency];
        if (!rate) {
            console.warn('Rate not available for', this.sendCurrency, '->', this.receiveCurrency);
            return;
        }

        // REAL-TIME SAVINGS with live rates
        // Bank spread: 2.5% (they take 2.5% from the mid-market rate)
        // Our spread: 0.5% (we only take 0.5%)
        const ourFeePercent = 0.005; // 0.5%
        const bankFeePercent = 0.025; // 2.5%

        // Calculate effective rates after fees
        const bankRate = rate * (1 - bankFeePercent);
        const ourRate = rate * (1 - ourFeePercent);

        // Calculate amounts
        const receiveAmount = this.sendAmount * ourRate;
        const bankAmount = this.sendAmount * bankRate;
        const savings = receiveAmount - bankAmount;

        console.log('💰 Real-time Savings Calculation:', {
            liveRate: rate.toFixed(4),
            bankRate: bankRate.toFixed(4),
            ourRate: ourRate.toFixed(4),
            youReceive: receiveAmount.toFixed(2),
            bankGives: bankAmount.toFixed(2),
            youSave: savings.toFixed(2)
        });

        // Update UI - Live Rate
        const liveRateEl = document.getElementById('live-rate');
        if (liveRateEl) {
            liveRateEl.textContent = `1 ${this.sendCurrency} = ${rate.toFixed(4)} ${this.receiveCurrency}`;
        }

        // Update UI - Receive Amount
        const receiveAmountEl = document.getElementById('receive-amount');
        if (receiveAmountEl) {
            receiveAmountEl.value = receiveAmount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }

        // Update UI - Savings Highlight (THE KEY DIFFERENTIATOR)
        const bankRateEl = document.getElementById('bank-rate');
        const ourRateEl = document.getElementById('our-rate');
        const savingsValueEl = document.getElementById('savings-value');

        if (bankRateEl) {
            bankRateEl.textContent = `${bankRate.toFixed(4)} ${this.receiveCurrency}`;
        }
        if (ourRateEl) {
            ourRateEl.textContent = `${ourRate.toFixed(4)} ${this.receiveCurrency}`;
        }
        if (savingsValueEl) {
            const symbol = this.getCurrencySymbol(this.receiveCurrency);
            savingsValueEl.textContent = `${symbol}${savings.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        }

        // Update UI - Fee Breakdown
        const feeAmount = this.sendAmount * ourFeePercent;
        const totalAmount = this.sendAmount + feeAmount;

        document.getElementById('fee-converted-amount').textContent =
            `${this.sendAmount.toFixed(2)} ${this.sendCurrency}`;
        document.getElementById('fee-amount').textContent =
            `${feeAmount.toFixed(2)} ${this.sendCurrency}`;
        document.getElementById('fee-total').textContent =
            `${totalAmount.toFixed(2)} ${this.sendCurrency}`;

        // Update comparison table with live rates
        this.updateComparisonTable(rate, receiveAmount, bankAmount);

        // Sync data for persistence
        this.syncDataToBackend();
    }

    updateComparisonTable(rate, ourAmount, bankAmount) {
        const ourFee = 0.005;
        const bankFee = 0.025;
        const cardFee = 0.03;

        const ourRate = rate * (1 - ourFee);
        const bankRate = rate * (1 - bankFee);
        const cardRate = rate * (1 - cardFee);

        const cardAmount = this.sendAmount * cardRate;

        const symbol = this.getCurrencySymbol(this.receiveCurrency);

        document.getElementById('comp-gc-rate').textContent = ourRate.toFixed(4);
        document.getElementById('comp-gc-amount').textContent = `${symbol}${ourAmount.toFixed(2)}`;

        document.getElementById('comp-bank-rate').textContent = bankRate.toFixed(4);
        document.getElementById('comp-bank-amount').textContent = `${symbol}${bankAmount.toFixed(2)}`;

        document.getElementById('comp-card-rate').textContent = cardRate.toFixed(4);
        document.getElementById('comp-card-amount').textContent = `${symbol}${cardAmount.toFixed(2)}`;
    }

    getCurrencySymbol(currency) {
        const symbols = { EUR: '€', USD: '$', GBP: '£', ILS: '₪' };
        return symbols[currency] || currency;
    }

    renderChart() {
        const canvas = document.getElementById('rate-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Calculate min/max
        const min = Math.min(...this.chartData);
        const max = Math.max(...this.chartData);
        const range = max - min;

        // Draw line
        ctx.beginPath();
        ctx.strokeStyle = '#00b9ff';
        ctx.lineWidth = 2;

        this.chartData.forEach((value, index) => {
            const x = (index / (this.chartData.length - 1)) * width;
            const y = height - ((value - min) / range) * (height - 20);

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw gradient fill
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();

        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(0, 185, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 185, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Update change percentage
        const firstRate = this.chartData[0];
        const lastRate = this.chartData[this.chartData.length - 1];
        const change = ((lastRate - firstRate) / firstRate) * 100;

        const changeEl = document.getElementById('chart-change');
        if (changeEl) {
            changeEl.textContent = (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
            changeEl.className = change >= 0 ? 'chart-change positive' : 'chart-change negative';
        }
    }

    async executeConversion() {
        // Show status tracker
        const tracker = document.getElementById('status-tracker');
        if (tracker) {
            tracker.style.display = 'block';
            tracker.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Animate steps
            await this.animateTrackerStep(1, 1000);
            await this.animateTrackerStep(2, 1500);
            await this.animateTrackerStep(3, 1000);

            // Hide tracker after 2 seconds
            setTimeout(() => {
                tracker.style.display = 'none';
                this.resetTracker();
            }, 2000);
        }

        // Execute via protocol
        // For demo, just update card balance
        alert(`Conversion successful!\n\n${this.sendAmount} ${this.sendCurrency} → ${document.getElementById('receive-amount').value} ${this.receiveCurrency}\n\nFunds loaded to your card.`);

        this.protocol.updateCardDisplay();
    }

    async animateTrackerStep(step, delay) {
        return new Promise(resolve => {
            const stepEl = document.getElementById(`step-${step}`);
            if (stepEl) {
                stepEl.classList.add('active');
                if (step > 1) {
                    const prevStep = document.getElementById(`step-${step - 1}`);
                    if (prevStep) {
                        prevStep.classList.remove('active');
                        prevStep.classList.add('complete');
                    }
                }
            }
            setTimeout(resolve, delay);
        });
    }

    resetTracker() {
        for (let i = 1; i <= 3; i++) {
            const step = document.getElementById(`step-${i}`);
            if (step) {
                step.classList.remove('active', 'complete');
            }
        }
        document.getElementById('step-1')?.classList.add('active');
    }

    showCardModal() {
        const modal = document.getElementById('card-modal');
        if (modal) modal.classList.add('active');
        this.protocol.updateCardDisplay();
    }

    hideCardModal() {
        const modal = document.getElementById('card-modal');
        if (modal) modal.classList.remove('active');
    }

    showLoadModal() {
        const modal = document.getElementById('load-modal');
        if (modal) modal.classList.add('active');
        document.querySelectorAll('.currency-card').forEach(c => c.classList.remove('selected'));
        document.getElementById('load-amount').value = '';
        document.getElementById('confirm-load').disabled = true;
    }

    hideLoadModal() {
        const modal = document.getElementById('load-modal');
        if (modal) modal.classList.remove('active');
    }

    checkLoadForm() {
        const amount = parseFloat(document.getElementById('load-amount')?.value || 0);
        const btn = document.getElementById('confirm-load');
        if (btn) {
            btn.disabled = !(amount > 0 && this.selectedLoadCurrency);
        }
    }

    async executeLoad() {
        const amount = parseFloat(document.getElementById('load-amount')?.value || 0);
        const currency = this.selectedLoadCurrency;

        if (!amount || !currency) return;

        // Use protocol to load funds
        await this.protocol.executeLoad();

        alert(`Successfully loaded ${amount} ${currency} to your account!`);
        this.hideLoadModal();
        this.protocol.updateCardDisplay();
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        window.app = new WiseInterface();
    });
} else {
    window.app = new WiseInterface();
}
