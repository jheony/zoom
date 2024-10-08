const messageList = document.querySelector("ul");
const nickForm = document.querySelector("#nick");
const messageForm = document.querySelector("#message");
const socket = new WebSocket(`ws://${window.location.host}`);

function makeMessage(type, payload){
    const msg = {type, payload};
    return JSON.stringify(msg);                             //json을 텍스트 형식으로 변환
}
socket.addEventListener("open", () => {                     //서버 연결
    console.log("Connected to Server");
})

socket.addEventListener("message", (message) => {           //배열에 메시지 추가
    const li = document.createElement("li");
    li.innerText = message.data;
    messageList.append(li);
})

socket.addEventListener("close", ()=> {                     //서버 종료
    console.log("Disconnected from Server");
})

function handleSubmit(event){
    event.preventDefault();                                 //기존 이벤트 방지
    const input = messageForm.querySelector("input");       //메시지 입력칸
    socket.send(makeMessage("new_message", input.value));
    input.value= "";                                        //입력칸 초기화
}

function handleNickSubmit(event){
    event.preventDefault();
    const input = nickForm.querySelector("input");          //닉네임 입력칸
    socket.send(makeMessage("nickname", input.value));
    input.value ="";
}

messageForm.addEventListener("submit",handleSubmit);        //메시지 입력 버튼
nickForm.addEventListener("submit", handleNickSubmit);      //닉네임 입력 버튼