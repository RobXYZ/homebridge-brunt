# homebridge-brunt
[Homebridge](https://github.com/nfarina/homebridge) platform plugin for Brunt blinds

# Installation

1. Install homebridge using: npm install -g homebridge
2. Install this plugin using: npm install -g homebridge-brunt
3. Update your configuration file. See sample config.json snippet below. 

# Configuration

Configuration sample:
 ```
"platforms": [
		{
			"platform": "Brunt",
			"name": "Brunt",
			"user":"YOURUSERNAME",
			"pass":"YOURPASSWORD"		
		}
	],

```


Fields: 

* "platform": Must always be "Brunt" (required)
* "name": Can be anything (required)
* "user": Brunt account email address (required)
* "pass": Password for Brunt account (required)
