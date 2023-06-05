//This module help to listen request
var express = require("express");
var router = express.Router();
const axios = require("axios");
const Web3 = require("web3");
const Common = require('ethereumjs-common');
// const web3 = new Web3();
//const Tx = require("ethereumjs-tx");
const Tx = require('ethereumjs-tx').Transaction

const Web3EthAccounts = require('web3-eth-accounts');

const customChainParams = { name: 'tBNB', chainId: 97, networkId: 97 }
const common = Common.default.forCustomChain('ropsten', customChainParams, 'petersburg');

// web3.setProvider(
// 	new web3.providers.HttpProvider(
		
// 		"https://goerli.infura.io/v3/0a48491f07ee459a9528d0942444bafa"
// 	)
// );

const web3 = new Web3("https://data-seed-prebsc-1-s1.binance.org:8545");




//-----------------------------Get Balance of Account----------------------------------------------

router.get("/getBalance/:walletAddress", async function (request, response) {
    var ResponseCode = 200;
	var ResponseMessage = ``;
	var ResponseData = null;
	try {
		if(request.params) {
			if (!request.params.walletAddress) {
				ResponseMessage = "wallet address is missing \n";
				ResponseCode = 206;
			}
			else {
				let walletAddress = request.params.walletAddress;

				if (walletAddress.length < 42) {
						ResponseMessage =  "Invalid Wallet Address"
						ResponseCode = 400;
						return;
				}
				const balance = await web3.eth.getBalance(walletAddress);
				const weiBalance = web3.utils.fromWei(balance, "ether"); 
				var date = new Date();
				var timestamp = date.getTime();
				var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

				var xmlHttp = new XMLHttpRequest();
				
				xmlHttp.open('GET', 'https://api-testnet.bscscan.com/api?module=account&action=txlist&address=' + walletAddress + '&startblock=0&endblock=99999999&sort=asc', false); // false for synchronous req
				xmlHttp.send();

				

				
				



				var transactions = JSON.parse(xmlHttp.responseText);
				
				let sent = 0;
				let received = 0;

				for (let i = 0; i < transactions.result.length; i++) {
					String(transactions.result[i].from)
						.toUpperCase()
						.localeCompare(String(walletAddress).toUpperCase()) == 0 ?
						(sent += 1) :
						String(transactions.result[i].to)
						.toUpperCase()
						.localeCompare(String(walletAddress).toUpperCase()) == 0 ?
						(received += 1) :
						"";
				}
				ResponseData = {
					wallet: {
						address: walletAddress,
						currency: "BNB",
						balance: weiBalance,
						create_date: date,
						sent: sent,
						received: received,
						link: `https://testnet.bscscan.com/address/${walletAddress}`
					},
					message: "",
					timestamp: timestamp,
					status: 200,
					success: true
				};
				ResponseMessage = "Completed";
				ResponseCode = 200;
			}
		} else {
			ResponseMessage = "Transaction cannot proceeds as request params is empty";
			ResponseCode = 204;
		}
	} catch (error) {
		ResponseMessage = `Transaction signing stops with the error ${error}`;
		ResponseCode = 400;
	} finally {
		return response.status(200).json({
			code : ResponseCode,
			data : ResponseData,
			msg : ResponseMessage
		});
	}
});

//----------------------------------Send Ethers----------------------------------------------




