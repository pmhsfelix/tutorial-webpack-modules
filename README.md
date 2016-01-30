# Tutorial on web pack and CommonJS modules

This tutorial shows how to install and use Webpack to bundle CommonJS modules.
It describes how Webpack performs this bundling, namely how modules are loaded and resolved.  

## Installing Webpack

Webpack is based on Node.js, so we start by creating a NPM `package.json` on the current folder.

```
npm init
```

After answering some questions, the result should be something similar to this

```
{
  "name": "tutorial-webpack-modules",
  "version": "0.1.0",
  "description": "Tutorial on Webpack and modules",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/pmhsfelix/tutorial-webpack-modules.git"
  },
  "author": "Pedro Félix",
  "license": "Apache-2.0",
  "bugs": {
    "url": "https://github.com/pmhsfelix/tutorial-webpack-modules/issues"
  },
  "homepage": "https://github.com/pmhsfelix/tutorial-webpack-modules#readme"
}
```

The next step is to install Webpack locally, as a development dependency.

```
npm install webpack --save-dev
```

This command install the `webpack` module as well as its dependencies.
The `webpack` module is recorded as a `devDependency` on the `package.json` file, so that a `npm install` restores it.

```
tutorial-webpack-modules pedro$ cat package.json
{
  ...
  "devDependencies": {
    "webpack": "^1.12.12"
  }
}
```

This command install also creates a `webpack` link in the `node_modules/.bin` folder pointing to the `webpack` command line interface (CLI).

```
tutorial-webpack-modules pedro$ ls -l node_modules/.bin
total 64
lrwxr-xr-x  1 pedro  staff  15 Jan 30 11:34 errno -> ../errno/cli.js
lrwxr-xr-x  1 pedro  staff  25 Jan 30 11:34 esparse -> ../esprima/bin/esparse.js
lrwxr-xr-x  1 pedro  staff  28 Jan 30 11:34 esvalidate -> ../esprima/bin/esvalidate.js
lrwxr-xr-x  1 pedro  staff  19 Jan 30 11:34 json5 -> ../json5/lib/cli.js
lrwxr-xr-x  1 pedro  staff  20 Jan 30 11:34 mkdirp -> ../mkdirp/bin/cmd.js
lrwxr-xr-x  1 pedro  staff  16 Jan 30 11:34 sha.js -> ../sha.js/bin.js
lrwxr-xr-x  1 pedro  staff  25 Jan 30 11:34 uglifyjs -> ../uglify-js/bin/uglifyjs
lrwxr-xr-x  1 pedro  staff  25 Jan 30 11:34 webpack -> ../webpack/bin/webpack.js
tutorial-webpack-modules pedro$
```

The Webpack CLI can now be called on this location.

```
tutorial-webpack-modules pedro$ node_modules/.bin/webpack --help
```

## Creating modules

To create some example modules, we start by creating a `web_modules` folder.
By default `webpack` will use this folder when looking for modules.
Notice how the folder name is inspired in NPM's module folder (`node_modules`).

Then we create the first module in this folder, named `module1.js`.

```
function addImpl(a, b) {
    return a + b;
}

exports.add = addImpl;
```

