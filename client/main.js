import { Scene } from "./scene.js"

const socket = new WebSocket("ws://localhost:8080/ws")

socket.addEventListener("open", function (event) {
	console.log("Connected to WebSocket server")
})

var gameState = {}
const scene = new Scene("threejs-container")

socket.addEventListener("message", function (event) {
	gameState = JSON.parse(event.data)

	if (scene.commandBuffer.length > 0) {
		console.log("Sending message buffer", scene.commandBuffer)
		socket.send(JSON.stringify(scene.commandBuffer))
		scene.commandBuffer = []
	} else {
		socket.send(JSON.stringify([{ noop: true }]))
	}
	// console.log("Received game state", gameState)

	step()
	// You can handle the incoming message here
})

function step() {
	Object.keys(gameState["players"]).forEach((pId, _) => {
		const playerData = gameState["players"][pId]
		Object.keys(playerData["fighters"]).forEach((key, _) => {
			const fighter = playerData["fighters"][key]
			if (!Object.keys(scene.fighters).includes(pId)) {
				scene.fighters[pId] = {}
			}
			if (scene.fighters[pId][fighter.id] === undefined) {
				scene.addFighter(
					fighter.id,
					pId,
					fighter.type,
					fighter.position.x,
					fighter.position.y,
					fighter.position.z
				)
			} else {
				scene.moveFighter(
					fighter.id,
					pId,
					fighter.position.x,
					fighter.position.y,
					fighter.position.z
				)
			}
		})
	})
}

scene.startAnimationLoop()

// UI interaction: Rotate the cube when the button is clicked
// ADD HOUSE BUTTON
document.getElementById("addHouse").addEventListener("click", () => {
	scene.isBuilding = true
	scene.currentBuildingType = "house"
})
// ADD TOWN HALL BUTTON
document.getElementById("addTownHall").addEventListener("click", () => {
	scene.isBuilding = true
	scene.currentBuildingType = "townhall"
})

// Handle resizing
window.addEventListener("resize", () => {
	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()
	renderer.setSize(window.innerWidth, window.innerHeight)
})

window.addEventListener("mousemove", (event) => {
	scene.mouseX = (event.clientX / window.innerWidth) * 2 - 1
	scene.mouseY = -(event.clientY / window.innerHeight) * 2 + 1
})

window.addEventListener("keydown", (event) => {
	scene.keysPressed[event.key] = true
})

window.addEventListener("keyup", (event) => {
	scene.keysPressed[event.key] = false
})

window.addEventListener("contextmenu", (event) => {
	event.preventDefault()
})

window.addEventListener("mousedown", (event) => {})
