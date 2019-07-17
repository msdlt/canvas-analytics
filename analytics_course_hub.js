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
			$('#' + openButtonId).bind('click', function() {openAnalytics();});
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
		var buttonText = 'Advanced Analytics';
		var buttonAnchorTagClose = '</a>';
		
		var buttonHtml = buttonAnchorTagOpen + buttonIcon + buttonText + buttonAnchorTagClose;
		
		return buttonHtml;
	}
	
	function openAnalytics() { 
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
		$('#' + closeButtonId).bind('click', function() {closeAnalytics();});
		
		//Add course analytics header and link
		//NOT ROBUST: The format of these links might change
		var courseAnalyticsHeader = '<h3>Course Analytics</h3>';
		var courseAnalyticsURL = 'https://canvas.ox.ac.uk/courses/' + courseId + '/analytics';
		var courseAnalyticsLink = '<a href="' + courseAnalyticsURL + '" title="Course Analytics" target="_blank">' + courseAnalyticsURL + '</a>';
		var courseAnalyticsExplanation = 'Some text explaining what you see in the Course Analytics';
		var courseAnalyticsHTML = courseAnalyticsHeader + '<p>' + courseAnalyticsLink + '<br />' + courseAnalyticsExplanation + '</p>';
		$(analyticsHubDivIdentifier).append(courseAnalyticsHTML);

		//Add course analytics header and link
		//NOT ROBUST: The format of these links might change
		var courseStatsHeader = '<h3>Course Statistics</h3>';
		var courseStatsURL = 'https://canvas.ox.ac.uk/courses/' + courseId + '/statistics';
		var courseStatsLink = '<a href="' + courseStatsURL + '" title="Course Statistics" target="_blank">' + courseStatsURL + '</a>';
		var courseStatsExplanation = 'Some text explaining what you see in the Course Statistics';
		var courseStatsHTML = courseStatsHeader + '<p>' + courseStatsLink + '<br />' + courseStatsExplanation + '</p>';
		$(analyticsHubDivIdentifier).append(courseStatsHTML);
	};
	
	function closeAnalytics() { 
		$(analyticsHubDivIdentifier).hide();
		$(contentDivIdentifier).show();
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