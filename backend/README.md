# MT4/MT5 Connection Backend

This backend server provides MT4/MT5 account connection functionality using MetaAPI.cloud API, similar to TradeZella and MyFxBook.

## Features

- Connect to MT4/MT5 accounts using account credentials
- Fetch account information, positions, orders, and trading history
- Real-time data updates
- Multiple account management
- RESTful API endpoints

## Setup

1. Install dependencies:
```bash
npm install
```

2. The `.env` file is already configured with your MetaAPI token.

3. Start the server:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## API Endpoints

### Connect to MT4/MT5 Account
**POST** `/api/connect`

Request body:
```json
{
  "login": "12345678",
  "password": "your-readonly-password",
  "server": "broker-server.com:443"
}
```

Response:
```json
{
  "success": true,
  "message": "Account connected successfully",
  "data": {
    "accountInfo": {
      "balance": 10000,
      "equity": 10050,
      "margin": 500,
      "freeMargin": 9550,
      "profit": 50
    },
    "positions": 2,
    "orders": 1,
    "deals": 150,
    "server": "broker-server.com:443",
    "login": "12345678"
  }
}
```

### Get Account Data
**GET** `/api/account/:login`

Returns current account information, positions, orders, and recent deals.

### List Connected Accounts
**GET** `/api/accounts`

Returns list of all connected accounts.

### Disconnect Account
**DELETE** `/api/disconnect/:login`

Disconnects the specified account.

### Health Check
**GET** `/api/health`

Returns server status and connected accounts count.

## Deployment to Render

1. Connect your GitHub repository to Render
2. Set the following environment variables in Render:
   - `METAAPI_TOKEN`: Your MetaAPI token
   - `PORT`: 10000 (Render's default)

3. Build Command: `npm install`
4. Start Command: `npm start`

## Usage Example

```javascript
// Connect to account
const response = await fetch('http://localhost:5000/api/connect', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    login: '12345678',
    password: 'readonly-password',
    server: 'broker-server.com:443'
  })
});

const result = await response.json();
console.log(result);
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400`: Missing required fields
- `404`: Account not found
- `500`: Server error or connection failure

## Security Notes

- Always use read-only/investor passwords for MT4/MT5 connections
- Never store passwords in plain text
- Use HTTPS in production
- Implement proper authentication for your frontend

## MetaAPI.cloud Documentation

For more information about MetaAPI.cloud, visit:
- [Official Documentation](https://metaapi.cloud/docs/)
- [API Reference](https://metaapi.cloud/docs/api/)
- [SDK Documentation](https://metaapi.cloud/docs/client/)
