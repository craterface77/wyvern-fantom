# NFT Marketplace

Hi! There is an overview of how to build and use the Marketplace.

## Files

1.  ERC20.sol - simple erc20 token contract. Deployed ERC20 token can be
    used as payment token or for fees payment.
2.  TokenERC1155.sol - simple erc1155 token contract. Actually, it is an
    asset that we will sell on marketplace.
3.  WyvernProxyRegistry.sol - smart contract that implements proxy delegate pattern. Need this to transfer assets on behalf of token seller.
4.  WyvernTokenTransferProxy.sol - smart contract that implements
    proxy delegate pattern. Need this to transfer erc20 tokens on
    behalf of token buyer.
5.  WyvernExchange.sol - main contract. Implements core marketplace
    logic.

## How to build the Marketplace

1. Deploy ERC20(initialSupply) // Don't forget about decimals. Thus, if you want supply 33 tokens then pass 33000000000000000000 value.
2. Deploy TokenERC1155
3. Deploy WyvernProxyRegistry
4. Deploy WyvernTokenTransferProxy(address proxyRegistry). Pass an address of deployed WyvernProxyRegistry as proxyRegistry.
5. Deploy WyvernExchange(ProxyRegistry registryAddress, TokenTransferProxy tokenTransferProxyAddress, ERC20 tokenAddress, address protocolFeeAddress). Pass the deployed ProxyRegistry, TokenTransferProxy, ERC20 and protocolFeeAddress respectively. protocolFeeAddress may be an arbitrary etherum account.

Contract WyvernProxyRegistry

1. Call grantInitialAuthentication(exchange_address)

## How to use

### From seller

Contract WyvernProxyRegistry

1. Call registerProxy() from protocol owner.
2. Get your personal proxy from proxies(your_address). It returns proxy_address.
3. Copy proxy_address.

> Steps 1-2 are repeated only one time for one seller.

## Contract TokenERC1155

4. Call setApprovalForAll(proxy_address, true).
5. Call mint(recipient, tokenId, amount). Recipient - owner or seller address.

Contract ERC20

7. Call transfer(recipient, amount). Recipient - an account of buyer. Because the buyer needs some tokens to make an offer. Don’t forget about decimals.

### From buyer

Contract WyvernExchange

8. Call tokenTransferProxy and copy an address.

Contract ERC20

9. Call approve(address, amount). Pass tokenTransferProxy address and amount you want to allow to transfer from your behalf.

**Now it is a time to make orders.**

Contract WyvernExchange

1. Call hashOrder\_ and pass relevant arguments of Sell order.
2. Call hashOrder\_ and pass relevant arguments of Buy order.
   Example:

```javascript
hashOrder_([
"0x97557feF28784f9E7944BD29B6112E3913bac367", // exchange address
"0xd493D783439eFC21eDEa282924b0e9df4B7D7f06", // maker
"0x0000000000000000000000000000000000000000", // taker
"0x1bB1243F77f14Cf0Be4a14D67e563bdC946ABc22", // feeRecipient
"0x37C1107Ae034aA04b9379c3CF5A7d014e198c9e0", // target (721 or 1155 address)
"0x0000000000000000000000000000000000000000", // always 0x
"0x80B7Cd8E83C0023098698BDfe9B0AeB03cECC605" // erc20 token address
],
["0", //fee
"0",  //fee
"0",  //fee
"0",  //fee
"30000000000000000000",  //erc20 or ETH value amount
"0", // 0
"1621439539", //listing time
"0", // 0
"3442369145004854125346731409435560308517429172360251056995968581355608116400" // salt, unique for each order
],
1, // feeMethod
1, // side (buy - 0/sell - 1)
0, // saleKind
0, // howToCall
0x3434344545...545, // calldata
0x0000000000...000, // replacement pattern (always string of zero, 202 length)
0x,
false)

```

Each order needs calldata - the essential part to transfer assets from seller to buyer. To create calldata with web3js use next as an example:

    const  from  =  '0xd493D783439eFC21eDEa282924b0e9df4B7D7f06'
    const  to  =  '0xa536007321fa2854981626F907b74E3a193FaC09'
    const  tokenId  =  '1'

    // "CallData for ERC721"

    web3.eth.abi.encodeFunctionCall({
        name:  'safeTransferFrom',
        type:  'function',
        inputs: [{
    		    type:  'address',
    		    name:  'from'
    	    }, {
    		    type:  'address',
    		    name:  'to'
    	    }, {
    		    type:  'uint256',
    		    name:  'tokenId'
        }]
    }, [from, to, tokenId]);

    // "Calldata for ERC1155"

    const  amount  =  '1'
    const  data  =  '0x'

    web3.eth.abi.encodeFunctionCall({
        name:  'safeTransferFrom',
        type:  'function',
        inputs: [{
    		    type:  'address',
    		    name:  'from'
    	    }, {
    		    type:  'address',
    		    name:  'to'
    	    }, {
    		    type:  'uint256',
    		    name:  'id'
    	    }, {
    		    type:  'uint256',
    		    name:  'amount'
    	    }, {
    		    type:  'bytes',
    		    name:  'data'
        }]
    }, [from, to, tokenId, amount, data]);

