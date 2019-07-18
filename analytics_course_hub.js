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
		
		//Add course analytics header and link
		//NOT ROBUST: The format of these links might change
		var courseAnalyticsHeader = '<h3>Course Analytics</h3>';
		var courseAnalyticsURL = '/courses/' + courseId + '/analytics';
		var courseAnalyticsLink = '<a href="' + courseAnalyticsURL + '" title="Course Analytics" target="_blank">' + courseAnalyticsURL + '</a>';
		var courseAnalyticsExplanation = 'Some text explaining what you see in the Course Analytics';
		var courseAnalyticsHTML = courseAnalyticsHeader + '<p>' + courseAnalyticsLink + '<br />' + courseAnalyticsExplanation + '</p>';
		$(analyticsHubDivIdentifier).append(courseAnalyticsHTML);

		//Add course analytics header and link
		//NOT ROBUST: The format of these links might change
		var courseStatsHeader = '<h3>Course Statistics</h3>';
		var courseStatsURL = '/courses/' + courseId + '/statistics';
		var courseStatsLink = '<a href="' + courseStatsURL + '" title="Course Statistics" target="_blank">' + courseStatsURL + '</a>';
		var courseStatsExplanation = 'Some text explaining what you see in the Course Statistics';
		var courseStatsHTML = courseStatsHeader + '<p>' + courseStatsLink + '<br />' + courseStatsExplanation + '</p>';
		$(analyticsHubDivIdentifier).append(courseStatsHTML);
		
		//Add Student-Specific Reports Header and Links
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

		//Add Quiz-Specific Statistics Header and Links
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