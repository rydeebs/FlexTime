// Constants
const WORKOUT_LEVELS = {
  Entry: { weekly_goal: 5, exercises: [
    '10 Lunges', 
    '10 Pushups', 
    '30s Plank', 
    '10 Situps', 
    '10 Bodyweight Squats'
  ]},
  Senior: { weekly_goal: 10, exercises: [
    '15 Lunges', 
    '15 Pushups', 
    '45s Plank', 
    '15 Situps', 
    '15 Bodyweight Squats',
    '10 Close-grip Pushups',
    '30s Side Plank (each side)'
  ]},
  Boss: { weekly_goal: 15, exercises: [
    '20 Lunges', 
    '20 Pushups', 
    '60s Plank', 
    '20 Situps', 
    '20 Bodyweight Squats',
    '15 Close-grip Pushups',
    '45s Side Plank (each side)',
    '10 Burpees',
    '20 Russian Twists'
  ]},
  Goggins: { weekly_goal: 20, exercises: [
    '25 Lunges', 
    '25 Pushups', 
    '90s Plank', 
    '25 Situps', 
    '25 Bodyweight Squats',
    '20 Close-grip Pushups',
    '60s Side Plank (each side)',
    '15 Burpees',
    '30 Russian Twists',
    '30 Mountain Climbers'
  ]}
};

// Helper functions
function getRandomExercise(level) {
  const exercises = WORKOUT_LEVELS[level].exercises;
  return exercises[Math.floor(Math.random() * exercises.length)];
}

function isWorkingHours(schedule) {
  const now = new Date();
  const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMinute] = schedule.start.split(':').map(Number);
  const [endHour, endMinute] = schedule.end.split(':').map(Number);
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;

  return schedule.days.includes(currentDay) && currentTime >= startTime && currentTime <= endTime;
}

// Main functionality
chrome.runtime.onInstalled.addListener(() => {
  // Initialize user preferences
  chrome.storage.sync.set({
    workoutLevel: 'beginner',
    workSchedule: { start: '09:00', end: '17:00', days: [1, 2, 3, 4, 5] }, // Mon-Fri, 9AM-5PM
    completedWorkouts: 0,
    weeklyGoal: WORKOUT_LEVELS.beginner.weekly_goal
  });

  // Set up alarm for checking calendar and triggering workouts
  chrome.alarms.create('checkCalendar', { periodInMinutes: 30 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'periodicScheduling') {
    scheduleWorkouts();
  } else if (alarm.name.startsWith('workout_')) {
    // This is a workout alarm
    const workoutTime = new Date(parseInt(alarm.name.split('_')[1]));
    console.log(`Time for a workout! Scheduled at ${workoutTime}`);
    // Here, trigger your workout notification or whatever action you want to take when it's time for a workout
  } else if (alarm.name === 'checkCalendar') {
    // Keep your existing checkCalendarAndTriggerWorkout() call here if you have one
    checkCalendarAndTriggerWorkout();
  }
});

function checkCalendarAndTriggerWorkout() {
  chrome.storage.sync.get(['workoutLevel', 'workSchedule', 'completedWorkouts', 'weeklyGoal'], (data) => {
    if (isWorkingHours(data.workSchedule)) {
      // TODO: Implement actual calendar checking logic here
      // For now, we'll just assume the user is available
      if (data.completedWorkouts < data.weeklyGoal) {
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
      }
    }
  });
}

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    // User chose to do the workout
    chrome.storage.sync.get(['completedWorkouts', 'weeklyGoal'], (data) => {
      const newCount = data.completedWorkouts + 1;
      chrome.storage.sync.set({ completedWorkouts: newCount });
      if (newCount >= data.weeklyGoal) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'images/icon128.png',
          title: 'Weekly Goal Achieved!',
          message: 'Congratulations! You've reached your workout goal for the week.',
        });
      }
    });
  } else {
    // User chose to skip (implement payment logic here)
    console.log('Workout skipped. $2 payment required.');
    // TODO: Implement actual payment logic
  }
});

// Reset weekly progress every Sunday at midnight
chrome.alarms.create('resetWeeklyProgress', {
  when: Date.now() + (7 - new Date().getDay()) * 24 * 60 * 60 * 1000,
  periodInMinutes: 7 * 24 * 60  // Repeat every week
});

// Update this line in the chrome.runtime.onInstalled listener
chrome.storage.sync.set({
  workoutLevel: 'Entry',  // Changed from 'beginner' to 'Entry'
  workSchedule: { start: '09:00', end: '17:00', days: [1, 2, 3, 4, 5] }, // Mon-Fri, 9AM-5PM
  completedWorkouts: 0,
  weeklyGoal: WORKOUT_LEVELS.Entry.weekly_goal  // Changed from WORKOUT_LEVELS.beginner.weekly_goal
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'resetWeeklyProgress') {
    chrome.storage.sync.set({ completedWorkouts: 0 });
  }
});

// Add this new message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateWeeklyGoal") {
      const newGoal = WORKOUT_LEVELS[request.level].weekly_goal;
      chrome.storage.sync.get(['completedWorkouts'], (data) => {
          chrome.storage.sync.set({ weeklyGoal: newGoal }, () => {
              sendResponse({ newGoal: newGoal, completedWorkouts: data.completedWorkouts });
          });
      });
      return true; // Indicates that the response is sent asynchronously
  }
  let token = null;

