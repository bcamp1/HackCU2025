package main

import (
	"math/rand"
)

type GridLocation struct {
	x int
	y int
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

func (g *Game) update(dt float64) {
	g.elapsedTime += dt
	for _, player := range g.players {
		for _, fighter := range player.fighters {
			updateMovable(fighter, dt)
		}
		for _, builder := range player.builders {
			updateMovable(builder, dt)
		}
	}
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
