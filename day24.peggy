lines = @registers "\n" @transforms

registers = (@register "\n")+

register = @reg ":" _ @bit


bit
  = "0" { return false }
  / "1" { return true }

transforms = transform+
transform = @reg _ @op _ @reg _ "->" _ @reg "\n"

op
  = "XOR"
  / "AND"
  / "OR"

reg = $[a-z0-9]+

_ = [ \t]+
