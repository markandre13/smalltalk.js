# smalltalk.js

A simple(!) Smalltalk interpreter written in TypeScript.

('interpreter' as in 'not really fast'. it would be much smarter to compile to javascript and let the javascript jit take it from there... which is what Amber is doing.)

My goal here is to learn Smalltalk and be able to run and share some examples I found in the literature on the web.

This is a work in progress, only tests so far, run with `bun test` (bun.sh 0.5.7).

## History

The Smalltalk system with it's OOP, Live Coding, Code Browser, Refactoring tools, MVC, etc. has been a major influence on, not just the Apple Lisa/Macintosh, but also on Agile, Clean Code, Unit Testing (SUnit), TDD, Design Patterns, XP, MVVM, ...

Then it became overshadowed by C++, and finally became a niche in the 90's when IBM united with Sun Microsystems against Microsoft and switched from Smalltalk to Java and Sun moved the Strongtalk team from Smalltalk to Java.

[VisualWorks](https://en.wikipedia.org/wiki/VisualWorks) is still around as a commerical grade Smalltalk (and also the origin of the MVVM pattern) while [Squeak](https://squeak.org) is aimed at the educational market and has replaced MVC with Morphic. E.g. the first versions of [Scratch](https://en.scratch-wiki.info/wiki/Smalltalk) were
written with Squeak.

## Distribution

When you go to look for a Smalltalk implementation, you'll usually find these things:

* Compiler

  Compiles Smalltalk into another language. Most compilers are part of a Smalltalk
  Image running inside a Smalltalk VM and generate bytecode suitable for that VM.
  
  E.g. Amber compiles Smalltalk into Javascript.

* Interpreter

  Compiles and executes the code at once.
  
  E.g. GNU Smalltalk.

* Virtual Machine (VM)

  The book _Smalltak-80 The Language and It's Implementation_ describes a common
  Smalltalk VM.

  Smalltalk VMs usually mimic a complete operating system complete with a bitmapped display
  to be able to run old Smalltalk images.

  E.g. Squeak, which is based on the the book but was been adjusted to deliver better
  performance.

* Just-In Time Compiler (JIT)

  A VM which also compiles parts into native machine code.

  E.g. [Strongtalk](http://strongtalk.org/), which adds optional type checking to Smalltalk
  and whose JIT layed the foundation for todays Java (HotSpot) and JavaScript (V8) VMs.

* Image

  An image to run in a VM. Old ones are available starting from the 1972 till today.

## Links

### Docs

* [Introduction to VisualWorks](http://ftp.squeak.org/docs/VW/VWCover.html)

  This is a nice overview from 1995/1996 how to build an application using the System Browser and drawing the UI in a Canvas window using the Canvas and Palette tool.

* [The Art and Science of Smalltalk](https://rmod-files.lille.inria.fr/FreeBooks/Art/artAdded174186187Final.pdf)

  This also covers VisualWorks and it's MVC variant which MVVM is based on.

* http://stephane.ducasse.free.fr/FreeBooks.html

* Just run a Smalltalk (e.g. in the [browser](https://squeak.js.org/demo/simple.html#fullscreen)) and examine the category _System-Compiler_ with classes like _Scanner_, _Parser_ or _ParseNode_.

* [ANSI Smalltalk Draft 1.9](https://wiki.squeak.org/squeak/172)

### Code

* [Amber](https://www.amber-lang.net) Smalltalk to JS Compiler (written in Smalltalk compiled to JS)
* [Squeak](https://squeak.org) Smalltalk VM by Smalltalk's inventors (written in Smalltalk and compiled to C)
* [Pharo](https://pharo.org) Smalltalk environment based on Squeak
* [OpenSmalltalk](https://github.com/OpenSmalltalk) The VM used by Squeak, Pharo, etc.
* [SqueakJS](https://squeak.js.org) Smalltalk VM in JS
* [Newspeak](https://newspeaklanguage.org) Smalltalk in WASM
* [GNU Smalltalk](https://www.gnu.org/software/smalltalk/)
* [Strongtalk](http://strongtalk.org/) Typed Smalltalk with JIT
* [By the Blue Book](https://github.com/dbanay/Smalltalk) Smalltalk-80 VM in C++
* [Smalltalk Zoo](https://smalltalkzoo.thechm.org) Run some old VMs in the browser
* ...
