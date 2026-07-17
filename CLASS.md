lookup:
* temporary variables are all within the scope of a method
  and hence always known
* instance, class and pool variables need to be declared.
  when they change, we can recompile all methods.
* all remaining variables can be assumed to be global.

can i get rid of ST_Scope?

System-Support: SystemDictionary: Dictionary
;; has one instance named Smalltalk (this means that we have global variables)
;; Smalltalk classNames (returns all names of entries of type Class)

Kernel-Classes: 
  Behaviour (methods)
    |superclass methodDict format subclases|
    selectors
      ^methodDict keys

    accessing instances and variables:
      instVarNames
  Class (adds variables)
    class name:
    class variables:
    instance variables:
    subclass creation:
      subclass: t instanceVariableNames: f classVariableNames: d poolDictionaries: s category: cat 

    
  ClassDescription
  Metaclass
    class hierarchy:
      
blue book
chapter 16: protocol for classes (p. 267)

Variables
* instance: lifetime of object (this.*)
* temporary: during execution (let)
* class: shared by all instances of class (static)
* global: shared by all objects
* pool: "shared by the instances of a subset of the classes in the system."
  'global' is a pool represented by the Smalltalk object, e.g.
    Smalltalk at: #XXX put: nil.
  'class' is a pool shared by all objects of a class
  pool hence lists additional pools which can be shared by the objects of that
  class


Object
  Behaviour
    ClassDescription (class name, comment, instance variable names, method categories)
      Class          (class variables, shared pools, new: creates new objects)
      Metaclass      (name: ... creates new classes)

* Every object is an instance of a class.
* Every class is an instance of a metaclass.

* a metaclass is created automatically whenever a new class is created.
* A metaclass has only one instance.

subclass: ...
-> create instance of Metaclass
-> Class (contains class methods)
-> create instance of Class (by calling new)
-> Object

how messages are sent
-> Object 

adding a method
Behaviour 
  addSelector: selector withMethod: compiledMethod
  removeSelector: selector
  compile: code
     compile code in the context of the receiver
  compile: code notifying: requestor
     like code plus add result to receiver's method dictionary

Metaclass
  name: .... ;; this is where new classes are created
