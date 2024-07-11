const express = require('express')
const mongoDB = require("./db");
const app = express()
const port = 4000
const serverPort=4000
var cors = require('cors')
const bodyParser = require("body-parser");

const webrtc = require("wrtc");
const path = require("path");
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json())
app.use(cors())
const { Server } = require('socket.io');
const http = require('http');
const server = http.createServer(app);
const io = new Server(server);


let senderStream;
let iceCandidates = [];

app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API routes
app.use('/api', require("./Routes/authRoutes"));

// Serve the static files from the React app
app.use(express.static(path.resolve(__dirname, '../Frontend/build')));

// Handle all GET requests to return the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/build', 'index.html'));
});

app.post('/consumer', async ({ body }, res) => {
  try {
    const peer = new webrtc.RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun.stunprotocol.org',
        },
      ],
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        io.emit('new-ice-candidate', {
          candidate: event.candidate,
          role: 'consumer',
        });
      }
    };

    const desc = new webrtc.RTCSessionDescription(body.sdp);
    await peer.setRemoteDescription(desc);

    if (!senderStream) {
      return res.status(404).json({ message: 'No Stream to watch' });
    }

    senderStream.getTracks().forEach((track) => peer.addTrack(track, senderStream));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    const payload = {
      sdp: peer.localDescription,
    };
    res.json(payload);

    iceCandidates.forEach(async (candidate) => {
      try {
        await peer.addIceCandidate(candidate);
      } catch (e) {
        console.error('Error adding ICE candidate:', e);
      }
    });
  } catch (error) {
    console.error('Error in /consumer:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/broadcast', async ({ body }, res) => {
  try {
    const peer = new webrtc.RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun.stunprotocol.org',
        },
      ],
    });

    peer.ontrack = (e) => handleTrackEvent(e, peer);
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        io.emit('new-ice-candidate', {
          candidate: event.candidate,
          role: 'broadcaster',
        });
      }
    };

    const desc = new webrtc.RTCSessionDescription(body.sdp);
    await peer.setRemoteDescription(desc);

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    broadcasterSdpOffer = peer.localDescription;

    const payload = {
      sdp: peer.localDescription,
    };
    res.json(payload);

    iceCandidates.forEach(async (candidate) => {
      try {
        await peer.addIceCandidate(candidate);
      } catch (e) {
        console.error('Error adding ICE candidate:', e);
      }
    });
  } catch (error) {
    console.error('Error in /broadcast:', error);
    res.status(500).json({ error: error.message });
  }
});
app.post('/ice-candidate', (req, res) => {
  const { candidate, role } = req.body;
  io.emit('new-ice-candidate', { candidate, role }); // Emit to all connected clients
  res.sendStatus(200);
});


function handleTrackEvent(e, peer) {
  senderStream = e.streams[0];
}

io.on('connection', (socket) => {
  socket.on('ice-candidate', ({ candidate }) => {
    iceCandidates.push(candidate);
  });
});


server.listen(serverPort, '0.0.0.0', () => {
  console.log(`Server is running on port ${serverPort}`);
});




app.listen(port, () => {
  console.log(`app listening on port ${port}`)
})

mongoDB();
