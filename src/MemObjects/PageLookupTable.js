define(function(require, exports, module)
{

    var Engine = require("famous/core/Engine");
    var Surface = require("famous/core/Surface");
    var Transform = require("famous/core/Transform");
    var Modifier = require("famous/core/Modifier");
    var Transitionable = require('famous/transitions/Transitionable');
    var Easing = require('famous/transitions/Easing');
    var RenderController = require("famous/views/RenderController");

    var DynamicDetailView = require('../DynamicDetailView');
    var StretchyLayout = require('../PositioningLayouts/StretchyLayout');
    var PositionableView = require("../PositioningLayouts/PositionableView");
    var ObjectFactory = require('../ObjectFactory');
    var BoxView = require('../PositioningLayouts/BoxView');
    var PositioningFlex = require('../PositioningLayouts/PositioningFlexibleLayout');

    var Utils = require('../Utils');


    var labelHeight = 30;

    var objectFactory = new ObjectFactory();

    function PageLookupTable(options){
        StretchyLayout.call(this,options);

        this.memConfig = this.options.memConfig;
        this.setSize(this.options.size);
        _init.call(this);
    }

    PageLookupTable.DEFAULT_OPTIONS = {
        size: [100,600],
        minimumContainerSize: [0,0],
        pageMappings: [],
        startPage: 0,
        direction: 1,
        viewSpacing: [0,0]
    };

    PageLookupTable.prototype= Object.create(StretchyLayout.prototype);
    PageLookupTable.prototype.constructor = PageLookupTable;

    function _init(){

        this.cells = {};

        function makePageAddress(num1,num2)
        {
            var pageAddress = new PositioningFlex({
                direction: 0,
                ratios:[0.5,0.6],
                size: [120,30]
            });

            var s = new BoxView({text: Utils.hexString(num1,5)});
            pageAddress.addChild(s);

            var s2 = new BoxView({text: Utils.hexString(num2,5)});
            pageAddress.addChild(s2);

            pageAddress._pageIndex = s;
            pageAddress._frameNumber = s2;
            pageAddress._pfnValue = num2;

            return pageAddress;
        }

        var startPage = this.options.startPage;
        var pageCount = this.options.pageMappings.length;

        for (var i = 0; i < pageCount; i++)
        {
            var pageCell = makePageAddress(startPage + i,this.options.pageMappings[i]);
            this.addChild(pageCell);
            this.cells[startPage + i] = pageCell;
        }
    }

    PageLookupTable.prototype.access  = function(index){
        var cell =this.cells[index];
        if (cell)
        {
            cell._pageIndex.pulse(50,500);
            return cell._pfnValue;
        }
        else
        {
            console.error('Cell ' + index + ' not found');
            return undefined;
        }
    };

    module.exports = PageLookupTable;

});