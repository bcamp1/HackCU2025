package main

type Movable interface {
	GetGoalPosition() Float3
	SetGoalPosition(Float3)
	GetPosition() Float3
	SetPosition(Float3)
	GetSpeed() float64
}

type Killable interface {
	GetHealth() float64
	SetHealth(float64)
	GetPosition() Float3
}

func updateMovable(m Movable, dt float64) {
	// Move movable entity towards goal location
	speed := m.GetSpeed()
	position := m.GetPosition()
	goalPosition := m.GetGoalPosition()
	delta := goalPosition.subtract(position)
	distanceToMove := speed * dt
	if delta.length() <= distanceToMove {
		// We've hit the goal
		m.SetPosition(goalPosition)
	} else {
		// We're getting closer to the goal
		delta_norm := delta.normalize()
		moveVector := delta_norm.scale(distanceToMove)
		newPosition := position.add(moveVector)
		m.SetPosition(newPosition)
	}
}

const aggroRadius float64 = 10
type Fighter struct {
	Id           EntityID `json:"id"`
	UnitType  string  `json:"unitType"`
	Position     Float3 `json:"position"`
	GoalPosition Float3 `json:"goalPosition"`
	TargetEntityId        EntityID `json:"targetEntityId"`
	Aggro        bool `json:"aggro"`
	Strength     float64 `json:"strength"`
	Speed        float64 `json:"speed"`
	TimeTillNextAttack float64 `json:"timeTillNextAttack"`
	AreaOfAttack float64 `json:"areaOfAttack"`
	AttackDelay  float64 `json:"attackSpeed"`
	MaxHealth    float64 `json:"maxHealth"`
	Health       float64 `json:"health"`
}

func (g *Game) createKnight(position Float3, id PlayerID) *Fighter {
	entityId := g.newEntityID()

	knight := &Fighter{
		Id:           entityId,
		UnitType:  "knight",
		Position:     position,
		GoalPosition: position,
		Strength:     10,
		AreaOfAttack: 1,
		AttackDelay:  1,
		Aggro: 	  false,
		TimeTillNextAttack: 0,
		TargetEntityId:     -1,
		Speed:              1,
		Health:             100,
		MaxHealth:          100,
	}
	g.players[id].fighters[entityId] = knight
	return knight
}

func (f *Fighter) GetPosition() Float3 {
	return f.Position
}

func (f *Fighter) GetSpeed() float64 {
	return f.Speed
}

func (f *Fighter) GetGoalPosition() Float3 {
	return f.GoalPosition
}

func (f *Fighter) SetPosition(p Float3) {
	f.Position = p
}

func (f *Fighter) SetGoalPosition(p Float3) {
	f.GoalPosition = p
}

func (f *Fighter) GetHealth() float64 {
	return f.Health
}

func (f *Fighter) SetHealth(h float64) {
	if h > f.MaxHealth {
		h = f.MaxHealth
	}
	f.Health = h
}

func (g *Game) getClosestEnemy(f *Fighter, playerId PlayerID) *Fighter {
	var closest *Fighter
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
			if closest == nil || distance < closestDistance {
				closest = enemy
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
			if target.GetHealth() <= 0 {
				f.TargetEntityId = -1
			}
		}

	} else {
		f.SetGoalPosition(target.GetPosition().subtract(Float3{X: .5, Y: .5, Z: .5}))
	}
	f.TimeTillNextAttack -= dt
}

func (f *Fighter) generalAttack(dt float64) {
	closestEnemy := game.getClosestEnemy(f, 1)
	if(closestEnemy == nil) {
		return
	}
	f.TargetEntityId = closestEnemy.Id
	f.huntDown(dt)
}

const builderSpeed float64 = 1
const builderMaxHealth float64 = 100

type Builder struct {
	Id           EntityID `json:"id"`
	Position     Float3   `json:"position"`
	UnitType     string   `json:"unitType"`
	GoalPosition Float3   `json:"goalPosition"`
	Gold         float64  `json:"gold"`
	Stone        float64  `json:"stone"`
	Wood         float64  `json:"wood"`
	Health       float64  `json:"health"`
}

func (g *Game) createBuilder(position Float3, id PlayerID) *Builder {
	entityId := g.newEntityID()
	builder := &Builder{
		Id:           entityId,
		Position:     position,
		GoalPosition: position,
		Gold:         0,
		Stone:        0,
		Wood:         0,
		Health:       builderMaxHealth,
	}
	g.players[id].builders[entityId] = builder
	return builder
}

func (b *Builder) GetPosition() Float3 {
	return b.Position
}

func (b *Builder) GetSpeed() float64 {
	return builderSpeed
}

func (b *Builder) GetGoalPosition() Float3 {
	return b.GoalPosition
}

