define(function (require, exports, module)
{

    function Globals(){


    }



    Globals.prototype.nextIdentifier = function(name){

        var nameMap = Globals.nameMap;

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


    Globals.nameMap = {};

    module.exports = Globals;

});