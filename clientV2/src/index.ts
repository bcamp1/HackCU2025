const startButton = document.getElementById("start-game-button")

const host = "10.0.0.43"
startButton?.addEventListener("click", async () => {
	const res = await fetch(`http://${host}:8080/join?code=hello`)
	const port = (await res.json()).data
	getGameData(port)
})

const getGameData = (port: string) => {
	console.log("Connecting to server on port", port)
	const socket = new WebSocket(`ws://${host}:8080/${port}`)

	socket.addEventListener("open", function (event: any) {
		console.log("Connected to server", event.data)
	})

	socket.addEventListener("error", function (event) {
		console.error("Error connecting to server", event)
	})

	socket.addEventListener("message", function (event) {
		console.log("event", event)
	})
}
