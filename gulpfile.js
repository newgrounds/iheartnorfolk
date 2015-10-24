var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    sass = require('gulp-sass'),
    connect = require('gulp-connect');

// starts server and injects livereload
gulp.task('connect', function () {
    connect.server({
        port: 8000,
        livereload: true
    });
});

// lint task to keep my JS in check
gulp.task('lint', function () {
    return gulp.src('js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(connect.reload());
});

// compile sass because who has time to do this manually
gulp.task('sass', function () {
    return gulp.src('scss/*.scss')
        .pipe(sass())
        .pipe(gulp.dest('css'))
        .pipe(connect.reload());
});

// watch for html changes
gulp.task('html', function () {
    return gulp.src('*.html')
        .pipe(connect.reload());
});

// look for changes
gulp.task('watch', function () {
    gulp.watch('js/*.js', ['lint']);
    gulp.watch('scss/*.scss', ['sass']);
    gulp.watch('*.html', ['html']);
});

// set default task to do everything
gulp.task('default', ['connect', 'lint', 'sass', 'watch']);
