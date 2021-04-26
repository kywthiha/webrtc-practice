const usersDiv = document.getElementById('users')
const videoDiv = document.getElementById('video')
const myInfoDiv = document.getElementById('myInfo')
const conversation = {}
var peerConnectionConfig = {
    'iceServers': [
        { 'urls': 'stun:stun.services.mozilla.com' },
        { 'urls': 'stun:stun.l.google.com:19302' },
        { "urls": "stun:stun.ideasip.com" }
    ]
};
let users = []

const baseUrl = 'https://webrtc-peer-to-peer.glitch.me'
const pc = new RTCPeerConnection(peerConnectionConfig);
const socket = io(baseUrl)

const addMyInfoUi = (myInfoDiv, user) => {
    const h3 = document.createElement('h3')
    h3.classList.add('name')
    h3.appendChild(document.createTextNode(`${user.name}`))
    myInfoDiv.appendChild(h3)
}



socket.on('connect', function () {
    const userName = prompt("Enter a name")
    const myUser = {
        name: userName,
        id: socket.id
    }
    socket.emit('join-user', myUser)
    conversation.myUser = myUser
    addMyInfoUi(myInfoDiv, myUser)

});



pc.onicecandidate = (event) => {
    if (event.candidate) {
        socket.emit('signal', { type: "candidate", "data": event.candidate, conversation })
    }
}

const requestVideoAudio = () => (navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}))



const addVideoUi = (videoDiv, stream, classList) => {
    const video = document.createElement('video')
    video.classList.add(classList)
    video.srcObject = stream
    video.addEventListener('loadedmetadata', (res) => {
        video.play()
    })
    videoDiv.appendChild(video)
}





const call = (pc, user) => ((event) => {

    requestVideoAudio().then(stream => {
        conversation.otherUser = user
        addVideoUi(videoDiv, stream, 'myVideo');
        pc.onaddstream = (event) => {
            addVideoUi(videoDiv, event.stream, 'otherVideo');
        };
        pc.addStream(stream);
        pc.createOffer().then(o => {
            pc.setLocalDescription(o)
            socket.emit('signal', { type: "offer", "data": o, conversation })
        })

    })

})



const renderUser = (usersDiv, user) => {
    const div = document.createElement('div')
    div.classList.add('user')
    const button = document.createElement('button')
    button.appendChild(document.createTextNode('Call'))
    button.addEventListener('click', call(pc, user))
    div.appendChild(document.createTextNode(`${user.name}`))
    div.appendChild(button)
    usersDiv.appendChild(div)
}
const signalOffer = (pc, data) => {
    const ans = confirm('Calling.... ' + data.conversation.otherUser.name)
    if (ans) {
        requestVideoAudio().then(stream => {
            console.log(data.conversation)
            conversation.otherUser = data.conversation.myUser
            addVideoUi(videoDiv, stream, 'myVideo');
            pc.onaddstream = (event) => {
                addVideoUi(videoDiv, event.stream, 'otherVideo');
            };
            pc.addStream(stream);

            pc.setRemoteDescription(data.data).then((res) => {
                console.log(res)
                pc.createAnswer().then(a => {
                    pc.setLocalDescription(a)
                    socket.emit('signal', { type: "answer", "data": a, conversation })
                })
            });
        })

    } else {
        alert('Thank You')
    }
}

const signalCandidate = (pc, data) => {
    if (pc && data && data.data)
        pc.addIceCandidate(data.data).then(res => console.log(res))
}

const signalAnswer = (pc, data) => {
    pc.setRemoteDescription(data.data).then(res => {
        console.log(res)
    });
}

socket.on('signal', (data) => {
    switch (data.type) {
        case 'offer': signalOffer(pc, data); break;
        case 'candidate': signalCandidate(pc, data); break;
        case 'answer': signalAnswer(pc, data); break;
    }
});

const userListRenderUI = (users) => {
    usersDiv.innerHTML = "";
    for (let user of users) {
        renderUser(usersDiv, user)
    }
}
socket.on('user-connected', (user) => {
    renderUser(usersDiv, user)
});

socket.on('user-disconnect', (user) => {
    console.log(user)
    users = users.filter(item => item.id !== user.id)
    userListRenderUI(users)
});


fetch(`${baseUrl}/users`).then(res => res.json())
    .then(res => {
        userListRenderUI(res)
    })
