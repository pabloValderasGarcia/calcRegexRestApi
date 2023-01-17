import sys
import json
import re # REGEX

# Variables
operation = sys.argv[1].split('"')[3]
    
# Check if numbers
if any(char.isdigit() for char in operation):
    print(eval(re.sub('[a-zA-Z,.:()" "]', '', operation)))
else:
    print('Invalid operation... Write it well.')

# Finish
sys.stdout.flush()