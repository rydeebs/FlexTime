const MS_CLIENT_ID = 'd674152d-b445-42a3-b369-56d2a8b88002';

// Constants
const WORKOUT_LEVELS = {
  Entry: { weekly_goal: 5, exercises: [
    '10 Lunges', '10 Pushups', '30s Plank', '10 Situps', '10 Bodyweight Squats'
  ]},
  Senior: { weekly_goal: 10, exercises: [
    '15 Lunges', '15 Pushups', '45s Plank', '15 Situps', '15 Bodyweight Squats',
    '10 Close-grip Pushups', '30s Side Plank (each side)'
  ]},
  Boss: { weekly_goal: 15, exercises: [
    '20 Lunges', '20 Pushups', '60s Plank', '20 Situps', '20 Bodyweight Squats',
    '15 Close-grip Pushups', '45s Side Plank (each side)', '10 Burpees', '20 Russian Twists'
  ]},
  Goggins: { weekly_goal: 20, exercises: [
    '25 Lunges', '25 Pushups', '90s Plank', '25 Situps', '25 Bodyweight Squats',
    '20 Close-grip Pushups', '60s Side Plank (each side)', '15 Burpees',
    '30 Russian Twists', '30 Mountain Climbers'
  ]}
};

let token = null;

// Helper functions
function getRandomExercise(level) {
  const exercises = WORKOUT_LEVELS[level].exercises;
  return exercises[Math.floor(Math.random() * exercises.length)];
}

function isWorkingHours(schedule) {
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [startHour, startMinute] = schedule.start.split(':').map(Number);
  const [endHour, endMinute] = schedule.end.split(':').map(Number);
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;
  return schedule.days.includes(currentDay) && currentTime >= startTime && currentTime <= endTime;
}

function connectToCalendar() {
  console.log('Attempting to connect to Google Calendar');
  return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({interactive: true}, function(token) {
          if (chrome.runtime.lastError) {
              console.error('Error getting auth token:', chrome.runtime.lastError);
              reject(chrome.runtime.lastError);
          } else if (!token) {
              console.error('No token received');
              reject(new Error('No token received'));
          } else {
              console.log('Auth token received successfully');
              chrome.storage.sync.set({calendarToken: token}, function() {
                  if (chrome.runtime.lastError) {
                      console.error('Error saving token:', chrome.runtime.lastError);
                      reject(chrome.runtime.lastError);
                  } else {
                      console.log('Calendar token saved successfully');
                      resolve(token);
                  }
              });
          }
      });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);
  if (request.action === "connectToCalendar") {
      connectToCalendar()
          .then(() => {
              console.log('Calendar connected successfully');
              sendResponse({success: true});
          })
          .catch(error => {
              console.error('Error connecting to calendar:', error);
              sendResponse({success: false, error: error.message});
          });
      return true; // Indicates that the response is sent asynchronously
  }
});

async function fetchCalendarEvents() {
  if (!token) {
    token = await connectToCalendar();
  }
  const now = new Date();
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${oneWeekFromNow.toISOString()}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch calendar events');
  }
  const data = await response.json();
  return data.items;
}

function findFreeTimeSlots(events, workSchedule) {
  // ... (keep the existing implementation)
}

async function scheduleWorkouts() {
  const events = await fetchCalendarEvents();
  chrome.storage.sync.get(['workSchedule', 'workoutLevel', 'weeklyGoal'], function(data) {
    const freeTimeSlots = findFreeTimeSlots(events, data.workSchedule);
    console.log('Free time slots:', freeTimeSlots);
    const workoutsToSchedule = Math.min(freeTimeSlots.length, data.weeklyGoal);
    const selectedSlots = [];
    for (let i = 0; i < workoutsToSchedule; i++) {
      const randomIndex = Math.floor(Math.random() * freeTimeSlots.length);
      selectedSlots.push(freeTimeSlots.splice(randomIndex, 1)[0]);
    }
    selectedSlots.forEach(slot => {
      const workout = getRandomExercise(data.workoutLevel);
      console.log(`Scheduled workout: ${workout} at ${slot.start}`);
      chrome.alarms.create(`workout_${slot.start.getTime()}`, {
        when: slot.start.getTime()
      });
    });
  });
}

