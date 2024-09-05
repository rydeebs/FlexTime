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
  if (alarm.name === 'checkCalendar') {
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
});