// How about we don't completely pollute the global namespace?
var Insta = (function () {
    'use strict';
    
    var client_id = "d0888d731c7a4dcf8d28d6c019a70bcd";
    
    var filters = "";

    // handle clicks on the different filters
    var filterClick = function (filter) {
        // set selected filter
        
        
        // reload pics
        getInstaPics();
    };

    // get the instagram pics based on the selected filter
    var getInstaPics = function () {
        $.ajax({
            dataType: "jsonp",
            url: "https://api.instagram.com/v1/tags/norfolkva/media/recent?client_id=" + client_id,
            success: function (result) {
                //$("#div1").html(result);
                if (result.data !== null) {
                    // iterate over the images
                    for (var d in result.data) {
                        var pic = result.data[d].images.low_resolution.url;
                        console.log(pic);
                        
                        // add to a list -- may be combined with other queries
                        
                        // de-duplicate list
                        
                        // sort list by created_time
                    }
                }
            }
        });
    };
    
    // return things that need to be accessible in the HTML
    return {
        filterClick: filterClick,
        getInstaPics: getInstaPics
    };
})();
