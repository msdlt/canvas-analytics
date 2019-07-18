// ==UserScript==
// @name         Canvas-People-Get_Student_Access_Data
// @namespace    http://www.dartmouth.edu/~breid/userscripts
// @version      0.8
// @description  Find the usage data for all students in a Canvas course
// @author       brian.p.reid@dartmouth.edu
// @include     /\S+\/courses\/\d+\/users/
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js
// ==/UserScript==

// Based on James Jones work, see https://community.canvaslms.com/docs/DOC-6061

(function() {
    'use strict';
    // Set up columns that will be written to csv file.
    // Two additional columns will be added to the date-time columns, one for the date alone and one for the time alone, for convenience in analysis)
    var csv_columns = [ {'column_name': 'DisplayName',    'canvas_name': 'name'              },
                        {'column_name': 'UserID',         'canvas_name': 'user_id'           },
                        {'column_name': 'Category',       'canvas_name': 'asset_category'    },
                        {'column_name': 'Class',          'canvas_name': 'asset_class_name'  },
                        {'column_name': 'Title',          'canvas_name': 'readable_name'     },
                        {'column_name': 'Views',          'canvas_name': 'view_score'        },
                        {'column_name': 'Participations', 'canvas_name': 'participate_score' },
                        {'column_name': 'LastAccess',     'canvas_name': 'last_access',      },
                        {'column_name': 'FirstAccess',    'canvas_name': 'created_at',       },
                        {'column_name': 'Action',         'canvas_name': 'action_level'      }
                     ];
    // Create the header row for the csv file
    var csv_text         = "";
    for (var c = 0; c< csv_columns.length; c++){
        if(c>0) csv_text += ",";
        csv_text += '"' + csv_columns[c]['column_name'] +'"';
        if (csv_columns[c]['column_name'].indexOf("Access") > 0){
            csv_text += ","+'"' + csv_columns[c]['column_name']+"Date" +'"';
            csv_text += ","+'"' + csv_columns[c]['column_name']+"Time" +'"';
        }
    }
    csv_text += "\n";
  //  Student,UserID,created_at,last_access,asset_category,view_score,participate_score,action_level,display_name \n";

	var defaultButtonText = '<i class="icon-analytics" role="presentation"></i> Student Usage Report';
  
    var students_results = [];  // Storage for students
    var student_vector   = {};  // List of students indexed by canvas_user_id
    var usage_results    = {};  // Storage for assignment data
    var student_counter  = 0;
  	var pending          = -1;  // used for pagination of data returned from Cavnas APIs
 	var course_id        = getCourseId(); // getCourseID gets the ID from the current page URL
    var canvas_user_id;

    // Create a button to start the process; the button is shaded green to stand out from standard Canvas controls.
    //if ($('#us_button').length === 0) { // Check to see if us_button is already created; if not, add it.
    //    setTimeout(add_button,500);     // Wait half a sec to let Canvas load everything, and then add a button.
    //}
    //function add_button(){
		
	$(document).ready(function() {
		//Get home page right hand side course options div
		var homeRightOptionsDiv = $('div#course_show_secondary div.course-options');
		
		//Check whether user can see the "View Course Analytics" button, and only add this button if they can
		if(homeRightOptionsDiv.length > 0 && $('a[href="/courses/' + course_id + '/analytics"]', homeRightOptionsDiv).length > 0) {
			//Add button
			homeRightOptionsDiv.append('<a class="btn button-sidebar-wide" id="us_button">' + defaultButtonText + '</a>');
			
			//On click, call getStudents
			$('#us_button').bind('click', function() {getStudents();});
		}
        
		
        //$('#tab-0').prepend('<a id="us_button" class="btn button-sidebar-wide"><i>Userscript</i>: Get Student Usage Data</a>');  // append new button to the element with id=tab-0
		//$('#us_button').bind('click', function() {startProcess();});
        // clicking the button will start the process of getting the usage data, by getting students and then usage for each student.
        //$('#us_button').css("margin","0.5em");
        //$('#us_button').css("background","#BBEEDD");
	});

    /*function startProcess(){
        //   Starts data collection
        //   Include a pop-up panel to report progress.
        var panel_string  = '';
        panel_string += ' <div      id="us_popup_panel" style="position:fixed; top:30%; left:20%; padding:1em; background:#BBEEDD; border-radius:5px; z-index:777;"> ';
        panel_string += ' <p id="us_console_title" style="background:#ABCDEF; padding-left:0.5em; color:#000000; font-weight:bold;">Userscript: Get Student Usage in Course</p> ';
        panel_string += ' <p        id="us_console" style="background:#FEDCBA; padding-left:0.5em;"></p> ';
        panel_string += ' <textarea id="us_report_area" rows="4" style="width: 30em;">'+csv_text+'</textarea>';
        panel_string += ' <button   id="us_start_button" type="button" style="cursor:pointer; margin: 1em 1em 0; border:1px outset buttonface;">Start</button> ';
        panel_string += ' <button id="us_close_button" type="button" style="cursor:pointer; margin: 1em 1em 0; border:1px outset buttonface;">Close</button>  </div> ';
        $("body").append (panel_string);
        $("#us_close_button").click ( function () {
            $("#us_popup_panel").hide ();
        } );
         $("#us_start_button").click ( function () {
            getStudents ();  // First real data collection is to get the students in the course
        } );
    }*/

    function getStudents(){
        //   Starts data collection by getting the students in the course.
        //   saveStudents() will be called for every page of students found.
        //   studentsRetrieved() will be called after all students have been retrieved.
        //$("#us_console").html("Getting students... ");
		$("#us_button").text("Getting students... ");
		
        var api_url = "/api/v1/courses/"+course_id+"/users?enrollment_type[]=student&per_page=50";  // the API "endpoint"
        getApiData(api_url, 0, saveStudents, studentsRetrieved);
    }

    function saveStudents(dummy_id,page_data){
        //   Save student enrollments in students_results array.
        Array.prototype.push.apply(students_results,page_data);
    }

	function studentsRetrieved(){
        //   All students have been found. Associate student names with ids in an object.
        $.each(students_results, function(index, student){
            student_vector[student.id] = student.sortable_name;
        });
        getUsageReports();   // get the usage reports for the set of students
	}

    function getUsageReports(){
        //   writeUsageReports() will be called for every page of assignments found.
        //   usageReportsRetrieved() will be called after all asignments have been retrieved for a student.
        canvas_user_id = students_results[student_counter].id;
        usage_results[canvas_user_id] = [];
        var api_url = "/courses/"+course_id+"/users/"+canvas_user_id+"/usage.json?per_page=50";  // the API "endpoint"
        //$("#us_console").html("Getting page views for student "+student_counter+" / "+students_results.length);
		$("#us_button").text("Getting page views: "+student_counter+" / "+students_results.length);
        getApiData(api_url, canvas_user_id, writeUsageReports, usageReportsRetrieved);
    }

    function writeUsageReports(dummy_id,usage_data){
        //   Put usage data in usage_results array.
        //$("#us_console_log").html("Collecting usage_results...");
		$("#us_button").text("Collating results: "+student_counter+" / "+students_results.length);
        Array.prototype.push.apply(usage_results[canvas_user_id],usage_data);
        $.each(usage_data, function(index, data){
 //           var asset_user_access = data.asset_user_access;
            var action_string = "";
            action_string += "\""+student_vector[data.asset_user_access.user_id]+"\"";
            for (var c = 1; c<csv_columns.length; c++){
                var column_value = data.asset_user_access[csv_columns[c]["canvas_name"]];
                if (typeof column_value === 'string') {
                    if (column_value.indexOf(",") >= 0) column_value = "\""+column_value+"\"";
                }
//                console.log(c+" "+column_value);
                action_string += ","+column_value;
                if (csv_columns[c]['column_name'].indexOf("Access") > 0){
                    var this_date =  new Date(column_value);
                    action_string += ","+dateFormat(this_date, "m/d/yyyy");
                    action_string += ","+dateFormat(this_date, "HH:MM:ss");
                }
            }
            action_string += "\n";
            $("#us_report_area").append(action_string);
            csv_text += action_string;
        });
    }

	function usageReportsRetrieved(){
        //  Called after the usage for a student has been found.
        //  Keeps calling getUsageReports until reports for all students have been retreived.
        //  Then write results to output file.
        student_counter++;
        if (student_counter < students_results.length) getUsageReports();
        else {  // We have reports for all students, so we can write the csv file
            var csvData = 'data:text/csv;charset=utf-8,\ufeff' + encodeURIComponent(csv_text);
            var download_link = document.createElement('a');
            download_link.style.display = 'none';
            document.body.appendChild(download_link);
            download_link.setAttribute('download', 'student_usage_report-'+course_id+'.csv');
            download_link.setAttribute('href', csvData);
            download_link.click();
            document.body.removeChild(download_link);
            //$("#us_console").html("Done. ");
			$("#us_button").html(defaultButtonText);
        }
    }

    // ---- Utility Routines -----

	function getApiData(api_url, call_id, page_function, return_function) {
        //   Implementation of API call to Canvas using jQuery.
        //   api_url = url (or endpoint) of the API.
        //   call_id = integer used to identify the call.
        //   page_function(call_id, data) = function to call after each page of data is retrieved.
        //   return_function(call_id) = function to call when done.
		try {
			pending++;
 			$.getJSON(api_url, function (the_data, status, jqXHR) {
 				page_function(call_id, the_data);                    // Do something with this page of data.
                api_url = nextURL(jqXHR.getResponseHeader('Link'));  // Make sure we get all pages of data.
				if (api_url) getApiData(api_url, call_id, page_function, return_function);  // If there is a link in the header, call this routine recursively.
				pending--;
				if (pending < 0) return_function(call_id);           // Call this function when completely done.
			}).fail(function () {
				pending--;
				return_function(call_id);
				throw new Error('Failed to get API data '+api_url);
			});
		}
    	catch (e) { console.log(e); alert(e); }
	}

    function nextURL(linkTxt) {
        //   Test for paginated data - from https://github.com/jamesjonesmath/canvancement.
        var n_url = null;
        if (linkTxt) {
            var links = linkTxt.split(',');
            var nextRegEx = new RegExp('^<(.*)>; rel="next"$');
            for (var i = 0; i < links.length; i++) {
                var matches = nextRegEx.exec(links[i]);
                if (matches) { n_url = matches[1]; }
            }
        }
        return n_url;
    }

    function getCourseId() {
        //   Get course ID from current URL - from https://github.com/jamesjonesmath/canvancement.
        var courseId = "";
        try {
            var courseRegex = new RegExp('/courses/([0-9]+)');
            var matches = courseRegex.exec(window.location.href);
            if (matches) { courseId = matches[1]; }
            else { throw new Error('Unable to detect Course ID'); }
        }
        catch (e) { errorHandler(e); }
        return courseId;
    }

})();

