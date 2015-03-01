define(function (require, exports, module)
{

    var Vector = require('./ProperVector');
    var RenderController = require("famous/views/RenderController");

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
        var string =  (n.length >= width ? n : new Array(width - n.length + 1).join(z) + n);
        return '0x' + string;
    };

    Utils.assertValidMeasure = function(view,measure){

        if (measure == undefined)
            console.error("Invalid measureObject. View = " + view._globalId);

        if (measure.minimumSize == undefined)
            console.error("Invalid minSize. View = " + view._globalId);


        if (measure.maximumSize == undefined)
            console.error("Invalid maxSize. View = " + view._globalId);
    };

    Utils.assertValidSize = function(size){
        if (size == undefined)
            console.error("Invalid size. View = " + view._globalId);
    };

    Utils.getDirectionVector = function (dirIndex){
        if (dirIndex == 0)
        {
            return new Vector(1,0,0);
        }
        else if (dirIndex == 1)
        {
            return new Vector(0,1,0);
        }
        else
        {
            console.error("Unexpected direction: " + this.direction);
        }
    };

    Utils.attachRenderController = function(object){

        object.renderController = new RenderController();

        object.show = function(){
            this.renderController.show(this);
        };

        object.hide = function(){
            this.renderController.hide();
        }

    };


    Utils.getPropertyMap = function(gapiMap)
    {
        var properties = {};
        var items= gapiMap.items();
        for (var i=0;i<items.length;i++)
        {
            var item = items[i];
            properties[item[0]] = item[1];
        }
        return properties;
    };

    Utils.nameMap = {};

    module.exports = Utils;

});