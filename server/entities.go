package main

type Movable interface {
	GetGoalPosition() Float3
	SetGoalPosition(Float3)
	GetPosition() Float3
	SetPosition(Float3)
	GetSpeed() float64
	SetAggro(bool)
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
	Id                 EntityID `json:"id"`
	UnitType           string   `json:"unitType"`
	Position           Float3   `json:"position"`
	GoalPosition       Float3   `json:"goalPosition"`
	TargetEntityId     EntityID `json:"targetEntityId"`
	Aggro              bool     `json:"aggro"`
	Strength           float64  `json:"strength"`
	Speed              float64  `json:"speed"`
	TimeTillNextAttack float64  `json:"timeTillNextAttack"`
	AreaOfAttack       float64  `json:"areaOfAttack"`
	AttackDelay        float64  `json:"attackSpeed"`
	MaxHealth          float64  `json:"maxHealth"`
	Health             float64  `json:"health"`
}

func (g *Game) createKnight(position Float3, id PlayerID) *Fighter {
	entityId := g.newEntityID()

	knight := &Fighter{
		Id:                 entityId,
		UnitType:           "knight",
		Position:           position,
		GoalPosition:       position,
		Strength:           10,
		AreaOfAttack:       1,
		AttackDelay:        1,
		Aggro:              false,
		TimeTillNextAttack: 0,
		TargetEntityId:     -1,
		Speed:              1,
		Health:             100,
		MaxHealth:          100,
	}
	g.players[id].fighters[entityId] = knight
	return knight
}

func (g *Game) getFighter(id EntityID) *Fighter {
	for _, player := range g.players {
		if fighter, ok := player.fighters[id]; ok {
			return fighter
		}
	}
	return nil
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

func (f *Fighter) SetAggro(a bool) {
	f.Aggro = a
}

func (f *Fighter) SetHealth(h float64) {
	if h > f.MaxHealth {
		h = f.MaxHealth
	}
	f.Health = h
}

const builderSpeed float64 = 1
const builderMaxHealth float64 = 100
const builderCarryingCapacity = 20
const builderReach = 0.5
const builderMineSpeed = 1

type Builder struct {
	Id             EntityID  `json:"id"`
	Position       Float3    `json:"position"`
	UnitType       string    `json:"unitType"`
	GoalPosition   Float3    `json:"goalPosition"`
	Gold           float64   `json:"gold"`
	Stone          float64   `json:"stone"`
	Wood           float64   `json:"wood"`
	Aggro          bool      `json:"aggro"`
	Health         float64   `json:"health"`
	MaxHealth      float64   `json:"max_health"`
	ResourceTarget *Resource `json:"resource_target"`
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
		Aggro:        false,
		Health:       builderMaxHealth,
		MaxHealth:    builderMaxHealth,
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

func (b *Builder) SetAggro(a bool) {
	b.Aggro = a
}

func (b *Builder) SetHealth(h float64) {
	if h > b.MaxHealth {
		h = b.MaxHealth
	}
	b.Health = h
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
	Cost        Cost    `json:"cost"`
	MaxHealth   float64 `json:"maxHealth"`
	Health      float64 `json:"health"`
	Progress    float64 `json:"progress"`
	Cooldown    float64 `json:"cooldown"`
	MaxCooldown float64 `json:"maxCooldown"`
}

func (b *Building) GetHealth() float64 {
	return b.Health
}

func (b *Building) SetHealth(h float64) {
	if h > b.MaxHealth {
		h = b.MaxHealth
	}
	b.Health = h
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
		Cooldown:     0,
		MaxCooldown:  10,
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
		Cooldown:     0,
		MaxCooldown:  0,
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
		Cooldown:     10,
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

func (r Resource) AllResources() float64 {
	return r.Gold + r.Stone + r.Wood
}

func (g *Game) createGoldResource(position GridLocation) *Resource {
	entityId := g.newEntityID()
	resource := &Resource{
		Id:           entityId,
		ResourceType: "gold",
		Position:     position,
		Gold:         300,
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
		Stone:        300,
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