// Main functionality
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    workoutLevel: 'Entry',
    workSchedule: { start: '09:00', end: '17:00', days: [1, 2, 3, 4, 5] },
    completedWorkouts: 0,
    weeklyGoal: WORKOUT_LEVELS.Entry.weekly_goal
  });
  chrome.alarms.create('checkCalendar', { periodInMinutes: 30 });
  chrome.alarms.create('periodicScheduling', { periodInMinutes: 60 });
  chrome.alarms.create('resetWeeklyProgress', {
    when: Date.now() + (7 - new Date().getDay()) * 24 * 60 * 60 * 1000,
    periodInMinutes: 7 * 24 * 60
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'periodicScheduling' || alarm.name === 'checkCalendar') {
    scheduleWorkouts();
  } else if (alarm.name.startsWith('workout_')) {
    const workoutTime = new Date(parseInt(alarm.name.split('_')[1]));
    console.log(`Time for a workout! Scheduled at ${workoutTime}`);
    triggerWorkoutNotification();
  } else if (alarm.name === 'resetWeeklyProgress') {
    chrome.storage.sync.set({ completedWorkouts: 0 });
  }
});

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    chrome.storage.sync.get(['completedWorkouts', 'weeklyGoal'], (data) => {
      const newCount = data.completedWorkouts + 1;
      chrome.storage.sync.set({ completedWorkouts: newCount });
      if (newCount >= data.weeklyGoal) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'images/icon128.png',
          title: 'Weekly Goal Achieved!',
          message: 'Congratulations! You have reached your workout goal for the week.',
        });
      }
    });
  } else {
    console.log('Workout skipped. $2 payment required.');
    // TODO: Implement actual payment logic
  }
});

// Combined message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);
  if (request.action === "updateWeeklyGoal") {
    const newGoal = WORKOUT_LEVELS[request.level].weekly_goal;
    chrome.storage.sync.get(['completedWorkouts'], (data) => {
      chrome.storage.sync.set({ weeklyGoal: newGoal }, () => {
        sendResponse({ newGoal: newGoal, completedWorkouts: data.completedWorkouts });
      });
    });
    return true;
  } else if (request.action === "connectToCalendar") {
    console.log('Connecting to calendar...');
    connectToCalendar()
      .then(() => {
        console.log('Calendar connected successfully');
        sendResponse({success: true});
      })
      .catch(error => {
        console.error('Error connecting to calendar:', error);
        sendResponse({success: false, error: error.message});
      });
    return true;
  }
});

function triggerWorkoutNotification() {
  chrome.storage.sync.get(['workoutLevel'], (data) => {
    const exercise = getRandomExercise(data.workoutLevel);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'images/icon128.png',
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

function connectToOutlook() {
  return new Promise((resolve, reject) => {
    const redirectUri = chrome.identity.getRedirectURL();
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${d674152d-b445-42a3-b369-56d2a8b88002}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent('https://graph.microsoft.com/Calendars.Read')}&response_mode=fragment`;

    chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true
    }, function(redirectUrl) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        const url = new URL(redirectUrl);
        const params = new URLSearchParams(url.hash.slice(1));
        const token = params.get('access_token');
        if (token) {
          chrome.storage.sync.set({outlookToken: token}, function() {
            resolve(token);
          });
        } else {
          reject(new Error('Failed to get token'));
        }
      }
    });
  });
}

async function fetchOutlookEvents() {
  const token = await new Promise((resolve) => chrome.storage.sync.get('outlookToken', data => resolve(data.outlookToken)));
  if (!token) throw new Error('No Outlook token found');

  const response = await fetch('https://graph.microsoft.com/v1.0/me/calendar/events', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) throw new Error('Failed to fetch Outlook events');

  const data = await response.json();
  return data.value;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "connectToOutlook") {
    connectToOutlook()
      .then(() => sendResponse({success: true}))
      .catch(error => sendResponse({success: false, error: error.message}));
    return true; // Indicates that the response is sent asynchronously
  }
});

// Initial run
scheduleWorkouts();