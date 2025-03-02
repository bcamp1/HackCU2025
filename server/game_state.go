package main

import (
	"fmt"
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
	id              int
	gold            float64
	stone           float64
	wood            float64
	primaryTownHall *Building
	fighters        map[EntityID]*Fighter
	builders        map[EntityID]*Builder
	buildings       map[EntityID]*Building
}

func (g *Game) CreatePlayer(id int, townHallLoc GridLocation) Player {
	townHallId := g.newEntityID()
	townHall := &Building{
		Id:           townHallId,
		BuildingType: "townhall",
		Position:     townHallLoc,
		Cost:         Cost{0, 0, 0},
		MaxHealth:    1000,
		Health:       1000,
		Progress:     0,
		BuildTime:    10,
	}

	buildings := make(map[EntityID]*Building)
	buildings[townHallId] = townHall

	p := Player{
		id:              id,
		gold:            0,
		stone:           0,
		wood:            0,
		fighters:        make(map[EntityID]*Fighter),
		builders:        make(map[EntityID]*Builder),
		buildings:       buildings,
		primaryTownHall: townHall,
	}

	g.players[PlayerID(id)] = &p
	return p
}

type Game struct {
	elapsedTime float64
	deceased    []EntityID
	players     map[PlayerID]*Player
	resources   map[EntityID]*Resource
	entityIDs   map[EntityID]struct{}
}

type GameState struct {
	ElapsedTime float64                  `json:"elapsedTime"`
	Deceased    []EntityID               `json:"deceased"`
	Players     map[PlayerID]PlayerState `json:"players"`
	Resources   map[EntityID]Resource    `json:"resources"`
}

type PlayerState struct {
	Id        int                   `json:"id"`
	Gold      float64               `json:"gold"`
	Stone     float64               `json:"stone"`
	Wood      float64               `json:"wood"`
	Fighters  map[EntityID]Fighter  `json:"fighters"`
	Builders  map[EntityID]Builder  `json:"builders"`
	Buildings map[EntityID]Building `json:"buildings"`
}

func (g *Game) AddResources(n int) {
	takenTiles := make(map[GridLocation]struct{})
	minX := -100
	maxX := 100
	minY := -100
	maxY := 100
	location := GridLocation{0, 0}
	for range n {
		chosen := false
		for !chosen {
			x := rand.Intn(maxX-minX) + minX
			y := rand.Intn(maxY-minY) + minY
			location = GridLocation{x, y}
			_, exists := takenTiles[location]
			if !exists {
				chosen = true
			}
		}

		diceRoll := rand.Float64()
		if diceRoll < 0.3 {
			g.createGoldResource(location)
		} else if diceRoll < 0.6 {
			g.createStoneResource(location)
		} else {
			g.createWoodResource(location)
		}
	}
}

func (g *Game) GetState() GameState {
	state := GameState{}
	state.ElapsedTime = g.elapsedTime
	state.Deceased = g.deceased
	state.Players = make(map[PlayerID]PlayerState)
	state.Resources = make(map[EntityID]Resource)

	for eid, resource := range g.resources {
		state.Resources[eid] = *resource
	}

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
			Fighters:  fighters,
			Builders:  builders,
			Buildings: buildings,
		}
	}
	return state
}

