define(function (require, exports, module)
{

    var Vector = require('./ProperVector');
    var RenderController = require("famous/views/RenderController");
    var Colors = require('Colors');
    var Transform = require('famous/core/Transform');
    var Modifier = require('famous/core/Modifier');

    function Utils()
    {

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

        object.renderController = new RenderController({
            inTransition:false,
            outTransition:false
        });

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
        if (!gapiMap)
            return properties;

        var items= gapiMap.items();
        for (var i=0;i<items.length;i++)
        {
            var item = items[i];
            properties[item[0]] = item[1];
        }
        return properties;
    };

    Utils.injectView = function(container,objectView)
    {
        console.log("Injecting view. Object = " + objectView._globalId + " InjectedContainer = " + container._globalId);
        objectView.setPosition([0, objectView.position[1], 0]);
        objectView.setAlign([0,0]);
        objectView.setOrigin([0,0]);
        if (objectView.parent)
        {
            var index = objectView.parent.children.indexOf(objectView);

            objectView.parent.removeChild(objectView);
            objectView.parent.addChild(container, {
                weight: 2,
                index: index,
                align: 'center'
            });
        }
        container.addChild(objectView);
    };

    Utils.extractContainer = function(container,objectView)
    {
        if (!container.parent)
            throw "Container has no parent";

        var parentView = container.parent;

        var index = parentView.children.indexOf(container);

        container.removeChild(objectView);
        parentView.removeChild(container);
        parentView.addChild(objectView, {
            weight: 2,
            index: index,
            align: 'center'
        });

    };

    Utils.parseText = function(text)
    {

        var textBlocks = [];

        var openTag = "{LINK=";
        var closeTag = "{/LINK}";

        var i =0;
        while (i < text.length)
        {
            var index = text.indexOf(openTag, i);

            if (index != i)
            {
                var end = index;
                if (index < 0)
                    end = text.length;
                textBlocks.push({
                    name:"",
                    text:text.slice(i,end)
                });
            }

            if (index < 0)
                break;

            var nameEndIndex = text.indexOf("}",index);
            var closingIndex = text.indexOf(closeTag,index);

            textBlocks.push({
                name:text.slice(index + openTag.length, nameEndIndex),
                text:text.slice(nameEndIndex+1, closingIndex)
            });

            i = closingIndex+closeTag.length;
            if (i < 0)
                break;
        }

        return textBlocks;
    };

    Utils.makeZOffset = function(offsetDepth)
    {
        if (!offsetDepth)
            offsetDepth = 1;

        return new Modifier({transform: Transform.translate(0,0,offsetDepth)});
    }


    Utils.nameMap = {};

    module.exports = Utils;

});