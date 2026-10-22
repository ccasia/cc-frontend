// socket.js
import { io } from 'socket.io-client';

const socket = io({ transports: ['websocket'], path: '/socket.io/' });

const JOIN_EVENTS = ['join-campaign', 'join:upload'];
const joinedRooms = new Map();

socket.onAnyOutgoing((event, roomId) => {
  if (JOIN_EVENTS.includes(event) && roomId) joinedRooms.set(`${event}:${roomId}`, [event, roomId]);
});

socket.on('connect', () => {
  joinedRooms.forEach(([event, roomId]) => socket.emit(event, roomId));
});

export default socket;
