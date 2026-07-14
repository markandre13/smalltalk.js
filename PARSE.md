Smalltalk's method calls (aka. messages) are a bit tricky to grasp.

1st, there are 3 kind:

  u                 unary, no argument
  + arg             binary, one argument
  k: arg k: arg...  keyword, one or more arguments

prim unary* (binary arg)* ((keyword: arg)*)?

the really nasty part is the ';' indicating cascaded messages

<basic expression> ::= <primary> [<messages> <cascaded messages>]
<cascaded messages> ::= (';' <messages>)*
<primary> ::= identifier | <literal> | <block constructor> | ( '(' <expression> ')' )

<messages> ::=
    (<unary message>+ <binary message>* [<keyword message>] )
  | (<binary message>+ [<keyword message>] )
  | <keyword message>

 <unary message> ::= unarySelector

 <binary message> ::= binarySelector <binary argument>
 <binary_selector> ::= + | - | @ | ...

 <binary argument> ::= <primary> <unary message>*

 <keyword message> ::= (keyword <keyword argument>)+
 <keyword argument> ::= <primary> <unary message>* <binary message>* 

basic_expression
   |
primary
   |
identifier

id
---------------
(1 + 2) + (2 + 3)


BASIC_EXPRESSION = PRIMARY UNARY_MESSAGE UNARY_MESSAGE BINARY_MESSAGE KEYWORD_MESSAGE
                      |          u             u           +  2       x:y:   1   2

=============

id u
id u u
id u u u

id + 1
id + 1 + 2
id + 1 + 2 + 3

id u + 1
id u u + 1 + 2
id u u u + 1 + 2 + 3

id u + 1 a: id
id u u + 1 + 2 a: id b: id
id u u u + 1 + 2 + 3 a: id b: id c: id

id a: 1 b: 2
id a: id u b: 2
id a: id u u b: 2
id a: id u u u b: 2

id a: id + 1 b: 2
id a: id + 1 + 2 b: 2
id a: id + 1 + 2 + 3 b: 2

id a: id u + 1 b: 2
id a: id u u + 1 + 2 b: 2
id a: id u u u + 1 + 2 + 3 b: 2

( id )
( id u ) + ( id u )

----------------------------------------------

COMPILE

;; uses of <statements>

<method definition> ::= <message pattern> [<temporaries> ] [<statements>]
<initializer definition> ::= [<temporaries>] [<statements>] ;; program
<block body> ::= [<block argument>* '|'] [<temporaries>] [<statements>]

<statements> ::=
     (<return statement> ['.'] )
   | (<expression> ['.' [<statements>]])

<basic expression> ::= <primary> [<messages> (';' <messages>)* ]

<expression> ::= <assignment> | <basic expression>
<assignment> ::= <identifier> assignmentOperator <expression>
<return statement> ::= returnOperator <expression>
