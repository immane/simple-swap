// Base
import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import PropTypes from "prop-types";
import NumberFormat from "react-number-format";

// UI
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import { createTheme, ThemeProvider } from "@material-ui/core/styles";

import { ToastContainer, toast } from "material-react-toastify";
import "material-react-toastify/dist/ReactToastify.css";

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

// Component
import MenuDrawer from "./components/MenuDrawer";
import MessageDialog from "./components/MessageDialog";

// Ethereum
import Ethereum from "./utils/Ethereum";
import EthereumNetworks from "./constant/EthereumNetworks.json";

import logo from "./logo.svg";
import "./App.css";

// Main
class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // Dialog
      openDialog: false,
      dialogTitle: "Dialog",
      dialogContent: "Content",
      refreshDialogKey: 0,

      // Drawer
      openDrawer: false,
      refreshDrawerKey: 0,

      // Ethereum
      chainId: 0,
      walletAddress: null,
      fromTokenAddress: "0x1372085c45Ca82139442Ac3a82db0Ec652066CDB",
      toTokenAddress: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
      // fromTokenAddress: "0x0",
      // toTokenAddress: "0x0",
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

  // Dialog

  showDialog = (title, content) => {
    return new Promise(() => {
      this.setState({
        dialogTitle: title,
        dialogContent: content,
        openDialog: true,
        refreshDialogKey: this.state.refreshDialogKey + 1,
      });
    });
  };

  // Drawer
  openDrawer = () => {
    this.setState({
      openDrawer: true,
      refreshDrawerKey: this.state.refreshDrawerKey + 1,
    });
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

  storeTokenInfo = async (address, variable) => {
    const info = await Ethereum.getTokenInfo(address);
    if (info) {
      this.setState({ [variable]: info });
      return info;
    }
    return false;
  };

  refreshTokenInfo = () => {
    this.storeTokenInfo(this.state.fromTokenAddress, "fromTokenInfo");
    this.storeTokenInfo(this.state.toTokenAddress, "toTokenInfo");
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
              onClick={this.openDrawer}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" className={classes.title}>
              Simple Swap
            </Typography>
            <Button
              color="inherit"
              onClick={async () => {
                const wallet = await Ethereum.connectWalletRequest();
                this.setState({
                  walletAddress: wallet.address,
                  chainId: wallet.chainId,
                });
              }}
            >
              {this.state.walletAddress
                ? `${this.state.walletAddress.slice(
                    0,
                    6
                  )}...${this.state.walletAddress.slice(-4)}`
                : "Connect"}
            </Button>
          </Toolbar>
        </AppBar>

        <MenuDrawer
          open={this.state.openDrawer}
          key={"MenuDrawer" + this.state.refreshDrawerKey}
        />

        <MessageDialog
          open={this.state.openDialog}
          key={"MessageDialog" + this.state.refreshDialogKey}
          title={this.state.dialogTitle}
          content={this.state.dialogContent}
        />

        <ToastContainer
          position="bottom-center"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          limit={3}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />

        <Router>
          <Switch>
            <Route path="/">
              <div className="App">
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
                                Ethereum.getTokenInfo(
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
                                Ethereum.getTokenInfo(
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
                          toast.warning("Please connect to wallet first");
                        } else {
                          Ethereum.approve(
                            this.state.fromTokenAddress,
                            EthereumNetworks[parseInt(this.state.chainId, 16)]
                              .swap.default.address,
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
                      onClick={() => {
                        Ethereum.swap(
                          parseInt(this.state.chainId, 16),
                          this.state.fromTokenAddress,
                          this.state.toTokenAddress,
                          this.state.fromAmount,
                          this.state.toAmount,
                          this.state.walletAddress
                        );
                      }}
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

      "& div.MuiToolbar-root": {
        minHeight: "40px",
      },
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
