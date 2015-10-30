// How about we don't completely pollute the global namespace?
var Insta = (function () {
    'use strict';
    
    // Instagram client ID
    var client_id = "d0888d731c7a4dcf8d28d6c019a70bcd";
    
    // array of pics
    var pics = [];
    
    // loaded images
    var numLoaded = 0;
    
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
        $("#image-holder").hide();
        
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
            $backContent.append($("<p>"+item.user.username+"</p>"));
        }
        // location
        if (item.location) {
            $backContent.append($("<p>"+item.location.name+"</p>"));
        }
        $backContent.append($("<p>"+date+"</p>"));
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
            $("#image-holder").prepend($container);
        } else {
            $("#image-holder > .flip-container:nth-child(" + (pos - 1) + ")").after($container);
        }
        
        // show the images once they've all loaded
        downImage.onload = function () {
            //$(downImage).css('visibility', 'visible');
            numLoaded++;
            
            // sort and display images once they're all loaded
            if (numLoaded >= pics.length) {
                // animate showing the images
                $("#image-holder").show().addClass("animated fadeIn");
                // messing around with some animations on individual children
                $.each($("#image-holder").children(), function (index, value) {
                    $(value).addClass("animated pulse");
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
    function filterClick (filter) {
        // clear pics list
        pics = [];
        
        // handle filtering all
        if (filter == "all") {
            getInstaPics('norfolkva');
            getInstaPics('fieldguidenfk');
            getInstaPics('growinteractive');
        } else {
            // load pics
            getInstaPics(filter);
        }
    }

    // get the instagram pics based on the selected filter
    function getInstaPics (tag) {
        $.ajax({
            dataType: "jsonp",
            url: "https://api.instagram.com/v1/tags/" + tag + "/media/recent?client_id=" + client_id,
            success: function (result) {
                if (result.data !== null) {
                    // iterate over the images
                    for (var d = 0; d < result.data.length; d++) {
                        var pic = result.data[d];
                        //console.log(pic);
                        
                        // add unique pic to array based on created_time -- may be combined with other queries
                        pics.pushUniqueOrdered(pic);
                    }
                }
            }
        });
    }
    
    // setup the page
    function setup () {
        // for displaying the sidebar
        $(".ham-menu").click(function () {
            $("#main-nav").toggleClass("target");
        });
        
        // determine when we hit the bottom of the page
        $(window).scroll(function(){
            if ($(window).scrollTop() == $(document).height() - $(window).height()) {
                console.log("hit bottom");
                
                // load more images
                
                
                // TODO: make sure we don't double load when we have agressive scrollers
                
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
