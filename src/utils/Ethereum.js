import React from "react";

import { ToastContainer, toast } from "material-react-toastify";
import "material-react-toastify/dist/ReactToastify.css";

import Web3 from "web3";
import bep20TokenAbi from "../abi/BEP20Token.abi.json";
import iUniswapV2Router02 from "../abi/IUniswapV2Router02.abi.json";
import EthereumNetworks from "../constant/EthereumNetworks.json";

export default class Ethereum {
  static connectWalletRequest = async () => {
    if (window.ethereum) {
      try {
        const ethereum = window.ethereum;
        const accounts = await ethereum.request({
          method: "eth_requestAccounts",
        });
        const wallet = accounts[0];

        const chainId = await ethereum.request({ method: "eth_chainId" });
        console.log("Connected chain id", chainId);

        ethereum.on("chainChanged", (_chainId) => {
          toast.warn("Wallet chain has changed, auto refreshing...", {
            position: "bottom-center",
            autoClose: 6000,
            hideProgressBar: false,
            closeOnClick: false,
            pauseOnHover: false,
            draggable: false,
            progress: undefined,
            limit: 1,
          });
          setTimeout(() => window.location.reload(), 5e3);
        });

        if (wallet) {
          return {
            address: wallet,
            chainId: chainId,
          };
        }
      } catch (e) {
        toast.error(e.message);
      }
    } else {
      toast.error("No ethereum environment found");
    }
  };

  static openContract = async (address, abi = bep20TokenAbi) => {
    const web3 = new Web3(window.ethereum);
    const wallet = await this.connectWalletRequest();
    if (wallet) {
      try {
        const contract = new web3.eth.Contract(abi, address, {
          from: wallet.address,
          // gasPrice: web3.utils.toHex(await web3.eth.getGasPrice()),
        });
        console.log(`Contract [${address}]`, contract);
        return contract;
      } catch (e) {
        toast.error(e.message);
      }
    } else {
      return false;
    }
  };

  static getTokenInfo = async (address) => {
    const wallet = await this.connectWalletRequest();
    const contract = await this.openContract(address);
    if (contract) {
      try {
        const tokenInfo = {
          symbol: await contract.methods?.symbol().call(),
          name: await contract.methods?.name().call(),
          decimals: await contract.methods?.decimals().call(),
          totalSupply: await contract.methods?.totalSupply().call(),
          balance:
            (await contract.methods?.balanceOf(wallet.address).call()) /
            10 ** (await contract.methods?.decimals().call()),
          address: address,
        };

        return tokenInfo;
      } catch (e) {
        toast.error(e.message);
      }
    } else return false;
  };

  static sendTransaction = async (contractAddress, rawData) => {
    const ethereum = window.ethereum;
    const web3 = new Web3(ethereum);
    const wallet = await this.connectWalletRequest();
    const nonce = await web3.eth.getTransactionCount(wallet.address);

    /*  
      // Some ethereum browser cannot recognize
      const rawDataInstance = Object.prototype.toString.call(rawData);
      let data = rawData;
      if ("[object AsyncFunction]" === rawDataInstance) {
        data = await rawData();
      } else if ("[object Function]" === rawDataInstance) {
        data = rawData();
      }
    */
    const data = await rawData();

    const params = [
      {
        from: wallet.address,
        nonce: web3.utils.toHex(nonce),
        gasPrice: web3.utils.toHex(await web3.eth.getGasPrice()),
        gasLimit: web3.utils.toHex(200000),
        to: contractAddress,
        value: "0x0",
        data: data,
      },
    ];
    console.log("Raw transaction: ", params);

    ethereum
      .request({
        method: "eth_sendTransaction",
        params,
      })
      .then(() => {
        // TODO: Refresh token
        // this.refreshTokenInfo();
        toast.success("Send transaction success");
      })
      .catch((err) => {
        toast.error(err.message);
      });
  };

  static transfer = async (tokenAddress, to, amount) => {
    return this.sendTransaction(tokenAddress, async () => {
      const contract = await this.openContract(tokenAddress);
      const decimals = await contract.methods.decimals().call();
      return contract.methods
        .transfer(
          to,
          Web3.utils.toBN(amount).mul(Web3.utils.toBN(`1e${decimals}`))
        )
        .encodeABI();
    });
  };

  static approve = async (tokenAddress, spender, amount) => {
    return this.sendTransaction(tokenAddress, async () => {
      const contract = await this.openContract(tokenAddress);
      const decimals = await contract.methods.decimals().call();
      return contract.methods
        .approve(
          spender,
          Web3.utils.toBN(amount).mul(Web3.utils.toBN(`1e${decimals}`))
        )
        .encodeABI();
    });
  };

  static swap = async (
    chainId,
    fromAddress,
    toAddress,
    fromAmount,
    toAmountMin,
    to
  ) => {
    const swapRouter = EthereumNetworks[chainId].swap.default.address;
    return this.sendTransaction(swapRouter, async () => {
      const fromToken = await this.openContract(fromAddress);
      const toToken = await this.openContract(toAddress);
      const contract = await this.openContract(swapRouter, iUniswapV2Router02);
      const fromDecimals = await fromToken.methods.decimals().call();
      const toDecimals = await toToken.methods.decimals().call();

      return contract.methods
        .swapExactTokensForTokens(
          Web3.utils.toBN(fromAmount).mul(Web3.utils.toBN(`1e${fromDecimals}`)),
          Web3.utils.toBN(toAmountMin).mul(Web3.utils.toBN(`1e${toDecimals}`)),
          [
            ...new Set([
              fromAddress,
              EthereumNetworks[chainId].weth,
              toAddress,
            ]),
          ],
          to,
          Date.now() + 1000 * 60 * 3
        )
        .encodeABI();
    });
  };
}
