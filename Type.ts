export enum Type {
    NONE,
    TKN_IDENTIFIER,
    TKN_KEYWORD,
    TKN_BINARY,
    TKN_COLON,
    TKN_SEMICOLON,
    TKN_DOT,
    TKN_LEFT_PARENTHESIS,
    TKN_RIGHT_PARENTHESIS,
    TKN_LEFT_SQUARE_BRACKET,
    TKN_RIGHT_SQUARE_BRACKET,
    TKN_RETURN,
    TKN_ASSIGNMENT,
    TKN_COMMENT,
    TKN_STRING,
    TKN_INTEGER,

    // reserved identifiers
    // TKN_TRUE
    // TKN_FALSE
    // TKN_NIL
    // TKN_SELF
    // TKN_SUPER

    SYN_TEMPORARIES,
    SYN_STATEMENTS,
    SYN_BLOCK_CLOSURE,
    SYN_BLOCK_ARGUMENTS,
    SYN_EXPRESSION,
    SYN_MESSAGES
}