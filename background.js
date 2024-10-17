// Constants
const WORKOUT_LEVELS = {
    Entry: { weekly_goal: 5, exercises: ['10 Lunges', '10 Pushups', '30s Plank', '10 Situps', '10 Bodyweight Squats'] },
    Manager: { weekly_goal: 10, exercises: ['15 Lunges', '15 Pushups', '45s Plank', '15 Situps', '15 Bodyweight Squats', '10 Close-grip Pushups', '30s Side Plank (each side)'] },
    Director: { weekly_goal: 15, exercises: ['20 Lunges', '20 Pushups', '60s Plank', '20 Situps', '20 Bodyweight Squats', '15 Close-grip Pushups', '45s Side Plank (each side)', '10 Burpees', '20 Russian Twists'] },
    CEO: { weekly_goal: 20, exercises: ['25 Lunges', '25 Pushups', '90s Plank', '25 Situps', '25 Bodyweight Squats', '20 Close-grip Pushups', '60s Side Plank (each side)', '15 Burpees', '30 Russian Twists', '30 Mountain Climbers'] }
  };
  
  // Initialize extension when installed or updated
  chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({
      googleToken: null,
      microsoftToken: null,
      workoutLevel: 'Entry',
      workSchedule: { start: '09:00', end: '17:00', days: [1, 2, 3, 4, 5] },
      completedWorkouts: 0
    });
  
    // Set up alarms
    chrome.alarms.create('scheduleWorkouts', { periodInMinutes: 60 });
    chrome.alarms.create('resetWeeklyProgress', { 
      when: getNextSundayMidnight(),
      periodInMinutes: 7 * 24 * 60 // Weekly
    });
  });
  
  // Helper function to get next Sunday midnight
  function getNextSundayMidnight() {
    const now = new Date();
    const nextSunday = new Date(now.setDate(now.getDate() + (7 - now.getDay()) % 7));
    nextSunday.setHours(0, 0, 0, 0);
    return nextSunday.getTime();
  }
  
  // Handle alarms
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'scheduleWorkouts') {
      scheduleWorkouts();
    } else if (alarm.name === 'resetWeeklyProgress') {
      resetWeeklyProgress();
    }
  });
  
  // Token management
  function getToken(provider) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get([`${provider}Token`], (result) => {
        if (result[`${provider}Token`]) {
          resolve(result[`${provider}Token`]);
        } else {
          reject(new Error(`No ${provider} token found`));
        }
      });
    });
  }
  
  // Schedule workouts
  async function scheduleWorkouts() {
    try {
      const googleToken = await getToken('google');
      const microsoftToken = await getToken('microsoft');
      
      const googleEvents = await fetchGoogleEvents(googleToken);
      const microsoftEvents = await fetchMicrosoftEvents(microsoftToken);
      
      const allEvents = [...googleEvents, ...microsoftEvents];
      
      chrome.storage.sync.get(['workSchedule', 'workoutLevel'], (data) => {
        const freeTimeSlots = findFreeTimeSlots(allEvents, data.workSchedule);
        const workoutsToSchedule = Math.min(freeTimeSlots.length, WORKOUT_LEVELS[data.workoutLevel].weekly_goal);
        
        for (let i = 0; i < workoutsToSchedule; i++) {
          const workout = getRandomExercise(data.workoutLevel);
          const slot = freeTimeSlots[i];
          scheduleWorkout(workout, slot);
        }
      });
    } catch (error) {
      console.error('Error scheduling workouts:', error);
    }
  }
  
  // Fetch Google Calendar events
  async function fetchGoogleEvents(token) {
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${oneWeekFromNow.toISOString()}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch Google Calendar events');
      }
      
      const data = await response.json();
      return data.items.map(event => ({
        start: new Date(event.start.dateTime || event.start.date),
        end: new Date(event.end.dateTime || event.end.date)
      }));
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      return [];
    }
  }
    // Implement Google Calendar API call here
    // Return array of events
  }
  
  // Fetch Microsoft Calendar events
  async function fetchMicrosoftEvents(token) {
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const url = `https://graph.microsoft.com/v1.0/me/calendarview?startDateTime=${now.toISOString()}&endDateTime=${oneWeekFromNow.toISOString()}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch Microsoft Calendar events');
      }
      
      const data = await response.json();
      return data.value.map(event => ({
        start: new Date(event.start.dateTime + 'Z'),
        end: new Date(event.end.dateTime + 'Z')
      }));
    } catch (error) {
      console.error('Error fetching Microsoft Calendar events:', error);
      return [];
    }
  }
    // Implement Microsoft Graph API call here
    // Return array of events
  }
  
  // Find free time slots
  function findFreeTimeSlots(events, workSchedule) {
    // Implement logic to find free time slots
    // Return array of free time slots
  }
  
  // Get random exercise
  function getRandomExercise(level) {
    const exercises = WORKOUT_LEVELS[level].exercises;
    return exercises[Math.floor(Math.random() * exercises.length)];
  }
  
  // Schedule a workout
  function scheduleWorkout(workout, slot) {
    chrome.alarms.create(`workout_${slot.start.getTime()}`, {
      when: slot.start.getTime()
    });
    
    // Store workout details for later notification
    chrome.storage.sync.set({ [`workout_${slot.start.getTime()}`]: workout });
  }
  
  // Reset weekly progress
  function resetWeeklyProgress() {
    chrome.storage.sync.set({ completedWorkouts: 0 });
  }
  
  // Listen for messages from popup or content scripts
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "connectToGoogle") {
      connectToGoogle().then(sendResponse).catch(error => sendResponse({ error: error.message }));
      return true;
    } else if (request.action === "connectToMicrosoft") {
      connectToMicrosoft().then(sendResponse).catch(error => sendResponse({ error: error.message }));
      return true;
    }
  });
  
  // Connect to Google
  function connectToGoogle() {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, function(token) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          chrome.storage.sync.set({ googleToken: token }, () => {
            resolve({ success: true });
          });
        }
      });
    });
  }
  
  // Connect to Microsoft
  function connectToMicrosoft() {
    return new Promise((resolve, reject) => {
      const clientId = 'dd4c37c3-3a02-44e3-9947-df74b9b56c2b'; // Replace with your actual client ID
      const redirectUrl = chrome.identity.getRedirectURL();
      const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUrl)}&scope=${encodeURIComponent('https://graph.microsoft.com/Calendars.Read')}`;
  
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
            chrome.storage.sync.set({ microsoftToken: token }, () => {
              resolve({ success: true });
            });
          } else {
            reject(new Error('Failed to get Microsoft access token'));
          }
        }
      });
    });
  }
      // Implement Microsoft authentication here
      // When successful, store the token and resolve
      // chrome.storage.sync.set({ microsoftToken: token }, () => {
      //   resolve({ success: true });
      // });
  
  // Handle workout alarms
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name.startsWith('workout_')) {
      chrome.storage.sync.get([alarm.name], (data) => {
        const workout = data[alarm.name];
        if (workout) {
          showWorkoutNotification(workout);
        }
      });
    }
  });
  
  // Show workout notification
  function showWorkoutNotification(workout) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'images/icon128.png',
      title: 'Time for a workout!',
      message: `Let's do ${workout}`,
      buttons: [
        { title: 'Do it!' },
        { title: 'Skip' }
      ],
      requireInteraction: true
    });
  }
  
  // Handle notification button clicks
  chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    if (buttonIndex === 0) {  // "Do it!" button
      chrome.storage.sync.get(['completedWorkouts'], (data) => {
        const newCount = (data.completedWorkouts || 0) + 1;
        chrome.storage.sync.set({ completedWorkouts: newCount });
      });
    }
    // Clear the notification
    chrome.notifications.clear(notificationId);
  });