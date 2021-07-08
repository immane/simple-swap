import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import PropTypes from "prop-types";
import NumberFormat from "react-number-format";

import InputAdornment from "@material-ui/core/InputAdornment";
import TextField from "@material-ui/core/TextField";
import IconButton from "@material-ui/core/IconButton";
import SwapVertIcon from '@material-ui/icons/SwapVert';
import Info from "@material-ui/icons/Info";
import ThumbUpIcon from '@material-ui/icons/ThumbUp';

import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { createTheme, ThemeProvider } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";

import Button from "@material-ui/core/Button";
import Icon from "@material-ui/core/Icon";

import Web3 from "web3";
import Contract from "web3-eth-contract";
import bep20TokenAbi from "./abi/BEP20Token.abi.json";
import iUniswapV2Router02 from "./abi/IUniswapV2Router02.abi.json";

import logo from "./logo.svg";
import "./App.css";


const DEFAULT_WETH = '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd';
const DEFAULT_SWAP_ROUTER = '0xD99D1c33F9fC3444f8101754aBC46c52416550D1';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      walletAddress: null,
      fromTokenAddress: "0x1372085c45Ca82139442Ac3a82db0Ec652066CDB",
      toTokenAddress: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
      fromBalance: 0,
      fromAmount: 0,
      toAmount: 0,
    };

    this.NumberFormatCustom.propTypes = {
      inputRef: PropTypes.func.isRequired,
      name: PropTypes.string.isRequired,
      onChange: PropTypes.func.isRequired,
    };
  }

  classes = makeStyles((theme) => ({
    root: {
      display: "flex",
      flexWrap: "wrap",
    },
    margin: {
      margin: theme.spacing(1),
    },
    withoutLabel: {
      marginTop: theme.spacing(3),
    },
    textField: {
      width: "25ch",
    },
  }));

  NumberFormatCustom = (props) => {
    const { inputRef, onChange, ...other } = props;

    return (
      <NumberFormat
        {...other}
        getInputRef={inputRef}
        onValueChange={(values) => {
          onChange({
            target: {
              name: props.name,
              value: values.value,
            },
          });
        }}
        thousandSeparator
        isNumericString
        prefix="$ "
      />
    );
  };

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

  openContract = async (address, abi = bep20TokenAbi) => {
    const wallet = await this.connectWalletRequest();
    if (wallet) {
      Contract.setProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
      try {
        return new Contract(abi, address, {
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
    const contract = await this.openContract(address);
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

    const token = await this.openContract(tokenAddress);
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

  approveBEP20Token = async (tokenAddress, spender, amount) => {
    const web3 = new Web3(window.ethereum);
    const wallet = await this.connectWalletRequest();
    const nonce = await web3.eth.getTransactionCount(wallet);

    const token = await this.openContract(tokenAddress);
    try {
      const decimals = await token.methods.decimals().call();
      const rawData = token.methods
        .approve(spender, amount * Math.pow(10, decimals))
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

  swap = async (fromAddress, toAddress, fromAmount, toAmountMin = 0) => {
    const web3 = new Web3(window.ethereum);
    const wallet = await this.connectWalletRequest();
    const nonce = await web3.eth.getTransactionCount(wallet);
    const gasLimit = 200000;

    const fromToken = await this.openContract(fromAddress)
    const toToken = await this.openContract(toAddress)
    const contract = await this.openContract(DEFAULT_SWAP_ROUTER, iUniswapV2Router02);

    try {
      const fromDecimals = await fromToken.methods.decimals().call();
      const toDecimals = await toToken.methods.decimals().call();

      const rawData = contract.methods
        .swapExactTokensForTokens(
            fromAmount * Math.pow(10, fromDecimals),
            toAmountMin * Math.pow(10, toDecimals),
            DEFAULT_WETH === toAddress 
                ? [fromAddress, toAddress]
                : [fromAddress, DEFAULT_WETH, toAddress],
            this.state.walletAddress,
            Date.now() + 1000 * 60 * 3
        )
        .encodeABI();

      const rawTransaction = {
        from: wallet,
        nonce: nonce,
        to: DEFAULT_SWAP_ROUTER,
        gasLimit: gasLimit,
        data: rawData,
      };

      return web3.eth.sendTransaction(rawTransaction);
    } catch (e) {
      alert(e.message);
    }
  };

  render() {
    const darkTheme = createTheme({
      palette: {
        type: "dark",
      },
    });

    return (
      <ThemeProvider theme={darkTheme}>
        <Router>
          <Switch>
            <Route path="/">
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
                  <br/>

                  <form>
                    <TextField
                      label="From Contract Address"
                      id="outlined-start-adornment"
                      className={clsx(
                        this.classes.margin,
                        this.classes.textField
                      )}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start"></InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={this.getBEP20TokenInfo.bind(
                                this,
                                this.state.fromTokenAddress
                              )}
                              edge="end"
                            >
                              <Info />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      variant="outlined"
                      name="fromTokenAddress"
                      value={this.state.fromTokenAddress}
                      onChange={this.valueChange}
                    />
                    <br />
                    <br />

                    <TextField
                      label={`From Amount (Balance: ${this.state.fromBalance})`}
                      id="outlined-start-adornment"
                      className={clsx(
                        this.classes.margin,
                        this.classes.textField
                      )}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start"></InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={this.getBEP20TokenInfo.bind(
                                this,
                                this.state.fromTokenAddress
                              )}
                              edge="end"
                            >
                              <Info />
                            </IconButton>
                          </InputAdornment>
                        ),
                        inputComponent: this.NumberFormatCustom,
                      }}
                      variant="outlined"
                      name="fromAmount"
                      value={this.state.fromAmount}
                      onChange={this.valueChange}
                    />
                    <br />
                    <br />

                    <TextField
                      label="To Contract Address"
                      id="outlined-start-adornment"
                      className={clsx(
                        this.classes.margin,
                        this.classes.textField
                      )}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start"></InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={this.getBEP20TokenInfo.bind(
                                this,
                                this.state.toTokenAddress
                              )}
                              edge="end"
                            >
                              <Info />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      variant="outlined"
                      name="toTokenAddress"
                      value={this.state.toTokenAddress}
                      onChange={this.valueChange}
                    />
                    <br />
                    <br />

                    <TextField
                      label={`To Amount`}
                      id="outlined-start-adornment"
                      className={clsx(
                        this.classes.margin,
                        this.classes.textField
                      )}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start"></InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton edge="end">
                              <Info />
                            </IconButton>
                          </InputAdornment>
                        ),
                        inputComponent: this.NumberFormatCustom,
                      }}
                      variant="outlined"
                      name="toAmount"
                      value={this.state.toAmount}
                      onChange={this.valueChange}
                    />
                    <br />
                    <br />

                    <Button
                      variant="contained"
                      color="primary"
                      className={makeStyles((theme) => ({
                        button: {
                          margin: theme.spacing(1),
                        },
                      }))}
                      endIcon={<ThumbUpIcon />}
                      onClick={this.approveBEP20Token.bind(
                        this,
                        this.state.fromTokenAddress,
                        DEFAULT_SWAP_ROUTER,
                        this.state.fromAmount
                      )}
                    >
                        1. Approve
                    </Button>
                    
                    &emsp;

                    <Button
                      variant="contained"
                      color="secondary"
                      className={makeStyles((theme) => ({
                        button: {
                          margin: theme.spacing(1),
                        },
                      }))}
                      endIcon={<SwapVertIcon />}
                      onClick={this.swap.bind(
                        this,
                        this.state.fromTokenAddress,
                        this.state.toTokenAddress,
                        this.state.fromAmount,
                        this.state.toAmount,
                      )}
                    >
                        2. SWAP
                    </Button>

                    <br/>
                    <br/>
                  </form>
                </header>
              </div>
            </Route>
            <Route> No route </Route>
          </Switch>
        </Router>
      </ThemeProvider>
    );
  }
}

export default App;
