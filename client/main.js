import * as THREE from "three"
import { Scene } from "./scene.js"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"

InitScene()
var gameState = {}

async function InitScene() {
	const models = await loadModels()
	const scene = new Scene("threejs-container", models)
	scene.startAnimationLoop()

	const socket = new WebSocket("ws://localhost:8080/ws")

	socket.addEventListener("open", function (event) {
		console.log("Connected to server", event.data)
	})

	socket.addEventListener("error", function (event) {
		console.error("Error connecting to server", event)
	})
	// UI interaction: Rotate the cube when the button is clicked
	// ADD HOUSE BUTTON
	// ADD HOUSE BUTTON
	const addHouseButton = document.getElementById("addHouse")
	addHouseButton.addEventListener("click", () => {
		scene.isBuilding = true
		scene.currentBuildingType = "house"
	})
	// ADD TOWN HALL BUTTON
	const addTownHallButton = document.getElementById("addTownHall")
	addTownHallButton.addEventListener("click", () => {
		scene.isBuilding = true
		scene.currentBuildingType = "townhall"
	})
	// ADD BARRACKS BUTTON
	const addBarracksButton = document.getElementById("addBarracks")
	addBarracksButton.addEventListener("click", () => {
		scene.isBuilding = true
		scene.currentBuildingType = "barracks"
	})
	const goldDisplay = document.getElementById("gold")
	const woodDisplay = document.getElementById("wood")
	const stoneDisplay = document.getElementById("stone")
	const populationDisplay = document.getElementById("population")

	// Handle resizing
	// window.addEventListener("resize", () => {
	// 	camera.aspect = window.innerWidth / window.innerHeight
	// 	camera.updateProjectionMatrix()
	// 	renderer.setSize(window.innerWidth, window.innerHeight)
	// })

	window.addEventListener("mousemove", (event) => {
		scene.mouseX = (event.clientX / window.innerWidth) * 2 - 1
		scene.mouseY = -(event.clientY / window.innerHeight) * 2 + 1
	})

	window.addEventListener("keydown", (event) => {
		scene.keysPressed[event.key] = true
		if (event.key === "1") {
			scene.moveType = 1
		} else if (event.key === "2") {
			scene.moveType = 0
		}
	})

	window.addEventListener("keyup", (event) => {
		scene.keysPressed[event.key] = false
	})

	window.addEventListener(
		"wheel",
		(event) => {
			console.log(scene.zoom)
			const minZoom = 0.5
			const maxZoom = 3.0
			const zoomSensitivity = 0.001
			event.preventDefault()

			// Adjust zoom based on the vertical scroll amount (deltaY)
			scene.zoom += event.deltaY * zoomSensitivity
			scene.zoom = Math.min(maxZoom, Math.max(minZoom, scene.zoom))
			scene.updateCamera()
		},
		{ passive: false }
	)

	window.addEventListener("contextmenu", (event) => {
		event.preventDefault()
	})

	socket.addEventListener("message", function (event) {
		gameState = JSON.parse(event.data)

		if (scene.commandBuffer.length > 0) {
			socket.send(JSON.stringify(scene.commandBuffer))
			scene.commandBuffer = []
		} else {
			socket.send(JSON.stringify([{ noop: true }]))
		}
		// if we just connected we should get our player id
		if (gameState["playerId"] === undefined) {
			step()
		} else {
			console.log("Game state", gameState)
			scene.playerId = gameState["playerId"]
		}
	})

	function step() {
		const playerData = gameState["players"][scene.playerId]
		goldDisplay.innerText = playerData["gold"]
		woodDisplay.innerText = playerData["wood"]
		stoneDisplay.innerText = playerData["stone"]
		populationDisplay.innerText =
			Object.keys(playerData["fighters"]).length +
			Object.keys(playerData["builders"]).length

		for (let i = 0; i < gameState["deceased"].length; i++) {
			console.log("Removing unit", gameState["deceased"][i])
			scene.removeUnit(gameState["deceased"][i])
		}

		// update the scene
		Object.keys(gameState["players"]).forEach((pId, _) => {
			const playerData = gameState["players"][pId]
			Object.keys(playerData["fighters"]).forEach((key, _) => {
				const fighter = playerData["fighters"][key]
				if (scene.unitsMap[fighter.id] === undefined) {
					scene.addUnit(
						fighter.id,
						pId,
						fighter.unitType,
						fighter.position.x,
						fighter.position.y,
						fighter.position.z
					)
				} else {
					scene.moveUnit(
						fighter.id,
						fighter.position.x,
						fighter.position.y,
						fighter.position.z
					)
				}
				// todo remove fighter if dead
			})
			Object.keys(playerData["buildings"]).forEach((key, _) => {
				const building = playerData["buildings"][key]
				if (scene.buildingsMap[building.id] === undefined) {
					scene.createBuilding(
						building.id,
						pId,
						building.buildingType,
						building.position.x,
						building.position.z
					)
				}
				// todo remove building if dead
			})
			Object.keys(playerData["builders"]).forEach((key, _) => {
				const builder = playerData["builders"][key]
				if (scene.unitsMap[builder.id] === undefined) {
					scene.addUnit(
						builder.id,
						pId,
						"builder",
						builder.position.x,
						builder.position.y,
						builder.position.z
					)
				} else {
					scene.moveUnit(
						builder.id,
						builder.position.x,
						builder.position.y,
						builder.position.z
					)
				}
				// todo remove building if dead
			})
		})
	}
}

async function loadModels() {
	var modelsDict = {}
	const houseModel = await loadModel(
		"public/models/buildings/house/house_full.glb"
	)
	const townhallModel = await loadModel(
		"public/models/buildings/townhall/townhall_full.glb"
	)
	const barracksModel = await loadModel(
		"public/models/buildings/barracks/barracks_full.glb"
	)
	modelsDict.house = houseModel
	modelsDict.townhall = townhallModel
	modelsDict.barracks = barracksModel

	return modelsDict
}

async function loadModel(path) {
	const loader = new GLTFLoader()

	return new Promise((resolve, reject) => {
		loader.load(
			path,
			(gltf) => {
				let model = gltf.scene
				model.rotation.x = -Math.PI / 2

				model.traverse((child) => {
					if (child.isMesh) {
						const edges = new THREE.EdgesGeometry(child.geometry)
						const lineMaterial = new THREE.LineBasicMaterial({
							color: 0x000000,
							linewidth: 10,
						})
						const outline = new THREE.LineSegments(edges, lineMaterial)
						child.userData.outline = outline
						child.add(outline)
						child.castShadow = true
					}
				})
				console.log("Model loaded")
				resolve(model)
			},
			undefined,
			(error) => {
				console.error("Found an error", error)
				reject(error)
			}
		)
	})
}