**Off-chain**

3.  Get hash of each order and sing it with your wallet. web3js example:

          web3.eth.getAccounts().then((acc) => {
        	web3.eth.personal.sign(ORDER_HASH_HERE, acc[0]).then(result => {

        		const  signature  = result.substring(2);
        		const  r  =  "0x"  + signature.substring(0, 64);
        		const  s  =  "0x"  + signature.substring(64, 128);
        		const  v  =  parseInt(signature.substring(128, 130), 16);

        		console.log("v: "  + v)
        		console.log("r: "  + r)
        		console.log("s: "  + s)
        	});
        });

4.  Call atomicMatch\_ and pass relevant arguments. Atomic match arguments consist of two orders data plus signature data.

Use this instruction in paired with video instruction for deeper understanding.

Cross-chain swap.

The main issue of cross-chain swaps is how to transfer the NFT between networks. The main idea of how to solve the issue is to burn the NFT in one network and mint the same NFT in another.

For cross-chain swaps there are two methods:

atomicMatchCrossChainBuy()
atomicMatchCrossChainSell()

To make cross-chain swap we need a system account that will serve as intermediate authority at the back-end side. That account will create and sign counter orders to match in different chains.

Let's imagine we have a common sell order on BSC network. At this point of time the user from Ethereum network comes to the app and desires to buy the NFT but in Ethereum network. To perfom this he should create a buy order and send it to system account. Calldata and replacement pattern for such orders is not required and can by passed as 0x.

Than, system account recognizes the order as cross-chain buy order and creates a so-called mint order. The difference between common order and mint order in calldata paramert of the order. For mint order calldata should be created as

      console.log(web3.eth.abi.encodeFunctionCall({
        name: 'mint',
        type: 'function',
        inputs: [{
          type: 'address',
          name: 'account'
        }, {
          type: 'uint256',
          name: 'id'
        }, {
          type: 'uint256',
          name: 'amount'
        }, {
          type: 'string',
          name: 'ipfsHash'
        }]
      }, ["account", "id", "amount", "ipfsHash"]));

where id and ipfsHash - are NFT paraments for token from BSC network.

To match orders the system account calls atomicMatchCrossChainBuy function on Ethereum network.

Than, system account creates a second so-called burn order to match with sell order in BSC. The difference between common order and mint order in staticTarget order parametr. For burn order staticTarget should be created as

      console.log(web3.eth.abi.encodeFunctionCall({
        name: 'burn',
        type: 'function',
        inputs: [{
          type: 'address',
          name: 'account'
        }, {
          type: 'uint256',
          name: 'id'
        }, {
          type: 'uint256',
          name: 'amount'
        }]
      }, ["account", "id", "amount"]));

To match orders the system account calls atomicMatchCrossChainSell function on BSC network.

PLEASE NOTE.
The system account implied to be an owner of ERC-1155 Token contract in both chains. Also, the system account should create a proxy by calling registerProxy() in WyvernProxyRegistry contract for both chains.

# Advanced Sample Hardhat Project

This project demonstrates an advanced Hardhat use case, integrating other tools commonly used alongside Hardhat in the ecosystem.

The project comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts. It also comes with a variety of other tools, preconfigured to work with the project code.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat help
REPORT_GAS=true npx hardhat test
npx hardhat coverage
npx hardhat run scripts/deploy.ts
TS_NODE_FILES=true npx ts-node scripts/deploy.ts
npx eslint '**/*.{js,ts}'
npx eslint '**/*.{js,ts}' --fix
npx prettier '**/*.{json,sol,md}' --check
npx prettier '**/*.{json,sol,md}' --write
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix
```

# Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Ropsten.

In this project, copy the .env.example file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Ropsten node URL (eg from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
hardhat run --network ropsten scripts/deploy.ts
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```

# Performance optimizations

For faster runs of your tests and scripts, consider skipping ts-node's type checking by setting the environment variable `TS_NODE_TRANSPILE_ONLY` to `1` in hardhat's environment. For more details see [the documentation](https://hardhat.org/guides/typescript.html#performance-optimizations).