function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, function(token) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(token);
      }
    });
  });
}

async function fetchCalendarEvents() {
  try {
    if (!token) {
      token = await getAuthToken();
    }

    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${oneWeekFromNow.toISOString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch calendar events');
    }

    const data = await response.json();
    return data.items;
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return [];
  }
}

function findFreeTimeSlots(events, workSchedule) {
  const freeSlots = [];
  const now = new Date();
  const endOfWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  for (let day = new Date(now); day < endOfWeek; day.setDate(day.getDate() + 1)) {
    const dayOfWeek = day.getDay();
    
    // Check if it's a workday
    if (workSchedule.days.includes(dayOfWeek)) {
      const startTime = new Date(day.setHours(workSchedule.start.split(':')[0], workSchedule.start.split(':')[1]));
      const endTime = new Date(day.setHours(workSchedule.end.split(':')[0], workSchedule.end.split(':')[1]));

      let currentSlotStart = new Date(startTime);

      events.forEach(event => {
        const eventStart = new Date(event.start.dateTime || event.start.date);
        const eventEnd = new Date(event.end.dateTime || event.end.date);

        // If event is on the same day and overlaps with work hours
        if (eventStart.toDateString() === day.toDateString() && 
            eventStart < endTime && eventEnd > startTime) {
          
          // Add free slot before event if there's enough time
          if (eventStart > currentSlotStart && (eventStart - currentSlotStart) >= 15 * 60 * 1000) {
            freeSlots.push({
              start: new Date(currentSlotStart),
              end: new Date(eventStart)
            });
          }

          currentSlotStart = new Date(Math.max(currentSlotStart, eventEnd));
        }
      });

      // Add remaining time after last event
      if (endTime > currentSlotStart && (endTime - currentSlotStart) >= 15 * 60 * 1000) {
        freeSlots.push({
          start: new Date(currentSlotStart),
          end: new Date(endTime)
        });
      }
    }
  }

  return freeSlots;
}

async function scheduleWorkouts() {
  const events = await fetchCalendarEvents();
  
  chrome.storage.sync.get(['workSchedule', 'workoutLevel'], function(data) {
    const freeTimeSlots = findFreeTimeSlots(events, data.workSchedule);
    // Use freeTimeSlots and data.workoutLevel to schedule workouts
    console.log('Free time slots:', freeTimeSlots);
    // Implement workout scheduling logic here
  });
}

// Add this line to your existing alarm listener
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkCalendar') {
    scheduleWorkouts();
    // Keep your existing checkCalendarAndTriggerWorkout() call here if you have one
  }
});

// Initial run
scheduleWorkouts();

async function scheduleWorkouts() {
  const events = await fetchCalendarEvents();
  
  chrome.storage.sync.get(['workSchedule', 'workoutLevel', 'weeklyGoal'], function(data) {
    const freeTimeSlots = findFreeTimeSlots(events, data.workSchedule);
    console.log('Free time slots:', freeTimeSlots);

    // Determine how many workouts to schedule based on weeklyGoal
    const workoutsToSchedule = Math.min(freeTimeSlots.length, data.weeklyGoal);

    // Randomly select time slots for workouts
    const selectedSlots = [];
    for (let i = 0; i < workoutsToSchedule; i++) {
      const randomIndex = Math.floor(Math.random() * freeTimeSlots.length);
      selectedSlots.push(freeTimeSlots.splice(randomIndex, 1)[0]);
    }

    // Schedule workouts for the selected slots
    selectedSlots.forEach(slot => {
      const workout = getRandomExercise(data.workoutLevel);
      console.log(`Scheduled workout: ${workout} at ${slot.start}`);
      // Create an alarm for this workout
      chrome.alarms.create(`workout_${slot.start.getTime()}`, {
        when: slot.start.getTime()
      });
    });
  });
}

// Initial run
scheduleWorkouts();

// Set up periodic scheduling
chrome.alarms.create('periodicScheduling', { periodInMinutes: 60 });

// Add this to your existing background.js file

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "connectToCalendar") {
      connectToCalendar()
          .then(() => sendResponse({success: true}))
          .catch(error => {
              console.error('Error connecting to calendar:', error);
              sendResponse({success: false});
          });
      return true; // Indicates that the response is sent asynchronously
  }
});

function connectToCalendar() {
  return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({interactive: true}, function(token) {
          if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
          } else {
              // Store the token or use it to make API calls
              chrome.storage.sync.set({calendarToken: token}, function() {
                  console.log('Calendar token saved');
                  resolve();
              });
          }
      });
  });
}

// Make sure to update your fetchCalendarEvents function to use this token
async function fetchCalendarEvents() {
  return new Promise((resolve, reject) => {
      chrome.storage.sync.get('calendarToken', async function(data) {
          if (data.calendarToken) {
              // Use data.calendarToken to make API calls
              // ... (rest of your fetchCalendarEvents logic)
          } else {
              reject(new Error('No calendar token found. Please connect to Google Calendar first.'));
          }
      });
  });
}

});
