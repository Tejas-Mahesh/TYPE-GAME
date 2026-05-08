const quote = document.getElementById("quote");
const input = document.getElementById("input");

const timeEl = document.getElementById("time");
const wpmEl = document.getElementById("wpm");
const accuracyEl = document.getElementById("accuracy");

const restartBtn = document.getElementById("restartBtn");

const quotes = [

"Practice typing every day to improve your speed and accuracy.",

"JavaScript helps developers create interactive websites easily.",

"Frontend developers use HTML CSS and JavaScript together.",

"Typing quickly can improve coding productivity and efficiency.",

"Consistency and patience are important for learning programming.",

"Responsive websites work smoothly on mobile tablet and desktop.",

"Web development combines creativity problem solving and logic.",

"Fast typing skills save time while writing long programs.",

"Animations make user interfaces more attractive and interactive.",

"Good programmers focus on both speed and code readability.",

"Learning by building projects improves frontend development skills.",

"Practice keyboard shortcuts to become faster while coding daily.",

"Technology changes rapidly so developers must keep learning always.",

"Creative website designs improve user experience and engagement.",

"Programming becomes easier with regular practice and dedication.",

"Typing games are useful for increasing keyboard typing speed.",

"Modern websites use animations transitions and responsive layouts.",

"Clean code is easier to understand maintain and improve later.",

"Developers should test websites carefully before publishing online.",

"Hard work and consistency help students become skilled developers."

];

let currentQuote = "";
let time = 60;
let timerStarted = false;
let interval;

function loadQuote(){

    currentQuote = quotes[Math.floor(Math.random()*quotes.length)];

    quote.innerHTML = "";

    currentQuote.split("").forEach(char => {

        const span = document.createElement("span");

        span.innerText = char;

        quote.appendChild(span);

    });

    quote.querySelector("span").classList.add("current");

}

loadQuote();

input.addEventListener("input", () => {

    if(!timerStarted){

        startTimer();
        timerStarted = true;

    }

    const typedChars = input.value.split("");

    const quoteChars = quote.querySelectorAll("span");

    let correctChars = 0;

    quoteChars.forEach((char,index) => {

        const typedChar = typedChars[index];

        char.classList.remove("correct","wrong","current");

        if(typedChar == null){

            char.classList.add("current");

        }

        else if(typedChar === char.innerText){

            char.classList.add("correct");

            correctChars++;

        }

        else{

            char.classList.add("wrong");

        }

    });

    calculateWPM(correctChars);

    calculateAccuracy(correctChars,typedChars.length);

    const completed = [...quoteChars].every(span =>
        span.classList.contains("correct")
    );

    if(completed){

        input.value = "";

        loadQuote();

    }

});

function startTimer(){

    interval = setInterval(() => {

        time--;

        timeEl.innerText = time;

        if(time <= 0){

            clearInterval(interval);

            endGame();

        }

    },1000);

}

function calculateWPM(correctChars){

    const words = correctChars / 5;

    const timePassed = (60 - time) / 60;

    const wpm = Math.round(words / timePassed) || 0;

    wpmEl.innerText = wpm;

}

function calculateAccuracy(correctChars,totalTyped){

    const accuracy =
    Math.round((correctChars / totalTyped) * 100) || 100;

    accuracyEl.innerText = accuracy + "%";

}

function endGame(){

    input.disabled = true;

    quote.innerHTML = `
    
    <div style="text-align:center;">

    <h2 style="color:cyan;margin-bottom:10px;">
    Game Over
    </h2>

    <p>Your Speed: ${wpmEl.innerText} WPM</p>

    <p>Accuracy: ${accuracyEl.innerText}</p>

    </div>
    
    `;

}

restartBtn.addEventListener("click", () => {

    clearInterval(interval);

    time = 60;

    timerStarted = false;

    timeEl.innerText = 60;

    wpmEl.innerText = 0;

    accuracyEl.innerText = "100%";

    input.disabled = false;

    input.value = "";

    loadQuote();

});
