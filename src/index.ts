function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

type Entity = {
  id: string;
  stale: boolean;
  render(ctx: CanvasRenderingContext2D): void;
  update(isPressed: (key: Key) => boolean): void;
};

type Collides = Physical & {
  bbox: {
    width: number;
    height: number;
  };
  onCollisionWith(entity: Entity): void;
};

function collidesWith(rect1: Collides, rect2: Collides): boolean {
  return (
    rect1.x - rect1.bbox.width / 2 < rect2.x - rect2.bbox.width / 2 + rect2.bbox.width &&
    rect1.x - rect1.bbox.width / 2 + rect1.bbox.width > rect2.x + rect2.bbox.width &&
    rect1.y - rect1.bbox.height / 2 < rect2.y - rect2.bbox.height / 2 + rect2.bbox.height &&
    rect1.bbox.height + rect1.y - rect1.bbox.height / 2 > rect2.y - rect2.bbox.height / 2
  );
}

type Physical = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

type Bounded = {
  width: number;
  height: number;
};

function physicalUpdate(physical: Physical) {
  physical.x += physical.vx;
  physical.y += physical.vy;
}

type Asteroid = Physical & Bounded;
type Bullet = Physical;

function asteroidEntity(
  asteroid: Asteroid,
  onSpawnAsteroid: (asteroid: Asteroid) => void
): Entity & Asteroid & Collides {
  return {
    id: "asteroid",
    stale: false,
    bbox: {
      width: asteroid.width,
      height: asteroid.height,
    },
    ...asteroid,
    render(ctx: CanvasRenderingContext2D) {
      ctx.strokeStyle = "white";
      ctx.strokeRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    },
    update(_isPressed) {
      if (this.height * this.width < 400) {
        this.stale = true;
      }
      physicalUpdate(this);
    },
    onCollisionWith(entity) {
      if (entity.id === "bullet") {
        const dx = this.vx;
        const dy = this.vy;

        const asteroidLeft: Asteroid = {
          ...this,
          width: this.height / Math.sqrt(2),
          height: this.width / Math.sqrt(2),
          vx: dx,
          vy: -dy,
        };
        const asteroidRight: Asteroid = {
          ...this,
          width: this.width / Math.sqrt(2),
          height: this.height / Math.sqrt(2),
          vx: -dx,
          vy: dy,
        };
        this.stale = true;
        onSpawnAsteroid(asteroidLeft);
        onSpawnAsteroid(asteroidRight);
      }
    },
  };
}

function bulletEntity(bullet: Bullet): Entity & Bullet & Collides {
  const spawnTime = Date.now();
  return {
    id: "bullet",
    stale: false,
    ...bullet,
    bbox: {
      height: 3,
      width: 3,
    },
    render(ctx: CanvasRenderingContext2D) {
      ctx.fillStyle = "white";
      ctx.fillRect(this.x - 1, this.y - 1, 3, 3);
    },
    update(isPressed) {
      physicalUpdate(this);
      if (Date.now() - spawnTime > 1000) {
        this.stale = true;
      }
    },
    onCollisionWith(entity) {
      if (entity.id === "asteroid") {
        this.stale = true;
      }
    },
  };
}

type Ship = Physical & {
  speed: number;
  theta: number;
  friction: number;
};

function shipEntity(ship: Ship, onCreateBullet: (bullet: Bullet) => void): Entity & Ship & Collides {
  return {
    id: "ship",
    stale: false,
    ...ship,
    bbox: {
      width: 30,
      height: 35,
    },
    render(ctx) {
      drawTriangle(ctx, "white", this.x, this.y, 30, 35, this.theta);
    },
    update(isPressed) {
      const cosine = Math.cos(toRadians(this.theta - 90));
      const sine = Math.sin(toRadians(this.theta - 90));
      if (isPressed(Key.LEFT)) {
        this.theta = (this.theta - 5) % 360;
      }
      if (isPressed(Key.RIGHT)) {
        this.theta = (this.theta + 5) % 360;
      }
      if (isPressed(Key.UP)) {
        this.vx += cosine * this.speed;
        this.vy += sine * this.speed;
      }
      if (isPressed(Key.DOWN)) {
        this.vx -= cosine * this.speed;
        this.vy -= sine * this.speed;
      }

      this.vx *= 1 - this.friction;
      this.vy *= 1 - this.friction;
      if (isPressed(Key.SPACE)) {
        onCreateBullet({
          x: this.x + (cosine * 30) / 2,
          y: this.y + (sine * 35) / 2,
          vx: this.vx + cosine * 10,
          vy: this.vy + sine * 10,
        });
      }

      physicalUpdate(this);
    },
    onCollisionWith(other) {},
  };
}

enum Key {
  LEFT = 0,
  RIGHT,
  UP,
  DOWN,
  SPACE,
}

type KeyStates = { [key: string]: boolean };

type ControlScheme = (keyStates: KeyStates, key: Key) => boolean;

function isPressed(keyStates: KeyStates, key: string) {
  return keyStates[key] ?? false;
}

