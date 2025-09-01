import { Game, Player } from "./game";

export function initPlayer(game: Game): Player {
	const player: Player = {
		ip: '',
		buildings: [],
		units: [],
		id: game.players.length + 1,
		stone: 500,
		gold: 500,
		wood: 500,
		population: 0,
		populationCap: 10
	}
	game.players.push(player)
	return player
}
