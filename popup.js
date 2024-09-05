document.addEventListener('DOMContentLoaded', function() {
    // Load saved settings
    chrome.storage.sync.get(['workoutLevel', 'workSchedule', 'completedWorkouts'], function(data) {
      document.getElementById('workoutLevel').value = data.workoutLevel || 'beginner';
      document.getElementById('workStartTime').value = data.workSchedule.start || '09:00';
      document.getElementById('workEndTime').value = data.workSchedule.end || '17:00';
      document.getElementById('completedWorkouts').textContent = data.completedWorkouts || 0;
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
        console.log('Settings saved');
        // You could add some visual feedback here to indicate successful save
      });
    });
  });