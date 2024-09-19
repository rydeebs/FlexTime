// Constants
const GOOGLE_CLIENT_ID = '557949130808-esoftroaka1it7d6cbtjrue5uo6lr72j.apps.googleusercontent.com';
const MS_CLIENT_ID = 'dd4c37c3-3a02-44e3-9947-df74b9b56c2b';
const MS_REDIRECT_URI = 'https://dd4c37c3-3a02-44e3-9947-df74b9b56c2b.chromiumapp.org/';

document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    setupEventListeners();
});

function checkLoginStatus() {
    chrome.storage.sync.get(['googleToken', 'microsoftToken', 'userName'], function(data) {
        if (data.googleToken || data.microsoftToken) {
            showMainView(data.userName || 'User');
        } else {
            showLoginView();
        }
    });
}

function setupEventListeners() {
    document.getElementById('connectToGoogle').addEventListener('click', connectToGoogle);
    document.getElementById('connectToOutlook').addEventListener('click', connectToMicrosoft);
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
    chrome.identity.getAuthToken({ interactive: true }, function(token) {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            showNotification('Failed to connect to Google Calendar. Please try again.');
            return;
        }
        
        fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
            headers: { Authorization: 'Bearer ' + token }
        })
        .then(response => response.json())
        .then(data => {
            chrome.storage.sync.set({
                googleToken: token,
                userName: data.name
            }, function() {
                showMainView(data.name);
            });
        })
        .catch(error => {
            console.error('Error fetching user info:', error);
            showNotification('Failed to get user info. Please try again.');
        });
    });
}

function connectToMicrosoft() {
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${encodeURIComponent(MS_CLIENT_ID)}&response_type=token&redirect_uri=${encodeURIComponent(MS_REDIRECT_URI)}&scope=${encodeURIComponent('https://graph.microsoft.com/Calendars.Read')}&response_mode=fragment`;

    chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true
    }, function(redirectUrl) {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            showNotification('Failed to connect to Microsoft Calendar. Please try again.');
            return;
        }

        const url = new URL(redirectUrl);
        const params = new URLSearchParams(url.hash.slice(1));
        const token = params.get('access_token');

        if (token) {
            fetch('https://graph.microsoft.com/v1.0/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(response => response.json())
            .then(data => {
                chrome.storage.sync.set({
                    microsoftToken: token,
                    userName: data.displayName
                }, function() {
                    showMainView(data.displayName);
                });
            })
            .catch(error => {
                console.error('Error fetching user info:', error);
                showNotification('Failed to get user info. Please try again.');
            });
        } else {
            showNotification('Failed to connect to Microsoft Calendar. Please try again.');
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