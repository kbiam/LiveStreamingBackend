const express = require('express');
const bodyParser = require('body-parser');
const webrtc = require('wrtc');
const path = require('path');
const cors = require('cors');
const socketIo = require('socket.io');
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv')
dotenv.config()

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:3000', "https://live-streaming-frontend-g2aa.vercel.app"],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true
  }
});

let streams = {};
let iceCandidates = {};

app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api', require("./Routes/authRoutes"));

app.post('/generate-stream-id', (req, res) => {
  const streamerId = uuidv4();
  res.json({ streamerId });
});

app.post('/consumer/:streamerId', async (req, res) => {
  const { streamerId } = req.params;
  console.log("Received consumer request for stream:", streamerId);
  try {
    if (!streams[streamerId]) {
      return res.status(404).json({ error: "Stream not found" });
    }
    const peer = new webrtc.RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.stunprotocol.org' },
        // Add TURN servers here if needed
      ],
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        io.emit('new-ice-candidate', {
          candidate: event.candidate,
          role: 'consumer',
          streamerId,
        });
      }
    };

    const desc = new webrtc.RTCSessionDescription(req.body);
    console.log('Received SDP:', desc.type);
    await peer.setRemoteDescription(desc);

    if (!streams[streamerId]) {
      return res.status(404).json({ error: "Stream not found" });
    }

    streams[streamerId].getTracks().forEach((track) => peer.addTrack(track, streams[streamerId]));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    const payload2 = {
      sdp: peer.localDescription,
    };
    res.json(payload2);

    if (iceCandidates[streamerId]) {
      iceCandidates[streamerId].forEach(async (candidate) => {
        try {
          await peer.addIceCandidate(candidate);
        } catch (e) {
          console.error('Error adding ICE candidate:', e);
        }
      });
    }
  } catch (error) {
    console.error('Error in /consumer:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/broadcast/:streamerId', async (req, res) => {
  const { streamerId } = req.params;
  console.log("Received broadcast request for stream:", streamerId);
  try {
    const peer = new webrtc.RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.stunprotocol.org' },
        // Add TURN servers here if needed
      ],
    });

    peer.ontrack = (e) => handleTrackEvent(e, streamerId);
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        io.emit('new-ice-candidate', {
          candidate: event.candidate,
          role: 'broadcaster',
          streamerId,
        });
      }
    };
    
    const desc = new webrtc.RTCSessionDescription(req.body.sdp);
    await peer.setRemoteDescription(desc);

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    const payload = {
      sdp: peer.localDescription,
    };
    res.json(payload);

    if (iceCandidates[streamerId]) {
      iceCandidates[streamerId].forEach(async (candidate) => {
        try {
          await peer.addIceCandidate(candidate);
        } catch (e) {
          console.error('Error adding ICE candidate:', e);
        }
      });
    }
  } catch (error) {
    console.error('Error in /broadcast:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/ice-candidate/:streamerId', (req, res) => {
  const { candidate, role } = req.body;
  const { streamerId } = req.params;

  if (!iceCandidates[streamerId]) {
    iceCandidates[streamerId] = [];
  }
  iceCandidates[streamerId].push(candidate);
  io.emit('new-ice-candidate', { candidate, role, streamerId });

  res.sendStatus(200);
});

function handleTrackEvent(e, streamerId) {
  if (e.streams && e.streams[0]) {
    streams[streamerId] = e.streams[0];
    console.log(`Stream added for streamerId ${streamerId}:`, streams[streamerId]);
  } else {
    console.error(`No stream found in track event for streamerId ${streamerId}`);
  }
}

io.on('connection', (socket) => {
  socket.on('ice-candidate', ({ candidate, streamerId, role }) => {
    console.log(`Received ICE candidate for ${role} on stream ${streamerId}`);
    if (!iceCandidates[streamerId]) {
      iceCandidates[streamerId] = [];
    }
    iceCandidates[streamerId].push(candidate);
    io.emit('new-ice-candidate', { candidate, streamerId, role });
  });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});