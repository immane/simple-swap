// Base
import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import PropTypes from "prop-types";
import NumberFormat from "react-number-format";

// UI
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import { createTheme, ThemeProvider } from "@material-ui/core/styles";

import InputAdornment from "@material-ui/core/InputAdornment";
import TextField from "@material-ui/core/TextField";

import IconButton from "@material-ui/core/IconButton";
import SwapVertIcon from "@material-ui/icons/SwapVert";
import Info from "@material-ui/icons/Info";
import PeopleIcon from "@material-ui/icons/People";
import AutorenewIcon from "@material-ui/icons/Autorenew";

import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import MenuIcon from "@material-ui/icons/Menu";

import Snackbar from "@material-ui/core/Snackbar";
import MuiAlert from "@material-ui/lab/Alert";

import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";

// Ethereum
import Web3 from "web3";
import bep20TokenAbi from "./abi/BEP20Token.abi.json";
import iUniswapV2Router02 from "./abi/IUniswapV2Router02.abi.json";

import logo from "./logo.svg";
import "./App.css";

// Constant
const NETWORKS = {
  0x1: {
    name: "Ethereum Mainnet",
    chain: "ETH",
    weth: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    swap: {
      default: {
        name: "Uniswap V2: Router 2",
        address: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
      },
    },
  },
  0x38: {
    name: "BSC Mainnet",
    chain: "BNB",
    weth: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    swap: {
      default: {
        name: "PancakeSwap: Router v2",
        address: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
      },
    },
  },
  0x61: {
    name: "BSC Mainnet",
    chain: "BNB",
    weth: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
    swap: {
      default: {
        name: "Pancakeswap Testnet: Router",
        address: "0xD99D1c33F9fC3444f8101754aBC46c52416550D1",
      },
    },
  },
};

