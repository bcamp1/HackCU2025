import { Unit } from "../guys/guys"
import { PlaceBuildingCommand, Scene } from "../scene/scene"
import { Building } from "../structures/building"

export type Player = {
	ip: string
	id: number
	buildings: Building[]
	units: Unit[]
	gold: number
	wood: number
	stone: number
	population: number
	populationCap: number
}

const handlePlaceBuildingCommand = (scene: Scene, command: PlaceBuildingCommand) => {
	return scene.createBuilding(1, 1, command.buildingType, command.pos.x, command.pos.z)
}

export class Game {
	players: Player[] = []
	buildings: Building[] = []
	scene: Scene

	constructor(scene: Scene) {
		this.scene = scene
	}

	gameLoop() {
		while (this.scene.commandBuffer[0]) {
			const curr = this.scene.commandBuffer.pop()
			switch (curr?.type) {
				case 'placeBuilding':
					this.buildings.push(handlePlaceBuildingCommand(this.scene, curr))
					break
			}
		}
	}

}
