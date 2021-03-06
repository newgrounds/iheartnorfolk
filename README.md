I hope you enjoy checking out my I Heart Norfolk project.

This was mainly tested in Chrome 46.0.2490.80 (64-bit) on Mac OSX 10.11.1 El Capitan.




Instructions for my own reference:

Create an "I heart Norfolk" demo site.

Note, for the purposes of this test, feel free to only concentrate on a single browser rather than make this fully cross-browser compatible.


Build a page based on the attached Photoshop files.

Pay attention to asset loading and be prepared to discuss the stack and methodology you choose to for your architecture.

Try to use a build tool such as Grunt or Gulp.

Note that our lead developers will be taking a look at your code, not just the delivered web page.

Use the Instagram API to pull in photos:
    tagged with #norfolkva or #fieldguidenfk
    from the growinteractive user account (@growinteractive).

Consolidate photos so that there are no duplicates and sort by newest first.

After the javascript has loaded photos from the API, animate photos onto the screen.

The user should be able to click on a photo, which will animate with a card flip to show details on the back of the photo such as username, location, date, etc.

Paginate results with either links or “infinite scroll” functionality.
(How does pagination handle sorting by newest first? I assume the new images should just be sorted against other new images)

Build asynchronous filters to allow the user to see:
    All
    #norfolkva
    #fieldguidenfk
    @growinteractive

Delivery should include a links to both the staged website and code repository.




Extra Credit:

Allow user to "favorite" photos so that your app remembers selections upon subsequent visits.

Make the "favorite" action tie into Instagram favorites by allowing the user to authenticate via Oauth.

Make favoriting action triggered by dragging photo to a photo album icon.

Make website responsive for mobile.

Follow as many of Google’s Material Design specifications as seem applicable.
    https://www.google.com/design/spec/material-design/introduction.html
