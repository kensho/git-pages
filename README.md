# git-pages

> Run your own github-like static pages

[![NPM][git-pages-icon] ][git-pages-url]

[![Build status][git-pages-ci-image] ][git-pages-ci-url]
[![dependencies][git-pages-dependencies-image] ][git-pages-dependencies-url]
[![devdependencies][git-pages-devdependencies-image] ][git-pages-devdependencies-url]

[git-pages-icon]: https://nodei.co/npm/git-pages.png?downloads=true
[git-pages-url]: https://npmjs.org/package/git-pages
[git-pages-ci-image]: https://travis-ci.org/kensho/git-pages.png?branch=master
[git-pages-ci-url]: https://travis-ci.org/kensho/git-pages
[git-pages-dependencies-image]: https://david-dm.org/kensho/git-pages.png
[git-pages-dependencies-url]: https://david-dm.org/kensho/git-pages
[git-pages-devdependencies-image]: https://david-dm.org/kensho/git-pages/dev-status.png
[git-pages-devdependencies-url]: https://david-dm.org/kensho/git-pages#info=devDependencies

## Install

* Install globally `npm install -g git-pages`
* Install as a dependency `npm install --save git-pages`

## Run

Run after installing globally `git-pages`

Run after installing as a dependency (via package.json script)

```json
"scripts": {
    "pages": "git-pages"
},
"dependencies": {
    "git-pages": "0.2.0"
}
```

Then you can start the `git-pages` server by simply `npm run pages`.

Run from the cloned folder

* simple start `node index.js` or `npm run start`
* run with automatic restart and watching source files `npm run watch`. 
Uses [nodemon](http://nodemon.io/).

### Small print

Author: Kensho &copy; 2015

* [@kensho](https://twitter.com/kensho)
* [kensho.com](http://kensho.com)

Support: if you find any problems with this library,
[open issue](https://github.com/kensho/git-pages/issues) on Github

## MIT License

The MIT License (MIT)

Copyright (c) 2015 Kensho

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