// Main
class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // Alert
      openAlert: false,
      alertType: "info",
      alertMessage: "Information",

      // Dialog
      openDialog: false,
      dialogTitle: "Dialog",
      dialogContent: "Content",

      // Ethereum
      chainId: 0,
      walletAddress: null,
      // fromTokenAddress: "0x1372085c45Ca82139442Ac3a82db0Ec652066CDB",
      // toTokenAddress: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
      fromTokenAddress: null,
      toTokenAddress: null,
      fromTokenInfo: {},
      toTokenInfo: {},
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

  // Alert

  showToast = (message, type = "info") => {
    return new Promise(() => {
      this.setState({
        alertMessage: message,
        alertType: type,
        openAlert: true,
      });
    });
  };

  handleAlertClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    this.setState({ openAlert: false });
  };

  // Dialog

  showDialog = (title, content) => {
    return new Promise(() => {
      this.setState({
        dialogTitle: title,
        dialogContent: content,
        openDialog: true,
      });
    });
  };

  handleDialogClose = () => {
    this.setState({ openDialog: false });
  };

  // Form

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
        prefix=""
      />
    );
  };

  valueChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value.trim(),
    });
  };

  handleBlur = (event) => {
    this.storeTokenInfo(this.state.fromTokenAddress, "fromTokenInfo");
    this.storeTokenInfo(this.state.toTokenAddress, "toTokenInfo");
  };

  handleFocus = (event) => {
    this.storeTokenInfo(this.state.fromTokenAddress, "fromTokenInfo");
    this.storeTokenInfo(this.state.toTokenAddress, "toTokenInfo");
    event.target.select();
  };

  // Ethereum

  connectWalletRequest = async () => {
    if (window.ethereum) {
      try {
        const ethereum = window.ethereum;
        const accounts = await ethereum.request({
          method: "eth_requestAccounts",
        });
        const wallet = accounts[0];

        const chainId = await ethereum.request({ method: "eth_chainId" });
        this.setState({ chainId: parseInt(chainId, 16) });
        console.log("Connected chain id", chainId);

        ethereum.on("chainChanged", (_chainId) => {
          this.showToast(
            "Wallet chain has changed, auto refreshing...",
            "warning"
          );
          setTimeout(() => window.location.reload(), 5e3);
        });

        if (wallet) {
          this.setState({
            walletAddress: wallet,
          });
          return wallet;
        }
      } catch (e) {
        this.showToast(e.message, "error");
      }
    } else {
      this.showToast("No ethereum environment found", "error");
    }
  };

  openContract = async (address, abi = bep20TokenAbi) => {
    const web3 = new Web3(window.ethereum);
    const wallet = await this.connectWalletRequest();
    if (wallet) {
      // Contract.setProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
      try {
        const contract = new web3.eth.Contract(abi, address, {
          from: wallet,
          // gasPrice: web3.utils.toHex(await web3.eth.getGasPrice()),
        });
        console.log(`Contract [${address}]`, contract);
        return contract;
      } catch (e) {
        this.showToast(e.message, "error");
      }
    } else {
      return false;
    }
  };

  getTokenInfo = async (address) => {
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

        return tokenInfo;
      } catch (e) {
        this.showToast(e.message, "error");
      }
    } else return false;
  };

  storeTokenInfo = async (address, variable) => {
    const info = await this.getTokenInfo(address);
    if (info) {
      this.setState({ [variable]: info });
      return info;
    }
    return false;
  };

  sendTransaction = async (contractAddress, rawData) => {
    const ethereum = window.ethereum;
    const web3 = new Web3(ethereum);
    const wallet = await this.connectWalletRequest();
    const nonce = await web3.eth.getTransactionCount(wallet);

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
        from: wallet,
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
        this.showToast("Send transaction success", "success");
      })
      .catch((err) => {
        this.showToast(err.message, "error");
      });
  };

  transfer = async (tokenAddress, to, amount) => {
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

  approve = async (tokenAddress, spender, amount) => {
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

  swap = async (fromAddress, toAddress, fromAmount, toAmountMin = 0) => {
    const swapRouter = NETWORKS[this.state.chainId].swap.default.address;
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
              NETWORKS[this.state.chainId].weth,
              toAddress,
            ]),
          ],
          this.state.walletAddress,
          Date.now() + 1000 * 60 * 3
        )
        .encodeABI();
    });
  };

  render() {
    const darkTheme = createTheme({
      palette: {
        type: "dark",
      },
    });
    const classes = this.props.classes;

    return (
      <ThemeProvider theme={darkTheme}>
        <AppBar position="fixed" className={classes.root}>
          <Toolbar>
            <IconButton
              edge="start"
              className={classes.menuButton}
              color="inherit"
              aria-label="menu"
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" className={classes.title}>
              Simple Swap
            </Typography>
            <Button color="inherit" onClick={this.connectWalletRequest}>
              {this.state.walletAddress
                ? `${this.state.walletAddress.slice(
                    0,
                    6
                  )}...${this.state.walletAddress.slice(-4)}`
                : "Connect"}
            </Button>
          </Toolbar>
        </AppBar>

        <Dialog
          open={this.state.openDialog}
          onClose={this.handleDialogClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {this.state.dialogTitle}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              <div
                dangerouslySetInnerHTML={{
                  __html: this.state.dialogContent,
                }}
              ></div>
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleDialogClose} color="primary" autoFocus>
              OK
            </Button>
          </DialogActions>
        </Dialog>

        <Router>
          <Switch>
            <Route path="/">
              <div className="App">
                <Snackbar
                  open={this.state.openAlert}
                  autoHideDuration={6000}
                  onClose={this.handleAlertClose}
                >
                  <MuiAlert
                    elevation={6}
                    variant="filled"
                    severity={this.state.alertType}
                    onClose={this.handleAlertClose}
                  >
                    {this.state.alertMessage}
                  </MuiAlert>
                </Snackbar>

                <header className="App-header">
                  <img src={logo} className="App-logo" alt="logo" />
                  <br />

                  <form>
                    <TextField
                      label="From Contract Address"
                      id="outlined-start-adornment"
                      className={clsx(classes.margin, classes.textField)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start"></InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => {
                                this.getTokenInfo(
                                  this.state.fromTokenAddress
                                ).then((res) => {
                                  if (res) {
                                    this.showDialog(
                                      "Token Information",
                                      `Symbol: ${res?.symbol}<br/>Name: ${res?.name}<br/>Decimals: ${res?.decimals}<br/>Total Supply: ${res?.totalSupply}<br/>Your Balance: ${res?.balance}`
                                    );
                                  }
                                });
                              }}
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
                      onFocus={this.handleFocus}
                      onBlur={this.handleBlur}
                    />
                    <br />
                    <br />
                    <TextField
                      label={`From Amount (Balance: ${
                        this.state.fromTokenInfo?.balance ?? 0
                      })`}
                      id="outlined-start-adornment"
                      className={clsx(classes.margin, classes.textField)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            {this.state.fromTokenInfo?.symbol}
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <span
                              onClick={() => {
                                this.setState({
                                  fromAmount: this.state.fromTokenInfo?.balance,
                                });
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              Max
                            </span>
                          </InputAdornment>
                        ),
                        inputComponent: this.NumberFormatCustom,
                      }}
                      variant="outlined"
                      name="fromAmount"
                      value={this.state.fromAmount}
                      onChange={this.valueChange}
                      onFocus={this.handleFocus}
                    />
                    <br />
                    <AutorenewIcon
                      style={{ color: "#61dafb", height: "2em" }}
                      onClick={() => {
                        this.setState(
                          {
                            fromTokenAddress: this.state.toTokenAddress,
                            toTokenAddress: this.state.fromTokenAddress,
                            fromAmount: this.state.toAmount,
                            toAmount: this.state.fromAmount,
                          },
                          () => {
                            this.storeTokenInfo(
                              this.state.fromTokenAddress,
                              "fromTokenInfo"
                            );
                            this.storeTokenInfo(
                              this.state.toTokenAddress,
                              "toTokenInfo"
                            );
                          }
                        );
                      }}
                    />
                    <br />
                    <TextField
                      label="To Contract Address"
                      id="outlined-start-adornment"
                      className={clsx(classes.margin, classes.textField)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start"></InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => {
                                this.getTokenInfo(
                                  this.state.toTokenAddress
                                ).then((res) => {
                                  if (res) {
                                    this.showDialog(
                                      "Token Information",
                                      `Symbol: ${res?.symbol}<br/>Name: ${res?.name}<br/>Decimals: ${res?.decimals}<br/>Total Supply: ${res?.totalSupply}<br/>Your Balance: ${res?.balance}`
                                    );
                                  }
                                });
                              }}
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
                      onFocus={this.handleFocus}
                      onBlur={this.handleBlur}
                    />
                    <br />
                    <br />
                    <TextField
                      label={`Minimum To Amount`}
                      id="outlined-start-adornment"
                      className={clsx(classes.margin, classes.textField)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            {this.state.toTokenInfo?.symbol}
                          </InputAdornment>
                        ),
                        inputComponent: this.NumberFormatCustom,
                      }}
                      variant="outlined"
                      name="toAmount"
                      value={this.state.toAmount}
                      onChange={this.valueChange}
                      onFocus={this.handleFocus}
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
                      endIcon={<PeopleIcon />}
                      onClick={() => {
                        if (!this.state.chainId) {
                          this.showToast(
                            "Please connect to wallet first",
                            "warning"
                          );
                        } else {
                          this.approve(
                            this.state.fromTokenAddress,
                            NETWORKS[this.state.chainId].swap.default.address,
                            this.state.fromAmount
                          );
                        }
                      }}
                    >
                      Approve
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
                        this.state.toAmount
                      )}
                    >
                      SWAP
                    </Button>
                    <br />
                    <br />
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

export default () => {
  const baseColor = "rgb(97, 218, 251)";
  const useStyles = makeStyles((theme) => ({
    root: {
      display: "flex",
      flexWrap: "wrap",
      backgroundColor: baseColor,
      color: "black",
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    title: {
      flexGrow: 1,
    },
    focused: {},
    margin: {
      margin: theme.spacing(1),
    },
    withoutLabel: {
      marginTop: theme.spacing(3),
    },
    textField: {
      width: "25ch",

      // input label when focused
      "& label.Mui-focused": {
        color: baseColor,
      },
      // focused color for input with variant='standard'
      "& .MuiInput-underline:after": {
        borderBottomColor: baseColor,
      },
      // focused color for input with variant='filled'
      "& .MuiFilledInput-underline:after": {
        borderBottomColor: baseColor,
      },
      // focused color for input with variant='outlined'
      "& .MuiOutlinedInput-root": {
        "&.Mui-focused fieldset": {
          borderColor: baseColor,
        },
      },
    },
  }));

  const classes = useStyles();
  return <App classes={classes} />;
};
