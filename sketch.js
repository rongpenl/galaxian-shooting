let creatures = []; // 敌人列表
let projectiles = []; // 子弹列表
let score = 0; // 分数
let gameOver = false; // 判断游戏是否结束
let restartButton; // 重新开始按钮
const ABSOLUTE_MAX_CREATURES = 4; // 绝对最大敌人按钮
let barrageCount = 1; // 剩余大招数
let lastScoreCheckpoint = 0; // 待议
let bulletSound;
let ultimateSound;
let explosionSound;
let explosionAnimation;
let explosions = [];
let backgroundImage;
let lastShakeTime = 0;
let shakeAmount = 5;
let bgX = 0;
let bgY = 0;

function preload() {
  // Load the sound file
  bulletSound = loadSound("bullet.mp3");
  ultimateSound = loadSound("ultimate.mp3");
  explosionSound = loadSound("explosion.mp3");
  explosionAnimation = loadImage("explosion.gif");
  backgroundImage = loadImage("bg.jpg");
}

function setup() {
  createCanvas(800, 500);
  angleMode(DEGREES);
  imageMode(CENTER);
  // noCursor(); // 默认不显示鼠标
  restartGame(); // 第一次开始游戏
}

function draw() {
  if (!gameOver) {
    // Apply the shaking effect
    shakeBackground();

    // Draw the background
    image(backgroundImage, width / 2 + bgX, height / 2 + bgY, width, height);
    let maxCreatures = max(1, floor(score / 5) + 1);
    maxCreatures = max(1, maxCreatures); // Ensure at least one creature

    // Update barrage count
    if (floor(score / 3) > floor(lastScoreCheckpoint / 3)) {
      barrageCount++;
      lastScoreCheckpoint = score;
    }

    // Update and display creatures
    for (let i = creatures.length - 1; i >= 0; i--) {
      updateCreature(creatures[i]);
      displayCreature(creatures[i]);
      if (creatures[i].y + creatures[i].size / 2 > height - 5) {
        gameOver = true;
        createRestartButton();
        break;
      }
      // if (creatures[i].y > height) {
      //   creatures.splice(i, 1);
      // }
    }

    // Add new creatures if below maxCreatures
    while (creatures.length < maxCreatures) {
      creatures.push(createCreature());
    }

    // Remove excess creatures if above maxCreatures
    while (creatures.length > maxCreatures) {
      creatures.pop();
    }

    // Draw the player/炮台
    fill(128);
    rectMode(CENTER);
    rect(mouseX, height - 25, 20, 50);

    // Update and display projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
      updateProjectile(projectiles[i]); // 让子弹飞
      if (checkProjectileCollision(projectiles[i]) || projectiles[i].y < 0) {
        projectiles.splice(i, 1); // 一颗子弹消灭一个敌人
      } else {
        displayProjectile(projectiles[i]);
      }
    }
  } else {
    // Game Over screen
    image(backgroundImage, width / 2 + bgX, height / 2 + bgY, width, height);
    fill(255);
    textSize(40);
    textAlign(CENTER, CENTER);
    text("GAME OVER", width / 2, height / 2 - 40);
    textSize(20);
    text("Final Score: " + score, width / 2, height / 2);

    // Display restart button
    restartButton.show();
  }

  // Draw the red line at the bottom
  // stroke(255, 0, 0);
  // strokeWeight(5);
  // line(0, height - 5, width, height - 5);

  // Display score, max creatures, and barrage count
  fill(255);
  textSize(20);
  textAlign(LEFT, TOP);
  text("Score: " + score, 10, 10);
  text(
    "Max Creatures: " + min(ABSOLUTE_MAX_CREATURES, max(1, floor(score / 5))),
    10,
    40
  );
  text("Barrage Count: " + barrageCount, 10, 70);

  // Draw explosions
  drawExplosions();
}

function shakeBackground() {
  let currentTime = millis();
  if (currentTime - lastShakeTime > 1000) {
    // Check if 1 second has passed
    bgX = random(-shakeAmount, shakeAmount);
    bgY = random(-shakeAmount, shakeAmount);
    lastShakeTime = currentTime;
  } else if (currentTime - lastShakeTime > 100) {
    // Reset position after 100ms
    bgX = 0;
    bgY = 0;
  }
}

function mousePressed() {
  if (!gameOver) {
    projectiles.push(createProjectile(mouseX, height - 25));
  }
} //  发射子弹

function keyPressed() {
  if (keyCode === 32 && !gameOver && barrageCount > 0) {
    // 32 is the keyCode for spacebar
    shootMultipleProjectiles(); // 发射一排子弹
    barrageCount--;
  }
} // 发射一排子弹的检测

function shootMultipleProjectiles() {
  let spacing = 20;
  let startX = mouseX - spacing * 2;
  for (let i = 0; i < 5; i++) {
    projectiles.push(createProjectile(startX + i * spacing, height - 25));
  }
  ultimateSound.play();
} // 放大招发射一排子弹的实现

function createCreature() {
  return {
    x: random(width),
    y: 0,
    size: 30,
    speed: random(1, 3),
  };
} // 创造敌人

function updateCreature(creature) {
  creature.y += creature.speed;
} // 更新每个敌人的状态

function displayCreature(creature) {
  fill(255);
  noStroke();
  ellipse(creature.x, creature.y, creature.size, creature.size);
} // 显示敌人

function createProjectile(x, y) {
  bulletSound.play();
  return {
    x: x,
    y: y,
    speed: -4,
  };
} // 创造子弹

function updateProjectile(projectile) {
  projectile.y += projectile.speed;
} // 更新子弹的位置

function displayProjectile(projectile) {
  fill(0, 255, 0);
  ellipse(projectile.x, projectile.y, 10, 10);
} // 显示子弹

function checkProjectileCollision(projectile) {
  for (let i = creatures.length - 1; i >= 0; i--) {
    // 循环检查敌人
    let d = dist(projectile.x, projectile.y, creatures[i].x, creatures[i].y); // 得到子弹和敌人的距离
    if (d < 20) {
      //碰撞成功
      createExplosion(creatures[i].x, creatures[i].y);
      creatures.splice(i, 1); // 消灭（删除）敌人
      score++;
      explosionSound.play();
      return true;
    }
  }
  return false;
} // 判断是否击中敌人

function createExplosion(x, y) {
  explosions.push({
    x: x,
    y: y,
    frame: 0,
    totalFrames: 60,
    rotation: random(360),
  });
}

function drawExplosions() {
  for (let i = explosions.length - 1; i >= 0; i--) {
    let explosion = explosions[i];

    push(); // Save the current drawing state
    translate(explosion.x, explosion.y); // Move to the explosion's position
    rotate(explosion.rotation); // Apply the random rotation

    // Draw the current frame of the explosion
    image(explosionAnimation, -60, -60, 120, 120);

    pop(); // Restore the drawing state

    // Advance to the next frame
    explosion.frame++;

    // Remove the explosion if it has played all frames
    if (explosion.frame >= explosion.totalFrames) {
      explosions.splice(i, 1);
    }
  }
}

function createRestartButton() {
  restartButton = createButton("Restart");
  restartButton.position(width / 2 - 40, height / 2 + 40);
  restartButton.mousePressed(restartGame);
} // 创建按钮

function restartGame() {
  creatures = [];
  projectiles = [];
  score = 0;
  gameOver = false;
  barrageCount = 1;
  lastScoreCheckpoint = 0;

  // Start with one creature
  creatures.push(createCreature());

  if (restartButton) {
    restartButton.hide();
  }
} // 重启游戏
