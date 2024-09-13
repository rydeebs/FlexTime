document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    setupEventListeners();
});

function checkLoginStatus() {
    chrome.storage.sync.get(['googleToken', 'outlookToken', 'userName'], function(data) {
        if (data.googleToken || data.outlookToken) {
            showMainView(data.userName || 'User');
        } else {
            showLoginView();
        }
    });
}

function setupEventListeners() {
    document.getElementById('connectToGoogle').addEventListener('click', connectToGoogle);
    document.getElementById('connectToOutlook').addEventListener('click', connectToOutlook);
    document.getElementById('prev-week').addEventListener('click', showPreviousWeek);
    document.getElementById('next-week').addEventListener('click', showNextWeek);
    document.getElementById('log-exercise').addEventListener('click', logExercise);
}

function showLoginView() {
    document.getElementById('login-view').style.display = 'block';
    document.getElementById('main-view').style.display = 'none';
}

function showMainView(userName) {
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('main-view').style.display = 'block';
    document.getElementById('user-name').textContent = userName;

    updateWeekView();
    updateExerciseList();
    updateTotalExercises();
}

function connectToGoogle() {
    chrome.runtime.sendMessage({action: "connectToGoogle"}, function(response) {
        if (response && response.success) {
            showNotification('Successfully connected to Google Calendar!');
            showMainView('Google User');
        } else {
            showNotification('Failed to connect to Google Calendar. Please try again.');
        }
    });
}

function connectToOutlook() {
    chrome.runtime.sendMessage({action: "connectToOutlook"}, function(response) {
        if (response && response.success) {
            showNotification('Successfully connected to Outlook Calendar!');
            showMainView('Outlook User');
        } else {
            showNotification('Failed to connect to Outlook Calendar. Please try again.');
        }
    });
}

function updateWeekView() {
    const weekView = document.getElementById('week-view');
    weekView.innerHTML = '';

    const today = new Date();
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);

    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'day';
        if (i === currentDay) {
            dayElement.classList.add('current');
        }

        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dayNumber = date.getDate();

        dayElement.innerHTML = `
            <div>${dayName}</div>
            <div>${dayNumber}</div>
            <div class="exercise-count">0</div>
        `;

        weekView.appendChild(dayElement);
    }

    // TODO: Fetch and update exercise counts for each day
}

function updateExerciseList() {
    const exerciseList = document.getElementById('exercise-list');
    exerciseList.innerHTML = '';

    const exercises = ['Lunges', 'Pushups', 'Situps', 'Squats'];
    exercises.forEach(exercise => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${exercise}</span>
            <span class="exercise-count">0</span>
        `;
        exerciseList.appendChild(li);
    });

    // TODO: Fetch and update exercise counts
}

function updateTotalExercises() {
    // TODO: Fetch total exercise count and update
    document.getElementById('total-exercises').textContent = '0';
}

function showPreviousWeek() {
    // TODO: Implement previous week view
    console.log('Show previous week');
}

function showNextWeek() {
    // TODO: Implement next week view
    console.log('Show next week');
}

function logExercise() {
    // TODO: Implement exercise logging
    console.log('Log exercise');
    showNotification('Exercise logged!');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '10px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = '#4CAF50';
    notification.style.color = 'white';
    notification.style.padding = '10px';
    notification.style.borderRadius = '5px';
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}