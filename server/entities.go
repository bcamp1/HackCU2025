package main

type Movable interface {
	GetGoalPosition() Float3
	SetGoalPosition(Float3)
	GetPosition() Float3
	SetPosition(Float3)
	GetSpeed() float64
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

type Fighter struct {
	id           EntityID
	fighterType  string
	position     Float3
	goalPosition Float3
	strength     float64
	speed        float64
	areaOfAttack float64
	maxHealth    float64
	health       float64
}

func (g *Game) createKnight(position Float3, id PlayerID) *Fighter {
	entityId := g.newEntityID()

	knight := &Fighter{
		id:           entityId,
		fighterType:  "knight",
		position:     position,
		goalPosition: position,
		strength:     40,
		areaOfAttack: 10,
		speed:        1,
		health:       100,
		maxHealth:    100,
	}
	g.players[id].fighters[entityId] = knight
	return knight
}

func (f *Fighter) GetPosition() Float3 {
	return f.position
}

func (f *Fighter) GetSpeed() float64 {
	return f.speed
}

func (f *Fighter) GetGoalPosition() Float3 {
	return f.goalPosition
}

func (f *Fighter) SetPosition(p Float3) {
	f.position = p
}

func (f *Fighter) SetGoalPosition(p Float3) {
	f.goalPosition = p
}

const builderSpeed float64 = 1
const builderMaxHealth float64 = 100

type Builder struct {
	id           EntityID
	position     Float3
	goalPosition Float3
	gold         float64
	stone        float64
	wood         float64
	health       float64
}

func (b *Builder) GetPosition() Float3 {
	return b.position
}

func (b *Builder) GetSpeed() float64 {
	return builderSpeed
}

func (b *Builder) GetGoalPosition() Float3 {
	return b.goalPosition
}

func (b *Builder) SetPosition(p Float3) {
	b.position = p
}

func (b *Builder) SetGoalPosition(p Float3) {
	b.goalPosition = p
}

// Building types
// house, townhall, barracks, mine
type Building struct {
	id           EntityID
	buildingType string
	position     GridLocation
	size         Float3
	maxHealth    float64
	health       float64
	progress     float64
	buildTime    float64
}
