
//This module help to listen request
var express = require("express");
var router = express.Router();
const axios = require("axios");
const Web3 = require("web3");
const web3 = new Web3();
//const Tx = require("ethereumjs-tx");

const Tx = require('ethereumjs-tx').Transaction

const Web3EthAccounts = require('web3-eth-accounts');



web3.setProvider(
	new web3.providers.HttpProvider(
		
		"https://goerli.infura.io/v3/0a48491f07ee459a9528d0942444bafa"
	)
);



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
				
				xmlHttp.open('GET', 'http://api-goerli.etherscan.io/api?module=account&action=txlist&address=' + walletAddress + '&startblock=0&endblock=99999999&sort=asc', false); // false for synchronous req
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
						currency: "ETH",
						balance: weiBalance,
						create_date: date,
						sent: sent,
						received: received,
						link: `https://goerli.etherscan.io/address/${walletAddress}`
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
					currency: "ETH",
					from: transaction.from,
					to: transaction.to,
					amount: transaction.value / 10 ** 18,
					fee: transaction.gasPrice,
					n_confirmation :  conf,
					block: transaction.blockNumber,
					link: `https://goerli.etherscan.io.org/tx/${hash}`
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



//-----------------------------Get ETH Transaction----------------------------------------------

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
					xmlHttp.open( "GET", 'http://api-goerli.etherscan.io/api?module=account&action=txlist&address=' + hash + '&startblock=0&endblock=99999999&sort=asc&limit=100', false ); // false for synchronous request  //fpr token detail tokentx
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
					xmlHttp.open( "GET", 'http://api-goerli.etherscan.io/api?module=account&action=tokentx&address=' + hash + '&startblock=0&endblock=99999999&sort=asc&limit=100', false ); // false for synchronous request  //fpr token detail 
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
					xmlHttp.open( "GET", 'http://api-goerli.etherscan.io/api?module=account&action=txlistinternal&address=' + hash + '&startblock=0&endblock=99999999&sort=asc&limit=100', false ); // false for synchronous request  //fpr token detail 
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
