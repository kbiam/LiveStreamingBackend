const express = require('express')
const mongoDB = require("./db");
const app = express()
const port = 4000

var cors = require('cors')
const bodyParser = require("body-parser");

const webrtc = require("wrtc");
const path = require("path");

app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json())
app.use(cors())

app.use('/api', require("./Routes/authRoutes"));

let senderStream;
app.use(cors({origin: '*'}));
let broadcasterSdpOffer;

// Serve the static files from the React app
app.use(express.static(path.resolve(__dirname, "../Frontend/build")));



app.post("/consumer", async ({ body }, res) => {
  try {
    const peer = new webrtc.RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.stunprotocol.org",
        },
      ],
    });
    const desc = new webrtc.RTCSessionDescription(body.sdp);
    await peer.setRemoteDescription(desc);
    console.log(senderStream);
    if (!senderStream) {
      return res.status(404).json({ message: "No Stream to watch" });
    }
    senderStream
      .getTracks()
      .forEach((track) => peer.addTrack(track, senderStream));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    const payload = {
      sdp: peer.localDescription,
    };
    res.json(payload);
  } catch (error) {
    console.error("Error in /consumer:", error);
    res.status(500).json({ error: error.message });
    ``;
  }
});

app.get("/broadcaster-sdp-offer", (req, res) => {
  try {
    if (broadcasterSdpOffer) {
      res.json({ sdp: broadcasterSdpOffer });
    } else {
      res.status(404).json({ error: "No broadcaster SDP offer available" });
    }
  } catch (error) {
    console.error("Error in /broadcaster-sdp:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/broadcast", async ({ body }, res) => {
  try {
    const peer = new webrtc.RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.stunprotocol.org",
        },
      ],
    });
    peer.ontrack = (e) => handleTrackEvent(e, peer);
    const desc = new webrtc.RTCSessionDescription(body.sdp);
    await peer.setRemoteDescription(desc);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    broadcasterSdpOffer = peer.localDescription;
    const payload = {
      sdp: peer.localDescription,
    };
    res.json(payload);
  } catch (error) {
    console.error("Error in /broadcast:", error);
    res.status(500).json({ error: error.message });
  }
});
function handleTrackEvent(e, peer) {
  senderStream = e.streams[0];
}

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});




mongoDB();

