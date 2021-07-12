import React from "react";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import Drawer from "@material-ui/core/Drawer";
import List from "@material-ui/core/List";
import Divider from "@material-ui/core/Divider";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import InboxIcon from "@material-ui/icons/MoveToInbox";
import MailIcon from "@material-ui/icons/Mail";

export default class MenuDrawer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      open: props.open ?? false,
    };
  }

  classes = makeStyles({
    list: {
      width: 250,
    },
    fullList: {
      width: "auto",
    },
  });

  toggleDrawer = (anchor, open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }

    this.setState({ ...this.state, open: this.open });
  };

  list = (anchor) => (
    <div
      className={clsx(this.classes.list)}
      style={{ width: 250 }}
      role="presentation"
      onClick={this.toggleDrawer(anchor, false)}
      onKeyDown={this.toggleDrawer(anchor, false)}
    >
      <List>
        <ListItem button key="doc">
          <ListItemIcon>
            <InboxIcon />
          </ListItemIcon>
          <ListItemText primary="Doc" />
        </ListItem>
      </List>
      <Divider />
      <List>
        <ListItem button key="help">
          <ListItemIcon>
            <MailIcon />
          </ListItemIcon>
          <ListItemText primary="Help" />
        </ListItem>
      </List>
    </div>
  );

  render() {
    return (
      <React.Fragment key={"open"}>
        <Drawer
          anchor={"open"}
          open={this.state["open"]}
          onClose={this.toggleDrawer("open", false)}
        >
          {this.list("open")}
        </Drawer>
      </React.Fragment>
    );
  }
}