const basicControlScheme: ControlScheme = (keyStates, key) => {
  if (key === Key.LEFT) {
    return isPressed(keyStates, "a") || isPressed(keyStates, "ArrowLeft");
  }
  if (key === Key.RIGHT) {
    return isPressed(keyStates, "d") || isPressed(keyStates, "ArrowRight");
  }
  if (key === Key.DOWN) {
    return isPressed(keyStates, "s") || isPressed(keyStates, "ArrowDown");
  }
  if (key === Key.UP) {
    return isPressed(keyStates, "w") || isPressed(keyStates, "ArrowUp");
  }
  if (key === Key.SPACE) {
    return isPressed(keyStates, "Spacebar") || isPressed(keyStates, " ");
  }
  return false;
};

function onKeyStateChange(keyStates: KeyStates, onEventValue: boolean) {
  return (e: KeyboardEvent) => {
    keyStates[e.key] = onEventValue;
  };
}

function loop(timeStepMs: number, update: () => boolean) {
  const i = setInterval(() => {
    if (update()) {
      clearInterval(i);
    }
  }, timeStepMs);

  return i;
}

function withContext(context: CanvasRenderingContext2D, fn: (ctx: CanvasRenderingContext2D) => void) {
  const oldStyle = context.fillStyle;
  const oldStroke = context.strokeStyle;
  fn(context);
  context.fillStyle = oldStyle;
  context.strokeStyle = oldStroke;
}

function drawTriangle(
  context: CanvasRenderingContext2D,
  style: string,
  x: number,
  y: number,
  base: number,
  height: number,
  rotation: number
) {
  const angle = (rotation * Math.PI) / 180;
  context.translate(x, y);
  context.rotate(angle);

  withContext(context, () => {
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

function clear(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
  withContext(context, (context) => {
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);
  });
}

function game(controlScheme: ControlScheme) {
  const canvas = document.getElementById("asteroids-canvas") as HTMLCanvasElement | null;
  if (canvas === null) {
    return;
  }

  const ctx = canvas.getContext("2d");

  if (ctx === null) {
    return;
  }

  const keyStates: KeyStates = {};

  document.onkeydown = onKeyStateChange(keyStates, true);
  document.onkeyup = onKeyStateChange(keyStates, false);

  const physicsManager = {
    entities: [] as (Entity & Physical & Collides)[],
    nextEntities: [] as (Entity & Physical & Collides)[],
    add(entity: Entity & Physical & Collides) {
      this.nextEntities.push(entity);
    },
    update() {
      for (let entity = 0; entity < this.entities.length; ++entity) {
        for (let otherEntity = 0; otherEntity < this.entities.length; ++otherEntity) {
          if (otherEntity === entity) {
            continue;
          }
          if (
            !this.entities[entity].stale &&
            !this.entities[otherEntity].stale &&
            collidesWith(this.entities[entity], this.entities[otherEntity])
          ) {
            this.entities[entity].onCollisionWith(this.entities[otherEntity]);
            this.entities[otherEntity].onCollisionWith(this.entities[entity]);
          }
        }
        if (!this.entities[entity].stale) {
          this.nextEntities.push(this.entities[entity]);
        }
      }
      this.entities = this.nextEntities;
      this.nextEntities = [];
    },
  };

  const entityManager = {
    entities: [] as (Entity & Physical)[],
    nextEntities: [] as (Entity & Physical)[],
    render(ctx: CanvasRenderingContext2D) {
      for (const entity of this.entities) {
        withContext(ctx, (ctx) => entity.render(ctx));
      }
    },
    update(isPressed: (key: Key) => boolean) {
      for (const entity of this.entities) {
        entity.update(isPressed);
        entity.x = (entity.x + 600) % 600;
        entity.y = (entity.y + 600) % 600;
        if (!entity.stale) {
          this.nextEntities.push(entity);
        }
      }

      this.entities = this.nextEntities;
      this.nextEntities = [];
    },
    spawn(entity: Entity & Physical) {
      this.nextEntities.push(entity);
    },
  };

  const gun = {
    lastTime: 0,
    fire(bullet: Bullet) {
      const currentTime = Date.now();
      if (currentTime - this.lastTime > 300) {
        createPhysical(bulletEntity(bullet));
        this.lastTime = currentTime;
      }
    },
  };

  const createPhysical = (e: Entity & Physical & Collides) => {
    entityManager.spawn(e);
    physicsManager.add(e);
  };

  createPhysical(
    shipEntity({ x: 300, y: 300, vx: 0, vy: 0, speed: 0.3, theta: 0, friction: 0.02 }, (bullet) => gun.fire(bullet))
  );

  const spawnAsteroid = (asteroid: Asteroid) => {
    createPhysical(asteroidEntity(asteroid, spawnAsteroid));
  };

  for (let i = 0; i < 5; ++i) {
    spawnAsteroid({
      x: Math.random() * 600,
      y: Math.random() * 600,
      vx: Math.random() * 4 - 2,
      vy: Math.random() * 4 - 2,
      width: Math.random() * 40 + 35,
      height: Math.random() * 40 + 35,
    });
  }

  loop(20, () => {
    clear(canvas, ctx);
    entityManager.render(ctx);
    physicsManager.update();
    entityManager.update((key) => controlScheme(keyStates, key));
    return false;
  });
}

game(basicControlScheme);
