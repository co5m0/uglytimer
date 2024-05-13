<script>
  let timerSecondBar = 0;
  let timerPercentageBar = 0;
  let min = {
    now: 0,
    restart: 0
  };
  let sec = {
    now: 0,
    restart: 0
  };
  const timer = {
    isPlaying: false
  };
  let intervalID;
  const finishEvent = new Event("timeout");
  $: {
    timerSecondBar = min.restart * 60 + sec.restart;
    timerPercentageBar = 100 / timerSecondBar;
  }
  let len = 100;
  let notificationPermission = "denied";
  let notificationFlag = false;

  function startTimer(event, time) {
    timer.isPlaying = true;
    setIntervalWrap();
  }

  function setIntervalWrap() {
    intervalID = setInterval(() => {
      if (sec.now > 0 && min.now >= 0) {
        sec.now -= 1;
        refreshProgressBar();
      }
      if (sec.now == 0 && min.now > 0) {
        min.now -= 1;
        sec.now = 59;
        refreshProgressBar();
      } else if (sec.now <= 0 && min.now <= 0) {
        clearInterval(intervalID);
        document.dispatchEvent(finishEvent);
        setTimeout(() => {
          timer.isPlaying = false;
          sec.now = sec.restart;
          min.now = min.restart;
          len = 100;
        }, 2000);
      }
    }, 1000);
  }

  function logger(msg) {
    console.log(msg);
    console.log("TIMER " + JSON.stringify(timer));
    console.log("MIN " + JSON.stringify(min));
    console.log("SEC " + JSON.stringify(sec));
    console.log(timerPercentageBar + " " + timerSecondBar);
  }

  function stopTimer() {
    timer.isPlaying = false;
    clearInterval(intervalID);
  }

  function increaseTimerMinutes() {
    if (!timer.isPlaying) {
      min.now += 1;
      alignMinutes();
    }
  }
  function decreaseTimerMinutes() {
    if (!timer.isPlaying && min.now > 0) {
      min.now -= 1;
      alignMinutes();
    }
  }
  function increaseTimerSeconds() {
    if (!timer.isPlaying && sec.now < 59) {
      sec.now += 1;
      alignSeconds();
    }
  }
  function decreaseTimerSeconds() {
    if (!timer.isPlaying && sec.now > 0) {
      sec.now -= 1;
      alignSeconds();
    }
  }

  function resetTimer() {
    min.now = min.restart = 0;
    sec.now = sec.restart = 0;
    stopTimer();
    len = 100;
  }

  function alignSeconds() {
    sec.restart = sec.now;
  }
  function alignMinutes() {
    min.restart = min.now;
  }
  function refreshProgressBar() {
    len -= timerPercentageBar;
    if (len < 0) len = 0;
  }

  function enableNotification() {
    if (notificationPermission === "denied" && !notificationFlag) {
      Notification.requestPermission().then(function (result) {
        notificationPermission = result;
      });
    }
  }

  document.addEventListener("timeout", e => {
    let ofs = 0;
    const nerdMovieQuotes = [
      "May the Force be with you.", // Star Wars
      "Live long and prosper.", // Star Trek
      "I'll be back.", // The Terminator
      "You're gonna need a bigger boat.", // Jaws
      "I see dead people.", // The Sixth Sense
      "My name is Inigo Montoya. You killed my father. Prepare to die.", // The Princess Bride",
      "I am your father.", // Star Wars: The Empire Strikes Back
      "There's no place like home.", // The Wizard of Oz
      "I'm the king of the world!", // Titanic
      "Elementary, my dear Watson.", // Sherlock Holmes
      "I'm Batman.", // Batman Begins
      "I'm a Jedi, like my father before me.", // Star Wars: The Force Awakens
      "I am Groot.", // Guardians of the Galaxy
      "I'm gonna make him an offer he can't refuse.", // The Godfather
      "Show me the money!",
      // Jerry Maguire
      "You're killing me, Smalls.", // The Sandlot
      "I'll have what she's having.", // When Harry Met Sally
      "You've got to ask yourself one question: 'Do I feel lucky?' Well, do ya, punk?", // Dirty Harry
      "I'm the Dude." // The Big Lebowski
    ];
    let backgroundFlash = setInterval(function () {
      document.body.style.background =
        "rgba(" +
        Math.floor(Math.random() * 256) +
        "," +
        Math.floor(Math.random() * 256) +
        "," +
        Math.floor(Math.random() * 256) +
        "," +
        Math.abs(Math.sin(ofs)) +
        ")";
      ofs += 0.05;
    }, 10);
    setTimeout(() => {
      clearInterval(backgroundFlash);
      document.body.style.background = "transparent";
    }, 1900);
    if (notificationPermission === "granted" && notificationFlag) {
      const text = Math.random().floor(nerdMovieQuotes.length);
      const img = "https://img.icons8.com/clouds/100/000000/timer.png";
      var notification = new Notification("Ugly timer over", {
        body: text,
        icon: img
      });
      setTimeout(notification.close.bind(notification), 10000);
    }
  });
