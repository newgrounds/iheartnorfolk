// How about we don't completely pollute the global namespace?
var Insta = (function () {
    'use strict';
    
    // Instagram client ID
    var client_id = "d0888d731c7a4dcf8d28d6c019a70bcd";
    // array of pics
    var pics = [];
    // array of favorites
    var favs = new Set();
    // number of favorites to load per page
    var favsToLoad = 16;
    // loaded images
    var numLoaded = 0;
    // currently selected filter
    var currentFilter = "all";
    // dictionary of tags mapped to the url of the next page
    var tagURLs = {};
    // ignore scroll while the screen autoscrolls
    var ignoreScroll = false;
    
    // flip image
    function flip (obj) {
        $(obj.currentTarget).toggleClass('flippy');
    }
    
    // format date from timestamp
    function formatDate (ts) {
        return new Date(ts * 1000);
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
    
    // extend Arrays to be able to push unique items
    Array.prototype.pushUniqueOrdered = function (item) {
        //console.log(item);
        //console.log(item);
        
        // if the array is empty then just add
        if (this.length === 0) {
            this.push(item);
            //downloadImage(item, 0);
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
                //console.log("didn't add duplicate");
                return false;
            }
            
            // find time where it would be inserted
            if (pic.created_time > item.created_time) {
                timeIndex = p + 1;
            }
        }
        
        // no duplicate found, add pic to array at timeIndex
        this.splice(timeIndex, 0, item);
        //downloadImage(item, timeIndex);
        return true;
    };
    
    /*
    * DRAG-DROP BEGIN------------------------------------------------
    */
    // helper for draggable
    function dragHelper (event) {
        var image = $(event.currentTarget).find("img").clone();
        image.addClass("drag-pic");
        //image.
        return image;
    }
    
    // drop handler
    function dropHandler (event, ui) {
        $("#album").removeClass("drop-hover remove");
        
        //console.log(ui);
        var pic_id = JSON.parse($(ui.draggable).attr("storedInfo")).id;
        console.log(pic_id);
        
        // remove if it's in favorites already
        if (favs.has(pic_id)) {
            favs.delete(pic_id);
            
            // remove favorite marking
            $(ui.draggable).removeClass("fav-pic");
        }
        // otherwise add to favorites
        else {
            // push unique images to favorites
            favs.add(pic_id);
            //console.log(JSON.stringify(Array.from(favs)));
            
            // mark as favorite
            $(ui.draggable).addClass("fav-pic");
        }
        
        // store favorites locally
        localStorage.favorites = JSON.stringify(Array.from(favs));
    }
    /*
    * DRAG-DROP END--------------------------------------------------
    */

    /*
    * FILTER BEGIN---------------------------------------------------
    */
    // handle clicks on the different filters
    function filterClick (filter, btn) {
        // bring us back to the top
        $(window).scrollTop();
        
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
        tagURLs.growinteractive = "https://api.instagram.com/v1/users/23299063/media/recent/?client_id=" + client_id;
        
        // keep track of selected filter
        currentFilter = filter;
        
        // show loading spinner
        $(".spinner").css({'opacity': 1});
        
        
        // get number to remove
        var numRemove = $("#image-holder").children().length;
        if (numRemove === 0) {
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
        // ignore scrolls for a bit
        ignoreScroll = true;
        
        // clear pics list
        pics = [];
        numLoaded = 0;
        
        // promises, and they still feel oh so wasted on myself
        var promises = [];
        
        // handle filtering all
        if (currentFilter == "all") {
            // load pics for all filters
            for (var t in tagURLs) {
                promises.push(getInstaPics(t));
                tagURLs[t] = null;
            }
        } else if (currentFilter == "favorites") {
            // load favorites
            promises = loadFavorites();
        } else {
            // load pics for selected filter
            promises.push(getInstaPics(currentFilter));
            tagURLs[currentFilter] = null;
        }
        
        // wait until all queries complete
        $.when.apply(undefined, promises).always(function () {
            //console.log("all promises returned");
            // allow more loading
            ignoreScroll = false;
            
            // download all images
            for (var p = 0; p < pics.length; p++) {
                downloadImage(pics[p]);
            }
        });
    }
    /*
    * FILTER END-----------------------------------------------------
    */
    
    /*
    * DOWNLOAD BEGIN-------------------------------------------------
    */
    // 
    function downloadFavorite (f) {
        return $.ajax({
            dataType: "jsonp",
            url: "https://api.instagram.com/v1/media/" + f + "?client_id=" + client_id,
            success: function (result) {
                // retrieve the image
                if (result.data !== null) {
                    // add unique pic to array based on created_time
                    // this may be combined with other queries
                    pics.pushUniqueOrdered(result.data);
                }
            }
        });
    }
    
    // download favorites
    function loadFavorites () {
        if (favs.size === 0) {
            // TODO: tell people that they can add favorites
            // by dragging images to the icon in the top right
            return [];
        } else if (numLoaded >= favs.size) {
            return [];
        }
        
        // promises for each favorite download
        var downloads = [];
    
        // loop over all favorites, but paginate still
        var favArray = Array.from(favs);
        for (var i = numLoaded; i < Math.min(favs.size, numLoaded + favsToLoad); i++) {
            // download each favorite
            downloads.push(downloadFavorite(favArray[i]));
        }
        
        return downloads;
    }

    // get the instagram pics based on the selected filter
    function getInstaPics (tag) {
        // if we ran out of images for this
        if (tagURLs[tag] === null) {
            return;
        }
        return $.ajax({
            dataType: "jsonp",
            url: tagURLs[tag],
            success: function (result) {
                if (result.data !== null) {
                    //console.log(result.pagination);
                    // iterate over the images
                    for (var d = 0; d < result.data.length; d++) {
                        var pic = result.data[d];
                        //console.log(pic);
                        
                        // add unique pic to array based on created_time
                        // this may be combined with other queries
                        pics.pushUniqueOrdered(pic);
                    }
                }
                // store url of next page
                if (result.pagination === undefined || result.pagination.next_url === undefined) {
                    tagURLs[tag] = null;
                } else {
                    tagURLs[tag] = result.pagination.next_url;
                }
            }
        });
    }
    
    // download image & display
    function downloadImage (item) {
        // image url, use the smaller one so we don't eat up memory
        var url = item.images.low_resolution.url;
        // format date
        var date = Insta.formatDate(item.created_time);
        
        // create object to hold downloaded image
        var downImage = new Image();
        
        // create divs
        // source for the flip: http://davidwalsh.name/css-flip
        var $container = $("<div>", {class: "flip-container"});
        $container.click(flip);
        // store image details
        $container.attr("storedInfo", JSON.stringify(item));
        // make the image draggable
        $container.draggable({
            cursorAt: { top: 50, left: 50 },
            helper: dragHelper
        });
        
        // check if this is one of our favorites
        if (favs.has(item.id)) {
            $container.addClass("fav-pic");
        }
        
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
        
        // append the image
        $("#temp-holder").append($container);
        
        // show the images once they've all loaded
        downImage.onload = function () {
            numLoaded++;
            
            // sort and display images once they're all loaded
            if (numLoaded >= pics.length) {
                // sort the images in temp-holder
                var sorted = $("#temp-holder").children().sort(function (a, b) {
                    return JSON.parse($(a).attr("storedInfo")).created_time < JSON.parse($(b).attr("storedInfo")).created_time;
                });
                
                // hide loading spinner
                $(".spinner").css({'opacity': 0});
                
                // move all children from temp-holder to image-holder
                sorted.appendTo("#image-holder");
                
                // animate the children... there's something weird about this comment
                // ... especially around halloween
                $.each($("#image-holder").children(), function (index, value) {
                    $(value).addClass("animated fadeIn");
                    // we can do multiple animations this way
                    //$(value).find(".front").addClass("animated pulse");
                    //.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend'
                    //transition: height 0.3s ease, width 0.3s ease;
                });
                
                // I believe we can clear pics here, maybe to save memory
                //pics = [];
            }
        };
        // set source of image object
        downImage.src = url;
    }
    /*
    * DOWNLOAD END---------------------------------------------------
    */
    
    // setup the page
    function setup () {
        // show loading spinner
        $(".spinner").css({'opacity': 1});
        
        // for displaying the sidebar
        $(".ham-menu").click(function () {
            $("#main-nav").toggleClass("target");
        });
        
        // remove transitions from images
        var resizeBeginDebounce = debounce(function () {
            //console.log("removing transitions");
            $(".flip-container").css({'transition': 'none'});
        }, 250, true);
        
        // add transitions back onto images
        var resizeEndDebounce = debounce(function () {
            //console.log("adding transitions");
            $(".flip-container").css({'transition': 'height 0.3s ease, width 0.3s ease'});
        }, 250);
        
        // handlers for window resizing, it's okay, we're debouncing
        $(window).resize(resizeBeginDebounce);
        $(window).resize(resizeEndDebounce);
        
        // determine when we hit the bottom of the page
        $(window).scroll(function () {
            if (ignoreScroll) {
                return;
            }
            if ($(window).scrollTop() == $(document).height() - $(window).height()) {
                //console.log("hit bottom");
                
                // show loading spinner
                $(".spinner").css({'opacity': 1});
                
                // TODO: make sure we don't double load when we have agressive scrollers
                //  ... on second thought I kind of like that it loads a faster
                
                // load more images
                filterHandler();
            }
        });
        
        // make sure localStorage is available
        if(typeof(Storage) !== undefined) {
            // handle drops on the album icon for favoriting
            $("#album").droppable({
                over: function (event, ui) {
                    $("#album").addClass("drop-hover");
                    
                    if (favs.has(JSON.parse($(ui.draggable).attr("storedInfo")).id)) {
                        $("#album").addClass("remove");
                    }
                },
                out: function (event, ui) {
                    $("#album").removeClass("drop-hover remove");
                },
                /*hoverClass: "drop-hover",*/
                drop: dropHandler
            });
            
            // load favorites from localStorage
            var storedFavs = localStorage.favorites;
            if (storedFavs !== null) {
                favs = new Set(JSON.parse(localStorage.favorites));
                //console.log(favs);
            }
        } else {
            console.log("no localStorage support -- favoriting disabled");
            $("#album").hide();
        }
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