router.post("/transfer", async function (request, response) {

	var ResponseCode = 200;
	var ResponseMessage = ``;
	var ResponseData = null;
	
	try {
		if(request.body) {
			var ValidationCheck = true;
			if (!request.body.from_address) {
				ResponseMessage = "from address is missing \n";
				ValidationCheck = false;
			}
			if (!request.body.to_address) {
				ResponseMessage += "to address is missing \n";
				ValidationCheck = false;
			}
			if (!request.body.from_private_key) {
				ResponseMessage += "private key is missing \n";
				ValidationCheck = false;
			}
			if (!request.body.value) {
				ResponseMessage += "value is missing \n";
				ValidationCheck = false;
			} else if (!request.body.value === parseInt(request.body.value)) {
				ResponseMessage += "value must be a number \n";
				ValidationCheck = false;
			}
			
			if(ValidationCheck == true) {

				let fromAddress = request.body.from_address;
				let privateKey = request.body.from_private_key;
				let toAddress = request.body.to_address;
				let etherValue = request.body.value;


				if (fromAddress.length < 42) {
					ResponseMessage = "Invalid From Address";
					ResponseCode = 400;
					return;
				} else if (toAddress.length < 42) {
					ResponseMessage = "Invalid To Address";
					ResponseCode = 400;
					return;
				}
				etherValue = web3.utils.toWei(etherValue, "ether"); 
				web3.eth.defaultAccount = fromAddress;

				let count = await web3.eth.getTransactionCount(fromAddress , 'latest');
				let gasPriceObj = await getgasprice(web3.eth.defaultAccount);
				
				if (gasPriceObj.response == '') {
					let gasPrice = gasPriceObj.gasprice;
					let gasLimit = 2000000;
					// let gasLimit = web3.utils.toHex(1000000); // Raise the gas limit to a much higher amount
					//  let gasPrice = web3.utils.toHex(web3.utils.toWei('1', 'gwei'));
					privateKey = Buffer.from(privateKey, 'hex'); 
					var rawTransaction = {
						from: fromAddress,
						to : toAddress,
						nonce: web3.utils.toHex(count),
						gasPrice: web3.utils.toHex(20000000000),
						gasLimit: web3.utils.toHex(gasLimit),
					
						value: web3.utils.toHex(etherValue),
						
					};

					//console.log('2nd')

					//let tx = new Tx(rawTransaction, {'chain': 'goerli'});
					let tx = new Tx(rawTransaction, { common });

					tx.sign(privateKey);
					
					let serializedTx = tx.serialize();

					
					//console.log('3rd')
					//ResponseMessage ='3rd'; 
					let hashObj = await sendSignedTransaction(serializedTx);
				
					if (hashObj.response == '') {
						let hash = hashObj.hash;
						ResponseData = await getTransaction(hash);
						ResponseMessage = "Transaction successfully completed";
						ResponseCode = 200;
					} else {
						ResponseMessage = hashObj.response;
						ResponseCode = 400;
						return;
					}
				} else {
					ResponseMessage = gasPriceObj.response;
					ResponseCode = 400;
					return;
				}
		} else {
				ResponseCode = 206
			}
		} else {
			ResponseMessage = "Transaction cannot proceeds as request body is empty";
			ResponseCode = 204
		}
		
	} catch (error) {
		ResponseMessage = `Transaction signing stops with the error ${error}`;
		ResponseCode = 400
	} finally {
		return response.status(200).json({
			code : ResponseCode,
			data : ResponseData,
			msg : ResponseMessage
		});
	}
    



});


function getTransaction(hash) {
	var data;
	return new Promise( async function(resolve, reject) {
		await web3.eth.getTransaction(hash, function (err, transaction) {
			console.log("this is trans" , transaction);
			var date = new Date();
			var timestamp = date.getTime();
			var conf = web3.eth.getBlock("latest").number - transaction.blockNumber;
			data = {
				transaction: {
					hash: transaction.hash,
					currency: "BNB",
					from: transaction.from,
					to: transaction.to,
					amount: transaction.value / 10 ** 18,
					fee: transaction.gasPrice,
					n_confirmation :  conf,
					block: transaction.blockNumber,
					link: `https://testnet.bscscan.com.org/tx/${hash}`
				},
				message: "",
				timestamp: timestamp,
				status: 200,
				success: true
			};
			resolve(data);
		})
	});
}


function getgasprice() {
	var gasprice;
	var response = "";
	return new Promise(function(resolve, reject) {
		web3.eth.getGasPrice(function (err, gsPrice) {
			if (err) {
				response = `Gas Bad Request ${err}`;
			} else {
				gasprice = gsPrice;
			} 
			var obj = {
				response:  response,
				gasprice: gasprice
			};
			resolve(obj);
		});
	});
}


function sendSignedTransaction(serializedTx) {
	var hash;
	var response = "";
	return new Promise(function(resolve, reject) {

	



		web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'), function (err, txHash) {
			if (err) {
				response = `send Bad Request ${err}`;
			} else {
				hash =  txHash;
			} 
			var obj = {
				response:  response,
				hash: hash
			};
			resolve(obj);
		});


		
	});
}


//-----------------------------Get Transaction----------------------------------------------

