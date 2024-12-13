machines = machine|.., "\n"|

machine = button button prize

button = "Button" _ [AB] ":" _ "X+" @num _ "," _  "Y+" _ @num "\n"
prize = "Prize:" _ "X=" @num _ "," _ "Y=" _ @num "\n"

num = n:$[0-9]+ { return parseInt(n, 10) }
_ = [ \t]*
