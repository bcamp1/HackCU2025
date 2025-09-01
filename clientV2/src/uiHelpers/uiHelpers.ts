import { Player } from "../game/game"
import { Scene } from "../scene/scene"

export function setResourceDisplay(player: Player, resource: "wood" | "stone" | "gold") {
	const woodDisplay = document.getElementById(resource)
	if (woodDisplay) woodDisplay.innerText = `${player[resource]}`
}

export function setPopulationDisplay(player: Player) {
	const populationDisplay = document.getElementById("population")
	if (populationDisplay) populationDisplay.innerText = `${player.population} / ${player.populationCap}`
}

export function initialiazePlayerDisplay(player: Player) {
	setResourceDisplay(player, 'stone')
	setResourceDisplay(player, 'wood')
	setResourceDisplay(player, 'gold')
	setPopulationDisplay(player)
	const playerLabel = document.getElementById("player-label")
	if (playerLabel) playerLabel.innerText = `Player ${player.id}`
}

export function initializeControlButtons(scene: Scene) {
	// ADD HOUSE BUTTON
	const addHouseButton = document.getElementById("addHouse")
	addHouseButton?.addEventListener("click", () => {
		scene.isBuilding = true
		scene.currentBuildingType = "house"
	})
	// ADD TOWN HALL BUTTON
	const addTownHallButton = document.getElementById("addTownHall")
	addTownHallButton?.addEventListener("click", () => {
		scene.isBuilding = true
		scene.currentBuildingType = "townhall"
	})
	// ADD BARRACKS BUTTON
	const addBarracksButton = document.getElementById("addBarracks")
	addBarracksButton?.addEventListener("click", () => {
		scene.isBuilding = true
		scene.currentBuildingType = "barracks"
	})

	const addKnight = document.getElementById("addKnight")
	addKnight?.addEventListener("click", () => {
		// TODO: 
		//scene.commandBuffer.push({ createKnight: { some: "knight" } })
	})
	const addWorker = document.getElementById("addWorker")
	addWorker?.addEventListener("click", () => {
		//scene.commandBuffer.push({ createBuilder: { some: "builder" } })
	})
}


