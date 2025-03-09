const startButton = document.getElementById("start-game-button")

startButton.addEventListener("click", async () => {
	const res = await fetch("http://localhost:8080/start")
	const j = await res.json()
	window.location.assign("http://localhost:3000/play?port=" + j.data)
})
