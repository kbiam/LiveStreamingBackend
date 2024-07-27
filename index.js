const express = require('express');
const bodyParser = require('body-parser');
const webrtc = require('wrtc');
const cors = require('cors');
const socketIo = require('socket.io');
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:3000', 'https://live-streaming-frontend-g2aa.vercel.app'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  },
});

let streams = {};
let iceCandidates = {};

app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api', require('./Routes/authRoutes'));

app.post('/generate-stream-id', (req, res) => {
  const streamerId = uuidv4();
  res.json({ streamerId });
});

app.post('/consumer/:streamerId', async (req, res) => {
  const { streamerId } = req.params;
  console.log('Received consumer request for stream:', streamerId);
  try {
    if (!streams[streamerId]) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    const { sdp } = req.body;
    const peer = new webrtc.RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.stunprotocol.org' }],
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        io.to(streamerId).emit('new-ice-candidate', {
          candidate: event.candidate,
          role: 'consumer',
          streamerId: streamerId,
        });
      }
    };

    streams[streamerId].peer.getSenders().forEach((sender) => peer.addTrack(sender.track));

    const desc = new webrtc.RTCSessionDescription(sdp);
    await peer.setRemoteDescription(desc);

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    const response = { sdp: peer.localDescription };
    res.json(response);
  } catch (error) {
    console.error('Error handling consumer connection:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/broadcast/:streamerId', async (req, res) => {
  const { streamerId } = req.params;
  console.log('Broadcast request from streamer:', streamerId);
  try {
    const { sdp } = req.body;

    const peer = new webrtc.RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.stunprotocol.org' }],
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        io.to(streamerId).emit('new-ice-candidate', {
          candidate: event.candidate,
          role: 'broadcaster',
          streamerId: streamerId,
        });
      }
    };

    const desc = new webrtc.RTCSessionDescription(sdp);
    await peer.setRemoteDescription(desc);

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    streams[streamerId] = { peer };
    const response = { sdp: peer.localDescription };
    res.json(response);
  } catch (error) {
    console.error('Error handling broadcast connection:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/ice-candidate/:streamerId', (req, res) => {
  const { streamerId } = req.params;
  const { candidate, role } = req.body;

  if (role === 'consumer') {
    if (streams[streamerId] && streams[streamerId].peer) {
      streams[streamerId].peer.addIceCandidate(new webrtc.RTCIceCandidate(candidate));
    }
  }

  if (role === 'broadcaster') {
    io.to(streamerId).emit('new-ice-candidate', {
      candidate,
      role: 'broadcaster',
      streamerId: streamerId,
    });
  }

  res.status(200).json({ success: true });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