func (b *Builder) SetPosition(p Float3) {
	b.Position = p
}

func (b *Builder) SetGoalPosition(p Float3) {
	b.GoalPosition = p
}

func (b *Builder) GetHealth() float64 {
	return b.Health
}

func (b *Builder) SetHealth(h float64) {
	b.Health = max(h, builderMaxHealth)
}

// Building types
// house, townhall, barracks, mine
type Cost struct {
	Gold  float64 `json:"gold"`
	Stone float64 `json:"stone"`
	Wood  float64 `json:"wood"`
}
type Building struct {
	Id           EntityID     `json:"id"`
	BuildingType string       `json:"buildingType"`
	Position     GridLocation `json:"position"`
	// Size         Float3      `json:"size"`
	Cost      Cost    `json:"cost"`
	MaxHealth float64 `json:"maxHealth"`
	Health    float64 `json:"health"`
	Progress  float64 `json:"progress"`
	BuildTime float64 `json:"buildTime"`
}

func (b *Building) GetHealth() float64 {
	return b.Health
}

func (b *Building) SetHealth(h float64) {
	b.Health = max(h, b.MaxHealth)
}

func (b *Building) GetPosition() Float3 {
	return Float3{X: float64(b.Position.X), Y: 0, Z: float64(b.Position.Z)}
}

func (p *Player) canAfford(cost *Cost) bool {
	return p.gold >= cost.Gold && p.stone >= cost.Stone && p.wood >= cost.Wood
}

func (p *Player) payCost(cost *Cost) {
	p.gold -= cost.Gold
	p.stone -= cost.Stone
	p.wood -= cost.Wood
}

func (g *Game) createHouse(position GridLocation, playerId PlayerID) *Building {
	cost := &Cost{Gold: 100, Stone: 0, Wood: 50}
	player := g.players[playerId]
	if !player.canAfford(cost) {
		return nil
	}
	player.payCost(cost)

	entityId := g.newEntityID()
	building := &Building{
		Id:           entityId,
		BuildingType: "house",
		Position:     position,
		MaxHealth:    500,
		Cost:         *cost,
		Health:       500,
		Progress:     0,
		BuildTime:    10,
	}
	g.players[playerId].buildings[entityId] = building
	return building
}

func (g *Game) createTownHall(position GridLocation, playerId PlayerID) *Building {
	cost := &Cost{Gold: 500, Stone: 400, Wood: 200}
	player := g.players[playerId]
	if !player.canAfford(cost) {
		return nil
	}
	player.payCost(cost)

	entityId := g.newEntityID()
	building := &Building{
		Id:           entityId,
		BuildingType: "townhall",
		Position:     position,
		Cost:         *cost,
		MaxHealth:    1000,
		Health:       1000,
		Progress:     0,
		BuildTime:    10,
	}
	g.players[playerId].buildings[entityId] = building
	return building
}

func (g *Game) createBarracks(position GridLocation, playerId PlayerID) *Building {
	cost := &Cost{Gold: 100, Stone: 100, Wood: 50}
	player := g.players[playerId]
	if !player.canAfford(cost) {
		return nil
	}
	player.payCost(cost)

	entityId := g.newEntityID()
	building := &Building{
		Id:           entityId,
		BuildingType: "barracks",
		Position:     position,
		MaxHealth:    500,
		Cost:         *cost,
		Health:       500,
		Progress:     0,
		BuildTime:    10,
	}
	g.players[playerId].buildings[entityId] = building
	return building
}

// Resource types
// 'gold', 'stone', 'wood'
type Resource struct {
	Id           EntityID     `json:"id"`
	ResourceType string       `json:"resourceType"`
	Position     GridLocation `json:"position"`
	Gold         float64      `json:"gold"`
	Stone        float64      `json:"stone"`
	Wood         float64      `json:"wood"`
}

func (g *Game) createGoldResource(position GridLocation) *Resource {
	entityId := g.newEntityID()
	resource := &Resource{
		Id:           entityId,
		ResourceType: "gold",
		Position:     position,
		Gold:         1000,
		Stone:        0,
		Wood:         0,
	}
	g.resources[entityId] = resource
	return resource
}

func (g *Game) createStoneResource(position GridLocation) *Resource {
	entityId := g.newEntityID()
	resource := &Resource{
		Id:           entityId,
		ResourceType: "stone",
		Position:     position,
		Gold:         0,
		Stone:        1000,
		Wood:         0,
	}
	g.resources[entityId] = resource
	return resource
}

func (g *Game) createWoodResource(position GridLocation) *Resource {
	entityId := g.newEntityID()
	resource := &Resource{
		Id:           entityId,
		ResourceType: "wood",
		Position:     position,
		Gold:         0,
		Stone:        0,
		Wood:         100,
	}
	g.resources[entityId] = resource
	return resource
}
