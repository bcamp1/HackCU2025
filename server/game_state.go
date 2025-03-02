package main

import (
	"math/rand"
)

type GridLocation struct {
	X int `json:"x"`
	Z int `json:"z"`
}

func mapToGridLocation(m map[string]any) GridLocation {
	return GridLocation{
		X: int(m["x"].(float64)),
		Z: int(m["z"].(float64)),
	}
}


type PlayerID int
type EntityID int

type Player struct {
	id        int
	gold      float64
	stone     float64
	wood      float64
	fighters  map[EntityID]*Fighter
	builders  map[EntityID]*Builder
	buildings map[EntityID]*Building
}

func MakePlayer(id int) Player {
	return Player{
		id:        id,
		gold:      0,
		stone:     0,
		wood:      0,
		fighters:  make(map[EntityID]*Fighter),
		builders:  make(map[EntityID]*Builder),
		buildings: make(map[EntityID]*Building),
	}
}

type Game struct {
	elapsedTime float64
	players     map[PlayerID]*Player
	entityIDs   map[EntityID]struct{}
}

type GameState struct {
	ElapsedTime float64 `json:"elapsedTime"`
	Players     map[PlayerID]PlayerState `json:"players"`
}

type PlayerState struct {
	Id        int `json:"id"`
	Gold      float64 `json:"gold"`
	Stone     float64 `json:"stone"`
	Wood      float64 `json:"wood"`
	Fighters  map[EntityID]Fighter `json:"fighters"`
	Builders  map[EntityID]Builder `json:"builders"`
	Buildings map[EntityID]Building `json:"buildings"`
}

func (g *Game) GetState() GameState {
	state := GameState {}
	state.ElapsedTime = g.elapsedTime
	state.Players = make(map[PlayerID]PlayerState)

	for pid, player := range g.players {
		fighters := make(map[EntityID]Fighter)
		builders := make(map[EntityID]Builder)
		buildings := make(map[EntityID]Building)
		for fid, fighter := range player.fighters {
			fighters[fid] = *fighter
		}
		for bid, builder := range player.builders {
			builders[bid] = *builder
		}
		for bid, building := range player.buildings {
			buildings[bid] = *building
		}

		state.Players[pid] = PlayerState{
			Id:        player.id,
			Gold:      player.gold,
			Stone:     player.stone,
			Wood:      player.wood,
			Fighters: fighters,
			Builders: builders,
			Buildings: buildings,
		}
	}
	return state
}

		


func MakeTwoPlayerGame() Game {
	player1 := MakePlayer(1)
	player2 := MakePlayer(2)
	playerMap := make(map[PlayerID]*Player)
	playerMap[1] = &player1
	playerMap[2] = &player2
	return Game{
		elapsedTime: 0,
		players:     playerMap,
		entityIDs:   make(map[EntityID]struct{}),
	}
}

func (g *Game) newEntityID() EntityID {
	for {
		proposedId := EntityID(rand.Intn(1000))
		_, exists := g.entityIDs[proposedId]
		if !exists {
			g.entityIDs[proposedId] = struct{}{}
			return proposedId
		}
	}
}

func (g *Game) deleteEntity(id EntityID) {
	delete(g.entityIDs, id)
	for pid, _ := range g.players {
		delete(g.players[pid].builders, id)
		delete(g.players[pid].fighters, id)
		delete(g.players[pid].buildings, id)
	}
}

func (g *Game) update(dt float64) bool {
	g.elapsedTime += dt
	for _, player := range g.players {
		for _, fighter := range player.fighters {
			updateMovable(fighter, dt)
		}
		for _, builder := range player.builders {
			updateMovable(builder, dt)
		}
	}
	return true
}

func (g *Game) getMovable(id EntityID) Movable {
		for _, player := range g.players {
			fighter, exists := player.fighters[id]
			if exists {
				return fighter
			}
			builder, exists := player.builders[id]
			if exists {
				return builder
			}
		}
	return nil
}

func (g *Game) addGold(player PlayerID, amount float64) {
	g.players[player].gold += amount
}
func (g *Game) addStone(player PlayerID, amount float64) {
	g.players[player].stone += amount
}
func (g *Game) addWood(player PlayerID, amount float64) {
	g.players[player].wood += amount
}

// func main() {
// 	game := MakeTwoPlayerGame()
// 	knight := game.createKnight(Float3{100, 20, 0}, 1)

// 	for {
// 		game.update(0.002)
// 		fmt.Println(*knight)
// 		if game.elapsedTime >= 600 {
// 			knight.SetGoalPosition(Float3{200, 0, 300})
// 		}
// 	}
// }
