function toRadians(degrees) {
    return degrees * Math.PI / 180;
}
function collidesWith(rect1, rect2) {
    return rect1.x - rect1.bbox.width / 2 < rect2.x - rect2.bbox.width / 2 + rect2.bbox.width && rect1.x - rect1.bbox.width / 2 + rect1.bbox.width > rect2.x + rect2.bbox.width && rect1.y - rect1.bbox.height / 2 < rect2.y - rect2.bbox.height / 2 + rect2.bbox.height && rect1.bbox.height + rect1.y - rect1.bbox.height / 2 > rect2.y - rect2.bbox.height / 2;
}
function physicalUpdate(physical) {
    physical.x += physical.vx;
    physical.y += physical.vy;
}
function asteroidEntity(asteroid, onSpawnAsteroid) {
    return {
        id: "asteroid",
        stale: false,
        bbox: {
            width: asteroid.width,
            height: asteroid.height
        },
        ...asteroid,
        render (ctx) {
            ctx.strokeStyle = "white";
            ctx.strokeRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        },
        update (_isPressed) {
            if (this.height * this.width < 400) this.stale = true;
            physicalUpdate(this);
        },
        onCollisionWith (entity) {
            if (entity.id === "bullet") {
                const dx = this.vx;
                const dy = this.vy;
                const asteroidLeft = {
                    ...this,
                    width: this.height / Math.sqrt(2),
                    height: this.width / Math.sqrt(2),
                    vx: dx,
                    vy: -dy
                };
                const asteroidRight = {
                    ...this,
                    width: this.width / Math.sqrt(2),
                    height: this.height / Math.sqrt(2),
                    vx: -dx,
                    vy: dy
                };
                this.stale = true;
                onSpawnAsteroid(asteroidLeft);
                onSpawnAsteroid(asteroidRight);
            }
        }
    };
}
function bulletEntity(bullet) {
    const spawnTime = Date.now();
    return {
        id: "bullet",
        stale: false,
        ...bullet,
        bbox: {
            height: 3,
            width: 3
        },
        render (ctx) {
            ctx.fillStyle = "white";
            ctx.fillRect(this.x - 1, this.y - 1, 3, 3);
        },
        update (isPressed) {
            physicalUpdate(this);
            if (Date.now() - spawnTime > 1000) this.stale = true;
        },
        onCollisionWith (entity) {
            if (entity.id === "asteroid") this.stale = true;
        }
    };
}
function shipEntity(ship, onCreateBullet) {
    return {
        id: "ship",
        stale: false,
        ...ship,
        bbox: {
            width: 30,
            height: 35
        },
        render (ctx) {
            drawTriangle(ctx, "white", this.x, this.y, 30, 35, this.theta);
        },
        update (isPressed) {
            const cosine = Math.cos(toRadians(this.theta - 90));
            const sine = Math.sin(toRadians(this.theta - 90));
            if (isPressed(Key1.LEFT)) this.theta = (this.theta - 5) % 360;
            if (isPressed(Key1.RIGHT)) this.theta = (this.theta + 5) % 360;
            if (isPressed(Key1.UP)) {
                this.vx += cosine * this.speed;
                this.vy += sine * this.speed;
            }
            if (isPressed(Key1.DOWN)) {
                this.vx -= cosine * this.speed;
                this.vy -= sine * this.speed;
            }
            this.vx *= 1 - this.friction;
            this.vy *= 1 - this.friction;
            if (isPressed(Key1.SPACE)) onCreateBullet({
                x: this.x + cosine * 30 / 2,
                y: this.y + sine * 35 / 2,
                vx: this.vx + cosine * 10,
                vy: this.vy + sine * 10
            });
            physicalUpdate(this);
        },
        onCollisionWith (other) {
        }
    };
}
var Key1;
(function(Key) {
    Key[Key["LEFT"] = 0] = "LEFT";
    Key[Key["RIGHT"] = 1] = "RIGHT";
    Key[Key["UP"] = 2] = "UP";
    Key[Key["DOWN"] = 3] = "DOWN";
    Key[Key["SPACE"] = 4] = "SPACE";
})(Key1 || (Key1 = {
}));
function isPressed1(keyStates, key) {
    return keyStates[key] ?? false;
}
const basicControlScheme = (keyStates, key)=>{
    if (key === Key1.LEFT) return isPressed1(keyStates, "a") || isPressed1(keyStates, "ArrowLeft");
    if (key === Key1.RIGHT) return isPressed1(keyStates, "d") || isPressed1(keyStates, "ArrowRight");
    if (key === Key1.DOWN) return isPressed1(keyStates, "s") || isPressed1(keyStates, "ArrowDown");
    if (key === Key1.UP) return isPressed1(keyStates, "w") || isPressed1(keyStates, "ArrowUp");
    if (key === Key1.SPACE) return isPressed1(keyStates, "Spacebar") || isPressed1(keyStates, " ");
    return false;
};
function onKeyStateChange(keyStates, onEventValue) {
    return (e)=>{
        keyStates[e.key] = onEventValue;
    };
}
function loop(timeStepMs, update) {
    const i = setInterval(()=>{
        if (update()) clearInterval(i);
    }, timeStepMs);
    return i;
}
function withContext(context, fn) {
    const oldStyle = context.fillStyle;
    const oldStroke = context.strokeStyle;
    fn(context);
    context.fillStyle = oldStyle;
    context.strokeStyle = oldStroke;
}
function drawTriangle(context, style, x, y, base, height, rotation) {
    const angle = rotation * Math.PI / 180;
    context.translate(x, y);
    context.rotate(angle);
    withContext(context, ()=>{
        context.strokeStyle = style;
        context.fillStyle = "red";
        context.beginPath();
        context.moveTo(-base / 2, height / 2);
        context.lineTo(0, -height / 2);
        context.lineTo(0 + base / 2 + 1, height / 2);
        context.lineTo(-base / 2, height / 2);
        context.stroke();
    });
    context.rotate(-angle);
    context.translate(-x, -y);
}
function clear(canvas, context1) {
    withContext(context1, (context)=>{
        context.fillStyle = "black";
        context.fillRect(0, 0, canvas.width, canvas.height);
    });
}
function game(controlScheme) {
    const canvas = document.getElementById("asteroids-canvas");
    if (canvas === null) return;
    const ctx1 = canvas.getContext("2d");
    if (ctx1 === null) return;
    const keyStates = {
    };
    document.onkeydown = onKeyStateChange(keyStates, true);
    document.onkeyup = onKeyStateChange(keyStates, false);
    const physicsManager = {
        entities: [],
        nextEntities: [],
        add (entity) {
            this.nextEntities.push(entity);
        },
        update () {
            for(let entity = 0; entity < this.entities.length; ++entity){
                for(let otherEntity = 0; otherEntity < this.entities.length; ++otherEntity){
                    if (otherEntity === entity) continue;
                    if (!this.entities[entity].stale && !this.entities[otherEntity].stale && collidesWith(this.entities[entity], this.entities[otherEntity])) {
                        this.entities[entity].onCollisionWith(this.entities[otherEntity]);
                        this.entities[otherEntity].onCollisionWith(this.entities[entity]);
                    }
                }
                if (!this.entities[entity].stale) this.nextEntities.push(this.entities[entity]);
            }
            this.entities = this.nextEntities;
            this.nextEntities = [];
        }
    };
    const entityManager = {
        entities: [],
        nextEntities: [],
        render (ctx2) {
            for (const entity of this.entities)withContext(ctx2, (ctx)=>entity.render(ctx)
            );
        },
        update (isPressed) {
            for (const entity of this.entities){
                entity.update(isPressed);
                entity.x = (entity.x + 600) % 600;
                entity.y = (entity.y + 600) % 600;
                if (!entity.stale) this.nextEntities.push(entity);
            }
            this.entities = this.nextEntities;
            this.nextEntities = [];
        },
        spawn (entity) {
            this.nextEntities.push(entity);
        }
    };
    const gun = {
        lastTime: 0,
        fire (bullet) {
            const currentTime = Date.now();
            if (currentTime - this.lastTime > 300) {
                createPhysical(bulletEntity(bullet));
                this.lastTime = currentTime;
            }
        }
    };
    const createPhysical = (e)=>{
        entityManager.spawn(e);
        physicsManager.add(e);
    };
    createPhysical(shipEntity({
        x: 300,
        y: 300,
        vx: 0,
        vy: 0,
        speed: 0.3,
        theta: 0,
        friction: 0.02
    }, (bullet)=>gun.fire(bullet)
    ));
    const spawnAsteroid = (asteroid)=>{
        createPhysical(asteroidEntity(asteroid, spawnAsteroid));
    };
    for(let i = 0; i < 5; ++i)spawnAsteroid({
        x: Math.random() * 600,
        y: Math.random() * 600,
        vx: Math.random() * 4 - 2,
        vy: Math.random() * 4 - 2,
        width: Math.random() * 40 + 35,
        height: Math.random() * 40 + 35
    });
    loop(20, ()=>{
        clear(canvas, ctx1);
        entityManager.render(ctx1);
        physicsManager.update();
        entityManager.update((key)=>controlScheme(keyStates, key)
        );
        return false;
    });
}
game(basicControlScheme);

//# sourceMappingURL=index.fb5312c9.js.map
