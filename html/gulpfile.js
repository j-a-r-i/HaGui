var gulp = require('gulp'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    inject = require('gulp-inject'),
    inline = require('gulp-inline-source'),
    source = require('vinyl-source-stream'),
    browserify = require('browserify'),
    minify = require('gulp-minify'),
    rename = require('gulp-rename');

var scriptFiles = 'report.js';
var htmlFiles = 'partials/*.html';


gulp.task('javascript', function() {
    return gulp.src(scriptFiles)
        .pipe(minify()) //concat({fileName: "./report_out.js"})
        .pipe(uglify())
        //.pipe(minify())
        .pipe(gulp.dest('./dist'));
});

gulp.task('html', ['javascript'], function() {
    return gulp.src('report.html')
        .pipe(inline())
        .pipe(inject(gulp.src([htmlFiles]),{
            starttag: '<!-- inject:html -->',
            transform: function(filepath, file) {
                var prefix = '<script type="text/ng-template" id="' + filepath.substring(10) + '">';
                var postfix = '</script>';
                return prefix + file.contents.toString('utf8') + postfix;
            }
        }))
        .pipe(gulp.dest('./dist'))
        .on('error', function(error) {
            console.log("ERROR");
        });
});

gulp.task('br', function() {
    var bundleStream = browserify('report.js').bundle()
 
    bundleStream
        .pipe(source('report.js'))
        .pipe(rename('bundle.js'))
        .pipe(gulp.dest('./dist'))
})


gulp.task('default', ['javascript', 'html']);

