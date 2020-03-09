let isAlreadyCalling = false;

const { RTCPeerConnection, RTCSessionDescription } = window;

const peerConnection = new RTCPeerConnection();

async function callUser( socketId ) {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription( new RTCSessionDescription( offer ) );

  socket.emit( "call-user", { offer, to: socketId } );
};

const socket = io.connect( "localhost:5000" );

socket.on( "call-made", async data => {

  await peerConnection.setRemoteDescription( new RTCSessionDescription( data.offer ) );

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription( new RTCSessionDescription( answer ) );

  socket.emit( "make-answer", { answer, to: data.socket } );
} );

socket.on( "answer-made", async data => {
  await peerConnection.setRemoteDescription( new RTCSessionDescription( data.answer ) );

  if ( !isAlreadyCalling ) {
    callUser( data.socket );
    isAlreadyCalling = true;
  }
} );

socket.on( "call-rejected", data => {
  alert( `UserL Socket - ${data.socket} rejected your call` );
  unselectUsersFromList();
} );

peerConnection.ontrack = function( { streams: [stream] } ) {
  const remoteVideo = document.getElementById( "remote-video" );
  if ( remoteVideo ) {
    remoteVideo.srcObject = stream;
  }
};

navigator.getUserMedia(
  { video: true, audio: true },
  stream => {
    const localVideo = document.getElementById( "remote-video" );
    if ( localVideo ) {
      localVideo.srcObject = stream;
    }

    stream.getTracks().forEach( track => peerConnection.addTrack( track, stream ) );
  },
  error => console.warn( error.message )
);

navigator.getUserMedia(
  { video: true, audio: true },
  stream => {
    const localVideo = document.getElementById( "local-video" );
    if ( localVideo ) {
      localVideo.srcObject = stream;
    }

    stream.getTracks().forEach( track => peerConnection.addTrack( track, stream ) );
  },
  error => console.warn( error.message )
);