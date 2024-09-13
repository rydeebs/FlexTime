console.log('Background script loaded');

const MS_CLIENT_ID = 'YOUR_AZURE_APPLICATION_CLIENT_ID'; // Replace with your actual Azure client ID

// Constants for workout levels
const WORKOUT_LEVELS = {
    Entry: { weekly_goal: 5, exercises: ['10 Lunges', '10 Pushups', '30s Plank', '10 Situps', '10 Bodyweight Squats'] },
    Senior: { weekly_goal: 10, exercises: ['15 Lunges', '15 Pushups', '45s Plank', '15 Situps', '15 Bodyweight Squats', '10 Close-grip Pushups', '30s Side Plank (each side)'] },
    Boss: { weekly_goal: 15, exercises: ['20 Lunges', '20 Pushups', '60s Plank', '20 Situps', '20 Bodyweight Squats', '15 Close-grip Pushups', '45s Side Plank (each side)', '10 Burpees', '20 Russian Twists'] },
    Goggins: { weekly_goal: 20, exercises: ['25 Lunges', '25 Pushups', '90s Plank', '25 Situps', '25 Bodyweight Squats', '20 Close-grip Pushups', '60s Side Plank (each side)', '15 Burpees', '30 Russian Twists', '30 Mountain Climbers'] }
};

chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
    chrome.storage.sync.set({
        workoutLevel: 'Entry',
        workSchedule: { start: '09:00', end: '17:00', days: [1, 2, 3, 4, 5] },
        completedWorkouts: 0,
        weeklyGoal: WORKOUT_LEVELS.Entry.weekly_goal
    });
    chrome.alarms.create('checkCalendar', { periodInMinutes: 30 });
    chrome.alarms.create('resetWeeklyProgress', {
        when: Date.now() + (7 - new Date().getDay()) * 24 * 60 * 60 * 1000,
        periodInMinutes: 7 * 24 * 60
    });
});

chrome.alarms.onAlarm.addListener((alarm) => {
    console.log('Alarm fired:', alarm.name);
    if (alarm.name === 'checkCalendar') {
        scheduleWorkouts();
    } else if (alarm.name === 'resetWeeklyProgress') {
        chrome.storage.sync.set({ completedWorkouts: 0 });
    } else if (alarm.name.startsWith('workout_')) {
        triggerWorkoutNotification();
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message in background:', request);
    if (request.action === "connectToGoogle") {
        console.log('Attempting to connect to Google Calendar');
        connectToGoogle()
            .then(() => {
                console.log('Google Calendar connected successfully');
                sendResponse({success: true});
            })
            .catch(error => {
                console.error('Error connecting to Google Calendar:', error);
                sendResponse({success: false, error: error.message});
            });
        return true; // Indicates that the response is sent asynchronously
    } else if (request.action === "connectToOutlook") {
        console.log('Attempting to connect to Outlook Calendar');
        connectToOutlook()
            .then(() => {
                console.log('Outlook Calendar connected successfully');
                sendResponse({success: true});
            })
            .catch(error => {
                console.error('Error connecting to Outlook Calendar:', error);
                sendResponse({success: false, error: error.message});
            });
        return true; // Indicates that the response is sent asynchronously
    }
});

function connectToGoogle() {
    console.log('connectToGoogle function called');
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({interactive: true}, function(token) {
            console.log('getAuthToken callback fired');
            if (chrome.runtime.lastError) {
                console.error('getAuthToken error:', chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
            } else {
                console.log('Got Google auth token:', token ? 'Token received' : 'No token');
                chrome.storage.sync.set({googleToken: token}, function() {
                    console.log('Google token saved');
                    resolve(token);
                });
            }
        });
    });
}

