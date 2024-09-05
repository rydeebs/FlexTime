// Constants
const WORKOUT_LEVELS = {
    beginner: { weekly_goal: 5, exercises: ['10 pushups', '20 squats', '30s plank'] },
    moderate: { weekly_goal: 10, exercises: ['15 pushups', '30 squats', '45s plank'] },
    good: { weekly_goal: 15, exercises: ['20 pushups', '40 squats', '60s plank'] },
    advanced: { weekly_goal: 20, exercises: ['25 pushups', '50 squats', '90s plank'] }
  };
  
  // Helper functions
  function getRandomExercise(level) {
    const exercises = WORKOUT_LEVELS[level].exercises;
    return exercises[Math.floor(Math.random() * exercises.length)];
  }
  
  // Main functionality
  chrome.runtime.onInstalled.addListener(() => {
    // Initialize user preferences
    chrome.storage.sync.set({
      workoutLevel: 'beginner',
      workSchedule: { start: '09:00', end: '17:00', days: [1, 2, 3, 4, 5] }, // Mon-Fri, 9AM-5PM
      completedWorkouts: 0
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
    // TODO: Implement calendar checking logic
    // For now, we'll just trigger a workout
    chrome.storage.sync.get(['workoutLevel', 'completedWorkouts'], (data) => {
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
  
  chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    if (buttonIndex === 0) {
      // User chose to do the workout
      chrome.storage.sync.get('completedWorkouts', (data) => {
        chrome.storage.sync.set({ completedWorkouts: data.completedWorkouts + 1 });
      });
    } else {
      // User chose to skip (implement payment logic here)
      console.log('Workout skipped. $2 payment required.');
    }
  });