# User Lib node

Monitors a folder with user's scripts and libraries.

Some notes:
 - User `uLib` as an alias when importing in `function` node. That will provide intelli in `monaco` editor.


Rules:
 - create `exports.destroy = function() {}` to clean up your own module
 - (!)restart the process if any of the require modules were removed from your module 

