import React, { Component } from "react";
// import "./App.css";
import "@fontsource/montserrat";
import JMuxer from "jmuxer";

import { Router } from '../../components/Router.js';
import { GooSpinner } from "react-spinners-kit";

const Store = window.require('electron-store');
const store = new Store();
const theme = store.get("colorTheme");

const { ipcRenderer } = window;

class Carplay extends Component {

  constructor(props) {
    super(props);
    this.navigateToDashboard = this.navigateToDashboard.bind(this);
    this.state = {
      height: 0,
      width: 0,
      mouseDown: false,
      lastX: 0,
      lastY: 0,
      status: false,
      playing: false,
      frameCount: 0,
      fps: 0,
      start: null,
      videoDuration: 0,
      loading: true,
    };
  }

  navigateToDashboard() {
    this.props.navigate("/dashboard");
    this.props.showNavBar(true);
  }

  componentWillUnmount() {
    ipcRenderer.removeListener("plugged", this.plugged);
    ipcRenderer.removeListener("unplugged", this.unplugged);
    ipcRenderer.removeListener('quitReq', this.quitReq);
  }

  plugged = () => {
    this.setState({ status: true });
    if (window.location.hash === "#/" || window.location.hash === "")
      this.props.showNavBar(false);
  }

  unplugged = () => {
    this.setState({ status: false });
    this.props.showNavBar(true);
  }

  quitReq = () => {
    this.navigateToDashboard();
    console.log("LEAVING CARPLAY");
  }

  componentDidMount() {

    const jmuxer = new JMuxer({
      node: "player",
      mode: "video",
      //readFpsFromTrack: true,
      maxDelay: 10,
      fps: 60,
      flushingTime: 1,
      debug: false,
    });
    const height = this.divElement.clientHeight;
    const width = this.divElement.clientWidth;


    this.setState({ height, width }, () => {
      //console.log(this.state.height, this.state.width);
    });

    ipcRenderer.on("plugged", this.plugged);
    ipcRenderer.on("unplugged", this.unplugged);
    ipcRenderer.on('quitReq', this.quitReq);

    ipcRenderer.send("statusReq");
    const ws = new WebSocket("ws://localhost:3001");
    ws.binaryType = "arraybuffer";
    ws.onmessage = (event) => {
      //  let duration = 0
      // if(!(this.state.start)) {
      //     this.setState({start: new Date().getTime()})
      // } else {
      //     let now = new Date().getTime()
      //     duration = (now - this.state.start)
      //     this.setState({start: now})
      // }
      let buf = Buffer.from(event.data);
      let duration = buf.readInt32BE(0);
      let video = buf.slice(4);
      //console.log("duration was: ", duration)
      jmuxer.feed({ video: new Uint8Array(video), duration: duration });
      //this.setState({videoDuration: this.state.videoDuration + duration})
      //console.log(new Date().getTime() - this.state.start, this.state.videoDuration)
      //this.setState({playing: true})
    };
  }

  /* Now feed media data using feed method. audio and video is buffer data and duration is in milliseconds */

  render() {
    const { loading } = this.state;

    const handleMDown = (e) => {
      //console.log("touched", e, e.target.getBoundingClientRect())
      let currentTargetRect = e.target.getBoundingClientRect();
      let x = e.clientX - currentTargetRect.left;
      let y = e.clientY - currentTargetRect.top;
      x = x / this.state.width;
      y = y / this.state.height;
      this.setState({ lastX: x, lastY: y });
      this.setState({ mouseDown: true });
      ipcRenderer.send("click", { type: 14, x: x, y: y });
    };
    const handleMUp = (e) => {
      //console.log("touched end", e)
      let currentTargetRect = e.target.getBoundingClientRect();
      let x = e.clientX - currentTargetRect.left;
      let y = e.clientY - currentTargetRect.top;
      x = x / this.state.width;
      y = y / this.state.height;
      this.setState({ mouseDown: false });
      ipcRenderer.send("click", { type: 16, x: x, y: y });
    };

    const handleMMove = (e) => {
      //console.log("touched drag", e)
      let currentTargetRect = e.target.getBoundingClientRect();
      let x = e.clientX - currentTargetRect.left;
      let y = e.clientY - currentTargetRect.top;
      x = x / this.state.width;
      y = y / this.state.height;
      ipcRenderer.send("click", { type: 15, x: x, y: y });
    };

    const handleDown = (e) => {
      //console.log("touched", e, e.target.getBoundingClientRect())
      let currentTargetRect = e.target.getBoundingClientRect();
      let x = e.touches[0].clientX - currentTargetRect.left;
      let y = e.touches[0].clientY - currentTargetRect.top;
      x = x / this.state.width;
      y = y / this.state.height;
      this.setState({ lastX: x, lastY: y });
      this.setState({ mouseDown: true });
      ipcRenderer.send("click", { type: 14, x: x, y: y });
      e.preventDefault();
    };
    const handleUp = (e) => {
      //console.log("touched end", e)
      //let currentTargetRect = e.target.getBoundingClientRect();
      let x = this.state.lastX;
      let y = this.state.lastY;
      this.setState({ mouseDown: false });
      ipcRenderer.send("click", { type: 16, x: x, y: y });
      e.preventDefault();
    };

    const handleMove = (e) => {
      //console.log("touched drag", e)
      let currentTargetRect = e.target.getBoundingClientRect();
      let x = e.touches[0].clientX - currentTargetRect.left;
      let y = e.touches[0].clientY - currentTargetRect.top;
      x = x / this.state.width;
      y = y / this.state.height;
      ipcRenderer.send("click", { type: 15, x: x, y: y });
      //e.preventDefault()
    };

    return (
      <div style={{ height: "100%", width: "100%", flex: "1" }}>
        <div
          ref={(divElement) => {
            this.divElement = divElement;
          }}
          className={`App ${theme}`}
          onTouchStart={handleDown}
          onTouchEnd={handleUp}
          onTouchMove={(e) => {
            if (this.state.mouseDown) {
              handleMove(e);
            }
          }}
          onMouseDown={handleMDown}
          onMouseUp={handleMUp}
          onMouseMove={(e) => {
            if (this.state.mouseDown) {
              handleMMove(e);
            }
          }}
          style={{
            height: "100%",
            width: "100%",
            padding: 0,
            margin: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <video
            style={{ display: this.state.status ? "block" : "none" }}
            autoPlay
            onPause={() => console.log("PAUSED")}
            id="player"
          ></video>
          {this.state.status ? (
            <div></div>
          ) : (
            <div>
            <div
              style={{
                marginTop: "35%",
                marginBottom: "auto",
                textAlign: "center",
                flexGrow: "1",
                justifyContent: "center",
                alignItems: "center",
                display: "flex",
                position: "relativ",
              }}>
                <h1 style={{ color: '#7c7c7c' }}>WAITING FOR BLUETOOTH DEVICE</h1>
            </div>
            <div
              style={{
                justifyContent: "center",
                display: "flex",
              }}>
                <GooSpinner size={40} color="#7c7c7c" loading={loading} />            
            </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default Router(Carplay);