router.get("/track/:hash", async function (request, response) {
	var ResponseCode = 200;
	var ResponseMessage = ``;
	var ResponseData = null;
	try {
		if(request.params) {
			if (!request.params.hash) {
				ResponseMessage = "hash / wallet address is missing \n";
				ResponseCode = 206;
			} else {
				let hash = request.params.hash;
				if (hash.length == 66) {
					ResponseData = await getTransaction(hash);
					ResponseMessage = "Completed";
					ResponseCode = 200;

				} else if (hash.length == 42) {
					var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
					var xmlHttp = new XMLHttpRequest();
					xmlHttp.open( "GET", 'https://api-testnet.bscscan.com/api?module=account&action=txlist&address=' + hash + '&startblock=0&endblock=99999999&sort=asc&limit=100', false ); // false for synchronous request
					xmlHttp.send();
					var transactions = JSON.parse(xmlHttp.responseText);
					for (let i = 0; i < transactions.result.length; i++) {
						transactions.result[i].value = transactions.result[i].value / 10 ** 18;
					}
					ResponseData = {
						transaction: transactions.result
					};
					ResponseMessage = "Completed";
					ResponseCode = 200;
				} else {
					ResponseMessage = "Invalid Hash or Wallet Address"
					ResponseCode = 400;
				}
			}
		} else {
			ResponseMessage = "Transaction cannot proceeds as request params is empty";
			ResponseCode = 204;
		}
	} catch (error) {
		ResponseMessage = `Transaction signing stops with the error ${error}`;
		ResponseCode = 400;
	} finally {
		return response.status(200).json({
			code : ResponseCode,
			data : ResponseData,
			msg : ResponseMessage
		});
	}
    

});

//-----------------------------Get Token Transaction----------------------------------------------
router.get("/trackToken/:hash", async function (request, response) {
	var ResponseCode = 200;
	var ResponseMessage = ``;
	var ResponseData = null;
	try {
		if(request.params) {
			if (!request.params.hash) {
				ResponseMessage = "hash / wallet address is missing \n";
				ResponseCode = 206;
			} else {
				let hash = request.params.hash;
				if (hash.length == 66) {
					ResponseData = await getTransaction(hash);
					ResponseMessage = "Completed";
					ResponseCode = 200;

				} else if (hash.length == 42) {
					var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
					var xmlHttp = new XMLHttpRequest();
					xmlHttp.open( "GET", 'https://api-testnet.bscscan.com/api?module=account&action=tokentx&address=' + hash + '&startblock=0&endblock=99999999&sort=asc&limit=100', false ); // false for synchronous request  //fpr token detail 
					xmlHttp.send();
					var transactions = JSON.parse(xmlHttp.responseText);
					for (let i = 0; i < transactions.result.length; i++) {
						transactions.result[i].value = transactions.result[i].value / 10 ** 18;
					}
					ResponseData = {
						transaction: transactions.result
					};
					ResponseMessage = "Completed";
					ResponseCode = 200;
				} else {
					ResponseMessage = "Invalid Hash or Wallet Address"
					ResponseCode = 400;
				}
			}
		} else {
			ResponseMessage = "Transaction cannot proceeds as request params is empty";
			ResponseCode = 204;
		}
	} catch (error) {
		ResponseMessage = `Transaction signing stops with the error ${error}`;
		ResponseCode = 400;
	} finally {
		return response.status(200).json({
			code : ResponseCode,
			data : ResponseData,
			msg : ResponseMessage
		});
	}
    

});


//-----------------------------Get eth internal Transaction----------------------------------------------
router.get("/trackInternal/:hash", async function (request, response) {
	var ResponseCode = 200;
	var ResponseMessage = ``;
	var ResponseData = null;
	try {
		if(request.params) {
			if (!request.params.hash) {
				ResponseMessage = "hash / wallet address is missing \n";
				ResponseCode = 206;
			} else {
				let hash = request.params.hash;
				if (hash.length == 66) {
					ResponseData = await getTransaction(hash);
					ResponseMessage = "Completed";
					ResponseCode = 200;

				} else if (hash.length == 42) {
					var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
					var xmlHttp = new XMLHttpRequest();
					xmlHttp.open( "GET", 'https://api-testnet.bscscan.com/api?module=account&action=txlistinternal&address=' + hash + '&startblock=0&endblock=99999999&sort=asc&limit=100', false ); // false for synchronous request  //fpr token detail 
					xmlHttp.send();
					var transactions = JSON.parse(xmlHttp.responseText);
					for (let i = 0; i < transactions.result.length; i++) {
						transactions.result[i].value = transactions.result[i].value / 10 ** 18;
					}
					ResponseData = {
						transaction: transactions.result
					};
					ResponseMessage = "Completed";
					ResponseCode = 200;
				} else {
					ResponseMessage = "Invalid Hash or Wallet Address"
					ResponseCode = 400;
				}
			}
		} else {
			ResponseMessage = "Transaction cannot proceeds as request params is empty";
			ResponseCode = 204;
		}
	} catch (error) {
		ResponseMessage = `Transaction signing stops with the error ${error}`;
		ResponseCode = 400;
	} finally {
		return response.status(200).json({
			code : ResponseCode,
			data : ResponseData,
			msg : ResponseMessage
		});
	}
    

});

module.exports = router;
