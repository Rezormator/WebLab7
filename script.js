document.getElementById("play-button").addEventListener("click", function () {
    const work = document.getElementById("work");
    work.style.display = "flex";
    resetCirclePosition();
});

document.getElementById("clear-local-storage").addEventListener("click", function () {
    localStorage.clear();
    displayEventLogs();
    logBatchEvents();
});

document.getElementById("close-button").addEventListener("click", function () {
    const work = document.getElementById("work");
    work.style.display = "none";
    displayEventLogs();
});

const anim = document.getElementById("anim");
const controls = document.getElementById("controls");
const startButton = document.getElementById("start-button");
let stopButton, reloadButton;
let circle, intervalId, direction, step;

function createCircle() {
    circle = document.createElement("div");
    circle.classList.add("circle");
    anim.appendChild(circle);
    resetCirclePosition();
}

function resetCirclePosition() {
    circle.style.left = `${(anim.clientWidth - circle.offsetWidth) / 2}px`;
    circle.style.top = `${(anim.clientHeight - circle.offsetHeight) / 2}px`;
    direction = "left";
    step = 1;
}

function moveCircle() {
    const circleRect = circle.getBoundingClientRect();
    const animRect = anim.getBoundingClientRect();

    if (
        circleRect.right < animRect.left ||
        circleRect.bottom < animRect.top ||
        circleRect.left > animRect.right ||
        circleRect.top > animRect.bottom
    ) {
        stopAnimation();
        showReloadButton();
        logEvent("Circle hit the boundary and stopped.");
        return;
    }

    switch (direction) {
        case "left":
            logEvent("Circle moved left.");
            circle.style.left = `${circle.offsetLeft - step}px`;
            if (circle.offsetLeft < 0) {
                direction = "down";
                logEvent("Circle changed direction to down.");
            }
            break;
        case "down":
            logEvent("Circle moved down.");
            circle.style.top = `${circle.offsetTop + step}px`;
            if (circle.offsetTop + circle.offsetHeight > anim.clientHeight) {
                direction = "right";
                logEvent("Circle changed direction to right.");
            }
            break;
        case "right":
            logEvent("Circle moved right.");
            circle.style.left = `${circle.offsetLeft + step}px`;
            if (circle.offsetLeft + circle.offsetWidth > anim.clientWidth) {
                direction = "up";
                logEvent("Circle changed direction to up.");
            }
            break;
        case "up":
            logEvent("Circle moved up.");
            circle.style.top = `${circle.offsetTop - step}px`;
            if (circle.offsetTop < 0) {
                direction = "left";
                logEvent("Circle changed direction to left.");
            }
            break;
    }

    step += 1;
}

function startAnimation() {
    intervalId = setInterval(moveCircle, 50);
    startButton.style.display = "none";
    showStopButton();
    logEvent("Animation started.");
}

function stopAnimation() {
    clearInterval(intervalId);
    intervalId = null;
    if (stopButton) stopButton.style.display = "none";
    logEvent("Animation stopped.");
}

function showStopButton() {
    stopButton = document.createElement("button");
    stopButton.textContent = "Stop";
    stopButton.className = "button-style";
    stopButton.id = "stop-button";
    stopButton.addEventListener("click", stopAndShowStart);
    controls.appendChild(stopButton);
}

function stopAndShowStart() {
    stopAnimation();
    controls.removeChild(stopButton);
    startButton.style.display = "block";
}

function showReloadButton() {
    reloadButton = document.createElement("button");
    reloadButton.textContent = "Reload";
    reloadButton.className = "button-style";
    reloadButton.id = "reload-button";
    reloadButton.addEventListener("click", reloadAnimation);
    controls.appendChild(reloadButton);
}

function reloadAnimation() {
    resetCirclePosition();
    if (reloadButton) controls.removeChild(reloadButton);
    startButton.style.display = "block";
    logEvent("Animation reloaded.");
}

function logEvent(eventDescription) {
    const localTimestamp = new Date().toLocaleString();
    const event = {
        description: eventDescription,
        timestamp: localTimestamp
    };

    const events = JSON.parse(localStorage.getItem('events')) || [];
    events.push(event);
    localStorage.setItem('events', JSON.stringify(events));

    fetch('https://weblabserver7.railway.internal/log_event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        mode: 'cors'
    })
        .then(response => response.json())
        .then(data => {
            console.log("Event logged:", data);
            console.log(`Server time: ${data.server_time}, Local time: ${localTimestamp}`);
        })
        .catch(err => console.error("Error logging event:", err));
}

function logBatchEvents() {
    const events = JSON.parse(localStorage.getItem('events')) || [];
    if (events.length === 0) return;

    fetch('https://weblabserver7.railway.internal/log_batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(events)
    });

    localStorage.removeItem('events');
}

function displayEventLogs() {
    const content = document.querySelector('.content');
    const existingTable = content.querySelector('table');

    if (existingTable) {
        content.removeChild(existingTable);
    }
    const events = JSON.parse(localStorage.getItem('events')) || [];
    if (events.length === 0) {
        return;
    }
    const table = document.createElement('table');
    const header = table.insertRow();
    header.insertCell().textContent = "Event Number";
    header.insertCell().textContent = "Timestamp";
    header.insertCell().textContent = "Description";
    events.forEach((event, index) => {
        if (event.timestamp != null) {
            const row = table.insertRow();
            row.insertCell().textContent = index + 1;
            row.insertCell().textContent = event.timestamp;
            row.insertCell().textContent = event.description;
        }
    });
    content.appendChild(table);
}

createCircle();
startButton.addEventListener("click", startAnimation);
