console.log("LOBBY")

const startButton = document.getElementById("start-game-button")
const gameIdLabel = document.getElementById("game-id-label")
const playerList = document.getElementById("player-list")

const host = "10.0.0.43"

// Get params
const urlSearchParams = new URLSearchParams(window.location.search)
const gameCode = urlSearchParams.get('gameCode').toUpperCase();
const playerName = urlSearchParams.get('name');
gameIdLabel.innerText = `Code: ${gameCode}`

console.log(gameIdLabel)
console.log(startButton)
console.log(gameCode)
console.log(playerName)

// Render Player List
playerNames = ['Steven', 'Jeff', 'Jordan', 'Mike']

// Websocket
const ws = new WebSocket(`ws://${host}:8080/join?gameCode=${gameCode}&name=${playerName}`)

ws.addEventListener('message', (event) => {
	data = JSON.parse(event.data)
	console.log(data)
	playerNames = data.names ?? []
	console.log(playerNames)

	while (playerList.firstChild) {
		playerList.removeChild(playerList.lastChild);
	}

	playerNames.forEach(element => {
		playerText = document.createElement("p");
		playerText.innerText = element
		playerList.appendChild(playerText)
	})
})

startButton?.addEventListener("click", async () => {
	// TODO
})