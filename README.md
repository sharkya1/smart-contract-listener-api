# Smart Contract Listener API

This application monitors a specified smart contract for 'Transfer' events, recording the recipient wallet address and block number into a SQLite database. It also provides an API endpoint to retrieve the five most recent records from the database.

## Build Locally
1. Copy .env.example to .env
2. Install dependencies: yarn
3. Start the API: yarn dev

## UI
https://github.com/sharkya1/smart-contract-feed-ui
