const { request } = require('express');
const jwt = require('jsonwebtoken');
const Request = require('../Models/requestModel')
const mongoose = require('mongoose');
const secretKey = process.env.SECRET;
const express = require("express");
const app = express();

const { v4: uuidv4 } = require('uuid');
const cloudinary = require('../cloudinaryConfig');
const path = require('path');
const fs = require('fs');

// Add request
const addRequest = async (userID, requestID, link, type, report, modifiedHTML, originalHTML, analysis_result) => {
    if (userID === null) {
        return false;
    }

    try {
        // Prepare an array of file paths, conditional on type
        const filePaths = [report, originalHTML, analysis_result];
        if (type === 'premium') {
            filePaths.push(modifiedHTML);
        }

        // Upload all files in a single call
        const fileIDs = await uploadFilesToCloud(filePaths, userID, type);

        // Assign IDs to respective variables
        const reportID = fileIDs[0];
        const originalID = fileIDs[1];
        const analysis_resultID = fileIDs[2];
        const modifiedID = type === 'premium' ? fileIDs[3] : null;

        // Create the request
        const request = await Request.create({
            userID: userID,
            requestID: requestID,
            link: link,
            type: type,
            report: reportID, 
            modifiedHTML: modifiedID,
            originalHTML: originalID,
            analysis_result: analysis_resultID
        });

        // Get secure URLs
        const reportLink = await getSecureUrlFromCloudinary(reportID);
        const modifiedLink = type === 'premium' ? await getSecureUrlFromCloudinary(modifiedID) : null;

        return { reportLink, fixedLink: modifiedLink };
    } catch (error) {
        console.error("Error: " + error);
        return false;
    }
}

// Upload multiple files to Cloudinary in a structured folder
const uploadFilesToCloud = async (filePaths, userId, typeOfRequest) => {
    try {
        // Generate a unique identifier using the current timestamp and a random string
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substr(2, 5);
        const uniqueIdentifier = `${timestamp}-${randomString}`;

        // Construct the folder path
        const folderPath = `${userId}/${typeOfRequest}_${uniqueIdentifier}/`;

        // Store the public IDs for each uploaded file
        const publicIds = [];

        // Upload each file
        for (const filePath of filePaths) {
            const result = await cloudinary.uploader.upload(filePath, {
                resource_type: 'raw',
                folder: folderPath
            });
            publicIds.push(result.public_id);
        }

        return publicIds;
    } catch (error) {
        console.error('Error uploading files:', error);
        throw error;
    }
};

// Delete history
const delete_history = async (request, response) => {
  // check if user has checked the checkbox
  if (!request.body.unlinkConformation) {
    request.flash('errorMessage', "الرجاء التأكد من تأكيد الحذف.");
    return response.redirect('/account-management');
  }
    const token = request.cookies.auth_token;
    let userID = null;
    try {
        userID = jwt.decode(token, secretKey)['id'];
    } catch (error) {
        response.clearCookie('auth_token');
        return response.status(401).render('error', { errormessage: 'Invalid authentication token. Please log in again. If this happens again please contact us.' });
    }
    try {
      const requests_history = await Request.deleteMany({ userID: userID });
      request.flash('successMessage', "تم مسح السجل بنجاح.");
      return response.redirect('/account-management');
    } catch (error) {
      request.flash('errorMessage', "حدث خطأ أثناء مسح السجل. الخطأ: " + error);
      return response.redirect('/account-management');
    }
    
};

// Get request history
const request_history = async (request, response) => {
    const token = request.cookies.auth_token;
    let userID = null;
    try {
        userID = jwt.decode(token, secretKey)['id'];
    } catch (error) {
        response.clearCookie('auth_token');
        return response.status(401).render('error', { errormessage: 'Invalid authentication token. Please log in again. If this happens again please contact us.' });
    }
    const history = await Request.find({ userID: userID });

    // Modify each history item to include only specific fields
    const modifiedHistory = await Promise.all(history.map(async (item) => {
        const modifiedItem = {
            type: item.type,
            createdAt: item.createdAt,
            link: item.link
        };

        // Modify report and modifiedHTML using getSecureUrlFromCloudinary
        if (item.report) {
            modifiedItem.report = await getSecureUrlFromCloudinary(item.report);
        }
        if (item.modifiedHTML) {
            modifiedItem.modifiedHTML = await getSecureUrlFromCloudinary(item.modifiedHTML);
        }

        return modifiedItem;
    }));

    return response.render('history', { requests: modifiedHistory });
};

// Method to get the secure URL of an uploaded file
const getSecureUrlFromCloudinary = async (publicId) => {
    try {
        // Generate the secure URL
        const secureUrl = cloudinary.url(publicId, {
            resource_type: 'raw',
            secure: true
        });
        return secureUrl;
    } catch (error) {
        console.error('Error getting secure URL:', error);
        throw error;
    }
};


// Set the view engine to EJS with the views folder as the default location
app.set('views', path.join(__dirname, 'Views'));
app.set('view engine', 'ejs');

