
function doGet(e) { 
  return ContentService.createTextOutput("The script is running successfully!");
}


function fetchCanvasAssignments() {
  const apiUrl = 'https://canvas.csuchico.edu/api/v1'; 
  const accessToken = '21744~ThHn8RDvyRBBkFEMWGyG2feTuK7P9KD8VQHkheFRykyUJE9WWBrFC3L7HJte4Ke8'; 
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Assignments');
  sheet.clear(); 
  sheet.appendRow(['Task', 'Course', 'Due Date', 'Priority', 'Status', 'Reminder Sent']);

  try {
    const coursesResponse = UrlFetchApp.fetch(`${apiUrl}/courses?enrollment_state=active&state=available`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const courses = JSON.parse(coursesResponse.getContentText());

    courses.forEach(course => {
      const courseId = course.id;
      const courseName = course.name;
      Logger.log(`Fetching assignments for course: ${courseName} (${courseId})`);

      try {
        // Fetch assignments for each course
        const assignmentsResponse = UrlFetchApp.fetch(`${apiUrl}/courses/${courseId}/assignments`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        const assignments = JSON.parse(assignmentsResponse.getContentText());

        if (!assignments.length) {
          Logger.log(`No assignments found for course: ${courseName}`);
          return;
        }

        assignments.forEach(assignment => {
          const taskName = assignment.name;
          const dueDate = assignment.due_at; 
          const submissionUrl = `${apiUrl}/courses/${courseId}/assignments/${assignment.id}/submissions/self`;

          // Format the due date
          const formattedDueDate = dueDate
            ? new Date(dueDate).toLocaleDateString('en-US', { timeZone: 'UTC' })
            : 'No Due Date';

          // Determine assignment status
          let status = 'Pending'; 
          let reminderSent = 'No';

          // Check submission status
          try {
            const submissionResponse = UrlFetchApp.fetch(submissionUrl, {
              headers: {
                Authorization: `Bearer ${accessToken}`
              }
            });
            const submission = JSON.parse(submissionResponse.getContentText());

            if (submission.submitted_at) {
              status = 'Completed'; // Mark as completed if submitted
              reminderSent = 'N/A';
            } else if (dueDate && new Date(dueDate) < new Date()) {
              status = 'Overdue'; // Mark as overdue if past the due date and not submitted
            }
          } catch (error) {
            Logger.log(`Error checking submission status for ${taskName}: ${error}`);
          }

          Logger.log(`Assignment "${taskName}" status: ${status}`);
          sheet.appendRow([taskName, courseName, formattedDueDate, 'Medium', status, reminderSent]);
        });
      } catch (error) {
        Logger.log(`Error fetching assignments for course ${courseName}: ${error}`);
      }
    });

    SpreadsheetApp.getUi().alert('Assignments have been successfully fetched from Canvas!');
  } catch (error) {
    SpreadsheetApp.getUi().alert(`Error fetching courses: ${error}`);
    Logger.log(error);
  }
}

function sendAssignmentReminders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Assignments');
  const data = sheet.getDataRange().getValues();
  const today = new Date();
  const email = Session.getActiveUser().getEmail(); 

  // Loop through all rows in the Assignments sheet
  for (let i = 1; i < data.length; i++) {
    const taskName = data[i][0]; 
    const courseName = data[i][1]; 
    const dueDate = new Date(data[i][2]); 
    const status = data[i][4]; 
    const reminderSent = data[i][5]; 

    // Check if the assignment is pending, has an upcoming deadline, and hasn't already sent a reminder
    if (status === 'Pending' && dueDate > today && reminderSent === 'No') {
      const subject = `Reminder: ${taskName} is due soon!`;
      const body = `Hello,\n\nThis is a friendly reminder that your assignment "${taskName}" for the course "${courseName}" is due on ${dueDate.toLocaleDateString()}.\n\nMake sure to complete it on time!\n\nBest regards,\nYour Student Management System`;
      MailApp.sendEmail(email, subject, body);

      // Mark the reminder as sent in the sheet
      sheet.getRange(i + 1, 6).setValue('Yes'); 
    }
  }

  SpreadsheetApp.getUi().alert('Reminders have been sent for all upcoming assignments!');
}

function runAllFunctions() {
  fetchCanvasAssignments();
  sendAssignmentReminders();
}


function generateEnhancedStudySchedule() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  let scheduleSheet = spreadsheet.getSheetByName('Enhanced Study Schedule');
  if (!scheduleSheet) {
    scheduleSheet = spreadsheet.insertSheet('Enhanced Study Schedule');
  } else {
    scheduleSheet.clear(); 
  }

  scheduleSheet.appendRow(['Date', 'Task', 'Course', 'Category', 'Priority', 'Hours Allocated', 'Status']);

  const assignmentsSheet = spreadsheet.getSheetByName('Assignments');
  if (!assignmentsSheet) {
    SpreadsheetApp.getUi().alert('Error: "Assignments" sheet not found. Please create it.');
    return;
  }

  const data = assignmentsSheet.getDataRange().getValues();
  const today = new Date();
  const studyHoursPerDay = 10; 
  let currentDay = new Date(today);

  const schedule = [];
  const categories = ['Assignments', 'Quizzes', 'Project Work', 'Revision'];
  const priorities = ['🔴 High', '🟠 Medium', '🟢 Low'];

  let remainingHoursToday = studyHoursPerDay;

  // Loop through assignments to allocate study time
  for (let i = 1; i < data.length; i++) {
    const taskName = data[i][0];
    const courseName = data[i][1];
    const dueDate = new Date(data[i][2]);
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];

    if (dueDate < today) continue; // Skip overdue tasks

    let hoursRemaining = 4; // Default 4 hours per task

    while (hoursRemaining > 0) {
      if (remainingHoursToday === 0) {
        // Reset the remaining hours for the next day
        currentDay.setDate(currentDay.getDate() + 1);
        remainingHoursToday = studyHoursPerDay;
      }

      const dailyHours = Math.min(remainingHoursToday, hoursRemaining);
      schedule.push([
        new Date(currentDay).toLocaleDateString(),
        taskName,
        courseName,
        category,
        priority,
        dailyHours.toFixed(1),
        'To Do'
      ]);

      hoursRemaining -= dailyHours;
      remainingHoursToday -= dailyHours;
    }
  }
  schedule.forEach(row => scheduleSheet.appendRow(row));
  SpreadsheetApp.getUi().alert('Enhanced Study Schedule generated successfully!');
}



function gSS() {
  generateEnhancedStudySchedule();
}

