const gulp = require('gulp'),
	eslint = require('gulp-eslint'),
	sourcemaps = require('gulp-sourcemaps'),
	closureCompiler = require('google-closure-compiler').gulp(),
	babel = require('gulp-babel'),
	gulpTypescript = require("gulp-typescript"),
	through2 = require('through2'),
	rename = require('gulp-rename'),
	tsProject = gulpTypescript.createProject("tsconfig.json");

let decorator = [
    '/**',
    '----',
    '*',
    '* (c) 2012-2025 Black Label',
    '*',
    '* License: MIT',
    '*/',
    ''
    ];

gulp.task("compile", () => {
	return tsProject
    	.src()
    	.pipe(tsProject())
    	.js
		.pipe(rename('grouped-categories.js'))
		.pipe(through2.obj(async function (file, _encoding, callback) {
			if (file.isBuffer()) {
				let fileContent = file.contents.toString('utf8');
				const removedSpecifiers = [],
					removedPaths = [],
					importPathReg = /import (.+?) from ["'](.+?)["'];/g,
					formattedPathReg = /^highcharts-github\/ts\//,
					exportReg = /\bexport\s*{[^}]*};?/g,
					utilsPathReg = /^.*Utilities.*$/m,
					templatingPathReg = /^.*Templating.*$/m;

				fileContent = fileContent.replace(importPathReg, (_match, specifier, path) => {
					removedSpecifiers.push(specifier);
			   		removedPaths.push(`${path.replace(formattedPathReg, "")}.js`);
			   		return '';
				});

				fileContent = fileContent.replace(
					utilsPathReg,
					'const { merge, pick, objectEach, isNumber, isObject, isString, pInt, format, Tick, Axis, SVGElement } = Highcharts;'
				);
				fileContent = fileContent.replace(templatingPathReg, '');
				fileContent = fileContent.replace(exportReg, '');

		  		const wrappedFileContent = decorator.join('\n') +
`(function (factory) {
	if (typeof module === 'object' && module.exports) {
		module.exports = factory;
	} else {
		factory(Highcharts);
	}
}(function (Highcharts) {
${fileContent}
}));`;
		  		file.contents = Buffer.from(wrappedFileContent, 'utf8');
			}

			this.push(file);
			callback();
	  	}))
		.pipe(gulp.dest('dist'))
		.pipe(sourcemaps.init())
		.pipe(babel({
			presets: ['@babel/preset-env'],
			overrides: [{
				presets: [["@babel/preset-env", { targets: "defaults" }]]
		  	}]
		}))
		.pipe(closureCompiler({
			compilation_level: 'SIMPLE',
			warning_level: 'DEFAULT', // VERBOSE
			language_in: 'ECMASCRIPT_2020',
			language_out: 'ECMASCRIPT_2020',
			output_wrapper: '(function(){\n%output%\n}).call(this)',
			js_output_file: 'grouped-categories.min.js',
			externs: 'compileExterns.js'
		}))
		.pipe(sourcemaps.write('/'))
		.pipe(gulp.dest('dist'))
});

gulp.task('lint', function () {
	return gulp.src(['ts/**/*.ts', '!ts/**/*.d.ts', '!ts/**/*.test.ts'], { allowEmpty: true })
	  	.pipe(eslint())
	  	.pipe(eslint.format())
	  	.pipe(eslint.failAfterError());
});

gulp.task('build', gulp.series('lint', 'compile'));

gulp.task('watch', function () {
  return gulp.watch('ts/*.ts', gulp.parallel(function(cb) {
    gulp.series('compile')(function(err) {
      if (err) console.log('Compile failed:', err.message);
      cb();
    });
  }));
});
