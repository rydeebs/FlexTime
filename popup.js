document.addEventListener('DOMContentLoaded', function() {
  // Load saved settings and update UI
  chrome.storage.sync.get(['workoutLevel', 'workSchedule', 'completedWorkouts', 'weeklyGoal'], function(data) {
      document.getElementById('workoutLevel').value = data.workoutLevel || 'Entry';
      document.getElementById('workStartTime').value = data.workSchedule.start || '09:00';
      document.getElementById('workEndTime').value = data.workSchedule.end || '17:00';
      document.getElementById('completedWorkouts').textContent = data.completedWorkouts || 0;
      document.getElementById('weeklyGoal').textContent = data.weeklyGoal || 5;
      updateProgressBar(data.completedWorkouts, data.weeklyGoal);
  });

  // Save settings
  document.getElementById('saveSettings').addEventListener('click', function() {
      const workoutLevel = document.getElementById('workoutLevel').value;
      const workStartTime = document.getElementById('workStartTime').value;
      const workEndTime = document.getElementById('workEndTime').value;

      chrome.storage.sync.set({
          workoutLevel: workoutLevel,
          workSchedule: { start: workStartTime, end: workEndTime, days: [1, 2, 3, 4, 5] }
      }, function() {
          // Update weekly goal based on new workout level
          chrome.runtime.sendMessage({action: "updateWeeklyGoal", level: workoutLevel}, function(response) {
              document.getElementById('weeklyGoal').textContent = response.newGoal;
              updateProgressBar(response.completedWorkouts, response.newGoal);
          });
          showNotification('Settings saved successfully!');
      });
  });
});

function updateProgressBar(completed, goal) {
  const progressBar = document.getElementById('progressBar');
  if (!progressBar) {
      console.error('Progress bar element not found');
      return;
  }
  
  if (typeof completed !== 'number' || typeof goal !== 'number' || goal <= 0) {
      console.error('Invalid input for updateProgressBar', { completed, goal });
      progressBar.value = 0;
      return;
  }

  const percentage = Math.min(100, Math.max(0, (completed / goal) * 100));
  progressBar.value = percentage;
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.className = 'notification';
  document.body.appendChild(notification);
  setTimeout(() => {
      notification.remove();
  }, 3000);
}