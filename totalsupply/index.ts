import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { promises as fs } from 'fs';

import Web3 from "web3";
import BN from 'bn.js'

const config = {
    providers: {
        web3: process.env.web3 // This is set in Azure Functions Configuration -> Application Settings (add to your local.settings.json ile)
    },
    tokens: {
        dam: {
            contractAddress: '0xF80D589b3Dbe130c270a69F1a69D050f268786Df', // Datamine ERC-777 Token
            decimals: 18
        },
        // You can list multiple tokens here
    }
}

const BNToDecimal = (number: BN | null, addCommas: boolean = false, decimals: number = 18) => {
	if (!number) {
		return null;
	}

	const decimalDividor = new BN(10).pow(new BN(decimals))

	const prefix = number.div(decimalDividor);
	const suffix = number.abs().mod(decimalDividor);

	const paddedPrefix = addCommas ? prefix.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') : prefix.toString();
	const paddedSuffix = String(suffix.toString()).padStart(decimals, '0')

	return `${paddedPrefix}.${paddedSuffix}`
}
/**
 * Returns total supply for a specific known token
 */
const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    if (!process.env.web3) {
        throw 'You must edit your local.settings.json and add "web3" key for web3 provider (ex: infura.io)'
    }

    // You can pass token name in through the 
    const token = (req.query.token || (req.body && req.body.token));
    const displayMethod = (req.query.displayMethod || (req.body && req.body.displayMethod));

    const tokenConfig = getTokenConfig(token)
    if (!tokenConfig) {
        context.res = {
            status: 501,
            body: "Invalid token specified."
        };
        return;
    }

    context.log(`Fetching token total supply for ${token}`);

    try {
        const abiJson = await getAbiJson(token);

        // Get our token contract based on the abi
        const web3 = new Web3(new Web3.providers.HttpProvider(config.providers.web3));
        const contract = new web3.eth.Contract(JSON.parse(abiJson), tokenConfig.contractAddress);

        // Call the contract to find total supply. This number will be returned without token decimals (the totalSupply is in ERC-20 standard)
        const totalSupply = await contract.methods.totalSupply().call();

        const getBody = ()=>{
            if (!!displayMethod) {
                switch (displayMethod) {
                    // For a nubmer that includes decimals
                    case 'full':
                        return BNToDecimal(new BN(totalSupply), false);
                    // No division
                    case 'pure':
                        return new BN(totalSupply).toString(10);
                }
            }
            // totalSupply needs to be formatted to appropriate decimal places (it's a huge number, and needs to be divided by 10 ^ decimal places)
            return new BN(totalSupply).div(new BN(10).pow(new BN(tokenConfig.decimals))).toString(10);
        }

        const body = getBody()

        context.res = {
            body
        };
    } catch (ex) {
        context.res = {
            status: 500,
            body: "Error fetching total supply for this token"
        };
    }
};

const getTokenConfig = (token: string) => {
    switch (token) {
        case 'dam':
            return config.tokens.dam;
    }
}

const getAbiJson = async (token) => {
    return await fs.readFile(`./abis/${token}.json`, 'utf8');
}

export default httpTrigger;