// Date Format utility routine

/*
 * Date Format 1.2.3
 * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
 * MIT license
 *
 * Includes enhancements by Scott Trenda <scott.trenda.net>
 * and Kris Kowal <cixar.com/~kris.kowal/>
 *
 * Accepts a date, a mask, or a date and a mask.
 * Returns a formatted version of the given date.
 * The date defaults to the current date/time.
 * The mask defaults to dateFormat.masks.default.
 */

(function(global) {
  'use strict';

  var dateFormat = (function() {
      var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZWN]|'[^']*'|'[^']*'/g;
      var timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g;
      var timezoneClip = /[^-+\dA-Z]/g;

      // Regexes and supporting functions are cached through closure
      return function (date, mask, utc, gmt) {

        // You can't provide utc if you skip other args (use the 'UTC:' mask prefix)
        if (arguments.length === 1 && kindOf(date) === 'string' && !/\d/.test(date)) {
          mask = date;
          date = undefined;
        }

        date = date || new Date;

        if(!(date instanceof Date)) {
          date = new Date(date);
        }

        if (isNaN(date)) {
          throw TypeError('Invalid date');
        }

        mask = String(dateFormat.masks[mask] || mask || dateFormat.masks['default']);

        // Allow setting the utc/gmt argument via the mask
        var maskSlice = mask.slice(0, 4);
        if (maskSlice === 'UTC:' || maskSlice === 'GMT:') {
          mask = mask.slice(4);
          utc = true;
          if (maskSlice === 'GMT:') {
            gmt = true;
          }
        }

        var _ = utc ? 'getUTC' : 'get';
        var d = date[_ + 'Date']();
        var D = date[_ + 'Day']();
        var m = date[_ + 'Month']();
        var y = date[_ + 'FullYear']();
        var H = date[_ + 'Hours']();
        var M = date[_ + 'Minutes']();
        var s = date[_ + 'Seconds']();
        var L = date[_ + 'Milliseconds']();
        var o = utc ? 0 : date.getTimezoneOffset();
        var W = getWeek(date);
        var N = getDayOfWeek(date);
        var flags = {
          d:    d,
          dd:   pad(d),
          ddd:  dateFormat.i18n.dayNames[D],
          dddd: dateFormat.i18n.dayNames[D + 7],
          m:    m + 1,
          mm:   pad(m + 1),
          mmm:  dateFormat.i18n.monthNames[m],
          mmmm: dateFormat.i18n.monthNames[m + 12],
          yy:   String(y).slice(2),
          yyyy: y,
          h:    H % 12 || 12,
          hh:   pad(H % 12 || 12),
          H:    H,
          HH:   pad(H),
          M:    M,
          MM:   pad(M),
          s:    s,
          ss:   pad(s),
          l:    pad(L, 3),
          L:    pad(Math.round(L / 10)),
          t:    H < 12 ? 'a'  : 'p',
          tt:   H < 12 ? 'am' : 'pm',
          T:    H < 12 ? 'A'  : 'P',
          TT:   H < 12 ? 'AM' : 'PM',
          Z:    gmt ? 'GMT' : utc ? 'UTC' : (String(date).match(timezone) || ['']).pop().replace(timezoneClip, ''),
          o:    (o > 0 ? '-' : '+') + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
          S:    ['th', 'st', 'nd', 'rd'][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10],
          W:    W,
          N:    N
        };

        return mask.replace(token, function (match) {
          if (match in flags) {
            return flags[match];
          }
          return match.slice(1, match.length - 1);
        });
      };
    })();

  dateFormat.masks = {
    'default':               'ddd mmm dd yyyy HH:MM:ss',
    'shortDate':             'm/d/yy',
    'mediumDate':            'mmm d, yyyy',
    'longDate':              'mmmm d, yyyy',
    'fullDate':              'dddd, mmmm d, yyyy',
    'shortTime':             'h:MM TT',
    'mediumTime':            'h:MM:ss TT',
    'longTime':              'h:MM:ss TT Z',
    'isoDate':               'yyyy-mm-dd',
    'isoTime':               'HH:MM:ss',
    'isoDateTime':           'yyyy-mm-dd\'T\'HH:MM:sso',
    'isoUtcDateTime':        'UTC:yyyy-mm-dd\'T\'HH:MM:ss\'Z\'',
    'expiresHeaderFormat':   'ddd, dd mmm yyyy HH:MM:ss Z'
  };

  // Internationalization strings
  dateFormat.i18n = {
    dayNames: [
      'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat',
      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    ],
    monthNames: [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
    ]
  };

function pad(val, len) {
  val = String(val);
  len = len || 2;
  while (val.length < len) {
    val = '0' + val;
  }
  return val;
}

/**
 * Get the ISO 8601 week number
 * Based on comments from
 * http://techblog.procurios.nl/k/n618/news/view/33796/14863/Calculate-ISO-8601-week-and-year-in-javascript.html
 *
 * @param  {Object} `date`
 * @return {Number}
 */
function getWeek(date) {
  // Remove time components of date
  var targetThursday = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  // Change date to Thursday same week
  targetThursday.setDate(targetThursday.getDate() - ((targetThursday.getDay() + 6) % 7) + 3);

  // Take January 4th as it is always in week 1 (see ISO 8601)
  var firstThursday = new Date(targetThursday.getFullYear(), 0, 4);

  // Change date to Thursday same week
  firstThursday.setDate(firstThursday.getDate() - ((firstThursday.getDay() + 6) % 7) + 3);

  // Check if daylight-saving-time-switch occured and correct for it
  var ds = targetThursday.getTimezoneOffset() - firstThursday.getTimezoneOffset();
  targetThursday.setHours(targetThursday.getHours() - ds);

  // Number of weeks between target Thursday and first Thursday
  var weekDiff = (targetThursday - firstThursday) / (86400000*7);
  return 1 + Math.floor(weekDiff);
}

/**
 * Get ISO-8601 numeric representation of the day of the week
 * 1 (for Monday) through 7 (for Sunday)
 *
 * @param  {Object} `date`
 * @return {Number}
 */
function getDayOfWeek(date) {
  var dow = date.getDay();
  if(dow === 0) {
    dow = 7;
  }
  return dow;
}

/**
 * kind-of shortcut
 * @param  {*} val
 * @return {String}
 */
function kindOf(val) {
  if (val === null) {
    return 'null';
  }

  if (val === undefined) {
    return 'undefined';
  }

  if (typeof val !== 'object') {
    return typeof val;
  }

  if (Array.isArray(val)) {
    return 'array';
  }

  return {}.toString.call(val)
    .slice(8, -1).toLowerCase();
};

  if (typeof define === 'function' && define.amd) {
    define(function () {
      return dateFormat;
    });
  } else if (typeof exports === 'object') {
    module.exports = dateFormat;
  } else {
    global.dateFormat = dateFormat;
  }
})(this);