// How about we don't completely pollute the global namespace?
var Insta = (function () {
    'use strict';
    
    // Instagram client ID
    var client_id = "d0888d731c7a4dcf8d28d6c019a70bcd";
    
    // array of pics
    var pics = [];
    
    // loaded images
    var numLoaded = 0;
    
    // currently selected filter
    var currentFilter = "all";
    
    // dictionary of tags mapped to the url of the next page
    var tagURLs = {};
    
    // flip image
    function flip (obj) {
        $(obj.currentTarget).toggleClass('flippy');
    }
    
    // format date from timestamp
    function formatDate (ts) {
        return new Date(ts * 1000);
    }
    
    // download image & display
    function downloadImage (item, pos) {
        console.log(pos);
        // image url, use the smaller one so we don't eat up memory
        var url = item.images.low_resolution.url;
        // format date
        var date = Insta.formatDate(item.created_time);
        
        // create object to hold downloaded image
        var downImage = new Image();
        //$(downImage).hide();
        //$("#image-holder").hide();
        
        // create divs
        // source for the flip: http://davidwalsh.name/css-flip
        var $container = $("<div>", {class: "flip-container"});
        $container.click(flip);
        var $flipper = $("<div>", {class: "flipper"});
        var $front = $("<div>", {class: "front"});
        var $back = $("<div>", {class: "back"});
        
        // fill in content for the back
        var $backContent = $("<div>", {class: "pic-info"});
        // username
        if (item.user) {
            $backContent.append($("<p>"+item.user.username+"</p><br/>"));
        }
        // location
        if (item.location) {
            $backContent.append($("<p>"+item.location.name+"</p><br/>"));
        }
        $backContent.append($("<p>"+date+"</p><br/>"));
        // caption
        if (item.caption) {
            $backContent.append($("<p>"+item.caption.text+"</p>"));
        }
        
        // nest divs
        $front.append(downImage);
        $back.append($backContent);
        $flipper.append($front);
        $flipper.append($back);
        $container.append($flipper);
        //$("#image-holder").append($container);
        
        // place the images in the correct position
        if (pos === 0) {
            $("#temp-holder").prepend($container);
        } else {
            $("#temp-holder > .flip-container:nth-child(" + (pos - 1) + ")").after($container);
        }
        
        // show the images once they've all loaded
        downImage.onload = function () {
            //$(downImage).css('visibility', 'visible');
            numLoaded++;
            
            // sort and display images once they're all loaded
            if (numLoaded >= pics.length) {
                // move all children from temp-holder to image-holder
                $("#temp-holder").children().appendTo("#image-holder");
                
                // animate showing the images
                //$("#image-holder").show().addClass("animated fadeIn");
                
                // animate the children... there's something weird about this comment
                // ... especially around halloween
                $.each($("#image-holder").children(), function (index, value) {
                    $(value).addClass("animated fadeIn");
                    // we can do multiple animations this way
                    //$(value).find(".front").addClass("animated pulse");
                    //.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend'
                    //transition: height 0.3s ease, width 0.3s ease;
                });
            }
        };
        // set source of image object
        downImage.src = url;
    }
    
    // extend Arrays to be able to push unique items
    Array.prototype.pushUniqueOrdered = function (item) {
        console.log(item);
        
        // if the array is empty then just add
        if (this.length === 0) {
            this.push(item);
            downloadImage(item, 0);
            return true;
        }
        
        // index of time where it would be inserted
        var timeIndex = 0;
        
        // iterate over pics
        for (var p = 0; p < this.length; p++) {
            // pic object from array
            var pic = this[p];
            
            // check if pic is already in array
            if (pic.id == item.id) {
                console.log("didn't add duplicate");
                return false;
            }
            
            // find time where it would be inserted
            if (pic.created_time > item.created_time) {
                timeIndex = p + 1;
            }
        }
        
        // no duplicate found, add pic to array at timeIndex
        this.splice(timeIndex, 0, item);
        downloadImage(item, timeIndex);
        return true;
    };

    // handle clicks on the different filters
    function filterClick (filter, btn) {
        // set nav menu button active
        $.each($("#main-nav").children(), function (index, value) {
            $(value).removeClass("active");
        });
        $(btn).addClass("active");
        
        // close nav menu
        $("#main-nav").removeClass("target");
        
        // set urls back to default
        tagURLs.norfolkva = "https://api.instagram.com/v1/tags/norfolkva/media/recent?client_id=" + client_id;
        tagURLs.fieldguidenfk = "https://api.instagram.com/v1/tags/fieldguidenfk/media/recent?client_id=" + client_id;
        tagURLs.growinteractive = "https://api.instagram.com/v1/tags/growinteractive/media/recent?client_id=" + client_id;
        
        // keep track of selected filter
        currentFilter = filter;
        
        // number to remove
        var numRemove = $("#image-holder").children().length;
        
        if (numRemove <= 0) {
            $("#image-holder").empty();
            filterHandler();
        }
        
        // fade out the images before removing
        $.each($("#image-holder").children(), function (index, value) {
            $(value).removeClass("animated fadeIn").addClass("fadeOut");
            $(value).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
                numRemove--;
                // if we've removed all of the images, empty the image holder & load new images
                if (numRemove <= 0) {
                    $("#image-holder").empty();
                    filterHandler();
                }
            });
        });
    }
    
    // just for looping through filters
    function filterHandler () {
        // clear pics list
        pics = [];
        numLoaded = 0;
        
        // handle filtering all
        if (currentFilter == "all") {
            for (var t in tagURLs) {
                getInstaPics(t);
            }
        } else {
            // load pics
            getInstaPics(currentFilter);
        }
    }

    // get the instagram pics based on the selected filter
    function getInstaPics (tag) {
        $.ajax({
            dataType: "jsonp",
            url: tagURLs[tag],
            success: function (result) {
                if (result.data !== null) {
                    console.log(result.pagination);
                    // iterate over the images
                    for (var d = 0; d < result.data.length; d++) {
                        var pic = result.data[d];
                        //console.log(pic);
                        
                        // add unique pic to array based on created_time -- may be combined with other queries
                        pics.pushUniqueOrdered(pic);
                    }
                }
                // store url of next page
                if (result.pagination !== null && result.pagination.next_url !== null) {
                    tagURLs[tag] = result.pagination.next_url;
                }
            }
        });
    }
    
    // Returns a function, that, as long as it continues to be invoked, will not
    // be triggered. The function will be called after it stops being called for
    // N milliseconds. If `immediate` is passed, trigger the function on the
    // leading edge, instead of the trailing.
    function debounce(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }
    
    // setup the page
    function setup () {
        // for displaying the sidebar
        $(".ham-menu").click(function () {
            $("#main-nav").toggleClass("target");
        });
        
        // remove transitions from images
        var resizeBeginDebounce = debounce(function () {
            console.log("removing transitions");
            $(".flip-container").css({'transition': 'none'});
        }, 250, true);
        
        // add transitions back onto images
        var resizeEndDebounce = debounce(function () {
            console.log("adding transitions");
            $(".flip-container").css({'transition': 'height 0.3s ease, width 0.3s ease'});
        }, 250);
        
        $(window).resize(resizeBeginDebounce);
        $(window).resize(resizeEndDebounce);
        
        // determine when we hit the bottom of the page
        $(window).scroll(function () {
            if ($(window).scrollTop() == $(document).height() - $(window).height()) {
                console.log("hit bottom");
                
                // TODO: make sure we don't double load when we have agressive scrollers
                //  ... on second thought I kind of like that it loads a faster
                
                // load more images
                filterHandler();
            }
        });
    }
    
    // return things that need to be accessible in the HTML
    return {
        filterClick: filterClick,
        getInstaPics: getInstaPics,
        flip: flip,
        formatDate: formatDate,
        setup: setup
    };
})();
