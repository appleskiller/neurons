var shell = require('shelljs');

module.exports = {
    required: function () {
        var exit = false;
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i] && !shell.which(arguments[i])) {
                shell.echo('Sorry, this script requires ' + arguments[i]);
                exit = true;
            }
        }
        if (exit) {
            shell.exit();
        }
    },
    exec: function (cmd, errorMsg) {
        console.log('[ Shell ]', cmd);
        var result = shell.exec(cmd);
        if (result.code !== 0) {
            if (errorMsg) {
                console.log('Error: ', errorMsg);
            }
            shell.exit();
        }
        return result;
    },
    cd: function (cmd) {
        console.log('[ Shell ]', 'cd' + cmd);
        if (shell.cd(cmd).code !== 0) {
            shell.exit();
        }
    },
    parseArgs: function(args) {
        args = args || process.argv;
        var result = {}, name;
        args.forEach(function(arg) {
            if (/^(-|--)/.test(arg) || !name) {
                result[arg] = true;
                name = arg;
            } else {
                if (arg === 'false') {
                    arg = false;
                } else if (arg === 'true') {
                    arg = true;
                } else if (!isNaN(arg)) {
                    arg = Number(arg);
                }
                if (typeof result[name] === 'boolean') {
                    result[name] = arg;
                } else if (Array.isArray(result[name])) {
                    result[name].push(arg);
                } else {
                    result[name] = [result[name], arg];
                }
            }
        });
        Object.keys(result).forEach(key => {
            var newKey = key.replace(/^-{0,}/, '');
            var value = result[key];
            delete result[key];
            result[newKey] = value;
        })
        return result;
    }
}