"use strict";

let projectFolder = require('path').basename(__dirname);
let sourceFolder = "#src";

let path = {
  build: {
    html: projectFolder + "/",
    pug: sourceFolder + "/",
    css: projectFolder + "/css",
    js: projectFolder + "/js",
    img: projectFolder + "/img",
    fonts: projectFolder + "/fonts",
  },

  src: {
    /* следит за файлами html без нижнего подчеркивания (страницами)*/
    html: [sourceFolder + "/*.html", "!" + sourceFolder + "/_*.html"], 
    /* следит за файлами pug без нижнего подчеркивания (страницами)*/
    pug: [sourceFolder + "/pug/*.pug", "!" + sourceFolder + "/_*.pug"], 
    scss: sourceFolder + "/scss/style.scss",
    js: sourceFolder + "/js/script.js",
    img: sourceFolder + "/img/**/*.+(png|jpg|gif|ico|svg|webp)",
    fonts: sourceFolder + "/fonts/*.ttf",
  },

  watch: {
    html: sourceFolder + "/**/*.html",
    scss: sourceFolder + "/scss/**/*.scss",
    js: sourceFolder + "/js/**/*.js",
    pug: sourceFolder + "/**/*.pug",
    img: sourceFolder + "/img/**/*.+(png|jpg|gif|ico|svg|webp)",
  },

  clean: "./" + projectFolder + "/",
};

let { src, dest } = require("gulp"),
  fs = require("fs"),
  gulpPug = require('gulp-pug'),
  gulp = require("gulp"),
  browsersync = require("browser-sync").create(),
  fileinclude = require("gulp-file-include"),
  del = require("del"),
  sass = require("gulp-sass")(require("sass")),
  autoprefixer = require("gulp-autoprefixer"),
  groupMedia = require("gulp-group-css-media-queries"),
  cleanCss = require("gulp-clean-css"),
  rename = require("gulp-rename"),
  uglify = require("gulp-uglify-es").default,
  imagemin = require("gulp-imagemin"),
  webp = require("gulp-webp"),
  webpHtml = require("gulp-webp-html"),
  webpcss = require("gulp-webpcss"),
  babel = require("gulp-babel"),
  ttf2woff = require("gulp-ttf2woff"),
  ttf2woff2 = require("gulp-ttf2woff2"),
  fonter = require("gulp-fonter"),
  sourcemaps = require("gulp-sourcemaps");

function browserSync() {
  browsersync.init({
    server: {
      baseDir: "./" + projectFolder + "/",
    },
    port: 3000,
    notify: false,
  });
}

function html() {
  return src(path.src.html)
    .pipe(fileinclude())
    .pipe(webpHtml())
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream());
}

/*Для работы с Pug(Jade) создать папку pug*/

function pug() {
  if (src(path.src.pug)) {
     return src(path.src.pug)
  .pipe(gulpPug({
    pretty: true
  }))
  .pipe(dest(path.build.pug))
  .pipe(browsersync.stream());
  }
   return ;
}

function css() {
  return src(path.src.scss)
    .pipe(sourcemaps.init())
    .pipe(sass().on("error", sass.logError))
    .pipe(groupMedia())
    .pipe(
      autoprefixer({
        overrideBrowserslist: ["last 5 versions"],
        cascade: true,
      })
    )
    .pipe(sourcemaps.write())
    .pipe(webpcss({ webpClass: ".webp", noWebpClass: ".no-webp" }))
    .pipe(dest(path.build.css))
    .pipe(cleanCss())
    .pipe(
      rename({
        extname: ".min.css",
      })
    )
    .pipe(sourcemaps.write())
    .pipe(dest(path.build.css))
    .pipe(browsersync.stream());
}

function js() {
  return src(path.src.js)
    .pipe(fileinclude())
    .pipe(
      babel({
        presets: ["@babel/env"],
      })
    )
    .pipe(dest(path.build.js))
    .pipe(uglify())
    .pipe(
      rename({
        extname: ".min.js",
      })
    )
    .pipe(dest(path.build.js))
    .pipe(browsersync.stream());
}

function images() {
  return src(path.src.img)
    .pipe(
      webp({
        quality: 70,
      })
    )
    .pipe(dest(path.build.img))
    .pipe(src(path.src.img))
    .pipe(
      imagemin({
        progressive: true,
        svgoPlugins: [
          {
            removeViewBox: true,
          },
        ],
        interlaced: true,
        optimizationLevel: 3, // 0 to 7
      })
    )
    .pipe(dest(path.build.img))
    .pipe(browsersync.stream());
}

function fonts() {
  src(path.src.fonts).pipe(ttf2woff()).pipe(dest(path.build.fonts));
  return src(path.src.fonts).pipe(ttf2woff2()).pipe(dest(path.build.fonts));
}

gulp.task("otf2ttf", function () {
  return src([sourceFolder + "/fonts/*.otf"])
    .pipe(
      fonter({
        formats: ["ttf"],
      })
    )
    .pipe(dest(sourceFolder + "/fonts"));
});

function cb() {}

function fontsStyle() {
  let fileContent = fs.readFileSync(sourceFolder + "/scss/accesse/fonts.scss");
  if (fileContent == "") {
    fs.writeFile(sourceFolder + "/scss/accesse/fonts.scss", "", cb);
    return fs.readdir(path.build.fonts, function (err, items) {
      if (items) {
        let Cfontname;
        for (var i = 0; i < items.length; i++) {
          let fontname = items[i].split(".");
          fontname = fontname[0];
          if (Cfontname != fontname) {
            fs.appendFile(
              sourceFolder + "/scss/accesse/fonts.scss",
              '@include font("' +
                fontname +
                '", "' +
                fontname +
                '", "400", "normal");\r\n',
              cb
            );
          }
          Cfontname = fontname;
        }
      }
    });
  }
}

function watchFiles() {
  gulp.watch([path.watch.pug], pug);
  gulp.watch([path.watch.html], html);
  gulp.watch([path.watch.scss], css);
  gulp.watch([path.watch.js], js);
  gulp.watch([path.watch.img], images);
}

function clean() {
  return del(path.clean);
}

let build = gulp.series(
  clean, pug, html,
  gulp.parallel(fonts, css,  images, js),
  fontsStyle
);

let watch = gulp.parallel(
  browserSync,
  watchFiles,
  build
);

exports.pug = pug;
exports.fontsStyle = fontsStyle;
exports.html = html;
exports.css = css;
exports.js = js;
exports.images = images;
exports.build = build;
exports.watch = watch;
exports.default = watch;
