function doGet(e) { 
  return ContentService.createTextOutput("The script is running successfully!");
}

function onFormSubmit(e) {
  Logger.log("Event Object: " + JSON.stringify(e)); 

  const spreadsheet = SpreadsheetApp.openById("1rmcJY_nBPEZhJJOEZyNIbMJHsRPZLaC8cqBpOtZU9Ys"); 
  const sheet = spreadsheet.getActiveSheet(); 

  const lastRow = sheet.getLastRow(); 
  const rowData = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0]; 
  const timestamp = rowData[0];
  const name = rowData[1];
  const email = rowData[2];
  const feedback = parseInt(rowData[3]); 

  Logger.log(`Extracted Data: Timestamp: ${timestamp}, Name: ${name}, Email: ${email}, Feedback: ${feedback}`);
  if (!email) {
    Logger.log("Missing required data: Email is empty");
    return;
  }
  const subject = "Thank You for Your Feedback!";
  const message = `Hi ${name},\n\nThank you for submitting your feedback: "${feedback}".\n\nWe appreciate your input.\n\nBest Regards,\nPriyanka`;

  try {
    MailApp.sendEmail(email, subject, message);
    Logger.log(`Email sent successfully to: ${email}`);
  } catch (error) {
    Logger.log("Error sending email: " + error.message);
  }

  // Notifications for Admin
  const feedbackThreshold = 3; // Threshold for low feedback
  if (feedback < feedbackThreshold) {
    const adminEmail = "skakarla1@csuchico.edu"; 
    const alertSubject = `Alert: Low Feedback Received from ${name}`;
    const alertMessage = `A new feedback submission requires your attention:\n\n` +
                         `Name: ${name}\nEmail: ${email}\nFeedback: ${feedback}\nTimestamp: ${timestamp}\n\n` +
                         `Please follow up as needed.`;

    try {
      MailApp.sendEmail(adminEmail, alertSubject, alertMessage);
      Logger.log(`Admin notified of low feedback from ${name}`);
    } catch (error) {
      Logger.log("Error sending admin notification: " + error.message);
    }
  }
}


function analyzeResponses() {
  const spreadsheet = SpreadsheetApp.openById("1rmcJY_nBPEZhJJOEZyNIbMJHsRPZLaC8cqBpOtZU9Ys"); 
  const sheet = spreadsheet.getSheetByName("Form Responses 1"); 
  
  // Check if the sheet exists
  if (!sheet) {
    Logger.log("Error: Sheet named 'Form Responses 1' not found.");
    return;
  }
  let summarySheet = spreadsheet.getSheetByName("Summary");
  if (!summarySheet) {
    summarySheet = spreadsheet.insertSheet("Summary");
    Logger.log("Created 'Summary' sheet");
  } else {
    Logger.log("Using existing 'Summary' sheet");
  }
  summarySheet.clear();

  const data = sheet.getDataRange().getValues(); 
  const feedbackIndex = 3; 
  let totalFeedback = 0;
  let count = 0;

  // Loop through rows to calculate total feedback and count
  for (let i = 1; i < data.length; i++) { 
    const feedback = parseInt(data[i][feedbackIndex]);
    if (!isNaN(feedback)) {
      totalFeedback += feedback;
      count++;
    }
  }

  // Calculate average feedback
  const averageFeedback = count > 0 ? (totalFeedback / count).toFixed(2) : 0;

  // Update the "Summary" sheet 
  summarySheet.getRange("A1").setValue("Metric");
  summarySheet.getRange("B1").setValue("Value");

  summarySheet.getRange("A2").setValue("Total Responses");
  summarySheet.getRange("B2").setValue(count);

  summarySheet.getRange("A3").setValue("Average Feedback");
  summarySheet.getRange("B3").setValue(averageFeedback);

  Logger.log(`Total Responses: ${count}, Average Feedback: ${averageFeedback}`);
}

