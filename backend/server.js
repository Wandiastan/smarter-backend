const express = require('express');
const cors = require('cors');
const MetaApi = require('metaapi.cloud-sdk').default;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize MetaAPI
const metaApi = new MetaApi(process.env.METAAPI_TOKEN);

// Store connected accounts
const connectedAccounts = new Map();

// Connect to MT4/5 account
app.post('/api/connect', async (req, res) => {
    try {
        const { login, password, server } = req.body;

        if (!login || !password || !server) {
            return res.status(400).json({
                success: false,
                message: 'Login, password, and server are required'
            });
        }

        // Create connection options
        const connectionOptions = {
            accountId: login,
            password: password,
            server: server,
            type: 'cloud' // Use cloud connection
        };

        // Connect to the account
        const connection = await metaApi.metatraderAccountApi.connect(connectionOptions);
        
        // Wait for connection to be established
        await connection.waitConnected();

        // Get account information
        const accountInfo = await connection.getAccountInformation();
        
        // Get positions
        const positions = await connection.getPositions();
        
        // Get orders
        const orders = await connection.getOrders();
        
        // Get history
        const history = await connection.getDealsByDateRange(
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            new Date()
        );

        // Store connection for later use
        connectedAccounts.set(login, {
            connection,
            accountInfo,
            lastUpdate: new Date()
        });

        res.json({
            success: true,
            message: 'Account connected successfully',
            data: {
                accountInfo,
                positions: positions.length,
                orders: orders.length,
                deals: history.length,
                server,
                login
            }
        });

    } catch (error) {
        console.error('Connection error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to connect to account',
            error: error.message
        });
    }
});

// Get account data
app.get('/api/account/:login', async (req, res) => {
    try {
        const { login } = req.params;
        
        if (!connectedAccounts.has(login)) {
            return res.status(404).json({
                success: false,
                message: 'Account not connected'
            });
        }

        const accountData = connectedAccounts.get(login);
        const connection = accountData.connection;

        // Refresh account data
        const accountInfo = await connection.getAccountInformation();
        const positions = await connection.getPositions();
        const orders = await connection.getOrders();
        const history = await connection.getDealsByDateRange(
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            new Date()
        );

        // Update stored data
        connectedAccounts.set(login, {
            ...accountData,
            accountInfo,
            lastUpdate: new Date()
        });

        res.json({
            success: true,
            data: {
                accountInfo,
                positions,
                orders,
                deals: history,
                lastUpdate: new Date()
            }
        });

    } catch (error) {
        console.error('Data fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch account data',
            error: error.message
        });
    }
});

// Get connected accounts list
app.get('/api/accounts', (req, res) => {
    const accounts = Array.from(connectedAccounts.keys()).map(login => ({
        login,
        lastUpdate: connectedAccounts.get(login).lastUpdate,
        accountInfo: connectedAccounts.get(login).accountInfo
    }));

    res.json({
        success: true,
        data: accounts
    });
});

// Disconnect account
app.delete('/api/disconnect/:login', async (req, res) => {
    try {
        const { login } = req.params;
        
        if (!connectedAccounts.has(login)) {
            return res.status(404).json({
                success: false,
                message: 'Account not connected'
            });
        }

        const accountData = connectedAccounts.get(login);
        await accountData.connection.disconnect();
        connectedAccounts.delete(login);

        res.json({
            success: true,
            message: 'Account disconnected successfully'
        });

    } catch (error) {
        console.error('Disconnect error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to disconnect account',
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date(),
        connectedAccounts: connectedAccounts.size
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    
    // Disconnect all accounts
    for (const [login, accountData] of connectedAccounts) {
        try {
            await accountData.connection.disconnect();
        } catch (error) {
            console.error(`Error disconnecting account ${login}:`, error);
        }
    }
    
    process.exit(0);
});
