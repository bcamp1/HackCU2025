const startButton = document.getElementById("start-game-button")
const gameIdLabel = document.getElementById("game-id-label")
const playerList = document.getElementById("player-list")

const host = "10.0.0.100"

// Get params
const urlSearchParams = new URLSearchParams(window.location.search)
const gameCode = urlSearchParams?.get("gameCode")?.toUpperCase()
const playerName = urlSearchParams.get("name")
if (gameIdLabel) gameIdLabel.innerText = `Code: ${gameCode}`

console.log(gameIdLabel)
console.log(startButton)
console.log(gameCode)
console.log(playerName)

// Render Player List
let playerNames = ["Steven", "Jeff", "Jordan", "Mike"]

// Websocket
const ws = new WebSocket(
	`ws://${host}:8080/join?gameCode=${gameCode}&name=${playerName}`
)

ws.addEventListener("message", (event) => {
	// data can be {names: string[]} or {start: bool; portNumber: number}
	const data = JSON.parse(event.data)
	if (data.names) {
		playerNames = data.names ?? []

		while (playerList?.firstChild) {
			if (playerList.lastChild) playerList.removeChild(playerList.lastChild)
		}

		playerNames.forEach((element) => {
			const playerText = document.createElement("p")
			playerText.innerText = element
			playerList?.appendChild(playerText)
		})
	}
	if (data.start) {
		const portNumber = data.portNumber
		window.history.pushState({}, "", `/play?portNumber=${portNumber}`) // this doesn't automatically fetch new page
		window.location.reload()
	}
})

startButton?.addEventListener("click", async () => {
	const startMsg = JSON.stringify({ start: true })
	ws.send(startMsg)
})