function connectToOutlook() {
    console.log('connectToOutlook function called');
    return new Promise((resolve, reject) => {
        const redirectUri = chrome.identity.getRedirectURL();
        console.log('Redirect URI:', redirectUri);
        const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${MS_CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent('https://graph.microsoft.com/Calendars.Read')}&response_mode=fragment`;
        console.log('Auth URL:', authUrl);

        chrome.identity.launchWebAuthFlow({
            url: authUrl,
            interactive: true
        }, function(redirectUrl) {
            console.log('launchWebAuthFlow callback fired');
            if (chrome.runtime.lastError) {
                console.error('launchWebAuthFlow error:', chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
            } else {
                console.log('Received redirect URL:', redirectUrl);
                const url = new URL(redirectUrl);
                const params = new URLSearchParams(url.hash.slice(1));
                const token = params.get('access_token');
                if (token) {
                    console.log('Got Outlook auth token');
                    chrome.storage.sync.set({outlookToken: token}, function() {
                        console.log('Outlook token saved');
                        resolve(token);
                    });
                } else {
                    console.error('No token found in redirect URL');
                    reject(new Error('Failed to get token'));
                }
            }
        });
    });
}

async function fetchGoogleEvents() {
    const token = await new Promise((resolve) => chrome.storage.sync.get('googleToken', data => resolve(data.googleToken)));
    if (!token) throw new Error('No Google token found');

    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${oneWeekFromNow.toISOString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to fetch Google events');
    const data = await response.json();
    return data.items;
}

async function fetchOutlookEvents() {
    const token = await new Promise((resolve) => chrome.storage.sync.get('outlookToken', data => resolve(data.outlookToken)));
    if (!token) throw new Error('No Outlook token found');

    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const response = await fetch(`https://graph.microsoft.com/v1.0/me/calendarview?startDateTime=${now.toISOString()}&endDateTime=${oneWeekFromNow.toISOString()}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Prefer': 'outlook.timezone="Etc/UTC"'
        }
    });

    if (!response.ok) throw new Error('Failed to fetch Outlook events');
    const data = await response.json();
    return data.value;
}

function findFreeTimeSlots(events, workSchedule) {
    // Implementation of finding free time slots
    // ... (implement this based on your specific requirements)
}

async function scheduleWorkouts() {
    console.log('Scheduling workouts');
    try {
        const googleEvents = await fetchGoogleEvents();
        const outlookEvents = await fetchOutlookEvents();
        const allEvents = [...googleEvents, ...outlookEvents];

        chrome.storage.sync.get(['workSchedule', 'workoutLevel', 'weeklyGoal'], function(data) {
            const freeTimeSlots = findFreeTimeSlots(allEvents, data.workSchedule);
            console.log('Free time slots:', freeTimeSlots);

            const workoutsToSchedule = Math.min(freeTimeSlots.length, data.weeklyGoal);
            for (let i = 0; i < workoutsToSchedule; i++) {
                const slot = freeTimeSlots[i];
                const workout = getRandomExercise(data.workoutLevel);
                console.log(`Scheduled workout: ${workout} at ${slot.start}`);
                chrome.alarms.create(`workout_${slot.start.getTime()}`, {
                    when: slot.start.getTime()
                });
            }
        });
    } catch (error) {
        console.error('Error scheduling workouts:', error);
    }
}

function getRandomExercise(level) {
    const exercises = WORKOUT_LEVELS[level].exercises;
    return exercises[Math.floor(Math.random() * exercises.length)];
}

function triggerWorkoutNotification() {
    chrome.storage.sync.get(['workoutLevel'], function(data) {
        const exercise = getRandomExercise(data.workoutLevel);
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon128.png',
            title: 'Time for a quick workout!',
            message: `Let's do ${exercise}`,
            buttons: [
                { title: 'Do it!' },
                { title: 'Skip ($2)' }
            ],
            requireInteraction: true
        });
    });
}

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    if (buttonIndex === 0) {
        chrome.storage.sync.get(['completedWorkouts', 'weeklyGoal'], function(data) {
            const newCount = data.completedWorkouts + 1;
            chrome.storage.sync.set({ completedWorkouts: newCount }, function() {
                if (newCount >= data.weeklyGoal) {
                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: 'icon128.png',
                        title: 'Weekly Goal Achieved!',
                        message: 'Congratulations! You've reached your workout goal for the week.'
                    });
                }
            });
        });
    } else {
        console.log('Workout skipped. $2 payment required.');
        // Implement payment logic here
    }
});