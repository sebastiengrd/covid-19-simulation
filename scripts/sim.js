const s = ( sketch ) => {


  var wanted_height = 500;
  var wanted_width = 500;

  var balls = [];

  var nbrBalls = 200;
  var diameter = 5;

  var maxVelocity = 0.5;

  var nbrSick = 10

  var waitingTimeToRecover = 700;

  /* 
  0 -> healthy
  1 -> sick
  2 -> heal
  */

  sketch.setup = () => {
    let cnv = sketch.createCanvas(wanted_width, wanted_height);
    sketch.pixelDensity(1);

    for(let i = 0; i < nbrBalls; i++) {
      if (i < nbrSick) {
        balls[i] = new Ball(diameter, maxVelocity, balls, 1, waitingTimeToRecover);  
      }
      else {
        balls[i] = new Ball(diameter, maxVelocity, balls, 0, waitingTimeToRecover);
      }
    }
    
    
    sketch.myLoop();

  }


  sketch.myLoop = () => {
    setTimeout(function () {
      sketch.background(0);
      
      balls.forEach(ball => {ball.recover(); ball.collide(); ball.move(); ball.display()})
      
      sketch.myLoop();

     }, 20) // delay before executing the function
  }

  // sketch.resize = () => {
  //   var wanted_height = 300;
  //   var wanted_width = 300;
  //   sketch.resizeCanvas(wanted_width, wanted_height, true)
  // }


  class Ball {
    constructor(diameter, maxVelocity, balls, state, waitingTime) {
      this.x = sketch.random(0, wanted_width);
      this.y = sketch.random(0, wanted_height);

      this.vx = sketch.random(-maxVelocity, maxVelocity);
      this.vy = sketch.random(-maxVelocity, maxVelocity);
      this.diameter = diameter;

      this.otherBalls = balls;

      this.state = state;
      this.waitingTime = waitingTime;
    }
    rotate(v, theta) {
      return [
        v[0] * Math.cos(theta) - v[1] * Math.sin(theta),
        v[0] * Math.sin(theta) + v[1] * Math.cos(theta)
      ];
    }

    recover() {
      if (this.state == 1) {
        if (this.waitingTime > 0) {
          this.waitingTime--;
        } else {
          this.state = 2
        }
      }
    }
    changeStates(one, two) {
      if (one.state == 1 || two.state == 1) {
        if (one.state != 2) {
          one.state = 1;
        }
        if (two.state != 2) {
          two.state = 1;
        }
      }
    }

    collide() {
      if (this.x-(this.diameter/2) < 0 || this.x + (this.diameter/2) > wanted_width) {
        this.vx *=-1;
      }

      if (this.y - (this.diameter/2) < 0 || this.y + (this.diameter/2) > wanted_height) {
        this.vy *= -1;
      }
      this.recover();
      for (let i = 0; i < this.otherBalls.length; i++) {
        let dx = this.otherBalls[i].x - this.x;
        let dy = this.otherBalls[i].y - this.y;
        let distance = sketch.sqrt(dx * dx + dy * dy);
        let minDist = this.diameter;

        if (distance <= minDist) {

          let other = this.otherBalls[i];
          this.changeStates(this, other);

          let theta = -Math.atan2(other.y - this.y, other.x - this.x);
          let m1 = 1;
          let m2 = 1;
          let v1 = this.rotate([this.vx, this.vy], theta);
          let v2 = this.rotate([other.vx, other.vy], theta);
          let u1 = this.rotate([(v1[0] * (m1 - m2)) / (m1 + m2) + (v2[0] * 2 * m2) / (m1 + m2), v1[1]], theta);
          let u2 = this.rotate([(v2[0] * (m2 - m1)) / (m1 + m2) + (v1[0] * 2 * m1) / (m1 + m2), v2[1]], -theta);

          this.vx = u1[0];
          this.vy = u1[1];
          other.vx = u2[0];
          other.vy = u2[1];

          this.move();
        }
      }
    }

    move() {
      this.x += this.vx;
      this.y += this.vy;
    }

    display() {
      if (this.state == 0) {
        sketch.fill(0, 255, 0);
      }
      else if (this.state == 1) {
        sketch.fill(255, 0, 0);
      }
      else {
        sketch.fill(0, 0, 255);
      }
      sketch.ellipse(this.x, this.y, this.diameter, this.diameter);
    }
    
  }

}
// create the canvas with the sketch
var myp5 = new p5(s, document.getElementById("simulation"));

// handle the resize event from the body
function resize(){
  // myp5.resize();
  // console.log("out");
}
