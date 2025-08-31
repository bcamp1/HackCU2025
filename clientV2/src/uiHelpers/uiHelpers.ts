import { Player } from "../game/game"

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


