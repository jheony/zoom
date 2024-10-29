const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");
const call = document.getElementById("call");

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;

async function getCameras() {
    try{
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind == "videoinput");
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach((camera) => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label == camera.label){
                option.selected = true;     // 화면에 보이는 카메라와 선택된 카메라 일치
            }
            cameraSelect.appendChild(option);
        });
    }catch(e){
        console.log(e);
    }
}
async function getMedia(deviceId) {
    const initialConnstraints = {
        audio: true,
        video: {facingMode: "user"}     // 모바일 환경 전면카메라 선택
    };
    const cameraConstraints = {
        audio: true,
        video: {deviceId: {exact: deviceId}}
    };
    try{
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstraints: initialConnstraints
        );
        myFace.srcObject = myStream;
        if(!deviceId){
            await getCameras();
        }  
    }catch(e){
        console.log(e);
    }
}

function handleMuteClick(){     // 뮤트(음소거) 버튼 클릭 시
    myStream.getAudioTracks().forEach(
        (track) => (track.enabled = !track.enabled)
    );
    if(!muted){    // 토글
        muteBtn.innerText = "Unmute";
        muted = true;
    }else{
        muteBtn.innerText = "Mute";
        muted = false;
    }
}

function handleCameraClick(){   // 카메라 버튼 클릭 시
    myStream.getVideoTracks().forEach(
        (track) => (track.enabled = !track.enabled)
    );
    if(!cameraOff){     // 토글
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    }else{
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    }
}

async function handleCameraChange(){    // 카메라 선택
    await getMedia(cameraSelect.value);
    if(myPeerConnection){
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection
        .getSeders()
        .find((sender) => sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack);
    }
}

muteBtn.addEventListener("click", handleMuteClick);        
cameraBtn.addEventListener("click", handleCameraClick);    
cameraSelect.addEventListener("input", handleCameraChange);

//Welcom Form (join a room)
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

call.hidden = true;

 async function initCall(){  // 입장 후
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}
async function handleWelcomeSubmit(event){    // 입장
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    await initCall();
    socket.emit("join_room", input.value);
    roomName = input.value;
    input.value="";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// Socket Code
socket.on("welcome", async () => {  // offer 송신지 실행
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    console.log("sent the offer");
    socket.emit("offer", offer, roomName);
})

socket.on("offer", async (offer) => {   // offer 수신지 실행
    console.log("received the off");
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
    console.log("sent the answer");
})
socket.on("answer", answer => {     // offer 송신지에서 answer를 받으면 실행 
    console.log("received the answer");
    myPeerConnection.setRemoteDescription(answer);
})
socket.on("ice", ice => {
    console.log("recieved candidate");
    myPeerConnection.addIceCandidate(ice);
});

//RTC Code
function makeConnection(){
    myPeerConnection = new RTCPeerConnection({
        iceServers: [
            {
                urls:[
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.l.google.com:19302",
                    "stun:stun3.l.google.com:19302",
                    "stun:stun4.l.google.com:19302",
                ]
            }
        ]
    });
    
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStream);
    myStream.getTracks()
    .forEach(track => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data){
    console.log("sent candidate");
    socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data){
    const peerFace = document.getElementById("peerFace");
    peerFace.srcObject = data.stream;
}