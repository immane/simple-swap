import React from "react";

import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Button from "@material-ui/core/Button";


export default class MessageDialog extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
        open: props.open,
        title: props.title,
        content: props.content,
    };
  }

  show = (title, content) => {
      this.setState({
        open: true,
        title: title,
        content: content,
      });
  };

  close = () => {
    this.setState({ open: false });
  };

  render() {
    return (
      <React.Fragment>
        <Dialog
          open={this.state.open}
          onClose={this.close}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {this.state.title}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              <div
                dangerouslySetInnerHTML={{
                  __html: this.state.content,
                }}
              ></div>
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.close} color="primary" autoFocus>
              OK
            </Button>
          </DialogActions>
        </Dialog>

      </React.Fragment>
    );
  }
}