</script>

<style>
    .container * {
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  h1,
  h2 {
    color: purple;
    display: inline-block;
  }

  button {
    border: none;
    background-color: darksalmon;
  }

  p {
    padding: 0;
    margin: 0;
  }

  .container-crono {
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    justify-content: center;
  }

  .row {
    flex: 100%;
    text-align: center;
  }

  .progressbar {
    background-color: yellow;
    padding: 3px;
  }

  .progressbar>div {
    background-color: violet;
    height: 20px;
  }

  .whited {
    color: white;
  }

  .footer {
    position: fixed;
    left: 0;
    bottom: 0;
    width: 100%;
    text-align: center;
  }

  .crono {
    font-size: 350%;
  }

  .adjust-time {
    display: flex;
    justify-content: space-around;
  }

  .dontknow {
    display: flex;
  }

  a {
    color: hotpink;
  }

  /* Checkbox */

  .checkbox {
    display: inline-block;
    position: relative;
    width: 20px;
    height: 20px;
    border: 1px solid #ccc;
    border-radius: 3px;
    background-color: #fff;
    cursor: pointer;
  }

  .checkbox input[type="checkbox"] {
    display: none;
  }

  .checkbox input[type="checkbox"]:checked+.checkbox-mark {
    display: block;
  }

  .pointer {
    cursor: pointer;
  }

  @media only screen and (min-width: 768px) {
    .container-crono {
      width: 720px;
      margin-right: auto;
      margin-left: auto;
    }
  }
</style>

<div class="container-crono">
  <div class="row">
    <h1 class="crono">{min.now.toString().padStart(2, 0)}</h1>
    <h1 class="crono">:</h1>
    <h1 class="crono">{sec.now.toString().padStart(2, 0)}</h1>
  </div>
  <div class="row">
    <div class="progressbar">
      <div style="width: {len}%" />
    </div>
  </div>
  <div class="row adjust-time">
    <div>
      <div class="pointer">
        <h1 on:click={increaseTimerMinutes}>+</h1>
      </div>
      <div />
      <h2>MINUTES</h2>
      <div />
      <div class="pointer">
        <h1 on:click={decreaseTimerMinutes}>-</h1>
      </div>
    </div>
    <div>
      <div class="pointer">
        <h1 on:click={increaseTimerSeconds}>+</h1>
      </div>
      <div />
      <h2>SECONDS</h2>
      <div />
      <div class="pointer">
        <h1 on:click={decreaseTimerSeconds}>-</h1>
      </div>
    </div>
  </div>
  {#if timer.isPlaying}
  <button on:click={stopTimer}>PAUSE</button>
  {:else}
  <button on:click={startTimer}>START</button>
  {/if}
  <button on:click={resetTimer}>RESET</button>
  <div class="row dontknow">
    <input type="checkbox" class="checkbox " bind:checked={notificationFlag} on:click={enableNotification} />
    <p class="whited">Check this fancy box if you want an ugly notification</p>
  </div>

  <div class="footer whited">
    c r e a t e d b y
    <a href="https://github.com/co5m0/uglytimer">C O 5 M O</a>
  </div>
</div>