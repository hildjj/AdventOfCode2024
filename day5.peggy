manual = @order "\n" @pages

order = (@num "|" @num "\n")*

pages = (@page "\n")+

page = num|1.., ","|

num = n:$[0-9]+ { return parseInt(n, 10) }
_ = [ \t]+
