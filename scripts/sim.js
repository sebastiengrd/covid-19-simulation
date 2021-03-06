const s = ( sketch ) => {

  var isRunning = false;

  var wanted_height = 500;
  var wanted_width = window.innerWidth;



  sketch.createGraph = () => {
    var years = sketch.dataX;
    // For drawing the lines
    var africa = sketch.dataY;

    var ctx = document.getElementById("myChart").getContext('2d');
    sketch.myChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: years,
        datasets: [
          { 
            data: africa
          }
        ]
      },
      options: {
        responsive: false
      }
    });

  }

  /* 
  0 -> healthy
  1 -> sick
  2 -> heal
  */

  sketch.start = () => {
    if (isRunning) {
      sketch.reset();
      sketch.start();
    }
    else {
      isRunning = true;
      sketch.myLoop();
    }

  }

  sketch.stop = () => {
    isRunning = false;
  }

  sketch.reset = () => {
    isRunning = false;
    sketch.myChart.destroy();
    sketch.setup();

  }

  sketch.setup = () => {
    sketch.balls = [];

    sketch.dataX = [];
    sketch.dataY = [];
    sketch.time = 0;
    sketch.nbrData = 0;

    sketch.nbrBalls = document.getElementById("initial-population").value;
    sketch.diameter = 3;

    sketch.maxVelocity = 0.25;

    sketch.infectionProbability = document.getElementById("initial-infected-population").value;

    sketch.stayHomeProbability = document.getElementById("motionless-percentage").value;

    sketch.waitingTimeToRecover = 700;

    sketch.angleMode(sketch.RADIANS);

    sketch.pixelDensity(1);
    sketch.createGraph();
    sketch.resizeCanvas(wanted_width, wanted_height);
    sketch.background(0);
    for(let i = 0; i < sketch.nbrBalls; i++) {
      sketch.balls[i] = new Ball(sketch.diameter, sketch.maxVelocity, sketch.balls, sketch.infectionProbability, sketch.waitingTimeToRecover, sketch.stayHomeProbability);
    }
    
    
    

  }

  sketch.updateGraph = () => {
    var count = 0;
    for (let i = 0; i < sketch.balls.length; i++) {
      if (sketch.balls[i].state == 1) {
        count++;
      }
    }

    sketch.myChart.data.datasets[0].data[sketch.nbrData] = count;
    sketch.myChart.data.labels[sketch.nbrData] = sketch.nbrData;
    sketch.myChart.update();
    sketch.nbrData++;
  }


  sketch.myLoop = () => {
    setTimeout(function () {
      sketch.background(0);
      
      sketch.balls.forEach(ball => {ball.recover(); ball.collide(); ball.move(); ball.display()})

      if (sketch.time % 10 == 0) {
        sketch.updateGraph();
      }
      sketch.time++;

      if (isRunning) {
        sketch.myLoop();
      }
     }, 10) // delay before executing the function
  }

  // sketch.resize = () => {
  //   var wanted_height = 300;
  //   var wanted_width = 300;
  //   sketch.resizeCanvas(wanted_width, wanted_height, true)
  // }


  class Ball {
    constructor(diameter, maxVelocity, balls, initialInfectionProbability, waitingTime, motionlessProbability) {
      this.x = sketch.random(0, wanted_width);
      this.y = sketch.random(0, wanted_height);

      this.motionless = sketch.random(0, 1) < motionlessProbability;

      if (this.motionless) {
        this.vx = 0;
        this.vy = 0; 
      } else {
        let angle = sketch.random(-sketch.PI, sketch.PI);
        this.vx = maxVelocity*sketch.cos(angle);
        this.vy = maxVelocity*sketch.sin(angle)
      }

      this.diameter = diameter;

      this.otherBalls = balls;

      if (sketch.random(0, 1) < initialInfectionProbability) {
        this.state = 1;
      } else {
        this.state = 0;
      }
      this.waitingToHill = waitingTime;
      this.waitingTime = sketch.random(this.waitingToHill-200, this.waitingToHill +200);
      
    }

    setWaitingTime() {
      this.waitingTime = sketch.random(this.waitingToHill-200, this.waitingToHill +200);
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
          // one.setWaitingTime();
        }
        if (two.state != 2) {
          two.state = 1;
          // two.setWaitingTime();
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

          if (!this.motionless) {
            this.vx = u1[0];
            this.vy = u1[1];
          }
          if (!other.motionless) {
            other.vx = u2[0];
            other.vy = u2[1];
          }

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

function start() {
  myp5.start();
}

function stop() {
  myp5.stop();
}

function reset() {
  myp5.reset();
}

function changeSliderNbrPeople(v) {
  document.getElementById("nbr-people").textContent = "Inintial number of people : " + v;

}

function changeSliderInfectedPercentage(v) {
  document.getElementById("percentage-infected-population").textContent = "Inintial percentage of infected person : " + v*100 + "%";
}

function changeSliderMotionlessPercentage(v) {
  document.getElementById("motionless-percentage-span").textContent = "Percentage of motionless person : " + v*100 + "%";
}