func MakeTwoPlayerGame() Game {
	player1TownHall := GridLocation{X: 0, Z: 0}
	player2TownHall := GridLocation{X: 20, Z: 0}

	playerMap := make(map[PlayerID]*Player)
	resources := make(map[EntityID]*Resource)

	g := Game{
		elapsedTime: 0,
		players:     playerMap,
		entityIDs:   make(map[EntityID]struct{}),
		resources:   resources,
	}
	g.CreatePlayer(1, player1TownHall)
	g.CreatePlayer(2, player2TownHall)
	g.AddResources(100)
	return g
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

func (g Game) getNearestResource(position Float3) (*Resource, Float3) {
	minDistance := float64(99999)
	nearestResource := &Resource{}
	nearestResourcePos := Float3{}
	for _, resource := range g.resources {
		resourcePosition := Float3{X: float64(resource.Position.X), Y: 0, Z: float64(resource.Position.Z)}
		distance := resourcePosition.subtract(position).length()
		if distance < minDistance && resource.AllResources() > 0 {
			minDistance = distance
			nearestResource = resource
			nearestResourcePos = resourcePosition
		}
	}
	return nearestResource, nearestResourcePos
}

func (g *Game) deleteEntity(id EntityID) {
	delete(g.entityIDs, id)
	for pid, _ := range g.players {
		delete(g.players[pid].builders, id)
		delete(g.players[pid].fighters, id)
		delete(g.players[pid].buildings, id)
	}

	delete(g.resources, id)
}

func (g *Game) updateBuilder(builder *Builder, player *Player, dt float64) {
	// Check how much they are carrying
	carrying_amount := builder.Gold + builder.Wood + builder.Stone
	//fmt.Println(carrying_amount)
	if carrying_amount >= builderCarryingCapacity {
		// Go back to town hall to deposit
		townHallPosition := player.primaryTownHall.GetPosition()
		builder.GoalPosition = townHallPosition

		// Check if it's in reach
		distanceToTownHall := townHallPosition.subtract(builder.Position).length()
		if distanceToTownHall < builderReach {
			// Deposit resources
			player.gold += builder.Gold
			player.stone += builder.Stone
			player.wood += builder.Wood
			builder.Gold = 0
			builder.Stone = 0
			builder.Wood = 0
		}
	} else {
		// Continue to find resources
		resource, targetPosition := g.getNearestResource(builder.Position)
		builder.ResourceTarget = resource
		builder.GoalPosition = targetPosition

		// See if resource is in reach
		distanceToResource := targetPosition.subtract(builder.Position).length()
		if distanceToResource < builderReach {
			// Mine resource
			mined := min(resource.Gold+resource.Stone+resource.Wood, builderMineSpeed*dt)
			switch resource.ResourceType {
			case "gold":
				builder.Gold += mined
				resource.Gold -= mined
				if resource.Gold <= 1 {
					resource.Gold = 0
				}
			case "stone":
				builder.Stone += mined
				resource.Stone -= mined
				if resource.Stone <= 1 {
					resource.Stone = 0
				}
			case "wood":
				builder.Wood += mined
				resource.Wood -= mined
				if resource.Wood <= 1 {
					resource.Wood = 0
				}
			}
		}
	}
}

func (g *Game) update(dt float64) bool {
	g.elapsedTime += dt
	for _, player := range g.players {
		for _, fighter := range player.fighters {
			updateMovable(fighter, dt)
			if fighter.TargetEntityId != -1 {
				fighter.huntDown(dt)
			} else {
				if fighter.Position.subtract(fighter.GoalPosition).length() == 0 || fighter.Aggro {
					fighter.generalAttack(PlayerID(player.id), dt)
				}
			}
		}
		for _, builder := range player.builders {
			updateMovable(builder, dt)
			g.updateBuilder(builder, player, dt)
		}
	}
	g.getDeceased()
	return true
}

func (g *Game) getClosestEnemy(f *Fighter, playerId PlayerID) EntityID {
	closest := EntityID(-1)
	var closestDistance float64
	for _, player := range g.players {
		if PlayerID(player.id) == playerId {
			continue
		}
		for _, enemy := range player.fighters {
			distance := enemy.Position.subtract(f.Position).length()
			if distance > aggroRadius {
				continue
			}
			if closest < 0 || distance < closestDistance {
				closest = enemy.Id
				closestDistance = distance
			}
		}
		for _, enemy := range player.builders {
			distance := enemy.Position.subtract(f.Position).length()
			if distance > aggroRadius {
				continue
			}
			if closest < 0 || distance < closestDistance {
				closest = enemy.Id
				closestDistance = distance
			}
		}
		for _, enemy := range player.buildings {
			distance := enemy.Position.toFloat3().subtract(f.Position).length()
			if distance > aggroRadius {
				continue
			}
			if closest < 0 || distance < closestDistance {
				closest = enemy.Id
				closestDistance = distance
			}
		}
	}
	return closest
}

func (g *Game) getKillable(id EntityID) Killable {
	for _, player := range g.players {
		if fighter, exists := player.fighters[id]; exists {
			return fighter
		}
		if builder, exists := player.builders[id]; exists {
			return builder
		}
		if building, exists := player.buildings[id]; exists {
			return building
		}
	}
	return nil
}

func (f *Fighter) huntDown(dt float64) {
	target := game.getKillable(f.TargetEntityId)
	if target == nil {
		return
	}
	if target.GetHealth() <= 0 {
		f.TargetEntityId = -1
		return
	}
	if f.Position.subtract(target.GetPosition()).length() <= f.AreaOfAttack {
		if f.TimeTillNextAttack <= 0 {
			target.SetHealth(target.GetHealth() - f.Strength)
			f.TimeTillNextAttack = f.AttackDelay
			fmt.Printf("Fighter %v attacked %v for %v damage\n", f.Id, target.GetHealth(), f.Strength)
			if target.GetHealth() <= 0 {
				f.TargetEntityId = -1
			}
		}

	} else {
		f.SetGoalPosition(target.GetPosition().subtract(Float3{X: .5, Y: .5, Z: .5}))
	}
	f.TimeTillNextAttack -= dt
}

func (f *Fighter) generalAttack(playerId PlayerID, dt float64) {
	closestEnemy := game.getClosestEnemy(f, playerId)
	if closestEnemy < 0 {
		return
	}
	f.TargetEntityId = closestEnemy
	f.huntDown(dt)
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

func (g *Game) getDeceased() {
	deceased := []EntityID{}
	for _, player := range g.players {
		for _, fighter := range player.fighters {
			if fighter.Health <= 0 {
				deceased = append(deceased, fighter.Id)
				g.deleteEntity(fighter.Id)
			}
		}
		for _, builder := range player.builders {
			if builder.Health <= 0 {
				deceased = append(deceased, builder.Id)
				g.deleteEntity(builder.Id)
			}
		}
		for _, building := range player.buildings {
			if building.Health <= 0 {
				deceased = append(deceased, building.Id)
				g.deleteEntity(building.Id)
			}
		}
	}

	for _, resource := range g.resources {
		if resource.AllResources() <= 1 {
			deceased = append(deceased, resource.Id)
			g.deleteEntity(resource.Id)
		}
	}
	g.deceased = deceased

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
