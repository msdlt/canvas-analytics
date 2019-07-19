// ==UserScript==
// @name         Canvas-Course-Analytics-Hub
// @namespace    https://github.com/msdlt/canvas-analytics/
// @version      0.1
// @description  Provide a single entry point to Canvas Course analytics, including student resource usage data
// @author       jon.mason@medsci.ox.ac.uk
// @include     /\S+\/courses\/\d+\/users/
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js
// ==/UserScript==

// Based on Brian Reid's (brian.p.reid@dartmouth.edu) work, see http://www.dartmouth.edu/~breid/userscripts
// Which was based on James Jones' work, see https://community.canvaslms.com/docs/DOC-6061

//Note:
//Some aspects of this are considered NOT ROBUST, and liable to break if things change in Canvas
//Such sections have been tagged with "NOT ROBUST"
//These should be the first place to look if this stops working

(function() {
    'use strict';
	
	//Identifier for the Course Options div, that (currently, 2019-07-07) sits on the right hand side of the home page
	//This div contains buttons like "Student view" and "Choose home page", and will be where the analytics hub button is added
	//NOT ROBUST: Identifier could change
	var courseOptionsDivIdentifier = 'div#course_show_secondary div.course-options';

	//IDs and Classes for Canvas content elements
	//NOT ROBUST: These could all change
	var contentWrapperDivIdentifier = 'div#content-wrapper';	//Content wrapper, where analytics hub will be added
	var contentDivIdentifier = 'div#content';	//Content Div, which will be hidden, to be replaced by the analytics hub
	var contentDivClass = "ic-Layout-contentMain";	//Class of the content div, which will also be applied to the analytics hub div
	
 	var courseId = getCourseId();	//Get Course ID
	var openButtonId = 'analytics-hub-open';	//ID for the analytics button
	var analyticsHubDivId = 'analytics-hub';	//ID for the analytics button
	var analyticsHubDivIdentifier = 'div#analytics-hub';	//ID for the analytics button
	
	//Usage Progress IDs need to be in global scope
	var resourceUsageProgressId = 'resource-usage-progress';
	var studentUsageProgressId = 'student-usage-progress';

	$(document).ready(function() {
		//Get home page right hand side course options div
		var homeRightOptionsDiv = $(courseOptionsDivIdentifier);
		
		//Check whether user can see the "View Course Analytics" button, and only add this button if they can
		//NOT ROBUST: URL for identifying this button could change
		//NOT ROBUST: Permissions should not be based on existence of that button
		//TODO: Use API to work out if user is permitted to perform analytics functions
		if(homeRightOptionsDiv.length > 0 && $('a[href="/courses/' + courseId + '/analytics"]', homeRightOptionsDiv).length > 0) {
			//Add button
			var buttonHtml = createButtonHtml(openButtonId);
			homeRightOptionsDiv.append(buttonHtml);
			
			//On click, call openAnalytics
			addOpenButtonClickHandler(openButtonId);
			//$('#' + openButtonId).on('click', function() {openAnalytics();});
		}
	});
	
	function createButtonHtml(openButtonId = null) {
		//Must have a button ID, otherwise create nothing
		if(!openButtonId) {
			return "";
		}
		
		//HTML snippets for creating the button
		//NOT ROBUST: Canvas button format/style could change
		var buttonAnchorTagOpen = '<a class="btn button-sidebar-wide" id="' + openButtonId + '">';
		var buttonIcon = '<i class="icon-analytics" role="presentation"></i> ';
		var buttonText = 'Analytics Hub';
		var buttonAnchorTagClose = '</a>';
		
		var buttonHtml = buttonAnchorTagOpen + buttonIcon + buttonText + buttonAnchorTagClose;
		
		return buttonHtml;
	}
	
	function addOpenButtonClickHandler(buttonId = null) {
		if(buttonId) {
			$('#' + buttonId).on('click', function() {openAnalytics();});
		}
	}
	
	function removeButtonClickHandlers(buttonId = null) {
		if(buttonId) {
			$('#' + buttonId).off('click');
		}
	}
	
	function openAnalytics() { 
		removeButtonClickHandlers(openButtonId);
		//$('#' + openButtonId).off('click');	//Remove click handler from button
		$(contentDivIdentifier).hide();	//Hide the default contentDiv
		
		//Display the Analytics Hub within the content wrapper
		var analyticsHubDiv = '<div id="' + analyticsHubDivId + '" class="' + contentDivClass + '"></div>';
		$(contentWrapperDivIdentifier).prepend(analyticsHubDiv);
		
		//Add the header
		var headerId = 'analyitcs-hub-header';
		var analyticsHubHeader = '<h2 id="' + headerId + '">Analytics Hub</h2>';
		$(analyticsHubDivIdentifier).append(analyticsHubHeader);

		//Add the close button into the header
		var closeButtonId = 'analyitcs-hub-close';
		var analyticsHubCloseButton = '<a id="' + closeButtonId + '" style="float: right; cursor: pointer;"><i class="icon-end" role="presentation"></i></a>';
		$('#' + headerId).prepend(analyticsHubCloseButton);
		$('#' + closeButtonId).on('click', function() {closeAnalytics();});
		
		//Add Course Analytics link
		//NOT ROBUST: The format of these links might change
		var courseAnalyticsHeader = '<h3>Course Analytics</h3>';
		var courseAnalyticsURL = '/courses/' + courseId + '/analytics';
		var courseAnalyticsLink = '<a href="' + courseAnalyticsURL + '" title="Course Analytics" target="_blank">' + courseAnalyticsURL + '</a>';
		var courseAnalyticsExplanation = 'Some text explaining what you see in the Course Analytics';
		var courseAnalyticsHTML = courseAnalyticsHeader + '<p>' + courseAnalyticsLink + '<br />' + courseAnalyticsExplanation + '</p>';
		$(analyticsHubDivIdentifier).append(courseAnalyticsHTML);

		//Add Course Analytics link
		//NOT ROBUST: The format of these links might change
		var courseStatsHeader = '<h3>Course Statistics</h3>';
		var courseStatsURL = '/courses/' + courseId + '/statistics';
		var courseStatsLink = '<a href="' + courseStatsURL + '" title="Course Statistics" target="_blank">' + courseStatsURL + '</a>';
		var courseStatsExplanation = 'Some text explaining what you see in the Course Statistics';
		var courseStatsHTML = courseStatsHeader + '<p>' + courseStatsLink + '<br />' + courseStatsExplanation + '</p>';
		$(analyticsHubDivIdentifier).append(courseStatsHTML);

		//Add Resource & Student Usage Report links
		var resourceUsagesHeader = '<h3>Resource & Student Usage Reports</h3>';
		var resourceUsageLinkId = 'generate-resource-usage';
		var resourceUsageReportLink = '<a id="' + resourceUsageLinkId + '" href="javascript:void(0)">Generate Resource Usage Report</a>';
		var resourceUsageExplanation = 'Some text explaining what you see in the Resource Usage Report';
		var resourceUsageHTML = resourceUsagesHeader + '<p>' + resourceUsageReportLink + '<br />' + resourceUsageExplanation + '<br /><span id="' + resourceUsageProgressId + '"></span></p>';
		$(analyticsHubDivIdentifier).append(resourceUsageHTML);
		$('#' + resourceUsageLinkId).on('click', function() {generateResourceUsageDownload(resourceUsageProgressId);});
		var studentUsageLinkId = 'generate-student-usage';
		var studentUsageReportLink = '<a id="' + studentUsageLinkId + '" href="javascript:void(0)">Generate Student Usage Report</a>';
		var studentUsageExplanation = 'Some text explaining what you see in the Student Usage Report';
		var studentUsageHTML = '<p>' + studentUsageReportLink + '<br />' + studentUsageExplanation + '<br /><span id="' + studentUsageProgressId + '"></span></p>';
		$(analyticsHubDivIdentifier).append(studentUsageHTML);
		$('#' + studentUsageLinkId).on('click', function() {generateStudentUsageDownload(studentUsageProgressId);});
		
		//Add Student-Specific Reports Links
		//NOT ROBUST: The format of these links might change
		var studentReportsHeader = '<h3>Student-Specific Reports</h3>';
		var studentReportsExplanation = '<p>This is just an example, but it would be possible to fetch the list of students in the course, and generate the following links for each student. The links below will only work in Courses where pubh0196+mscstudent@canvas-alias.it.ox.ac.uk (156389) is a student.</p>';
		var exampleAccessReportURL = '/courses/' + courseId + '/users/156389/usage';
		var exampleAccessReportLink = '<a href="' + exampleAccessReportURL + '" title="Example Access Report" target="_blank">' + exampleAccessReportURL + '</a>';
		var exampleAccessReportHTML = '<p>Example Access Report: ' + exampleAccessReportLink + '</p>';
		var exampleStudentAnalyticsReportURL = '/courses/' + courseId + '/analytics/users/156389';
		var exampleStudentAnalyticsLink = '<a href="' + exampleStudentAnalyticsReportURL + '" title="Example Student Analytics" target="_blank">' + exampleStudentAnalyticsReportURL + '</a>';
		var exampleStudentAnalyticsHTML = '<p>Example Student Analytics: ' + exampleAccessReportLink + '</p>';
		$(analyticsHubDivIdentifier).append(studentReportsHeader + studentReportsExplanation + exampleAccessReportHTML + exampleStudentAnalyticsHTML);

		//Add Quiz-Specific Statistics Links
		//NOT ROBUST: The format of these links might change
		var quizStatsHeader = '<h3>Quiz Statistics</h3>';
		var quizStatsExplanation = '<p>This is just an example, but it would be possible to fetch the list of quizzes in the course, and generate the following link for each quiz. The link below will only work for the "End of Module Review: Intro to GHS" quiz (5924) in the "GHSE 01: Introduction to Global Health Science" (4018) course.</p>';
		var exampleQuizStatsURL = '/courses/' + courseId + '/quizzes/5924/statistics';
		var exampleQuizStatsLink = '<a href="' + exampleQuizStatsURL + '" title="Example Quiz Statistics" target="_blank">' + exampleQuizStatsURL + '</a>';
		var exampleQuizStatsHTML = '<p>Example Quiz Statistics: ' + exampleQuizStatsLink + '</p>';
		$(analyticsHubDivIdentifier).append(quizStatsHeader + quizStatsExplanation + exampleQuizStatsHTML);
	};
	
	function closeAnalytics() { 
		$(analyticsHubDivIdentifier).hide();
		$(contentDivIdentifier).show();
		addOpenButtonClickHandler(openButtonId);
	};
	
	// --- Resource & Student Usage Report Variables and Functions

	//Usage Variables
	var csv_text, students_results, student_vector, usage_results, resource_results, student_counter, pending, canvas_user_id, reportType;
	
	var resourceCsvColumns = [ 
		{'column_name': 'Code',         'canvas_name': 'asset_code'           },
		{'column_name': 'Title',          'canvas_name': 'title'     },
		{'column_name': 'Category',       'canvas_name': 'asset_category'    },
		{'column_name': 'Class',          'canvas_name': 'asset_class_name'  },
		{'column_name': 'Unique Viewers',          'canvas_name': 'view_unique'        },
		{'column_name': 'Total Views',          'canvas_name': 'view_total'        },
		{'column_name': 'Unique Participators', 'canvas_name': 'participate_unique' },
		{'column_name': 'Total Participations', 'canvas_name': 'participate_total' },
	];

	var studentCsvColumns = [ 
		{'column_name': 'DisplayName',    'canvas_name': 'name'              },
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
	 
	function generateResourceUsageDownload() {
        //   Starts data collection by getting the students in the course.
        //   saveStudents() will be called for every page of students found.
        //   studentsRetrieved() will be called after all students have been retrieved.
		$('#' + resourceUsageProgressId).text("Getting students... ");

		resetUsageVariables();
		csv_text = generateCSVHeaders(resourceCsvColumns);
        
		reportType = 'resource';
		
		var api_url = "/api/v1/courses/"+courseId+"/users?enrollment_type[]=student&per_page=50";  // the API "endpoint"
        getApiData(api_url, 0, saveStudents, studentsRetrieved);
	}
	
	function generateStudentUsageDownload() {
        //   Starts data collection by getting the students in the course.
        //   saveStudents() will be called for every page of students found.
        //   studentsRetrieved() will be called after all students have been retrieved.
		$('#' + studentUsageProgressId).text("Getting students... ");

		resetUsageVariables();
		csv_text = generateCSVHeaders(studentCsvColumns);
        
		reportType = 'student';
		
		var api_url = "/api/v1/courses/"+courseId+"/users?enrollment_type[]=student&per_page=50";  // the API "endpoint"
        getApiData(api_url, 0, saveStudents, studentsRetrieved);
	}
	
    function resetUsageVariables() {
		csv_text         = "";
		students_results = [];  // Storage for students
		student_vector   = {};  // List of students indexed by canvas_user_id
		usage_results    = {};  // Storage for assignment data
		resource_results = {};  // Storage for results by resource
		student_counter  = 0;
		pending          = -1;  // used for pagination of data returned from Cavnas APIs
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
        var api_url = "/courses/"+courseId+"/users/"+canvas_user_id+"/usage.json?per_page=50";  // the API "endpoint"

		var progressSpanId, writeUsageReportsFunction, usageReportsRetrievedFunction;
		
		if(reportType === 'student') {
			progressSpanId = studentUsageProgressId;
			writeUsageReportsFunction = writeStudentUsageReports;
			usageReportsRetrievedFunction = studentUsageReportsRetrieved;
		}
		else {	//Default to doing resource report
			progressSpanId = resourceUsageProgressId;
			writeUsageReportsFunction = writeResourceUsageReports;
			usageReportsRetrievedFunction = resourceUsageReportsRetrieved;
		}

		$('#' + progressSpanId).text("Getting page views: "+student_counter+" / "+students_results.length);
        getApiData(api_url, canvas_user_id, writeUsageReportsFunction, usageReportsRetrievedFunction);
    }

    function writeResourceUsageReports(dummy_id,usage_data){
        //   Put usage data in usage_results array.
		$('#' + resourceUsageProgressId).text("Collating results");
        Array.prototype.push.apply(usage_results[canvas_user_id],usage_data);

        $.each(usage_data, function(index, data){
			var resource = data.asset_user_access;
			
			if(typeof(resource_results[resource.asset_code]) === "undefined") {
				resource_results[resource.asset_code] = {
					'action_level': resource.action_level,
					'asset_category': resource.asset_category,
					'asset_class_name': resource.asset_class_name != null?resource.asset_class_name:"",
					'asset_code': resource.asset_code,
					'asset_group_code': resource.asset_group_code,
					'title': resource.readable_name,
					'view_unique': 0,
					'view_total': 0,
					'participate_unique': 0,
					'participate_total': 0
				};
			}
			
			//All resources count towards unique views, and have a view_score
			resource_results[resource.asset_code]['view_unique']++;
			resource_results[resource.asset_code]['view_total'] += resource.view_score;
			
			//Only participate resources count towards unique participations and have a participate score
			if(resource.action_level === "participate") {
				resource_results[resource.asset_code]['participate_unique']++;
				resource_results[resource.asset_code]['participate_total'] += resource.participate_score;
			}
        });
    }

	function resourceUsageReportsRetrieved(){
        //  Called after the usage for a student has been found.
        //  Keeps calling getUsageReports until reports for all students have been retreived.
        //  Then write results to output file.
        student_counter++;
        if (student_counter < students_results.length) getUsageReports();
        else {  // We have reports for all students, so we can write the csv file
			console.log(resource_results);
			for(var resourceIndex in resource_results) {
				var resource = resource_results[resourceIndex];
				for (var c in resourceCsvColumns){
					var column_value = resource[resourceCsvColumns[c]["canvas_name"]];
					if (typeof column_value === 'string') {
						if (column_value.indexOf(",") >= 0) column_value = "\""+column_value+"\"";
					}
					if(c > 0) {
						csv_text += ",";
					}
					csv_text += column_value;
				}
				csv_text += "\n";
			}
		
            var csvData = 'data:text/csv;charset=utf-8,\ufeff' + encodeURIComponent(csv_text);
            var download_link = document.createElement('a');
            download_link.style.display = 'none';
            document.body.appendChild(download_link);
            download_link.setAttribute('download', 'resource_usage_report-'+courseId+'.csv');
            download_link.setAttribute('href', csvData);
            download_link.click();
            document.body.removeChild(download_link);
            $('#' + resourceUsageProgressId).html("Done. ");
        }
    }
	
    function writeStudentUsageReports(dummy_id,usage_data){
        //   Put usage data in usage_results array.
		$('#' + studentUsageProgressId).text("Collating results");
        Array.prototype.push.apply(usage_results[canvas_user_id],usage_data);
        $.each(usage_data, function(index, data){
 //           var asset_user_access = data.asset_user_access;
            var action_string = "";
            action_string += "\""+student_vector[data.asset_user_access.user_id]+"\"";
            for (var c = 1; c<studentCsvColumns.length; c++){
                var column_value = data.asset_user_access[studentCsvColumns[c]["canvas_name"]];
                if (typeof column_value === 'string') {
                    if (column_value.indexOf(",") >= 0) column_value = "\""+column_value+"\"";
                }
//                console.log(c+" "+column_value);
                action_string += ","+column_value;
                if (studentCsvColumns[c]['column_name'].indexOf("Access") > 0){
                    var this_date =  new Date(column_value);
                    action_string += ","+dateFormat(this_date, "m/d/yyyy");
                    action_string += ","+dateFormat(this_date, "HH:MM:ss");
                }
            }
            action_string += "\n";
            //$("#us_report_area").append(action_string);
            csv_text += action_string;
        });
    }

	function studentUsageReportsRetrieved(){
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
            download_link.setAttribute('download', 'student_usage_report-'+courseId+'.csv');
            download_link.setAttribute('href', csvData);
            download_link.click();
            document.body.removeChild(download_link);
            //$("#us_console").html("Done. ");
            $('#' + studentUsageProgressId).html("Done. ");
        }
    }
	
	
    // ---- Utility Routines -----

    function generateCSVHeaders(csv_columns) {
		for(var c in csv_columns){
			if(c>0) csv_text += ",";
			csv_text += '"' + csv_columns[c]['column_name'] +'"';
			if (csv_columns[c]['column_name'].indexOf("Access") > 0){
				csv_text += ","+'"' + csv_columns[c]['column_name']+"Date" +'"';
				csv_text += ","+'"' + csv_columns[c]['column_name']+"Time" +'"';
			}
		}
		csv_text += "\n";
		
		return csv_text;
	}

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
        //Get course ID from current URL - from https://github.com/jamesjonesmath/canvancement.
		//NOT ROBUST: URL format could change
		//TODO: Get this from the API??
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
})(this);



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