// This method calls the python script to perform validation of a the provided website's URL accessibility
// An example of how it would be called
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// validateWebsiteAccessibility("Websift.com", "basic", request, response);
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
async function validateWebsiteAccessibility(link, typeOfRequest, request, response) {
  if (!isValidLink(link)) {
    request.flash('errorMessage', "الرجاء التأكد من صحة الرابط المدخل.");
    return response.redirect('/services');
  }

  let isResponseSent = false;
  let on_data_results = '';

  // Strip the URL to be from https://www.example.com/search/ar to example.com
  var strippedURL = link.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
  const requestID = "REQ"+uuidv4();
  const { spawn } = require("child_process");
  const pythonProcess = spawn("python", ["Websift_Modules/main.py", link, typeOfRequest, requestID]);

  pythonProcess.stdout.on("data", (data) => {
    on_data_results += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    if (isResponseSent) {
      return;
    }
  });

  pythonProcess.on("close", (code) => {
    // Check if the response has already been sent or the code exited is not 0 "which means an error occured"
    if(isResponseSent){
      return;
    } else if (code !== 0) {
      isResponseSent = true;
      return response.render('error', {errormessage: "Error parsing Python script output code:" + code});
    }

    // Try to parse the results from the python script and check if there is an error
    try {
      if (JSON.parse(on_data_results).error) {
        isResponseSent = true;
        return response.render('error', {errormessage: JSON.parse(on_data_results).error});
      }
    } catch (error) {
      isResponseSent = true;
      return response.render('error',{errormessage: "Error parsing Python script output, Error:" + error});
    }
    const python_analysis_results = JSON.parse(on_data_results);

    // Catch the path of files and validating their existance
    try {
      if(python_analysis_results.file_path){
        var root_exist = fs.existsSync(path.resolve(python_analysis_results.file_path));
        if (!root_exist) {
          isResponseSent = true;
          return response.render('error', {errormessage: "Error in creating your files."});
        }
        let temp_root = path.resolve(python_analysis_results.file_path);
        var analysis_exist = fs.existsSync(path.join(temp_root, 'JSON/analysis_results.json'));
        if (!analysis_exist) {
          isResponseSent = true;
          return response.render('error', {errormessage: "Error in creating your analysis file."});
        }
        var report_exist = fs.existsSync(path.join(temp_root, 'Report/accessibility_report.pdf'));
        if (!report_exist) {
          isResponseSent = true;
          return response.render('error', {errormessage: "Error in creating your report file."});
        }
        var original_html_exist = fs.existsSync(path.join(temp_root, 'HTML/original.html'));
        if (!original_html_exist) {
          isResponseSent = true;
          return response.render('error', {errormessage: "Error in storing your original html file."});
        }
        var fixed_html_exist = fs.existsSync(path.join(temp_root, 'HTML/fixed.html'));
        if (typeOfRequest === 'premium' && !fixed_html_exist) {
          isResponseSent = true;
          return response.render('error', {errormessage: "Error in storing your fixed html file."});
        }
      }
    } catch (error) {
      isResponseSent = true;
      return response.render('error',{errormessage: "Error parsing Python script output, Error:" + error});
    }
    const rootPath = path.resolve(python_analysis_results.file_path);
    const jsonFilePath = path.join(rootPath, 'JSON', 'analysis_results.json');
    const reportFilePath = path.join(rootPath, 'Report', 'accessibility_report.pdf');
    const originalFilePath = path.join(rootPath, 'HTML', 'original.html');
    // Create fixed const only if the type of request is premium
    const fixedFilePath = typeOfRequest === 'premium' ? path.join(rootPath, 'HTML', 'fixed.html') : null;
    
    // Store the request in the databse and return the analysis page
    fs.readFile(jsonFilePath, 'utf8', async (err, data) => {
      if (err) {
        return response.render('error',{errormessage: err});
      }
      const token = request.cookies.auth_token;
      let userID = null;
      try{
          userID = jwt.decode(token, secretKey)['id'];
      }catch(error){
          return response.render('error',{errormessage: "Invalid token." + error});
      }
      const {reportLink, fixedLink} = await addRequest(userID, requestID, link, typeOfRequest, reportFilePath, fixedFilePath, originalFilePath, jsonFilePath);
      const jsonData = JSON.parse(data);
      const progress = python_analysis_results.progress;
      response.render('results', {resultsFromPython: jsonData, strippedURL: strippedURL, typeOfRequest: typeOfRequest, reportLink: reportLink, fixedLink: fixedLink, progress: progress});
      isResponseSent = true;
      // Delete the file
      fs.rmdir(rootPath, { recursive: true }, (err) => {
        if (err) {
          console.error('Error deleting directory:', rootPath, err);
        }
      });
    });
  });
}


// This method checks if the URL is valid for use or not.
function isValidLink(string) {
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;  
  }
  return url.protocol === "http:" || url.protocol === "https:";
}

module.exports = {
    addRequest,
    request_history,
    validateWebsiteAccessibility,
    isValidLink,
    delete_history
};