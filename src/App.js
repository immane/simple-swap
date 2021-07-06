import React from "react";

import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";

import { ThemeProvider } from "styled-components";
import { light, dark, Toast } from "@pancakeswap-libs/uikit";

import { ethers } from "ethers";

import Web3 from "web3";
import Contract from "web3-eth-contract";
import bep20TokenAbi from "./abi/BEP20Token.abi.json";

import logo from "./logo.svg";
import "./App.css";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      walletAddress: null,
      fromTokenAddress: "0x1372085c45Ca82139442Ac3a82db0Ec652066CDB",
      toTokenAddress: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
      fromAmount: 0,
      toAmount: 0,
    };
  }

  valueChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value,
    });
  };

  getInfo = () => {
    fetch(
      `https://api.pancakeswap.info/api/v2/tokens/${this.state.fromTokenAddress}`
    ).then((res) =>
      res.json().then((data) => {
        console.log(data);
      })
    );
  };

  connectWalletRequest = async () => {
    if (window.ethereum) {
      await window.ethereum.send("eth_requestAccounts");
      const web3 = new Web3(window.ethereum);

      const wallet = (await web3.eth.getAccounts())[0];
      if (wallet) {
        this.setState({
          walletAddress: wallet,
        });
        return wallet;
      }
    }

    return false;
  };

  openBEP20TokenContract = async (address) => {
    const wallet = await this.connectWalletRequest();
    if (wallet) {
      Contract.setProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
      try {
        return new Contract(bep20TokenAbi, address, {
          from: wallet,
          gasPrice: 2e10,
        });
      } catch (e) {
        alert(e.message);
      }
    } else {
      return false;
    }
  };

  getBEP20TokenInfo = async (address) => {
    const wallet = await this.connectWalletRequest();
    const contract = await this.openBEP20TokenContract(address);
    if (contract) {
      try {
        const tokenInfo = {
          symbol: await contract.methods?.symbol().call(),
          name: await contract.methods?.name().call(),
          decimals: await contract.methods?.decimals().call(),
          totalSupply: await contract.methods?.totalSupply().call(),
          balance:
            (await contract.methods?.balanceOf(wallet).call()) /
            10 ** (await contract.methods?.decimals().call()),
          address: address,
        };
        console.log("Token info:", tokenInfo);
        alert(JSON.stringify(tokenInfo));

        return tokenInfo;
      } catch (e) {
        alert(e.message);
      }
    } else return false;
  };

  makeBEP20RawTransaction = async (tokenAddress, to, amount) => {
    const web3 = new Web3(window.ethereum);
    const wallet = await this.connectWalletRequest();
    const nonce = await web3.eth.getTransactionCount(wallet);

    const token = await this.openBEP20TokenContract(tokenAddress);
    try {
      const decimals = await token.methods.decimals().call();
      const rawData = token.methods
        .transfer(to, amount * Math.pow(10, decimals))
        .encodeABI();

      const rawTransaction = {
        from: wallet,
        nonce: nonce,
        // gasPrice: await web3.eth.getGasPrice(),
        // gasLimit: gasLimit,
        to: tokenAddress,
        value: "0x0",
        data: rawData,
      };

      return web3.eth.sendTransaction(rawTransaction);
    } catch (e) {
      alert(e.message);
    }
  };

  pancakeswapTest() {
  /*
    const {
      ChainId,
      Fetcher,
      WETH,
      Route,
      Trade,
      TokenAmount,
      TradeType,
    } = require("@pancakeswap-libs/sdk");

    const chainId = ChainId.MAINNET;
    const bscProvider = new ethers.providers.JsonRpcProvider(
      "https://data-seed-prebsc-1-s1.binance.org:8545/"
    );

    const init = async () => {
      const blockNumber = await bscProvider.getBlockNumber();
      console.log(blockNumber);

      const abcAbi = [
        // Some details about the token
        "function name() view returns (string)",
        "function symbol() view returns (string)",

        // Get the account balance
        "function balanceOf(address) view returns (uint)",

        // Send some of your tokens to someone else
        "function transfer(address to, uint amount)",

        // An event triggered whenever anyone transfers to someone else
        "event Transfer(address indexed from, address indexed to, uint amount)",
      ];

      // The Contract object
      const abcAddresss = "0x2ec46b509ab89f123b8ef0656a2dc6ed1e50a1c6";
      const abcContract = new ethers.Contract(abcAddresss, abcAbi, bscProvider);

      console.log(
        "Contract info",
        await abcContract.name(),
        await abcContract.symbol()
      );

      // const balance = await bscProvider.getBalance(tokenAddresss)
      // console.log(ethers.utils.formatEther(balance));
    };
  */
  }

  render() {
    return (
      <Router>
        <Switch>
          <Route path="/">
            <ThemeProvider theme={dark}>
              <div className="App">
                <header className="App-header">
                  <img src={logo} className="App-logo" alt="logo" />
                  <p
                    className="App-link"
                    rel="noopener noreferrer"
                    onClick={this.connectWalletRequest}
                  >
                    {this.state.walletAddress
                      ? `Connected to ${this.state.walletAddress.slice(
                          0,
                          6
                        )}...${this.state.walletAddress.slice(-4)}`
                      : "Connect to wallet"}
                  </p>
                  <form
                    style={{
                      width: "100%",
                    }}
                  >
                    <span> From Contract address </span> <br />
                    <input
                      type="text"
                      name="fromTokenAddress"
                      value={this.state.fromTokenAddress}
                      onChange={this.valueChange}
                    />
                    <input
                      type="button"
                      value="Info"
                      onClick={this.getBEP20TokenInfo.bind(
                        this,
                        this.state.fromTokenAddress
                      )}
                    />
                    <br />
                    <span> From amount </span> <br />
                    <input
                      type="number"
                      step="0.01"
                      name="fromAmount"
                      value={this.state.fromAmount}
                      onChange={this.valueChange}
                    />
                    <br />
                    <br />
                    <span> To Contract address </span> <br />
                    <input
                      type="text"
                      name="toTokenAddress"
                      value={this.state.toTokenAddress}
                      onChange={this.valueChange}
                    />
                    <input
                      type="button"
                      value="Info"
                      onClick={this.getBEP20TokenInfo.bind(
                        this,
                        this.state.toTokenAddress
                      )}
                    />
                    <br />
                    <span> To amount </span> <br />
                    <input
                      type="number"
                      step="0.01"
                      name="toAmount"
                      value={this.state.toAmount}
                      onChange={this.valueChange}
                    />
                    <br />
                    <br />
                    <input
                      type="button"
                      value="SWAP"
                      onClick={this.makeBEP20RawTransaction.bind(
                        this,
                        this.state.fromTokenAddress,
                        this.state.walletAddress,
                        this.state.fromAmount
                      )}
                    />
                  </form>
                </header>
              </div>
            </ThemeProvider>
          </Route>
          <Route> No route </Route>
        </Switch>
      </Router>
    );
  }
}

export default App;
