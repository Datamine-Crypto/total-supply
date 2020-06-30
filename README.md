A quick way to fetch total supply for your Ethereum based ERC-20 smart contract token via web3 and output it to body. This example comes with Datamine (DAM) & FLUX ERC-777 tokens pre-configured.

# Installation

- Get Microsoft Azure account
- Get Visual Studio Code & install Azure Functions extension 
- You will need web3 provider (ex: infura.io) and set it as a "web3" prop in `local.settings.json` Values section (This is Application Settings in prod)

# Usage

- `npm run watch` in one terminal (This will automatically compile Typescript on Changes)
- `npm run start` this will run a function in an emulator (look at output for url)
- Navigate to `/api/totalsupply?token=dam` for example of Datamine ERC-777 Token. This will output total supply of the token from the smart contract value.