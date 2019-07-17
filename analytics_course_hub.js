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
	
 	var course_id = getCourseId();	//Get Course ID
	var buttonId = 'analytics_button';	//ID for the analytics button
	
	$(document).ready(function() {
		//Get home page right hand side course options div
		var homeRightOptionsDiv = $(courseOptionsDivIdentifier);
		
		//Check whether user can see the "View Course Analytics" button, and only add this button if they can
		//NOT ROBUST: URL for identifying this button could change
		//NOT ROBUST: Permissions should not be based on existence of that button
		//TODO: Use API to work out if user is permitted to perform analytics functions
		if(homeRightOptionsDiv.length > 0 && $('a[href="/courses/' + course_id + '/analytics"]', homeRightOptionsDiv).length > 0) {
			//Add button
			var buttonHtml = createButtonHtml(buttonId);
			homeRightOptionsDiv.append(buttonHtml);
			
			//On click, call openAnalytics
			$('#' + buttonId).bind('click', function() {openAnalytics();});
		}
	});
	
	function createButtonHtml(buttonId = null) {
		//Must have a button ID, otherwise create nothing
		if(!buttonId) {
			return "";
		}
		
		//HTML snippets for creating the button
		//NOT ROBUST: Canvas button format/style could change
		var buttonAnchorTagOpen = '<a class="btn button-sidebar-wide" id="' + buttonId + '">';
		var buttonIcon = '<i class="icon-analytics" role="presentation"></i> ';
		var buttonText = 'Advanced Analytics';
		var buttonAnchorTagClose = '</a>';
		
		var buttonHtml = buttonAnchorTagOpen + buttonIcon + buttonText + buttonAnchorTagClose;
		
		return buttonHtml;
	}
	
	function openAnalytics() { 
		alert("analytics opened");
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