This module exports the `addImpl` function by adding a `add` property to the `exports` object: `exports.add = add;`.
The `exports` object is available in the _module context_, as defined by the [CommonJS specification](http://wiki.commonjs.org/wiki/Modules/1.1), and is "an object that the module may add its API to as it executes".

The next step is to create a second module, named `module2.js`.
This module will simultaneously require the `add` function exported by `module1` as well as exporting a new `mult` function.

```
var add = require('mod1').add;
function multImpl(a, b){
    if(a < 0) throw new Error("can't handle negative numbers");
    var res = 0;
    for(var i = 0 ; i < a ; ++i){
        res = add(res, b);
    }
    return res;
}
exports.mult = multImpl;
```

The first line uses the `require` function defined by [CommonJS](http://wiki.commonjs.org/wiki/Modules/1.1) as accepting a _module identifier_ and returning the module's exported API.
Notice how the module identifier (`module1`) is the module's file name, without extension and path information.
The last line exports the `multImpl` function as the `mult` field.

So now we have a `web_modules` folder with two javascript files, each one defining one module.

```
tutorial-webpack-modules pedro$ tree web_modules/
web_modules/
├── module1.js
└── module2.js
```

We can now create a javascript file that takes advantage of these modules. 
For that we create a `index.js` file in the root folder, that simply uses the `module2` exported function to multiply 2 by 3 and write the result into the browser's `document`.

```
var mult = require('module2').mult;
document.write(mult(2,3));
```

Again, we are using the `require` function to access the module's API.

## Bundling

The final step is to bundle all these files into a single javascript file that can be included in a HTML document.
For that we just use `webpack`, passing the _main module_ file (`./index.js`) and the bundled file name (`bundle.js).


```
tutorial-webpack-modules pedro$ node_modules/.bin/webpack ./index.js bundle.js
Hash: 752f10f9dcca1e978e90
Version: webpack 1.12.12
Time: 52ms
    Asset     Size  Chunks             Chunk Names
bundle.js  1.93 kB       0  [emitted]  main
   [0] ./index.js 63 bytes {0} [built]
   [1] ./web_modules/module2.js 250 bytes {0} [built]
   [2] ./web_modules/module1.js 60 bytes {0} [built]
```

Notice that there was no need to also pass in the `module1.js` and `module2.js` files.
These modules are pulled in via the transitive dependencies of `index.js`.

We can now create a simple HTML document that includes `bundle.js` and observe the output.
```
<html>
    <head>
        <title>Webpack Modules tutorial</title>
        <meta charset="utf-8">
    </head>
    <body>
        <script type="text/javascript" src="bundle.js" charset="utf-8"></script>
    </body>
</html>
```

```
tutorial-webpack-modules pedro$ open index.html
```

The result should be a browser presenting the number 6.

## Bundling and dependency resolution

The `bundle.js` file is more than simply the character concatenation of the `index.js`, `module1.js` and `module2.js`. 
Since all these files are _modules_, they must be executed in a context that provides both the `requires` function and the `exports` object.
An analysis of the `bundle.js` is very instructive to understand how this is achieved.

```
/******/ (function(modules) { // webpackBootstrap
/******/    // The module cache
/******/    var installedModules = {};

/******/    // The require function
/******/    function __webpack_require__(moduleId) {

/******/        // Check if module is in cache
/******/        if(installedModules[moduleId])
/******/            return installedModules[moduleId].exports;

/******/        // Create a new module (and put it into the cache)
/******/        var module = installedModules[moduleId] = {
/******/            exports: {},
/******/            id: moduleId,
/******/            loaded: false
/******/        };

/******/        // Execute the module function
/******/        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/        // Flag the module as loaded
/******/        module.loaded = true;

/******/        // Return the exports of the module
/******/        return module.exports;
/******/    }


/******/    // expose the modules object (__webpack_modules__)
/******/    __webpack_require__.m = modules;

/******/    // expose the module cache
/******/    __webpack_require__.c = installedModules;

/******/    // __webpack_public_path__
/******/    __webpack_require__.p = "";

/******/    // Load entry module and return exports
/******/    return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

    var mult = __webpack_require__(1).mult;
    document.write(mult(2,3));


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

    var add = __webpack_require__(2).add;
    function multImpl(a, b){
        if(a < 0) throw new Error("can't handle negative numbers");
        var res = 0;
        for(var i = 0 ; i < a ; ++i){
            res = add(res, b);
        }
        return res;
    }
    exports.mult = multImpl;


/***/ },
/* 2 */
/***/ function(module, exports) {

    function add(a, b) {
        return a + b;
    }

    exports.add = add


/***/ }
/******/ ]);
```

The file starts with the definition of an anonymous function receiving a `modules` variable, which is a  function array.
Looking at the end of the file we see that this anonymous function is called with an array containing three functions, one for each module (`index`, `module1` and `module`).
Each one of these functions contains the module contents as the body.
For instance, the `index.js` module, which is defined as

```
var mult = require('module2').mult;
document.write(mult(2,3));
```

results in the the following function

```
function(module, exports, __webpack_require__) {
    var mult = __webpack_require__(1).mult;
    document.write(mult(2,3));
 },
```

The function body contains the module's body with following changes:

* The `require` context function is replaced by a `__webpack_required__` function parameter.
* The module identifiers, which are strings in the original module definition, are replaced by integers. The mapping between module names and these integers is shown by the `webpack` CLI tool when it executes.

```
[0] ./index.js 63 bytes {0} [built]
[1] ./web_modules/module2.js 250 bytes {0} [built]
[2] ./web_modules/module1.js 60 bytes {0} [built]
```

The parameter list to this function also includes the `exports` contextual object where the module adds its API. 

The anonymous function execution starts by creating the empty `installedModules` that will hold all the module information.
Each entry on this object represents a module and is an object with the following fields:

* The `exports` field, initiated with an empty object, will contain the module's exported API.
* The `id` contains the module identifier.
* The `loaded` indicates if the module function was executed, that is, if the `exports` field already contains the module's API.


After creating the `installedModules` cache, the anonymous function defines a `__webpack_require__` function that implements the CommonJS `require` function contract: given a module identifier it returns the exported API object.
This contract is implemented by the following steps:

* First, the `installedModules` object is queried to check if it already contains the requested module. If so, the `exports` object is returned.

```
if(installedModules[moduleId])
    return installedModules[moduleId].exports;
```

* If not, the function creates a new entry on the `installedModules`, containig three fields

  * The `exports` field, initiated with an empty object, will contain the module's exported API.
  * The `id` contains the module identifier.
  * The `loaded` indicates if the module function was executed.

* Then the `__webpack_require__` calls the respective module function, thereby running the respective module's definition.
This call passes to the module function a set of parameters that implement the CommonJS context, namely

  * The `exports` object, that will be filled by the module with its API.
  * The own `__webpack_require__` function that will be used by the module to access other modules. 

* Finally, the `__webpack_require__` function returns the `exports` object after it has been filled in.

The anonymous function ends by calling the `__webpack_require__` on the first module function. 

