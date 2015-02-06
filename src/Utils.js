define(function (require, exports, module)
{

    function Utils(){


    }



    Utils.prototype.nextIdentifier = function(name){

        var nameMap = Utils.nameMap;

        if (!name)
        {
            name = "noname";
        }

        if (nameMap[name] != undefined)
        {
            nameMap[name] = nameMap[name] + 1;
        }
        else
        {
            nameMap[name] = 0;
        }

        return name + "[" + nameMap[name] + "]";

    };

    Utils.hexString = function(n,width){
        var z = '0';
        width = width || 8;
        n = n.toString(16).toUpperCase() + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    };

    Utils.nameMap = {};

    module.exports = Utils;

});